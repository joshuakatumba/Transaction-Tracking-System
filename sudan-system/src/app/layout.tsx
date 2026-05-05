import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/actions/auth'
import LayoutNavigation from '@/components/LayoutNavigation'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_BRANCH_NAME || 'Lennox Sudan',
  description: 'Secure cross-border transaction tracking system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let branchName = 'Sudan Branch'

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, branch_id, branches(name)')
      .eq('id', user.id)
      .single()
    branchName = (profile?.branches as any)?.name || 'Sudan Branch'
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'LayoutDashboard' },
    { href: '/create', label: 'Send Money', iconName: 'SendHorizontal' },
    { href: '/claim', label: 'Receive Money', iconName: 'Download' },
    { href: '/history', label: 'History', iconName: 'History' },
  ]

  return (
    <html lang="en">
      <body className="theme-sudan">
        {user ? (
          <div className="layout-wrapper">
            <LayoutNavigation
              branchName={branchName}
              links={navLinks}
              signoutAction={signout}
            />
            <main className="main-content flex-1 animate-fade-in">
              <div className="container">{children}</div>
            </main>
          </div>
        ) : (
          <div className="center-page">
            {children}
          </div>
        )}
      </body>
    </html>
  )
}
