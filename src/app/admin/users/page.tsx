import { fetchUsers, fetchBranches, updateUser, deleteUser } from '@/app/actions/admin'

export default async function AdminUsersPage() {
  const { data: users, error: userError } = await fetchUsers()
  const { data: branches, error: branchError } = await fetchBranches()

  if (userError || branchError) {
    return (
      <div className="card border-l-4 border-red-500 bg-red-50 p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600 text-sm">
          {userError?.message || branchError?.message || 'An unexpected error occurred while fetching user data.'}
        </p>
        <div className="mt-4 text-xs text-red-400">
          Try refreshing the page or contact the system administrator.
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-4">User Management</h1>
      
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Access Level</th>
                <th>Assigned Branch</th>
                <th>Joined</th>
                <th>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(user => (
                <tr key={user.id}>
                  <td style={{ fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous User'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {user.email}
                    </div>
                    {user.contact && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        Contact: {user.contact}
                      </div>
                    )}
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', filter: 'opacity(0.6)' }}>
                      ID: {user.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'branch_user' ? 'badge-claimed' : 'badge-pending'}`}>
                      {user.role === 'admin' ? '🛡️ Admin' : user.role === 'branch_user' ? '👤 Branch Employee' : '⏳ Pending Approval'}
                    </span>
                  </td>
                  <td>
                    {(user.branches as { name: string }[] | null)?.[0]?.name || (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <form className="flex items-center gap-2" action={async (formData) => {
                        'use server';
                        const role = formData.get('role') as 'branch_user' | 'pending';
                        const branchId = formData.get('branch_id') as string;
                        await updateUser(user.id, role, branchId);
                      }}>
                        <select name="role" defaultValue={user.role} className="form-select" style={{ width: 'auto', minWidth: '130px' }} required>
                          <option value="pending">Pending Approval</option>
                          <option value="branch_user">Approved Branch User</option>
                        </select>
                        
                        <select name="branch_id" defaultValue={user.branch_id || ''} className="form-select" style={{ width: 'auto', minWidth: '160px' }}>
                          <option value="">Unassigned</option>
                          {branches?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem' }}>
                          Update
                        </button>
                      </form>

                      <form action={async () => {
                        'use server';
                        if (confirm('Are you sure you want to remove this user? Their profile data will be deleted.')) {
                          await deleteUser(user.id);
                        }
                      }}>
                        <button type="submit" className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
