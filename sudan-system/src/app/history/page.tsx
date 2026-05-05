import { fetchTransactions } from '@/app/actions/transactions'
import { createClient } from '@/utils/supabase/server'

export default async function BranchHistoryPage() {
  const { data: transactions } = await fetchTransactions()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('branch_id').eq('id', user?.id).single()

  // Filter transactions that belong to this branch either as origin or claimed
  const branchTransactions = (transactions || []).filter(
    tx => tx.branch_origin === profile?.branch_id || tx.branch_claimed === profile?.branch_id
  )

  return (
    <>
      <h1 className="mb-4">Branch Transaction History</h1>
      
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Other Branch</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {branchTransactions.map(tx => {
                const isSentByUs = tx.branch_origin === profile?.branch_id
                const otherBranch = isSentByUs ? tx.claimed : tx.origin
                
                return (
                  <tr key={tx.id}>
                    <td>
                      {isSentByUs ? (
                        <span className="badge badge-admin">Sent</span>
                      ) : (
                        <span className="badge badge-claimed">Received</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.code}</td>
                    <td>${Number(tx.amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${tx.status === 'CLAIMED' ? 'badge-claimed' : 'badge-pending'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{(otherBranch as { name: string }[] | null)?.[0]?.name || 'Pending'}</td>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
              {branchTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No transaction history found for this branch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
