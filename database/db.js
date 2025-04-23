import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // 가장 먼저 호출해야 함

const { Pool } = pg;

const pool = new Pool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT), 
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  const testConnection = async () => {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('[LOG]- testConnection / success time', result.rows[0].now,'\n');
    } catch (err) {
      console.error('[LOG]- testConnection / failed time', err.message,'\n');
    }
    await pool.end();
  };
  
  testConnection();
  
  export default pool;