'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { fetchNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications'
import { Bell, X, CheckCheck, Trash2, Check } from 'lucide-react'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 20))
          setUnreadCount((prev) => prev + 1)
          
          // Show toast
          setToast(payload.new)
          setTimeout(() => setToast(null), 5000)
        }
      )
      .subscribe()

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function loadNotifications() {
    const { data } = await fetchNotifications()
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n: any) => !n.is_read).length)
    }
  }

  async function handleMarkAsRead(id: string) {
    await markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className={`bell-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown animate-slide-up">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-btn">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                >
                  <div className="item-header">
                    <span className="type-dot"></span>
                    <span className="time">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="title">{n.title}</div>
                  <div className="message">{n.message}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Layered Toast */}
      {toast && (
        <div className="notification-toast-wrapper">
          <div className="notification-toast animate-slide-in">
            <div className="toast-icon">
              <Check size={20} strokeWidth={3} />
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button onClick={() => setToast(null)} className="toast-close">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-container {
          position: relative;
        }
        .bell-button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .bell-button:hover, .bell-button.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--accent-primary);
        }
        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--accent-danger);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-secondary);
        }
        .notification-dropdown {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 0;
          width: 320px;
          background: var(--blue-900);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 1000;
          color: white;
        }
        .dropdown-header {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dropdown-header h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
        }
        .mark-all-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .notification-list {
          max-height: 350px;
          overflow-y: auto;
        }
        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid var(--glass-border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .notification-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .notification-item.unread {
          background: rgba(255, 255, 255, 0.03);
        }
        .notification-item.unread .type-dot {
          background: var(--blue-400);
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .type-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-secondary);
        }
        .time {
          font-size: 0.7rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        /* Premium Stacked Toast Styles */
        .notification-toast-wrapper {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 10000;
          perspective: 1000px;
        }

        .notification-toast {
          position: relative;
          width: 400px;
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0,0,0,0.05);
        }

        /* Stacked Layers Effect */
        .notification-toast::before,
        .notification-toast::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          height: 100%;
          background: #ffffff;
          border-radius: 16px;
          z-index: -1;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .notification-toast::before {
          top: -8px;
          transform: scale(0.96);
          opacity: 0.8;
          background: #f8fafc;
        }

        .notification-toast::after {
          top: -16px;
          transform: scale(0.92);
          opacity: 0.4;
          background: #f1f5f9;
        }

        .toast-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .toast-body {
          flex: 1;
          padding-top: 2px;
        }

        .toast-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .toast-message {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s;
          margin-top: -4px;
          margin-right: -4px;
        }

        .toast-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(40px) translateY(-10px) rotate(2deg);
          }
          to { 
            opacity: 1; 
            transform: translateX(0) translateY(0) rotate(0deg);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
