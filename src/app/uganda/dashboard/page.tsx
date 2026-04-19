import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchTransactions } from '@/app/actions/transactions'

export default async function BranchDashboard() {
  const { data: transactions } = await fetchTransactions()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('branch_id').eq('id', user?.id).single()

  const myBranchTransactions = (transactions || []).filter(
    tx => tx.branch_origin === profile?.branch_id || tx.branch_claimed === profile?.branch_id
  )

  const sentCount = myBranchTransactions.filter(tx => tx.branch_origin === profile?.branch_id).length
  const receivedCount = myBranchTransactions.filter(tx => tx.branch_claimed === profile?.branch_id && tx.status === 'CLAIMED').length

  return (
    <>
      <h1 className="mb-4">Branch Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card stat-card">
          <h3>Transfers Sent</h3>
          <div className="value">{sentCount}</div>
          <Link href="/uganda/create" className="btn btn-primary mt-4 btn-block">New Transfer</Link>
        </div>
        
        <div className="card stat-card">
          <h3>Transfers Received</h3>
          <div className="value text-success">{receivedCount}</div>
          <Link href="/uganda/claim" className="btn btn-success mt-4 btn-block">Process Claim</Link>
        </div>

        <div className="card stat-card">
          <h3>Pending Claims (Global)</h3>
          <div className="value text-pending">
            {(transactions || []).filter(t => t.status === 'PENDING').length}
          </div>
          <p className="mt-4 text-center" style={{ fontSize: '0.875rem' }}>Awaiting recipients</p>
        </div>
      </div>
    </>
  )
}
