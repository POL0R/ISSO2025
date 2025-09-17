import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const signInEmailPassword = async () => {
    try {
      setLoading(true)
      setMessage('')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      location.href = '/scoreboard'
    } catch (e: any) {
      setMessage(e.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const sendMagicLink = async () => {
    try {
      setLoading(true)
      setMessage('')
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMessage('Magic link sent. Check your email.')
    } catch (e: any) {
      setMessage(e.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ color: '#000', background: '#fff', marginTop: '12svh', padding: 16 }}>
      <h2>Sign in</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={loading} onClick={signInEmailPassword}>Sign in</button>
        <button disabled={loading} onClick={sendMagicLink}>Send magic link</button>
        {message && <div style={{ color: '#d00' }}>{message}</div>}
      </div>
    </div>
  )
}


