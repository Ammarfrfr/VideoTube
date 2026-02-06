import React, { createContext, useContext, useEffect, useState } from 'react'
import api, { setAuthToken, clearAuthToken } from '../api'

const AuthContext = createContext()

export function useAuth(){
  return useContext(AuthContext)
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // initial load

  const normalizeUserFromResponse = (res) => {
    // backend responses vary; try common shapes
    if(!res) return null
    if(res.data?.data) return res.data.data
    if(res.data?.user) return res.data.user
    if(res.data) return res.data
    return null
  }

  const fetchCurrentUser = async () => {
    try{
      const res = await api.get('/users/current-user')
      const payload = normalizeUserFromResponse(res)
      // if backend returns wrapper e.g. ApiResponse {data: user}
      setUser(payload || null)
    } catch (err){
      // unauthorized or other error -> no user
      setUser(null)
      // remove invalid token if any
      clearAuthToken()
      localStorage.removeItem('accessToken')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // if an accessToken exists in localStorage, use it for Authorization header
    const existing = localStorage.getItem('accessToken')
    if (existing) {
      setAuthToken(existing)
      // only fetch current user when a token exists — avoids noisy 401 on first load
      fetchCurrentUser()
    } else {
      // no token -> not authenticated. mark loading finished
      setLoading(false)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (payload) => {
    // payload: {username|email, password}
    const res = await api.post('/users/login', payload)

    // try to read accessToken from response body (backend returns it in data)
    const accessToken = res?.data?.data?.accessToken || res?.data?.accessToken || res?.data?.access_token
    if (accessToken) {
      // persist and set Authorization header for future requests
      localStorage.setItem('accessToken', accessToken)
      setAuthToken(accessToken)
    }

    // refresh current user using Authorization header (or cookies if backend sets them)
    await fetchCurrentUser()
  }

  const logout = async () => {
    try{
      await api.post('/users/logout')
    } catch (err) {
      // ignore errors
    }
    clearAuthToken()
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  const value = { user, loading, login, logout, fetchCurrentUser }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
