import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kftltxdzlfculgctvypz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdGx0eGR6bGZjdWxnY3R2eXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMjUsImV4cCI6MjA2ODk3NTMyNX0.Lfd4WsJmErIvMWGytlb2G-EOAZNTkdE9YGBI1cb0YFo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single()

    let user
    if (existingUser) {
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
      
      if (error) throw error
      user = data
    } else {
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
      
      if (error) throw error
      user = data
    }

    // Create session token (temporary - should use proper JWT)
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }

    // Redirect to home with session data
    res.redirect(`https://creativeos-kai.vercel.app/?session=${encodeURIComponent(JSON.stringify(sessionData))}`)
  } catch (error) {
    console.error('OAuth error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}