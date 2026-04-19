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

  // 2. Update user
  // Allow branch assignment regardless of role if specified
  const { error: updateError } = await supabase
    .from('users')
    .update({
      role: targetRole,
      branch_id: branchId || null
    })
    .eq('id', userId)

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

  // 2. Delete user profile
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (deleteError) {
    return { error: deleteError.message }
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
