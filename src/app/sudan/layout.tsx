import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/actions/auth'
import { LayoutDashboard, SendHorizontal, Download, History, LogOut } from 'lucide-react'
import NavLink from '@/utils/NavLink'
import NotificationBell from '@/components/NotificationBell'

export default async function BranchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'branch_user') {
    redirect('/')
  }

  const branchDisplayName = "Sudan Branch"

  return (
    <div className="layout-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div style={{ width: '32px', height: '32px', background: 'var(--accent-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>B</div>
            {branchDisplayName}
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink href="/sudan/dashboard">
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink href="/sudan/create">
            <SendHorizontal size={18} /> Send Money
          </NavLink>
          <NavLink href="/sudan/claim">
            <Download size={18} /> Receive Money
          </NavLink>
          <NavLink href="/sudan/history">
            <History size={18} /> History
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center justify-between mb-2">
            <div className="portal-badge">
              <span></span> Branch Portal
            </div>
            <NotificationBell />
          </div>
          <form action={signout}>
            <button type="submit" className="btn btn-secondary btn-block" style={{ fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="main-content flex-1 animate-fade-in">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  )
}
