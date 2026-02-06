import React, { useState } from 'react'
import api from '../api'
import './EditVideoModal.css'

export default function EditVideoModal({ video, onClose, onSaved }){
  const [title, setTitle] = useState(video.title || '')
  const [description, setDescription] = useState(video.description || '')
  const [thumbnail, setThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const save = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try{
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      if(thumbnail) form.append('thumbnail', thumbnail)
      const res = await api.patch(`/videos/${video._id}`, form, { headers: {'Content-Type':'multipart/form-data'} })
      const updated = res?.data?.data || res?.data
      onSaved && onSaved(updated)
      onClose && onClose()
    } catch (err){
      setError(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-wrap">
        <h3>Edit video</h3>
        {error && <div className="modal-error">{error}</div>}
        <form onSubmit={save} className="modal-form">
          <label>Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} />
          <label>Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} />
          <label>Thumbnail (optional)</label>
          <input type="file" accept="image/*" onChange={e=>setThumbnail(e.target.files[0])} />
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
