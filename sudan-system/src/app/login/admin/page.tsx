'use client'

import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { useState } from 'react'

export default function AdminLoginPage() {
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await login(formData)
      if (res?.error) {
        setErrorMsg(res.error)
      }
    } catch {
      // ignore redirect throwing
    }
    setLoading(false)
  }

  return (
    <div className="center-page">
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="portal-badge">
            <span></span>
            Admin Portal
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>v2.4.0</div>
        </div>

        <h1 className="text-center" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Login</h1>
        <p className="text-center mb-4">Authorized administrators only</p>

        {errorMsg && (
          <div className="mb-4 p-3 text-center text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="portal" value="admin" />
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="form-input"
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-input"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block mb-3" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="text-center" style={{ fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Regular user? </span>
          <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
            Go to staff login
          </Link>
        </div>
      </div>
    </div>
  )
}
