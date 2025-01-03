'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import format from 'date-fns/format'
import ja from 'date-fns/locale/ja'

interface Notification {
  id: string
  type: 'status_changed' | 'new_request'
  message: string
  is_read: boolean
  created_at: string
  work_id: string
  sequential_id: number
  status: string
  requester_name: string
  creator_name: string
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!session?.user?.id) return

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(error => console.error('Error fetching notifications:', error))
  }, [session?.user?.id])

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 既読にする
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'POST',
      })

      // 作品ページに遷移
      router.push(`/requests/${notification.sequential_id}`)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">通知一覧</h1>
      <div className="space-y-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              notification.is_read
                ? 'bg-white hover:bg-gray-50'
                : 'bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{notification.message}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(notification.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </p>
              </div>
              {!notification.is_read && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  未読
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              依頼者: {notification.requester_name} / クリエイター: {notification.creator_name}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-8">通知はありません</p>
        )}
      </div>
    </div>
  )
} 