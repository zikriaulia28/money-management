import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

pool
  .query("SELECT 1 AS ok")
  .then((r) => {
    console.log("✅ Connected:", r.rows[0]);
    return pool.end();
  })
  .catch((e) => {
    console.log("❌ Error:", e.message);
    console.log("Code:", e.code);
    pool.end();
  });
