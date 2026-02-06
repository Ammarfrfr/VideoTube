import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Video from './pages/Video'
import Login from './pages/Login'
import Upload from './pages/Upload'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyVideos from './pages/MyVideos'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <AuthProvider>
  <Header />
  <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<Video />} />
          <Route path="/my-videos" element={<RequireAuth><MyVideos /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
        </Routes>
      </main>
    </AuthProvider>
  )
}

export default App
