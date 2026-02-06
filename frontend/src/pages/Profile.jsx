import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'
import './Profile.css'

export default function Profile(){
  const { user, fetchCurrentUser } = useAuth()
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  if(!user) return <p>Please login to view your profile.</p>

  const uploadAvatar = async (e) => {
    e.preventDefault()
    if(!avatarFile) return setMessage('Select an avatar file')
    setLoading(true)
    setMessage(null)
    try{
      const form = new FormData()
      form.append('avatar', avatarFile)
      await api.patch('/users/avatar', form, { headers: {'Content-Type': 'multipart/form-data'} })
      await fetchCurrentUser()
      setMessage('Avatar updated')
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  // Workaround to "remove" avatar/cover when backend doesn't provide delete endpoints:
  // we create a tiny placeholder image on the client and upload it to replace the current image.
  const createPlaceholderFile = (name = 'placeholder.png', w = 200, h = 200, color = '#ddd') => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0,0,w,h)
    // optional: draw initials or icon
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], name, { type: blob.type || 'image/png' })
        resolve(file)
      }, 'image/png')
    })
  }

  const removeAvatar = async () => {
    if(!window.confirm('Replace avatar with a placeholder?')) return
    setLoading(true)
    setMessage(null)
    try{
      const placeholder = await createPlaceholderFile('avatar-placeholder.png', 200, 200, '#cfcfcf')
      const form = new FormData()
      form.append('avatar', placeholder)
      await api.patch('/users/avatar', form, { headers: {'Content-Type': 'multipart/form-data'} })
      await fetchCurrentUser()
      setMessage('Avatar replaced with placeholder')
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  const uploadCover = async (e) => {
    e.preventDefault()
    if(!coverFile) return setMessage('Select a cover image')
    setLoading(true)
    setMessage(null)
    try{
      const form = new FormData()
      form.append('coverImage', coverFile)
      await api.patch('/users/update-cover-image', form, { headers: {'Content-Type': 'multipart/form-data'} })
      await fetchCurrentUser()
      setMessage('Cover image updated')
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  const removeCover = async () => {
    if(!window.confirm('Replace cover image with a placeholder?')) return
    setLoading(true)
    setMessage(null)
    try{
      const placeholder = await createPlaceholderFile('cover-placeholder.png', 1200, 300, '#e8e8e8')
      const form = new FormData()
      form.append('coverImage', placeholder)
      await api.patch('/users/update-cover-image', form, { headers: {'Content-Type': 'multipart/form-data'} })
      await fetchCurrentUser()
      setMessage('Cover image replaced with placeholder')
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <section className="profile-section">
      <h2>Your profile</h2>
      {message && <div className="profile-message">{message}</div>}
      <div className="profile-row">
        <img src={user.avatar || '/vite.svg'} alt="avatar" className="profile-avatar" />
        <div>
          <div><strong>{user.fullName}</strong></div>
          <div className="profile-meta">@{user.username}</div>
          <div className="profile-meta">{user.email}</div>
        </div>
      </div>

      <form onSubmit={uploadAvatar} className="profile-form">
        <label>Change avatar</label>
        <input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files[0])} />
        <button type="submit" disabled={loading}>Upload avatar</button>
        <button type="button" className="muted" onClick={removeAvatar} disabled={loading}>Remove avatar</button>
      </form>

      <form onSubmit={uploadCover} className="profile-form">
        <label>Change cover image</label>
        <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} />
        <button type="submit" disabled={loading}>Upload cover</button>
        <button type="button" className="muted" onClick={removeCover} disabled={loading}>Remove cover</button>
      </form>
    </section>
  )
}
