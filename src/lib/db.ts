import { Pool } from 'pg'

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('Database connection error:', err);
        process.exit(-1);
      }
    });
  }
  return pool;
}

export async function query(text: string, params: any[] = []) {
  const client = await getPool().connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 料金プランの有効性をチェックする関数
export async function hasValidPriceEntry(userId: string): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS (
      SELECT 1 FROM price_entries 
      WHERE user_id = $1 
      AND amount > 0 
      AND NOT is_hidden
    )`,
    [userId]
  );
  return result.rows[0].exists;
}

// ユーザーの受付状態を更新する関数
export async function updateUserAvailability(userId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // 有効な料金プランがあるか確認
    const hasValid = await hasValidPriceEntry(userId);

    // 有効な料金プランがない場合は強制的にunavailableに設定
    if (!hasValid) {
      await client.query(
        'UPDATE users SET status = $1 WHERE id = $2',
        ['unavailable', userId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} 