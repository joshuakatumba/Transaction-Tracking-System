'use client'

import { useState } from 'react'
import { createTransaction } from '@/app/actions/transactions'
import Link from 'next/link'

interface TransactionPayload {
  amount: number
  senderName: string
  senderContact: string
  senderAddress: string
}

export default function BranchCreateTxPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code?: string, error?: string, rawData?: TransactionPayload } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const payload = {
      amount: Number(formData.get('amount')),
      senderName: formData.get('senderName') as string,
      senderContact: formData.get('senderContact') as string,
      senderAddress: formData.get('senderAddress') as string,
    }
    
    const res = await createTransaction(payload)
    if (res.error) {
      setResult({ error: res.error })
    } else if (res.data) {
      setResult({ code: res.data.code, rawData: payload })
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 className="mb-4 text-center">Initiate Transfer</h1>
      
      <div className="card">
        {result?.error && (
          <div className="mb-4 p-3 text-center text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px' }}>
            {result.error}
          </div>
        )}

        {result?.code ? (
          <div className="p-4 text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-success)', borderRadius: 'var(--border-radius)' }}>
            <h3 className="text-success mb-2">Transfer Initiated Successfully</h3>
            <p className="mb-2 text-secondary">Provide this secure code to the recipient.</p>
            <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '2px', fontFamily: 'monospace', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', margin: '1rem 0' }}>
              {result.code}
            </div>
            
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 className="mb-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Transaction Details</h4>
              <p><strong>Amount to Transfer:</strong> ${result.rawData?.amount.toLocaleString()}</p>
              <br/>
              <p><strong>Sender:</strong> {result.rawData?.senderName}</p>
              <p><strong>Sender Contact:</strong> {result.rawData?.senderContact}</p>
              <p><strong>Sender Address:</strong> {result.rawData?.senderAddress}</p>
            </div>

            <div className="mt-4 flex gap-4" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => window.print()} className="btn btn-primary btn-print" style={{ background: '#3b82f6' }}>
                Print Receipt
              </button>
              <button type="button" onClick={() => setResult(null)} className="btn btn-secondary btn-print">
                Send Another
              </button>
              <Link href="/uganda/history" className="btn btn-secondary">View History</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="mb-3 text-secondary" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Sender Details</h3>
            
            <div className="form-group">
              <label className="form-label" htmlFor="senderName">Full Name</label>
              <input className="form-input" id="senderName" name="senderName" type="text" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="senderContact">Phone Number</label>
              <input className="form-input" id="senderContact" name="senderContact" type="tel" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="senderAddress">Physical Address</label>
              <input className="form-input" id="senderAddress" name="senderAddress" type="text" required />
            </div>

            <h3 className="mb-3 mt-4 text-secondary" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Transfer Details</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="amount">Amount (USD)</label>
              <input className="form-input" id="amount" name="amount" type="number" min="1" step="0.01" style={{ fontSize: '1.25rem', fontWeight: 600 }} required />
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-4" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem' }}>
              {loading ? 'Processing...' : 'Generate Transfer Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
