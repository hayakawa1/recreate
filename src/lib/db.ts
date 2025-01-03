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

export default pool;

export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  try {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        text += `$${i + 1}`; // $1, $2, ... の形式でパラメータバインド
      }
    }
    console.log('Executing SQL:', text, 'with values:', values);
    const result = await pool.query(text, values);
    return result;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
} 