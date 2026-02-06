import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

export default function Header(){
  const { user, logout } = useAuth()

  return (
    <header className="header">
      {user?.coverImage && (
        <div className="header-banner">
          <img className="cover-img" src={user.coverImage} alt="cover" onError={(e)=>{ e.currentTarget.style.display = 'none' }} />
        </div>
      )}
      <div className="header-inner">
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/upload">Upload</Link>
          <Link to="/my-videos">My Videos</Link>
        </nav>
        <div className="header-links">
          {user ? (
            <>
              <div className="user-inline">
                <img
                  className="user-avatar"
                  src={user.avatar || '/vite.svg'}
                  alt={(user.username || user.fullName || 'Me') + " avatar"}
                />
                <span className="user-name">{user.username || user?.fullName || 'Me'}</span>
              </div>
              <Link to="/profile">Profile</Link>
              <button onClick={() => logout()}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
