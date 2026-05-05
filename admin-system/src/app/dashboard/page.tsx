import { fetchTransactions } from '@/app/actions/transactions'
import { fetchUsers } from '@/app/actions/admin'

export default async function AdminDashboard() {
  const [txRes, usersRes] = await Promise.all([
    fetchTransactions(),
    fetchUsers()
  ])

  const transactions = txRes.data || []
  const users = usersRes.data || []

  const totalVolume = transactions
    .filter(t => t.status === 'CLAIMED')
    .reduce((acc, current) => acc + Number(current.amount), 0)

  const pendingVolume = transactions
    .filter(t => t.status === 'PENDING')
    .reduce((acc, current) => acc + Number(current.amount), 0)

  const pendingAdminsCount = users.filter(u => u.role === 'pending').length

  return (
    <>
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card stat-card">
          <h3>Total Volume (Claimed)</h3>
          <div className="value text-success">${totalVolume.toLocaleString()}</div>
        </div>
        
        <div className="card stat-card">
          <h3>Pending Volume</h3>
          <div className="value text-pending">${pendingVolume.toLocaleString()}</div>
        </div>

        <div className="card stat-card">
          <h3>Total Users</h3>
          <div className="value">{users.length}</div>
          {pendingAdminsCount > 0 && (
            <p className="text-danger mt-2" style={{ fontSize: '0.85rem' }}>
              {pendingAdminsCount} user(s) awaiting approval
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3">Recent Activity</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Origin</th>
                <th>Claimed Hub</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.code}</td>
                  <td>${Number(tx.amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${tx.status === 'CLAIMED' ? 'badge-claimed' : 'badge-pending'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>{(tx.origin as { name: string }[] | null)?.[0]?.name}</td>
                  <td>{(tx.claimed as { name: string }[] | null)?.[0]?.name || '-'}</td>
                  <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No recent activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
