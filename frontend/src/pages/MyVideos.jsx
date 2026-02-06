import React, { useEffect, useState, useRef } from 'react'
import api from '../api'
import VideoCard from '../components/VideoCard'
import EditVideoModal from '../components/EditVideoModal'
import { useAuth } from '../contexts/AuthContext'
import './MyVideos.css'

export default function MyVideos(){
  const { user, loading: authLoading } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // selection and pending delete state
  const [selected, setSelected] = useState(() => new Set())
  const [pendingDeletes, setPendingDeletes] = useState(() => ({})) // id -> timeoutId
  const pendingDeletesRef = useRef({})

  // edit modal
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    const fetchMyVideos = async () => {
      setLoading(true)
      try{
        const res = await api.get('/videos', { params: { userId: user._id, page: 1, limit: 200 } })
        const list = res?.data?.data?.videos || res?.data?.videos || []
        // fallback filter for various owner shapes
        const filtered = list.filter(v => {
          if(!v) return false
          if(!v.owner) return false
          if(typeof v.owner === 'string') return v.owner === user._id
          return v.owner._id === user._id || v.owner === user._id
        })
        setVideos(filtered)
      } catch (err){
        setError(err?.response?.data?.message || err.message)
      } finally { setLoading(false) }
    }

    if(!authLoading && user){
      fetchMyVideos()
    }
  }, [authLoading, user])

  const handleSelectChange = (id, isChecked) => {
    setSelected(prev => {
      const copy = new Set(prev)
      if(isChecked) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  const selectAll = (checked) => {
    if(checked){
      setSelected(new Set(videos.map(v=>v._id)))
    } else {
      setSelected(new Set())
    }
  }

  const scheduleDelete = (ids = []) => {
    // schedule deletion after delay (allow undo)
    const delay = 7000 // ms
    const timeouts = {}
    ids.forEach(id => {
      if(pendingDeletesRef.current[id]) return // already scheduled
      const t = setTimeout(async () => {
        try{
          await api.delete(`/videos/${id}`)
        } catch (err){
          console.error('delete failed', err)
        }
        // remove from UI
        setVideos(prev => prev.filter(v => v._id !== id))
        // cleanup pending state
        setPendingDeletes(prev => {
          const copy = {...prev}
          delete copy[id]
          pendingDeletesRef.current = copy
          return copy
        })
      }, delay)
      timeouts[id] = t
    })

    setPendingDeletes(prev => {
      const copy = {...prev, ...timeouts}
      pendingDeletesRef.current = copy
      return copy
    })
    // clear selection of scheduled ids
    setSelected(prev => {
      const copy = new Set(prev)
      ids.forEach(id=>copy.delete(id))
      return copy
    })
  }

  const cancelPending = (ids = []) => {
    setPendingDeletes(prev => {
      const copy = {...prev}
      ids.forEach(id => {
        const t = copy[id]
        if(t) clearTimeout(t)
        delete copy[id]
      })
      pendingDeletesRef.current = copy
      return copy
    })
  }

  const handleBulkDelete = () => {
    if(selected.size === 0) return
    const ids = Array.from(selected)
    // mark and schedule
    scheduleDelete(ids)
  }

  const handleImmediateDelete = (id) => {
    // schedule single id delete
    scheduleDelete([id])
  }

  const handleDeleted = (id) => {
    // immediate UI removal (used by VideoCard individual delete)
    setVideos(prev => prev.filter(v => v._id !== id))
  }

  const openEdit = (video) => {
    setEditing(video)
  }

  const onSaved = (updated) => {
    setVideos(prev => prev.map(v => v._id === updated._id ? updated : v))
  }

  const pendingCount = Object.keys(pendingDeletes).length

  if(authLoading) return <p>Checking authentication...</p>
  if(!user) return <p>Please login to see your uploads.</p>

  return (
    <section className="myvideos-section">
      <h2>My uploads</h2>

      <div className="management-bar">
        <label>
          <input type="checkbox" onChange={e=>selectAll(e.target.checked)} checked={selected.size === videos.length && videos.length>0} /> Select all
        </label>
        <button disabled={selected.size===0} onClick={handleBulkDelete} className="bulk-delete">Delete selected</button>
        {pendingCount>0 && (
          <div className="undo-bar">
            <span>{pendingCount} pending deletion</span>
            <button onClick={()=>cancelPending(Object.keys(pendingDeletes))}>Undo</button>
          </div>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      <div className="myvideos-list">
        {videos.map(v => (
          <VideoCard
            key={v._id}
            video={v}
            onDeleted={handleDeleted}
            selectable={true}
            selected={selected.has(v._id)}
            onSelectChange={handleSelectChange}
            onEdit={openEdit}
          />
        ))}
      </div>

      {editing && <EditVideoModal video={editing} onClose={()=>setEditing(null)} onSaved={onSaved} />}
    </section>
  )
}
