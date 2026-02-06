import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Loading authentication...</div>

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
