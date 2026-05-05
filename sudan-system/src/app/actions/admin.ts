'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchUsers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      role,
      branch_id,
      full_name,
      first_name,
      last_name,
      contact,
      email,
      created_at,
      branches (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }
  
  return { data, error }
}

export async function updateUser(userId: string, targetRole: 'admin' | 'branch_user' | 'pending', branchId: string | null) {
  const supabase = await createClient()

  // 1. Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { error: 'Unauthorized. Admin only.' }
  }

  // 2. Update user using RPC function
  // This bypasses any RLS issues or cascading triggers blocking the update
  const { error: updateError } = await supabase.rpc('admin_update_user', {
    target_user_id: userId,
    new_role: targetRole,
    new_branch_id: branchId || null
  })

  if (updateError) {
    return { error: updateError.message }
  }

  // 3. Log Action
  await supabase.from('logs').insert([{
    user_id: user.id,
    action: 'UPDATE_USER',
    details: { target_user_id: userId, role: targetRole, branch_id: branchId }
  }])

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  // 1. Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { error: 'Unauthorized. Admin only.' }
  }

  // 2. Delete user using high-privilege RPC function
  // This completely removes the user from auth.users and cascades to public.users
  const { error: deleteError } = await supabase.rpc('admin_delete_user_full', {
    target_user_id: userId
  })

  if (deleteError) {
    console.error('Delete User Error:', deleteError)
    return { error: `Failed to delete user: ${deleteError.message}` }
  }

  // 3. Log Action
  await supabase.from('logs').insert([{
    user_id: user.id,
    action: 'DELETE_USER',
    details: { target_user_id: userId }
  }])

  revalidatePath('/admin/users')
  return { success: true }
}

export async function fetchLogs() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('logs')
    .select(`
      *,
      users ( role )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function fetchBranches() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name')
  return { data, error }
}
