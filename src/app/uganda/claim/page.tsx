'use client'

import { useState } from 'react'
import { previewClaim, claimTransaction } from '@/app/actions/transactions'
import Link from 'next/link'

interface TransactionData {
  id: string;
  amount: number;
  sender_name?: string;
  sender_contact?: string;
}

export default function BranchClaimTxPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<TransactionData | null>(null)
  const [successData, setSuccessData] = useState<TransactionData | null>(null)

  async function handleLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessData(null)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const code = formData.get('code') as string
    
    const res = await previewClaim(code.trim())
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.data) {
      setPreview(res.data)
      form.reset()
    }
    setLoading(false)
  }

  async function handleConfirmClaim() {
    if (!preview) return
    setLoading(true)
    setErrorMsg('')
    const res = await claimTransaction(preview.id)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.data) {
      setSuccessData(res.data)
      setPreview(null) // Clear preview state
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="mb-4 text-center">Process Claim</h1>
      
      <div className="card">
        {errorMsg && (
          <div className="mb-4 p-3 text-center text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        {/* STEP 1: LOOKUP FORM */}
        {!preview && !successData && (
          <form onSubmit={handleLookup}>
            <p className="mb-4 text-secondary text-center">Enter the requested cross-border transfer code to lookup details.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="code">Transfer Code</label>
              <input 
                className="form-input" 
                id="code" 
                name="code" 
                type="text" 
                placeholder="e.g. UG-ABCDEF12" 
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px', textAlign: 'center' }}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Searching...' : 'Lookup Payload'}
            </button>
          </form>
        )}

        {/* STEP 2: PREVIEW / VERIFICATION */}
        {preview && !successData && (
          <div className="animate-fade-in">
            <h3 className="mb-3 text-center" style={{ color: 'var(--accent-pending)' }}>Transaction Found</h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p className="mb-2"><strong>Transfer Amount:</strong> <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>${Number(preview.amount).toLocaleString()}</span></p>
              
              <div style={{ borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }}></div>
              <p className="mb-2 text-secondary"><strong>Sender Information:</strong></p>
              <p>Name: {preview.sender_name}</p>
              <p>Contact: {preview.sender_contact}</p>
              
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setPreview(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmClaim} className="btn btn-success" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Processing...' : 'Verify ID & Release Funds'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS RECEIPT */}
        {successData && (
          <div className="animate-fade-in p-4 text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-success)', borderRadius: 'var(--border-radius)' }}>
            <h3 className="text-success mb-2">Claim Successfully Processed!</h3>
            <p className="mb-2">Release the following completely verified amount to the customer:</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              ${Number(successData.amount).toLocaleString()}
            </div>
            
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Transaction automatically securely logged.</p>

            <div className="mt-4 flex gap-4" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => window.print()} className="btn btn-success btn-print">
                Print Final Receipt
              </button>
              <button type="button" onClick={() => setSuccessData(null)} className="btn btn-secondary btn-print">
                Next Claim
              </button>
              <Link href="/uganda/history" className="btn btn-secondary">History</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
