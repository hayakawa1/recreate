import { Work } from '@/types/work'
import { query } from '@/lib/db'

export type NotificationType = 'status_changed' | 'new_request'

interface CreateNotificationParams {
  userId: string
  workId: string
  type: NotificationType
  message: string
}

export async function createNotification({
  userId,
  workId,
  type,
  message,
}: CreateNotificationParams) {
  await query(
    `INSERT INTO notifications (
      user_id,
      work_id,
      type,
      message
    ) VALUES ($1, $2, $3, $4)`,
    [userId, workId, type, message]
  )
}

export async function createWorkNotification(work: Work, type: NotificationType) {
  const messages: Record<string, string> = {
    new_request: `新しいリクエストが届きました。`,
    status_changed: {
      rejected: 'リクエストが拒否されました。',
      delivered: '作品が納品されました。',
      paid: '支払いが確認されました。',
    }[work.status] || '作品のステータスが更新されました。',
  }

  const targetUserId = {
    new_request: work.creator_id,
    status_changed: work.requester_id,
  }[type]

  await createNotification({
    userId: targetUserId,
    workId: work.id,
    type,
    message: messages[type],
  })
}

export async function getUnreadCount(userId: string) {
  const result = await query(
    `SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = $1
    AND is_read = false`,
    [userId]
  )
  return parseInt(result.rows[0].count as string, 10)
}

export async function getNotifications(userId: string) {
  const result = await query(
    `SELECT n.*, w.sequential_id, w.status,
            requester.name as requester_name,
            creator.name as creator_name
    FROM notifications n
    JOIN works w ON n.work_id = w.id
    JOIN users requester ON w.requester_id = requester.id
    JOIN users creator ON w.creator_id = creator.id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC`,
    [userId]
  )
  return result.rows
}

export async function markAsRead(notificationId: string, userId: string) {
  await query(
    `UPDATE notifications
    SET is_read = true,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    AND user_id = $2`,
    [notificationId, userId]
  )
} 