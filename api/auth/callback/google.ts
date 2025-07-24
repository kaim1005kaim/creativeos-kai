import { supabase } from '../../../src/lib/supabase'

export default async function handler(req: any, res: any) {
  const { code } = req.query

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' })
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      return res.status(400).json({ error: tokens.error })
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()

    // Upsert user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: 'google'
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (userError) {
      console.error('User upsert error:', userError)
      return res.status(500).json({ error: 'Failed to save user' })
    }

    // Create session token (temporary - should use proper JWT)
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }

    // Redirect to home with session data
    res.redirect(`/?session=${encodeURIComponent(JSON.stringify(sessionData))}`)
  } catch (error) {
    console.error('OAuth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}