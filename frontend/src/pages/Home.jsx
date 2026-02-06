import React, { useEffect, useState } from 'react'
import api from '../api'
import VideoCard from '../components/VideoCard'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import './Home.css'

export default function Home(){
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const res = await api.get('/videos')
        const list = res?.data?.data?.videos || res?.data?.videos || []
        setVideos(list)
      } catch (err) {
        setError(err?.response?.data?.message || err.message)
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
      {loading && <p>Loading...</p>}
      {error && <p className="home-error">Error: {error}</p>}
      <div className="home-list">
        {videos.map(v => (
          <VideoCard key={v._id} video={v} onDeleted={(id) => setVideos(prev => prev.filter(x => x._id !== id))} />
        ))}
      </div>
    </section>
  )
}
