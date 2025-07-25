import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/[\r\n\t\s]/g, '') || 'https://kftltxdzlfculgctvypz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/[\r\n\t]/g, '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdGx0eGR6bGZjdWxnY3R2eXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMjUsImV4cCI6MjA2ODk3NTMyNX0.Lfd4WsJmErIvMWGytlb2G-EOAZNTkdE9YGBI1cb0YFo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  console.log('🚀 OAuth callback function started')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Request query:', req.query)
  
  const { code } = req.query

  console.log('OAuth callback called with code:', code ? 'present' : 'missing')
  console.log('Environment check:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing',
    SUPABASE_URL: supabaseUrl ? 'set' : 'missing'
  })

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' })
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://creativeos-kai.vercel.app/api/auth/callback/google',
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()
    console.log('Token response status:', tokenResponse.status)
    console.log('Token response:', tokens.error ? `Error: ${tokens.error}` : 'Success')

    if (!tokenResponse.ok || tokens.error) {
      console.error('Token exchange failed:', tokens)
      return res.status(400).json({ error: tokens.error || 'Token exchange failed' })
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()
    console.log('Google user info:', { email: googleUser.email, name: googleUser.name })

    // Upsert user in Supabase
    console.log('Checking for existing user in Supabase...')
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Supabase select error:', selectError)
      throw new Error(`Database query failed: ${selectError.message}`)
    }

    let user
    if (existingUser) {
      console.log('Updating existing user...')
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          name: googleUser.name,
          picture: googleUser.picture,
          provider: 'google'
        })
        .eq('email', googleUser.email)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase update error:', error)
        throw new Error(`User update failed: ${error.message}`)
      }
      user = data
    } else {
      console.log('Creating new user...')
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          provider: 'google'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase insert error:', error)
        throw new Error(`User creation failed: ${error.message}`)
      }
      user = data
    }

    // Create session token (temporary - should use proper JWT)
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }

    // Generate a short session ID instead of passing full data in URL
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    // Store session temporarily (in production, use Redis or database)
    // For now, we'll use a simpler approach with shorter data
    const shortSessionData = `${user.id}|${user.email}|${user.name}|${user.picture}`
    
    console.log('📝 Session data length:', JSON.stringify(sessionData).length)
    console.log('🔗 Short session data:', shortSessionData.substring(0, 50) + '...')
    
    // Use base64 encoding to make URL shorter and safer
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    const redirectUrl = `https://creativeos-kai.vercel.app/?s=${encodedSession}`
    
    console.log('🔄 Redirect URL length:', redirectUrl.length)
    console.log('🔄 Redirecting to:', redirectUrl.substring(0, 120) + '...')
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth error:', error)
    console.error('Error stack:', error.stack)
    
    // Return detailed error info for debugging
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.stack,
      step: 'OAuth processing failed'
    })
  }
}