import React, { useEffect, useState } from 'react'
import api from '../api'
import VideoCard from '../components/VideoCard'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [debugOpen, setDebugOpen] = useState(false)
  const [feedRaw, setFeedRaw] = useState(null)
  const [mineRaw, setMineRaw] = useState(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        // Fetch public feed
        const res = await api.get('/videos')
        const feed = res?.data?.data?.videos || res?.data?.videos || []
        setFeedRaw(res?.data || null)

        // Also try to fetch the current user's uploads (some deployments return different datasets)
        let mine = []
        try {
          const mineRes = await api.get('/videos', { params: { userId: user?._id, page: 1, limit: 50 } })
          mine = mineRes?.data?.data?.videos || mineRes?.data?.videos || []
          setMineRaw(mineRes?.data || null)
        } catch (e) {
          // ignore: backend may not return owner videos via this endpoint
          console.debug('Could not fetch user-specific videos', e?.response?.data || e.message || e)
        }

        // merge feed + mine, preferring feed order, and dedupe by _id
        const combined = []
        const seen = new Set()
          ;[...feed, ...mine].forEach(v => {
            if (!v) return
            if (!seen.has(v._id)) {
              seen.add(v._id)
              combined.push(v)
            }
          })

        setVideos(combined)
        // clear error when we successfully fetched
        setError(null)

      } catch (err) {
        // show friendly message and attempt a fallback detailed fetch to help debugging
        const msg = err?.response?.data?.message || err.message || String(err)
        setError(msg)

        // fallback: try calling the API directly with fetch and Authorization header (helps when CORS/cookies are the issue)
        try {
          const API_BASE = import.meta.env.VITE_API_URL
          const token = localStorage.getItem('accessToken')
          const fallbackRes = await fetch(`${API_BASE}/api/v1/videos?page=1&limit=50`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          const text = await fallbackRes.text()
          console.debug('Fallback /videos response:', fallbackRes.status, text)
        } catch (fallbackErr) {
          console.debug('Fallback fetch failed', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    // wait for auth to finish. If user is present, fetch videos.
    if (!authLoading && user) {
      fetchVideos()
    }
    // if auth finished and no user, do not fetch (videos API is protected on backend)
  }, [authLoading, user])

  if (authLoading) return <p>Checking authentication...</p>

  if (!user) {
    return (
      <section className="home-section">
        <h2>Latest videos</h2>
        <p>
          You need to <Link to="/login">log in</Link> to see videos.
        </p>
      </section>
    )
  }

  return (
    <section className="home-section">
      <h2>Latest videos</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setDebugOpen(d => !d)} style={{ fontSize: 12 }}>{debugOpen ? 'Hide' : 'Show'} debug</button>
        {feedRaw && <div style={{ fontSize: 12, color: '#666' }}>{`feed: ${Array.isArray(feedRaw?.data?.videos || feedRaw?.videos) ? (feedRaw?.data?.videos || feedRaw?.videos).length : '??'} items`}</div>}
        {mineRaw && <div style={{ fontSize: 12, color: '#666' }}>{`mine: ${Array.isArray(mineRaw?.data?.videos || mineRaw?.videos) ? (mineRaw?.data?.videos || mineRaw?.videos).length : '??'} items`}</div>}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="home-error">Error: {error}</p>}
      {debugOpen && (
        <div style={{ background: '#111', color: '#0f0', padding: 12, margin: '12px 0', maxHeight: 320, overflow: 'auto' }}>
          <h4 style={{ marginTop: 0 }}>Debug — raw responses</h4>
          <details style={{ marginBottom: 8 }} open>
            <summary style={{ cursor: 'pointer' }}>Feed response</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(feedRaw, null, 2)}</pre>
          </details>
          <details>
            <summary style={{ cursor: 'pointer' }}>My videos response</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(mineRaw, null, 2)}</pre>
          </details>
        </div>
      )}
      <div className="home-list">
        {videos.map(v => (
          <VideoCard key={v._id} video={v} onDeleted={(id) => setVideos(prev => prev.filter(x => x._id !== id))} />
        ))}
      </div>
    </section>
  )
}
