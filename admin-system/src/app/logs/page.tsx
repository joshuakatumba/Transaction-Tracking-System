import { fetchLogs } from '@/app/actions/admin'

export default async function AdminLogsPage() {
  const { data: logs } = await fetchLogs()

  return (
    <>
      <h1 className="mb-4">System Audit Logs</h1>
      
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User ID / Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {log.user_id}<br/>
                    <span style={{ color: 'var(--accent-primary)' }}>{(log.users as { role: string } | null)?.role}</span>
                  </td>
                  <td>
                    <span className="badge badge-admin">{log.action}</span>
                  </td>
                  <td>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '0.75rem', 
                      borderRadius: '6px',
                    }}>
                      {log.details && typeof log.details === 'object' ? (
                        Object.entries(log.details).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '0.25rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>{key}: </strong>
                            <span style={{ fontFamily: 'monospace' }}>{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center">No logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
