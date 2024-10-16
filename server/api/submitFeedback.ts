import { defineEventHandler, readBody } from 'h3';
import type { H3Event } from 'h3';
import mysql from 'mysql2/promise';
import { apiConfig } from '~/config';

// Interface for the expected request body
interface FeedbackBody {
  url: string;
  feedback: string;
  comment?: string;
  device?: string;
  userAgent?: string;
}

// Interface for the query result
interface QueryResult {
  affectedRows: number;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Read and parse the request body
    const body = await readBody<FeedbackBody>(event);
    const { url, feedback, comment, device, userAgent } = body;

    // Validate required fields
    if (!url || !feedback) {
      throw new Error('Missing required fields');
    }

    // Construct the full URL
    const fullUrl = new URL(url, 'https://www.wikiherbalist.com').href;

    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: apiConfig.dbHost,
      user: apiConfig.dbUser,
      password: apiConfig.dbPassword,
      database: apiConfig.dbName,
    });

    // Prepare the SQL query
    const query = `
      INSERT INTO wh_perseo_feedback 
      (url, time, feedback, comment, device, user_agent, ip) 
      VALUES (?, NOW(), ?, ?, ?, ?, ?)
    `;

    // Extract the client's IP address
    const clientIp = (
      (event.node.req.headers['x-forwarded-for'] as string | undefined) ||
      event.node.req.socket.remoteAddress ||
      ''
    )
      .split(',')[0]
      .trim()
      .substring(0, 45);

    // Prepare the values for the SQL query
    const values = [
      fullUrl,
      feedback,
      comment || '',
      device || '',
      userAgent || '',
      clientIp,
    ];

    // Execute the SQL query
    const [result] = await connection.execute<QueryResult[]>(query, values);

    // Close the database connection
    await connection.end();

    // Check if the insertion was successful
    if (result.affectedRows === 1) {
      return { success: true, message: 'Feedback submitted successfully' };
    } else {
      throw new Error('No rows affected');
    }
  } catch (error: any) {
    // Handle errors gracefully
    return {
      success: false,
      message: 'Failed to submit feedback',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
});
