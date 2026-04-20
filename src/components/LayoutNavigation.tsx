'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, X, LogOut, LayoutDashboard, SendHorizontal, Download, History, Users, Banknote, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

const iconMap: Record<string, React.ComponentType<{ size: number }>> = {
  LayoutDashboard, SendHorizontal, Download, History, Users, Banknote, ScrollText,
}

interface NavLinkItem {
  href: string
  label: string
  iconName: string
}

interface SidebarProps {
  branchName: string
  links: NavLinkItem[]
  signoutAction: () => void
}

export default function LayoutNavigation({ branchName, links, signoutAction }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <div className="nav-wrapper">
      {/* Mobile Top Bar — hidden on desktop via CSS */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-icon">{branchName.charAt(0)}</div>
          <span style={{ fontWeight: 700 }}>{branchName}</span>
        </div>
        <button onClick={open} aria-label="Open menu" className="hamburger-btn">
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay — inline so no CSS class conflicts */}
      {isOpen && (
        <div onClick={close} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 19999,
        }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-close-row">
          <button onClick={close} aria-label="Close menu" className="sidebar-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">{branchName.charAt(0)}</div>
            {branchName}
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = iconMap[link.iconName]
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href} className={active ? 'active' : ''} onClick={close}>
                {Icon && <Icon size={18} />} {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="portal-badge"><span></span> Portal</div>
            <NotificationBell />
          </div>
          <form action={signoutAction}>
            <button type="submit" className="btn btn-secondary btn-block"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <style jsx>{`
        .nav-wrapper {
          display: contents;
        }
        .brand-icon {
          width: 32px;
          height: 32px;
          background: var(--accent-primary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .hamburger-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .hamburger-btn:active {
          background: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  )
}
