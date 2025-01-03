export type WorkStatus = 'requested' | 'rejected' | 'delivered' | 'paid';

// ステータスの表示名マッピング
export const workStatusDisplayNames: Record<WorkStatus, string> = {
  requested: 'リクエスト中',
  rejected: '却下',
  delivered: '納品済み',
  paid: '支払済み',
}; 