import './globals.css'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/actions/auth'
import LayoutNavigation from '@/components/LayoutNavigation'

export const metadata = {
  title: 'Lennox Admin Portal',
  description: 'Management system for Lennox operations',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null

  if (user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'LayoutDashboard' },
    { href: '/users', label: 'Users', iconName: 'Users' },
    { href: '/transactions', label: 'Transactions', iconName: 'Banknote' },
    { href: '/logs', label: 'Logs', iconName: 'ScrollText' },
  ]

  const isAdmin = user && profile?.role === 'admin'

  return (
    <html lang="en">
      <body className="theme-admin">
        {isAdmin ? (
          <div className="layout-wrapper">
            <LayoutNavigation 
              branchName="Admin Portal" 
              links={navLinks} 
              signoutAction={signout} 
            />
            <main className="main-content flex-1 animate-fade-in">
              <div className="container">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <main className="main-content flex-1 animate-fade-in">
            <div className="container">
              {children}
            </div>
          </main>
        )}
      </body>
    </html>
  )
}
