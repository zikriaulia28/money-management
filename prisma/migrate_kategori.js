// Migration script: restruktur kategori + cleansing transaksi
// Run: node prisma/migrate_kategori.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Memulai migrasi kategori...\n');

    // ── 1. CATEGORIES YANG DI-RENAME (update in place) ─────────────
    console.log('1️⃣  Merename kategori lama...');

    // Bonus → Bonus/THR
    await client.query(
      `UPDATE "Category" SET name = 'Bonus/THR' WHERE name = 'Bonus'`
    );
    console.log('   ✅ Bonus → Bonus/THR');

    // Pendapatan → Pendapatan Lainnya + change icon
    await client.query(
      `UPDATE "Category" SET name = 'Pendapatan Lainnya', icon = 'PlusCircle' WHERE name = 'Pendapatan'`
    );
    console.log('   ✅ Pendapatan → Pendapatan Lainnya');

    // Kebutuhan Rumah → Wajib Rumah
    await client.query(
      `UPDATE "Category" SET name = 'Wajib Rumah' WHERE name = 'Kebutuhan Rumah'`
    );
    console.log('   ✅ Kebutuhan Rumah → Wajib Rumah');

    // Transportasi → Kendaraan
    await client.query(
      `UPDATE "Category" SET name = 'Kendaraan' WHERE name = 'Transportasi'`
    );
    console.log('   ✅ Transportasi → Kendaraan');

    // ── 2. CATEGORIES YANG DI-UPDATE ICON (same name) ──────────────
    console.log('\n2️⃣  Update icon kategori...');

    // Bonus/THR → Gift icon (just renamed, now set icon)
    await client.query(`UPDATE "Category" SET icon = 'Gift' WHERE name = 'Bonus/THR'`);
    console.log('   ✅ Bonus/THR → icon Gift');

    // Anak → Baby
    await client.query(`UPDATE "Category" SET icon = 'Baby' WHERE name = 'Anak'`);
    console.log('   ✅ Anak → icon Baby');

    // Donasi → HandHeart
    await client.query(`UPDATE "Category" SET icon = 'HandHeart' WHERE name = 'Donasi'`);
    console.log('   ✅ Donasi → icon HandHeart');

    // Kesehatan → HeartPulse
    await client.query(`UPDATE "Category" SET icon = 'HeartPulse' WHERE name = 'Kesehatan'`);
    console.log('   ✅ Kesehatan → icon HeartPulse');

    // Lainnya → MoreHorizontal
    await client.query(`UPDATE "Category" SET icon = 'MoreHorizontal' WHERE name = 'Lainnya'`);
    console.log('   ✅ Lainnya → icon MoreHorizontal');

    // ── 3. INSERT NEW CATEGORIES ────────────────────────────────────
    console.log('\n3️⃣  Insert kategori baru...');

    const newCategories = [
      { name: 'Bahan Masakan', icon: 'ChefHat', type: 'pengeluaran' },
      { name: 'Jajan/Snack', icon: 'Coffee', type: 'pengeluaran' },
      { name: 'Fashion', icon: 'Shirt', type: 'pengeluaran' },
      { name: 'Sosial', icon: 'Users', type: 'pengeluaran' },
      { name: 'Hiburan', icon: 'Film', type: 'pengeluaran' },
      { name: 'Investasi', icon: 'TrendingUp', type: 'pengeluaran' },
    ];

    for (const cat of newCategories) {
      await client.query(
        `INSERT INTO "Category" (id, name, icon, type) VALUES (gen_random_uuid()::text, $1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [cat.name, cat.icon, cat.type]
      );
      console.log(`   ✅ ${cat.name} ditambahkan`);
    }

    // ── 4. MAPPING TRANSACTIONS — old → new category ─────────────
    console.log('\n4️⃣  Mapping transaksi ke kategori baru...');

    // Fetch semua kategori untuk mapping
    const catResult = await client.query('SELECT id, name FROM "Category"');
    const categoryMap = {};
    for (const row of catResult.rows) {
      categoryMap[row.name] = row.id;
    }

    // Mapping: old category name → new category name
    const mapping = [
      // Removed: Belanja Harian → Bahan Masakan (untuk bahan makanan)
      //          → Wajib Rumah (untuk tissue dewasa — handled manually)
      { old: 'Belanja Harian', new: 'Bahan Masakan' },
      // Removed: Belanja → Jajan/Snack
      { old: 'Belanja', new: 'Bahan Masakan' },
      // Removed: Makanan & Minuman → Jajan/Snack
      { old: 'Makanan & Minuman', new: 'Jajan/Snack' },
      // Removed: Makan & Minum → Jajan/Snack
      { old: 'Makan & Minum', new: 'Jajan/Snack' },
    ];

    let txMigrated = 0;
    for (const m of mapping) {
      // Cari ID kategori lama
      const oldCat = await client.query(
        `SELECT id FROM "Category" WHERE name = $1`, [m.old]
      );
      if (oldCat.rows.length === 0) continue;

      const oldId = oldCat.rows[0].id;
      const newId = categoryMap[m.new];
      if (!newId) {
        console.log(`   ⚠️  Category "${m.new}" not found, skipping`);
        continue;
      }

      const result = await client.query(
        `UPDATE "Transaction" SET "categoryId" = $1 WHERE "categoryId" = $2`,
        [newId, oldId]
      );
      txMigrated += result.rowCount;
      console.log(`   ✅ ${m.old} → ${m.new} (${result.rowCount} transaksi)`);
    }

    // ── 5. HANDLE SPECIAL CASES ─────────────────────────────────
    console.log('\n5️⃣  Handle transaksi khusus...');

    // Celana Istri → Fashion (currently under Hiburan... wait, no
    // actually Celana Istri is already under Hiburan.
    // Let me check what happened with mapping above.)
    // Actually the issue is: after the rename, some transactions need
    // more specific mapping than batch.
    // We handle them here using the transaction name pattern.

    // 5a. Celana Istri → Fashion (currently mapped to Hiburan which we keep)
    //     This needs special handling since Hiburan still exists.
    //     We search by transaction name containing 'Celana'
    const celanaResult = await client.query(
      `UPDATE "Transaction" SET "categoryId" = $1
       WHERE "name" ILIKE '%celana%' AND "categoryId" = $2`,
      [categoryMap['Fashion'], categoryMap['Hiburan']]
    );
    if (celanaResult.rowCount > 0) {
      console.log(`   ✅ Celana Istri → Fashion (${celanaResult.rowCount} transaksi)`);
    }

    // 5b. Tissue Guardian → Wajib Rumah (currently under Belanja Harian → Bahan Masakan)
    //     But user said tissue dewasa = Wajib Rumah
    const tissueResult = await client.query(
      `UPDATE "Transaction" SET "categoryId" = $1
       WHERE "name" ILIKE '%tissue%' AND "categoryId" = $2`,
      [categoryMap['Wajib Rumah'], categoryMap['Bahan Masakan']]
    );
    if (tissueResult.rowCount > 0) {
      console.log(`   ✅ Tissue Guardian → Wajib Rumah (${tissueResult.rowCount} transaksi)`);
    }

    // 5c. Minyak Sunco → Bahan Masakan (currently Kebutuhan Rumah → Wajib Rumah)
    //     Minyak goreng = bahan masakan
    const minyakResult = await client.query(
      `UPDATE "Transaction" SET "categoryId" = $1
       WHERE "name" ILIKE '%minyak%' AND "categoryId" = $2`,
      [categoryMap['Bahan Masakan'], categoryMap['Wajib Rumah']]
    );
    if (minyakResult.rowCount > 0) {
      console.log(`   ✅ Minyak Sunco → Bahan Masakan (${minyakResult.rowCount} transaksi)`);
    }

    // 5d. Kado agi niken, Gift kado anak fadil, Rekan kerja → Sosial
    //     Currently: Kado agi niken & Gift kado anak fadil were under Donasi,
    //     Rekan kerja was under Donasi
    const kadoResult = await client.query(
      `UPDATE "Transaction" SET "categoryId" = $1
       WHERE ("name" ILIKE '%kado%' OR "name" ILIKE '%rekan kerja%') AND "categoryId" = $2`,
      [categoryMap['Sosial'], categoryMap['Donasi']]
    );
    if (kadoResult.rowCount > 0) {
      console.log(`   ✅ Kado / Gift / Rekan kerja → Sosial (${kadoResult.rowCount} transaksi)`);
    }

    // 5e. Snack shift malam — already handled by Makan & Minum → Jajan/Snack ✅

    // ── 5f. MIGRATE BUDGET TABLE ─────────────────────────────────
    console.log('\n5f. Migrasi Budget ke kategori baru...');

    // Mapping: old budget category name → new category name
    const budgetMapping = {
      'Makanan & Minuman': 'Jajan/Snack',
      'Makan & Minum': 'Jajan/Snack',
      'Belanja Harian': 'Bahan Masakan',
      // Kebutuhan Rumah → Wajib Rumah (already renamed)
      // Transportasi → Kendaraan (already renamed)
    };

    for (const [oldName, newName] of Object.entries(budgetMapping)) {
      const oldCat = await client.query(
        `SELECT id FROM "Category" WHERE name = $1`, [oldName]
      );
      if (oldCat.rows.length === 0) continue;
      const oldId = oldCat.rows[0].id;
      const newId = categoryMap[newName];
      if (!newId) continue;

      const result = await client.query(
        `UPDATE "Budget" SET "categoryId" = $1 WHERE "categoryId" = $2`,
        [newId, oldId]
      );
      if (result.rowCount > 0) {
        console.log(`   ✅ Budget ${oldName} → ${newName} (${result.rowCount} record)`);
      }
    }

    // ── 6. DELETE OLD UNUSED CATEGORIES ─────────────────────────
    console.log('\n6️⃣  Hapus kategori lama yang sudah tidak dipakai...');

    // These old categories should now have 0 transactions
    const toDelete = ['Belanja', 'Belanja Harian', 'Makanan & Minuman', 'Makan & Minum'];
    for (const name of toDelete) {
      // Check if still has transactions
      const check = await client.query(
        `SELECT t.id FROM "Transaction" t
         JOIN "Category" c ON t."categoryId" = c.id
         WHERE c.name = $1 LIMIT 1`,
        [name]
      );
      if (check.rows.length > 0) {
        console.log(`   ⚠️  ${name} masih punya transaksi, skip hapus`);
        continue;
      }

      // Also check Budget table
      const budgetCheck = await client.query(
        `SELECT b.id FROM "Budget" b
         JOIN "Category" c ON b."categoryId" = c.id
         WHERE c.name = $1 LIMIT 1`,
        [name]
      );

      if (budgetCheck.rows.length > 0) {
        console.log(`   ⚠️  ${name} masih dipake di Budget, skip hapus`);
        continue;
      }

      await client.query(`DELETE FROM "Category" WHERE name = $1`, [name]);
      console.log(`   ✅ ${name} dihapus`);
    }

    // ── 7. VERIFY ────────────────────────────────────────────────
    console.log('\n7️⃣  Verifikasi hasil...');

    const cats = await client.query(
      'SELECT name, icon, type FROM "Category" ORDER BY type, name'
    );
    console.table(cats.rows);
    console.log(`   Total kategori: ${cats.rows.length}`);

    const txCount = await client.query('SELECT COUNT(*) FROM "Transaction"');
    console.log(`   Total transaksi: ${txCount.rows[0].count}`);

    const unmapped = await client.query(`
      SELECT t.name, c.name AS kategori
      FROM "Transaction" t
      LEFT JOIN "Category" c ON t."categoryId" = c.id
      WHERE c.id IS NULL
    `);
    if (unmapped.rows.length > 0) {
      console.log(`   ⚠️  ${unmapped.rows.length} transaksi tanpa kategori!`);
      console.table(unmapped.rows);
    } else {
      console.log('   ✅ Semua transaksi punya kategori valid');
    }

    console.log('\n✅ Migrasi selesai!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
