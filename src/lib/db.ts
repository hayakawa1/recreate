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