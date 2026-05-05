import { fetchUsers, fetchBranches } from '@/app/actions/admin'
import UserTable from './UserTable'

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
      </div>
    )
  }

  // Cast users to the expected type for the UserTable component
  const typedUsers = (users || []).map(u => ({
    ...u,
    branches: (u.branches as any)
  })) as any[]

  return (
    <>
      <h1 className="mb-4">User Management</h1>
      <UserTable initialUsers={typedUsers} branches={branches || []} />
    </>
  )
}
