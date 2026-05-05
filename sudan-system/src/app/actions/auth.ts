'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const portal = (formData.get('portal') as string) || 'user'
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unable to verify account access.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Unable to load profile. Please contact admin.' }
  }

  if (portal === 'admin' && profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'Admin access only. Use the staff login page.' }
  }

  if (portal === 'user' && profile.role === 'admin') {
    revalidatePath('/', 'layout')
    redirect('/admin/dashboard')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const contact = formData.get('contact') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = `${firstName} ${lastName}`.trim()

  console.log('Attempting signup for:', email)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        contact,
      },
    },
  })

  if (error) {
    console.error('Signup error:', error)
    return { error: error.message }
  }

  console.log('Signup successful for user:', data.user?.id)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Signout error:', error.message)
    // we can still redirect or just ignore the error.
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
