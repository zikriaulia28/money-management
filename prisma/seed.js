import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Hapus kategori lama
    await client.query('DELETE FROM "Category"');

    const categories = [
      // Pemasukan
      { name: "Gaji", icon: "Briefcase", type: "pemasukan" },
      { name: "Bonus/THR", icon: "Gift", type: "pemasukan" },
      { name: "Pendapatan Lainnya", icon: "PlusCircle", type: "pemasukan" },

      // Pengeluaran
      { name: "Wajib Rumah", icon: "Home", type: "pengeluaran" },
      { name: "Bahan Masakan", icon: "ChefHat", type: "pengeluaran" },
      { name: "Jajan/Snack", icon: "Coffee", type: "pengeluaran" },
      { name: "Kendaraan", icon: "Car", type: "pengeluaran" },
      { name: "Anak", icon: "Baby", type: "pengeluaran" },
      { name: "Fashion", icon: "Shirt", type: "pengeluaran" },
      { name: "Sosial", icon: "Users", type: "pengeluaran" },
      { name: "Kesehatan", icon: "HeartPulse", type: "pengeluaran" },
      { name: "Donasi", icon: "HandHeart", type: "pengeluaran" },
      { name: "Hiburan", icon: "Film", type: "pengeluaran" },
      { name: "Investasi", icon: "TrendingUp", type: "pengeluaran" },

      // Keduanya
      { name: "Lainnya", icon: "MoreHorizontal", type: "keduanya" },
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
