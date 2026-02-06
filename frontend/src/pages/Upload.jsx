import React, { useState } from 'react'
import api from '../api'
import './Upload.css'

export default function Upload(){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    try{
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      if(videoFile) form.append('videoFile', videoFile)
      if(thumbnail) form.append('thumbnail', thumbnail)

      const res = await api.post('/videos', form, { headers: {'Content-Type': 'multipart/form-data'} })
      setMessage('Uploaded successfully')
    } catch (err){
      setMessage(err?.response?.data?.message || err.message)
    }
  }

  return (
    <form onSubmit={submit} className="upload-form">
      <h2>Upload Video</h2>
      {message && <div className="upload-message">{message}</div>}
      <div className="upload-row">
        <label>Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="upload-full" />
      </div>
      <div className="upload-row">
        <label>Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} className="upload-full" />
      </div>
      <div className="upload-row">
        <label>Video File</label>
        <input type="file" accept="video/*" onChange={e=>setVideoFile(e.target.files[0])} />
      </div>
      <div className="upload-row">
        <label>Thumbnail</label>
        <input type="file" accept="image/*" onChange={e=>setThumbnail(e.target.files[0])} />
      </div>
      <button type="submit">Publish</button>
    </form>
  )
}
