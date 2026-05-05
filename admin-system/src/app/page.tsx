import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/actions/auth'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/dashboard')
  }

  if (profile?.role === 'branch_user') {
    return (
      <div className="center-page">
        <div className="card text-center animate-fade-in" style={{ maxWidth: '400px' }}>
          <h2 className="mb-2">Wrong Portal</h2>
          <p className="mb-4">
            You are a branch user. Please log into your designated branch portal (Sudan or Uganda).
          </p>
          <form action={signout}>
            <button type="submit" className="btn btn-secondary btn-block">Sign Out</button>
          </form>
        </div>
      </div>
    )
  }

  // If role is pending or null
  return (
    <div className="center-page">
      <div className="card text-center animate-fade-in" style={{ maxWidth: '400px' }}>
        <h2 className="mb-2">Awaiting Approval</h2>
        <p className="mb-4">
          Your details were received. Awaiting admin&apos;s access approval before you can use branch features.
        </p>
        <form action={signout}>
          <button type="submit" className="btn btn-secondary btn-block">Sign Out</button>
        </form>
      </div>
    </div>
  )
}
