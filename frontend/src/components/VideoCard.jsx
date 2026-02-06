import { Link } from 'react-router-dom'
import './VideoCard.css'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'
import { useState } from 'react'

export default function VideoCard({ video, onDeleted, selectable = false, selected = false, onSelectChange, onEdit }) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  if (!video) return null

  const isOwner = user && (video.owner && ((video.owner._id && video.owner._id === user._id) || (video.owner === user._id) || (video.owner._id === user?._id)))

  const doDelete = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    if (!window.confirm('Delete this video? This cannot be undone.')) return
    setDeleting(true)
    setError(null)
    try {
      await api.delete(`/videos/${video._id}`)
      onDeleted && onDeleted(video._id)
    } catch (err) {
      setError(err?.response?.data?.message || err.message)
    } finally { setDeleting(false) }
  }

  return (
    <article className="video-card">
      <div className="card-top">
        {selectable && (
          <input type="checkbox" className="card-select" checked={!!selected} onChange={e => onSelectChange && onSelectChange(video._id, e.target.checked)} />
        )}
        <Link to={`/video/${video._id}`} className="card-link">
          <img className="video-thumb" src={video.thumbnail} alt={video.title} />
        </Link>
      </div>
      <div className="card-body">
        <Link to={`/video/${video._id}`} className="card-link">
          <h3 className="video-title">{video.title}</h3>
          <div className="video-owner">
            <img className="owner-avatar" src={video.owner?.avatar || '/vite.svg'} alt={(video.owner?.username || 'Unknown') + ' avatar'} />
            <div className="owner-name">{video.owner?.username || 'Unknown'}</div>
          </div>
        </Link>
      </div>
      <div className="card-footer">
        {isOwner && onEdit && (
          <button className="card-edit" onClick={() => onEdit(video)}>Edit</button>
        )}
        {isOwner && (
          <div className="card-actions">
            <button className="card-delete" onClick={doDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
            {error && <div className="card-error">{error}</div>}
          </div>
        )}
      </div>
    </article>
  )
}
