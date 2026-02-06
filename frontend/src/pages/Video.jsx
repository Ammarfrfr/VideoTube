import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import './Video.css'

export default function Video(){
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/videos/${id}`)
        const data = res?.data?.data || res?.data

        // Backend currently may return just the videoId (string) due to a server bug.
        // If we receive a non-object (string) or the object doesn't contain videoFile,
        // fall back to fetching the videos list and find the video by id.
        if (!data || typeof data === 'string' || (typeof data === 'object' && !data.videoFile)) {
          // try to fetch list and find the video
          const listRes = await api.get('/videos', { params: { page: 1, limit: 100 } })
          const list = listRes?.data?.data?.videos || listRes?.data?.videos || []
          const found = list.find(v => v._id === id)
          if (found) {
            setVideo(found)
          } else {
            // as a last resort, if data is an id string, indicate not found
            setError('Video data not found (server returned unexpected response)')
          }
        } else {
          setVideo(data)
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchVideo()
  }, [id])

  if(loading) return <p>Loading...</p>
  if(error) return <p className="error">Error: {error}</p>

  return (
    <section>
      {!video && <p>No video data available.</p>}
      {video && (
        <div>
          {video.coverImage && (
            <div className="video-cover-wrap">
              <img className="video-cover" src={video.coverImage} alt="cover" onError={(e)=>{ e.currentTarget.style.display = 'none' }} />
            </div>
          )}
          <h2>{video.title || `Video ${id}`}</h2>
          {video.videoFile ? (
            <video controls src={video.videoFile} className="video-player" />
          ) : (
            <p>Video playback unavailable.</p>
          )}
          {/* If owner show delete button */}
          {user && (video.owner && ((video.owner._id && video.owner._id === user._id) || (video.owner === user._id) || (video.owner._id === user?._id))) && (
            <DeleteButton videoId={video._id} onDeleted={() => navigate('/')} />
          )}
          {/* If the current user is the owner show a publish toggle */}
          {user && (video.owner && ((video.owner._id && video.owner._id === user._id) || (video.owner === user._id) || (video.owner._id === user?._id))) && (
            <PublishToggle videoId={video._id} isPublished={!!video.isPublished} onChange={(val) => setVideo(prev => ({...prev, isPublished: val}))} />
          )}
          <p>{video.description}</p>
        </div>
      )}
    </section>
  )
}

function PublishToggle({ videoId, isPublished, onChange }){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggle = async () => {
    setLoading(true)
    setError(null)
    try{
      const res = await api.patch(`/videos/toggle/publish/${videoId}`)
      const updated = res?.data?.data || res?.data
      onChange(updated?.isPublished ?? !isPublished)
    } catch (err){
      setError(err?.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="publish-toggle">
      <button onClick={toggle} disabled={loading}>
        {loading ? 'Changing...' : isPublished ? 'Make Private' : 'Make Public'}
      </button>
      {error && <div className="publish-error">{error}</div>}
    </div>
  )
}

function DeleteButton({ videoId, onDeleted }){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const doDelete = async () => {
    if(!window.confirm('Delete this video? This action cannot be undone.')) return
    setLoading(true)
    setError(null)
    try{
      await api.delete(`/videos/${videoId}`)
      onDeleted && onDeleted()
    } catch (err){
      setError(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="delete-area">
      <button className="delete-button" onClick={doDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete Video'}
      </button>
      {error && <div className="delete-error">{error}</div>}
    </div>
  )
}
