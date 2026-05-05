'use client'

import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { useState } from 'react'

export default function SignupPage() {
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    
    const res = await signup(formData)
    if (res?.error) {
      setErrorMsg(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="center-page">
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-center">Create Account</h1>
        <p className="text-center mb-4">Sign up and wait for admin approval</p>

        {errorMsg && (
          <div className="mb-4 p-3 text-center text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="first_name">First Name</label>
            <input 
              className="form-input" 
              id="first_name" 
              name="first_name" 
              type="text" 
              placeholder="John" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="last_name">Last Name</label>
            <input 
              className="form-input" 
              id="last_name" 
              name="last_name" 
              type="text" 
              placeholder="Doe" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact">Contact</label>
            <input 
              className="form-input" 
              id="contact" 
              name="contact" 
              type="text" 
              placeholder="+256700000000" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              className="form-input" 
              id="email" 
              name="email" 
              type="email" 
              placeholder="agent@example.com" 
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
              placeholder="Create a strong password" 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block mb-3" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center" style={{ fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  )
}
