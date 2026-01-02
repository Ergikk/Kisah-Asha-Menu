import { useEffect } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'

export default function AdminGuard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('asha_admin_token')

  useEffect(() => {
    if (!token || token.split('_')[2] < Date.now() - 24*60*60*1000) {
      localStorage.removeItem('asha_admin_token')
      navigate('/admin-login')
    }
  }, [navigate, token])

  if (!token) return null // Loading state

  return <Outlet />
}
