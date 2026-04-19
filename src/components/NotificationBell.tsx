'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { fetchNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications'
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
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
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 100;
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
          font-weight: 600;
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
          background: rgba(59, 130, 246, 0.05);
        }
        .notification-item.unread .type-dot {
          background: var(--accent-primary);
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
        .title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .empty-state {
          padding: 3rem 1rem;
          text-align: center;
          color: var(--text-secondary);
        }
        .empty-state p {
          margin: 0;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
}
