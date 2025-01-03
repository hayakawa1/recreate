import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  let text = strings[0];
  let paramIndex = 1;
  for (let i = 1; i < strings.length; i++) {
    text += `$${paramIndex}` + strings[i];
    paramIndex++;
  }
  const result = await pool.query(text, values);
  return result;
}

export default pool; 