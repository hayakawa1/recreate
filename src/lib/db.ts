import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 接続テスト
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 接続が成功したことを確認
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  try {
    let text = strings[0];
    let paramIndex = 1;
    for (let i = 1; i < strings.length; i++) {
      text += `$${paramIndex}` + strings[i];
      paramIndex++;
    }
    console.log('Executing SQL:', text, 'with values:', values);
    const result = await pool.query(text, values);
    return result;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

export default pool; 