import { defineEventHandler, readBody } from 'h3';
import type { H3Event } from 'h3';
import mysql from 'mysql2/promise';
import { apiConfig } from '~/config';
import { validateCSRFToken } from './csrf-token';
import fs from 'fs/promises';
import path from 'path';

// Interface for the expected request body
interface FeedbackBody {
  url: string;
  feedback: string;
  comment?: string;
  device?: string;
  userAgent?: string;
  csrfToken: string;
}

// Interface for the query result
interface QueryResult {
  affectedRows: number;
}

// Rate limiting store (in produzione usare Redis)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minuti
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 feedback per 15 minuti per IP

// Funzione per il rate limiting
function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const key = `feedback_${clientIp}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  current.count++;
  return true;
}

// Funzione per sanitizzare stringhe (equivalente a htmlspecialchars in PHP)
function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Funzione per validare caratteri consentiti nel commento
function validateCommentChars(comment: string): boolean {
  // Regex per caratteri consentiti: alfanumerici, spazi, punteggiatura di base, caratteri accentati
  const allowedCharsRegex = /^[a-zA-Z0-9\sàáâäèéêëìíîïòóôöùúûüñçÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÑÇ.,!?;:()\-'"]*$/;
  return allowedCharsRegex.test(comment);
}

// Funzione per rilevare pattern sospetti
function detectSuspiciousPatterns(input: string): string[] {
  const suspiciousPatterns = [
    { pattern: /<script/i, name: 'script_tag' },
    { pattern: /javascript:/i, name: 'javascript_protocol' },
    { pattern: /on\w+\s*=/i, name: 'event_handler' },
    { pattern: /eval\s*\(/i, name: 'eval_function' },
    { pattern: /expression\s*\(/i, name: 'css_expression' },
    { pattern: /vbscript:/i, name: 'vbscript_protocol' },
    { pattern: /data:text\/html/i, name: 'data_html' },
    { pattern: /\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/|\/sys\//i, name: 'path_traversal' },
    { pattern: /response\.write/i, name: 'response_write' },
    { pattern: /document\.cookie/i, name: 'cookie_access' },
    { pattern: /window\.location/i, name: 'location_redirect' },
    { pattern: /alert\s*\(/i, name: 'alert_function' },
    { pattern: /confirm\s*\(/i, name: 'confirm_function' },
    { pattern: /prompt\s*\(/i, name: 'prompt_function' },
    { pattern: /union\s+select/i, name: 'sql_union' },
    { pattern: /drop\s+table/i, name: 'sql_drop' },
    { pattern: /insert\s+into/i, name: 'sql_insert' },
    { pattern: /delete\s+from/i, name: 'sql_delete' },
    { pattern: /update\s+set/i, name: 'sql_update' },
    { pattern: /xp_cmdshell/i, name: 'sql_cmdshell' },
    { pattern: /bxss\.me|evil\.com|malware\.test/i, name: 'malicious_domain' }
  ];
  
  const detectedPatterns: string[] = [];
  
  for (const { pattern, name } of suspiciousPatterns) {
    if (pattern.test(input)) {
      detectedPatterns.push(name);
    }
  }
  
  return detectedPatterns;
}

// Funzione per loggare tentativi sospetti
async function logSuspiciousActivity(
  clientIp: string,
  userAgent: string,
  input: string,
  detectedPatterns: string[],
  reason: string
) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'security.log');
    
    // Crea la directory logs se non esiste
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (err) {
      // Directory già esistente, ignora l'errore
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: clientIp,
      userAgent: userAgent.substring(0, 200), // Limita lunghezza
      reason: reason,
      detectedPatterns: detectedPatterns,
      input: input.substring(0, 500), // Limita lunghezza per sicurezza
      severity: 'HIGH'
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(logFile, logLine);
    
  } catch (error) {
    console.error('Failed to log suspicious activity:', error);
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Estrai l'IP del client
    const clientIp = (
      (event.node.req.headers['x-forwarded-for'] as string | undefined) ||
      event.node.req.socket.remoteAddress ||
      'unknown'
    )
      .split(',')[0]
      .trim()
      .substring(0, 45);

    // Verifica rate limiting
    if (!checkRateLimit(clientIp)) {
      await logSuspiciousActivity(
        clientIp,
        event.node.req.headers['user-agent'] || 'unknown',
        'Rate limit exceeded',
        ['rate_limit_exceeded'],
        'Too many requests'
      );
      
      throw new Error('Troppi tentativi. Riprova tra 15 minuti.');
    }

    // Leggi e valida il body della richiesta
    const body = await readBody<FeedbackBody>(event);
    const { url, feedback, comment, device, userAgent, csrfToken } = body;

    // Validazione CSRF token
    if (!csrfToken || !validateCSRFToken(event, csrfToken)) {
      await logSuspiciousActivity(
        clientIp,
        userAgent || 'unknown',
        JSON.stringify(body),
        ['invalid_csrf_token'],
        'Invalid or missing CSRF token'
      );
      
      throw new Error('Token di sicurezza non valido');
    }

    // Validazione campi obbligatori
    if (!url || !feedback) {
      throw new Error('Campi obbligatori mancanti');
    }

    // Validazione rigorosa del feedback (solo 'yes' o 'no')
    if (feedback !== 'yes' && feedback !== 'no') {
      await logSuspiciousActivity(
        clientIp,
        userAgent || 'unknown',
        `Invalid feedback value: ${feedback}`,
        ['invalid_feedback_value'],
        'Invalid feedback value'
      );
      
      throw new Error('Valore feedback non valido');
    }

    // Validazione e sanitizzazione del commento
    let sanitizedComment = '';
    if (comment && comment.trim()) {
      const trimmedComment = comment.trim();
      
      // Verifica lunghezza massima
      if (trimmedComment.length > 200) {
        throw new Error('Commento troppo lungo (massimo 200 caratteri)');
      }
      
      // Verifica caratteri consentiti
      if (!validateCommentChars(trimmedComment)) {
        await logSuspiciousActivity(
          clientIp,
          userAgent || 'unknown',
          trimmedComment,
          ['invalid_characters'],
          'Invalid characters in comment'
        );
        
        throw new Error('Caratteri non consentiti nel commento');
      }
      
      // Rileva pattern sospetti
      const suspiciousPatterns = detectSuspiciousPatterns(trimmedComment);
      if (suspiciousPatterns.length > 0) {
        await logSuspiciousActivity(
          clientIp,
          userAgent || 'unknown',
          trimmedComment,
          suspiciousPatterns,
          'Suspicious patterns detected in comment'
        );
        
        throw new Error('Contenuto non consentito rilevato');
      }
      
      // Sanitizza il commento
      sanitizedComment = sanitizeString(trimmedComment);
    }

    // Sanitizza altri campi
    const sanitizedUrl = sanitizeString(url.substring(0, 500));
    const sanitizedDevice = device ? sanitizeString(device.substring(0, 50)) : '';
    const sanitizedUserAgent = userAgent ? sanitizeString(userAgent.substring(0, 500)) : '';

    // Costruisci l'URL completo
    const fullUrl = new URL(sanitizedUrl, 'https://www.wikiherbalist.com').href;

    // Connessione al database
    const connection = await mysql.createConnection({
      host: apiConfig.dbHost,
      user: apiConfig.dbUser,
      password: apiConfig.dbPassword,
      database: apiConfig.dbName,
    });

    // Query preparata per prevenire SQL injection
    const query = `
      INSERT INTO wh_perseo_feedback 
      (url, time, feedback, comment, device, user_agent, ip) 
      VALUES (?, NOW(), ?, ?, ?, ?, ?)
    `;

    // Valori per la query (tutti sanitizzati)
    const values = [
      fullUrl,
      feedback, // Già validato come 'yes' o 'no'
      sanitizedComment,
      sanitizedDevice,
      sanitizedUserAgent,
      clientIp,
    ];

    // Esegui la query preparata
    const [result] = await connection.execute<QueryResult[]>(query, values);

    // Chiudi la connessione al database
    await connection.end();

    // Verifica successo dell'inserimento
    if (result.affectedRows === 1) {
      return { success: true, message: 'Feedback inviato con successo' };
    } else {
      throw new Error('Errore durante il salvataggio');
    }
    
  } catch (error: any) {
    // Log dell'errore (senza esporre dettagli sensibili)
    console.error('Feedback submission error:', error.message);
    
    // Risposta di errore sicura
    return {
      success: false,
      message: error.message || 'Errore durante l\'invio del feedback',
      // Non esporre stack trace in produzione
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
});
