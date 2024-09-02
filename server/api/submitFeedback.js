import { defineEventHandler, readBody } from 'h3'
import mysql from 'mysql2/promise'
import { apiConfig } from '~/config'

export default defineEventHandler(async (event) => {
  console.log('Received feedback submission request')
  try {
    const body = await readBody(event)
    console.log('Received body:', JSON.stringify(body, null, 2))

    const { url, feedback, comment, device, userAgent } = body

    if (!url || !feedback) {
      console.error('Missing required fields')
      throw new Error('Missing required fields')
    }

    // Construct the full URL
    const fullUrl = new URL(url, 'https://www.wikiherbalist.com').href

    console.log('Connecting to database...')
    console.log('Database config:', {
      host: apiConfig.dbHost,
      user: apiConfig.dbUser,
      database: apiConfig.dbName,
      // Never log the password
    })

    const connection = await mysql.createConnection({
      host: apiConfig.dbHost,
      user: apiConfig.dbUser,
      password: apiConfig.dbPassword,
      database: apiConfig.dbName,
    })
    console.log('Connected to database')

    console.log('Table name being used:', 'wh_perseo_feedback')

    const query = `
      INSERT INTO wh_perseo_feedback 
      (url, time, feedback, comment, device, user_agent, ip) 
      VALUES (?, NOW(), ?, ?, ?, ?, ?)
    `

    const clientIp = ((event.node.req.headers['x-forwarded-for'] || 
                      event.node.req.connection.remoteAddress || '')
                     .split(',')[0].trim().substring(0, 45))

    const values = [
      fullUrl,
      feedback,
      comment || '', 
      device, 
      userAgent, 
      clientIp
    ]

    console.log('Executing query:', query)
    console.log('Query values:', values)

    const [result] = await connection.execute(query, values)
    console.log('Query execution result:', JSON.stringify(result, null, 2))

    await connection.end()
    console.log('Database connection closed')

    if (result.affectedRows === 1) {
      console.log('Feedback submitted successfully')
      return { success: true, message: 'Feedback submitted successfully' }
    } else {
      console.error('No rows affected')
      throw new Error('No rows affected')
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return { 
      success: false, 
      message: 'Failed to submit feedback', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }
})