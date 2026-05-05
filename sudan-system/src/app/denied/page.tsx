import { signout } from '@/app/actions/auth'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function DeniedPage() {
  const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME || 'this branch'
  const isBranch = process.env.NEXT_PUBLIC_APP_MODE === 'BRANCH'

  return (
    <div className="center-page">
      <div className="card text-center animate-fade-in" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ShieldAlert size={64} className="text-danger mb-4" />
        <h1 style={{ fontSize: '1.5rem', color: 'var(--accent-danger)' }}>Access Restricted</h1>
        
        <p className="mb-4">
          Your account is not authorized to access the <strong>{branchName}</strong> {isBranch ? 'portal' : 'system'}.
        </p>
        
        <div className="mb-4 p-3 text-secondary" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
          Each branch location has its own secure link. Please ensure you are using the correct link assigned to you by your administrator.
        </div>

        <form action={signout}>
          <button type="submit" className="btn btn-primary btn-block mb-3">
            Sign Out & Try Again
          </button>
        </form>
        
        <Link href="/login" className="btn btn-secondary btn-block">
          Return to Login
        </Link>
      </div>
    </div>
  )
}
