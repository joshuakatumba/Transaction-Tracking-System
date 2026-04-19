'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface TransactionPayload {
  amount: number
  senderName: string
  senderContact: string
  senderAddress: string
}

export async function createTransaction(payload: TransactionPayload) {
  const supabase = await createClient()

  // 1. Get current user profile to ensure they are a branch user and have a branch
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, branch_id, branches(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'branch_user' || !profile.branch_id) {
    return { error: 'Unauthorized. Only active branch users can create transactions.' }
  }

  // 2. Generate unique code
  const branchName = (profile.branches as { name: string }[] | null)?.[0]?.name || ''
  const prefix = branchName.toUpperCase().substring(0, 2) || 'XX'
  const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase()
  const code = `${prefix}-${uniqueId}`

  // 3. Insert transaction
  const insertPayload = {
    code,
    amount: payload.amount,
    status: 'PENDING' as const,
    branch_origin: profile.branch_id,
    created_by: user.id,
    sender_name: payload.senderName,
    sender_contact: payload.senderContact,
    sender_address: payload.senderAddress
  }

  let { data, error } = await supabase
    .from('transactions')
    .insert([insertPayload])
    .select()
    .single()

  // Backward compatibility for databases that haven't yet added sender_address.
  if (error?.message?.includes("Could not find the 'sender_address' column")) {
    const fallbackPayload = {
      code,
      amount: payload.amount,
      status: 'PENDING' as const,
      branch_origin: profile.branch_id,
      created_by: user.id,
      sender_name: payload.senderName,
      sender_contact: payload.senderContact
    }

    const fallbackResult = await supabase
      .from('transactions')
      .insert([fallbackPayload])
      .select()
      .single()

    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    return { error: error.message }
  }

  // 4. Log Action
  await supabase.from('logs').insert([{
    user_id: user.id,
    action: 'CREATE_TRANSACTION',
    details: { transaction_id: data.id, amount: payload.amount, code, sender: payload.senderName }
  }])

  revalidatePath('/uganda/history')
  revalidatePath('/uganda/dashboard')
  revalidatePath('/sudan/history')
  revalidatePath('/sudan/dashboard')
  
  return { data }
}

export async function previewClaim(code: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'branch_user' || !profile.branch_id) {
    return { error: 'Unauthorized.' }
  }

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('code', code)
    .single()

  if (fetchError || !transaction) {
    return { error: 'Transaction not found or invalid code.' }
  }

  if (transaction.status === 'CLAIMED') {
    return { error: 'Transaction has already been claimed.' }
  }

  if (transaction.branch_origin === profile.branch_id) {
    return { error: 'You cannot claim a transaction initiated by your own branch.' }
  }

  return { data: transaction }
}

export async function claimTransaction(transactionId: string) {
  const supabase = await createClient()

  // 1. Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'branch_user' || !profile.branch_id) {
    return { error: 'Unauthorized.' }
  }

  // 2. Fetch Transaction to double check status securely
  const { data: transaction } = await supabase
    .from('transactions')
    .select('status, code, branch_origin')
    .eq('id', transactionId)
    .single()

  if (!transaction || transaction.status !== 'PENDING') {
    return { error: 'Transaction is invalid or already claimed.' }
  }

  if (transaction.branch_origin === profile.branch_id) {
    return { error: 'You cannot claim a transaction initiated by your own branch.' }
  }

  // 3. Update Transaction
  const { data: updatedTx, error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'CLAIMED',
      branch_claimed: profile.branch_id,
      claimed_by: user.id,
      claimed_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  // 4. Log Action
  await supabase.from('logs').insert([{
    user_id: user.id,
    action: 'CLAIM_TRANSACTION',
    details: { transaction_id: transactionId, code: transaction.code }
  }])

  revalidatePath('/uganda/history')
  revalidatePath('/uganda/dashboard')
  revalidatePath('/sudan/history')
  revalidatePath('/sudan/dashboard')

  return { data: updatedTx }
}

export async function fetchTransactions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      origin:branches!branch_origin(name),
      claimed:branches!branch_claimed(name),
      creator:users!created_by(id),
      claimer:users!claimed_by(id)
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}
