import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Register.css'

export default function Register(){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    try{
      const form = new FormData()
      form.append('fullName', fullName)
      form.append('email', String(email).trim().toLowerCase())
      form.append('username', String(username).trim().toLowerCase())
      form.append('password', password)
      if(avatar) form.append('avatar', avatar)
      if(coverImage) form.append('coverImage', coverImage)

      await api.post('/users/register', form, { headers: {'Content-Type': 'multipart/form-data'} })
      setMessage('Registered successfully — please login')
      // navigate to login after short delay
      setTimeout(() => navigate('/login'), 900)
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    }
  }

  return (
    <form onSubmit={submit} className="register-form" encType="multipart/form-data">
      <h2>Create account</h2>
      {message && <div className="register-message">{message}</div>}
      <div className="register-row">
        <label>Full Name</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} required className="register-full" />
      </div>
      <div className="register-row">
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="register-full" />
      </div>
      <div className="register-row">
        <label>Username</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} required className="register-full" />
      </div>
      <div className="register-row">
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="register-full" />
      </div>
      <div className="register-row">
        <label>Avatar</label>
        <input type="file" accept="image/*" onChange={e=>setAvatar(e.target.files[0])} required />
      </div>
      <div className="register-row">
        <label>Cover Image (optional)</label>
        <input type="file" accept="image/*" onChange={e=>setCoverImage(e.target.files[0])} />
      </div>
      <button type="submit">Register</button>
    </form>
  )
}
