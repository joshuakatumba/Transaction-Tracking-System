'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface NavLinkProps {
  href: string
  children: ReactNode
  className?: string
  activeClassName?: string
}

export default function NavLink({ 
  href, 
  children, 
  className = 'sidebar-link', 
  activeClassName = 'active' 
}: NavLinkProps) {
  const pathname = usePathname()
  
  // Check if current path matches href
  // We use startsWith for sub-pages or exact match for dashboard
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link 
      href={href} 
      className={`${className} ${isActive ? activeClassName : ''}`}
    >
      {children}
    </Link>
  )
}
