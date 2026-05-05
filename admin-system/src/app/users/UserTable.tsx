'use client'

import { useState } from 'react'
import { updateUser, deleteUser } from '@/app/actions/admin'
import { X } from 'lucide-react'

interface User {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  contact: string | null
  role: string
  branch_id: string | null
  created_at: string
  branches: { name: string }[] | null
}

interface Branch {
  id: string
  name: string
}

interface UserTableProps {
  initialUsers: User[]
  branches: Branch[]
}

export default function UserTable({ initialUsers, branches }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Access Level</th>
                <th>Joined</th>
                <th>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers?.map(user => (
                <tr key={user.id}>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="btn-link"
                    >
                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous User'}
                    </button>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'branch_user' ? 'badge-claimed' : 'badge-pending'}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'branch_user' ? 'Branch Employee' : 'Pending Approval'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <form className="flex items-center gap-2" action={async (formData) => {
                        const role = formData.get('role') as any;
                        const branchId = formData.get('branch_id') as string;
                        const result = await updateUser(user.id, role, branchId);
                        if (result?.error) {
                          alert(result.error);
                        }
                      }}>
                        <select key={user.role} name="role" defaultValue={user.role} className="form-select" style={{ width: 'auto', minWidth: '140px' }} required>
                          <option value="pending">Pending Approval</option>
                          <option value="branch_user">Branch User</option>
                          <option value="admin">System Admin</option>
                        </select>
                        
                        <select key={user.branch_id || 'unassigned'} name="branch_id" defaultValue={user.branch_id || ''} className="form-select" style={{ width: 'auto', minWidth: '160px' }}>
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
                        if (confirm('Are you sure you want to delete this user?')) {
                          const result = await deleteUser(user.id);
                          if (result?.error) {
                            alert(result.error);
                          }
                        }
                      }}>
                        <button type="submit" className="btn btn-danger" style={{ padding: '0.65rem 1rem' }}>
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

      {/* Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-detail">
                <label>Full Name</label>
                <div className="value">
                  {selectedUser.full_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Anonymous'}
                </div>
              </div>
              <div className="profile-detail">
                <label>Email Address</label>
                <div className="value">{selectedUser.email}</div>
              </div>
              {selectedUser.contact && (
                <div className="profile-detail">
                  <label>Contact Number</label>
                  <div className="value">{selectedUser.contact}</div>
                </div>
              )}
              <div className="profile-detail">
                <label>Assigned Branch</label>
                <div className="value">
                  {(selectedUser.branches as any)?.[0]?.name || 'Unassigned'}
                </div>
              </div>
              <div className="profile-detail">
                <label>System ID</label>
                <div className="value mono">{selectedUser.id}</div>
              </div>
              <div className="profile-detail">
                <label>Account Created</label>
                <div className="value">{new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--blue-900);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
        }
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #ffffff;
        }
        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .close-btn:hover {
          color: var(--text-primary);
        }
        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .profile-detail .value.mono {
          font-family: monospace;
          font-size: 0.85rem;
          opacity: 0.8;
        }
        .btn-link {
          background: none;
          border: none;
          color: #1e293b;
          font-weight: 700;
          font-size: 1.05rem;
          cursor: pointer;
          padding: 0;
          text-align: left;
          transition: color 0.2s;
          text-decoration: none;
        }
        .btn-link:hover {
          color: var(--blue-700);
          text-decoration: none;
        }
      `}</style>
    </>
  )
}
