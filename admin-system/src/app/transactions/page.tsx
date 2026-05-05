import { fetchTransactions } from '@/app/actions/transactions'

export default async function AdminTransactionsPage() {
  const { data: transactions } = await fetchTransactions()

  return (
    <>
      <h1 className="mb-4">Transactions Overview</h1>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Origin</th>
                <th>Claimed By</th>
                <th>Created At</th>
                <th>Claimed At</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.code}</td>
                  <td>${Number(tx.amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${tx.status === 'CLAIMED' ? 'badge-claimed' : 'badge-pending'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>{(tx.origin as { name: string }[] | null)?.[0]?.name}</td>
                  <td>{(tx.claimed as { name: string }[] | null)?.[0]?.name || 'Pending'}</td>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>{tx.claimed_at ? new Date(tx.claimed_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
