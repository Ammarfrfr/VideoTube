import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login(){
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = location.state?.from?.pathname || '/'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = {}
      // backend accepts either username or email
      const trimmed = usernameOrEmail.trim()
      if (trimmed.includes('@')) payload.email = trimmed.toLowerCase()
      else payload.username = trimmed.toLowerCase()
      payload.password = password

      await login(payload)
      // on success backend sets cookies; we navigate back
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || err.message)
    }
  }

  return (
    <form onSubmit={submit} className="login-form">
      <h2>Login</h2>
      {error && <div className="login-error">{error}</div>}
      <div className="form-row">
        <label>Username or Email</label>
        <input value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} className="full-width" />
      </div>
      <div className="form-row">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="full-width" />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}
