const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const categories = [
      { name: "Makanan & Minuman", icon: "Utensils", type: "pengeluaran" },
      { name: "Transportasi", icon: "Car", type: "pengeluaran" },
      { name: "Belanja", icon: "ShoppingCart", type: "pengeluaran" },
      { name: "Hiburan", icon: "Film", type: "pengeluaran" },
      { name: "Kebutuhan Rumah", icon: "Home", type: "pengeluaran" },
      { name: "Kesehatan", icon: "Heart", type: "pengeluaran" },
      { name: "Gaji", icon: "Briefcase", type: "pemasukan" },
      { name: "Bonus", icon: "Gift", type: "pemasukan" },
      { name: "Lainnya", icon: "Circle", type: "keduanya" },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO "Category" (id, name, icon, type)
         VALUES (gen_random_uuid()::text, $1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, type = EXCLUDED.type`,
        [cat.name, cat.icon, cat.type]
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Seeded ${categories.length} categories`);
    process.exit(0);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", e.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
