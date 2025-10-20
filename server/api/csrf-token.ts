import { defineEventHandler } from 'h3';
import crypto from 'crypto';

// Store per i token CSRF (in produzione usare Redis o database)
const csrfTokens = new Map<string, { token: string, timestamp: number }>();

// Pulizia periodica dei token scaduti (30 minuti)
const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minuti in millisecondi

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now - value.timestamp > TOKEN_EXPIRY) {
      csrfTokens.delete(key);
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Pulizia token scaduti
    cleanExpiredTokens();
    
    // Genera un token CSRF sicuro
    const token = crypto.randomBytes(32).toString('hex');
    
    // Ottieni l'IP del client per associare il token
    const clientIp = (
      (event.node.req.headers['x-forwarded-for'] as string | undefined) ||
      event.node.req.socket.remoteAddress ||
      'unknown'
    )
      .split(',')[0]
      .trim();
    
    // Genera una chiave unica basata su IP e timestamp
    const tokenKey = crypto
      .createHash('sha256')
      .update(clientIp + Date.now().toString())
      .digest('hex');
    
    // Salva il token con timestamp
    csrfTokens.set(tokenKey, {
      token,
      timestamp: Date.now()
    });
    
    // Imposta il token key come cookie httpOnly per sicurezza
    setCookie(event, 'csrf_key', tokenKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY / 1000 // 30 minuti
    });
    
    return {
      success: true,
      token
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to generate CSRF token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
});

// Funzione helper per validare il CSRF token (esportata per uso in altri endpoint)
export function validateCSRFToken(event: any, providedToken: string): boolean {
  try {
    const tokenKey = getCookie(event, 'csrf_key');
    if (!tokenKey) return false;
    
    const storedTokenData = csrfTokens.get(tokenKey);
    if (!storedTokenData) return false;
    
    // Verifica scadenza
    if (Date.now() - storedTokenData.timestamp > TOKEN_EXPIRY) {
      csrfTokens.delete(tokenKey);
      return false;
    }
    
    // Verifica token
    const isValid = storedTokenData.token === providedToken;
    
    // Rimuovi il token dopo l'uso (one-time use)
    if (isValid) {
      csrfTokens.delete(tokenKey);
    }
    
    return isValid;
  } catch {
    return false;
  }
}
