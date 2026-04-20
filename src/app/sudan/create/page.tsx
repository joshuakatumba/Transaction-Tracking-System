'use client'

import { useState } from 'react'
import { createTransaction } from '@/app/actions/transactions'
import Link from 'next/link'
import { Printer, Send, History, CheckCircle, ArrowLeft } from 'lucide-react'

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

  const branchName = "Sudan Branch"

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Screen View */}
      <div className="no-print">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/sudan/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0 }}>Initiate Transfer</h1>
        </div>
        
        <div className="card" style={{ padding: 0 }}>
          {result?.code ? (
            <div style={{ padding: '4rem', textAlign: 'center' }} className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <CheckCircle size={64} color="var(--accent-success)" />
              </div>
              <h2 className="text-success mb-2">Transfer Initiated Successfully</h2>
              <p className="mb-6 text-secondary">Provide the secure code below to the recipient.</p>
              
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                letterSpacing: '4px', 
                fontFamily: 'monospace', 
                padding: '1.5rem', 
                background: 'rgba(0,0,0,0.4)', 
                border: '2px dashed var(--accent-success)',
                borderRadius: '12px', 
                margin: '2rem 0',
                color: 'white',
                textShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
              }}>
                {result.code}
              </div>
              
              <div className="mt-8 flex gap-4" style={{ justifyContent: 'center' }}>
                <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ gap: '8px' }}>
                  <Printer size={18} /> Print Receipt
                </button>
                <button type="button" onClick={() => setResult(null)} className="btn btn-secondary">
                  Send Another
                </button>
                <Link href="/sudan/dashboard" className="btn btn-secondary">
                  Done
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Form Body Section */}
              <div style={{ flex: 1, padding: '3.5rem', borderRight: '1px solid var(--border-color)' }}>
                <form onSubmit={handleSubmit}>
                  {result?.error && (
                    <div className="mb-4 p-3 text-center text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px' }}>
                      {result.error}
                    </div>
                  )}

                  <h3 className="mb-4 text-secondary" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sender Information</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="senderName">Sender Full Name</label>
                    <input className="form-input" id="senderName" name="senderName" type="text" placeholder="Enter full legal name" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label" htmlFor="senderContact">Phone Number</label>
                      <input className="form-input" id="senderContact" name="senderContact" type="tel" placeholder="+249..." required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="senderAddress">Physical Address</label>
                      <input className="form-input" id="senderAddress" name="senderAddress" type="text" placeholder="City, Street" required />
                    </div>
                  </div>

                  <h3 className="mb-4 mt-8 text-secondary" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transfer Details</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="amount">Transfer Amount (USD)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-secondary)' }}>$</span>
                      <input 
                        className="form-input" 
                        id="amount" 
                        name="amount" 
                        type="number" 
                        min="1" 
                        step="0.01" 
                        style={{ paddingLeft: '2rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }} 
                        placeholder="0.00"
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '4rem', padding: '1.25rem', fontSize: '1.1rem', gap: '10px' }}>
                    {loading ? 'Processing...' : <><Send size={20} /> Generate Transfer Code</>}
                  </button>
                </form>
              </div>

              {/* Info Sidebar Section */}
              <div style={{ width: '100%', maxWidth: '320px', padding: '3.5rem', background: 'rgba(0,0,0,0.02)' }}>
                <h4 className="mb-3">Quick Tips</h4>
                <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li>• Ensure the sender's name matches their ID.</li>
                  <li>• Transfer codes are case-sensitive.</li>
                  <li>• Provide the printed receipt to the customer for their records.</li>
                </ul>
                <div style={{ marginTop: '4rem' }}>
                  <Link href="/sudan/history" className="btn btn-secondary btn-block" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    <History size={16} /> View History
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-Only Receipt Version */}
      {result?.code && (
        <div className="print-only">
          <div className="receipt-border">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <h1 style={{ color: 'black', fontSize: '1.8rem', marginBottom: '0.25rem' }}>LENNOX POS</h1>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Official Transfer Receipt</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div>
                <p style={{ fontWeight: 'bold' }}>DATE</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold' }}>BRANCH</p>
                <p>{branchName}</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transfer Code</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', border: '2px solid black', display: 'inline-block', padding: '0.25rem 1rem' }}>
                {result.code}
              </h2>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', borderBottom: '1px solid black', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>DETAILS</h3>
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.25rem 0' }}>Amount:</td>
                    <td style={{ padding: '0.25rem 0', textAlign: 'right', fontWeight: 700 }}>${result.rawData?.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.25rem 0' }}>Sender:</td>
                    <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{result.rawData?.senderName}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '3rem', fontSize: '0.75rem', textAlign: 'center' }}>
              <p style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>Customer Signature</p>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem' }}>
              <p>Keep this code safe.</p>
              <p>Thank you for using Lennox.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) {
          .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .flex-row { flex-direction: row; }
        }
      `}</style>
    </div>
  )
}
