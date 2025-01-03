export type WorkStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'paid';

// ステータスの表示名マッピング
export const workStatusDisplayNames: Record<WorkStatus, string> = {
  pending: '未対応',
  accepted: '作業中',
  rejected: '却下',
  delivered: '納品済み',
  paid: '支払済み',
}; 