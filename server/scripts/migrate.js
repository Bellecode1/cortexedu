/**
 * Script de migration des données de db.json vers Supabase
 * 
 * Usage : node scripts/migrate.js
 * 
 * Prérequis :
 * 1. Les tables doivent déjà exister dans Supabase
 * 2. Les variables SUPABASE_URL et SUPABASE_ANON_KEY doivent être définies
 *    dans server/.env.local (ou dans l'environnement)
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hxzioeulmegkmgyqqwio.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error("❌ SUPABASE_ANON_KEY non défini dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Lire le fichier db.json
const dbPath = path.join(__dirname, "..", "db.json");
if (!fs.existsSync(dbPath)) {
  console.error("❌ db.json introuvable à:", dbPath);
  process.exit(1);
}
const dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));

console.log("📦 Données chargées depuis db.json");
console.log(`   users: ${dbData.users?.length || 0}`);
console.log(`   quiz: ${dbData.quiz?.length || 0}`);
console.log(`   results: ${dbData.results?.length || 0}`);
console.log(`   branch: ${dbData.branch?.length || 0}`);
console.log(`   exams: ${dbData.exams?.length || 0}`);
console.log(`   submissions: ${dbData.submissions?.length || 0}`);
console.log(`   notifications: ${dbData.notifications?.length || 0}`);

async function migrate() {
  const tables = [
    { name: "users", data: dbData.users || [] },
    { name: "branch", data: dbData.branch || [] },
    { name: "quiz", data: dbData.quiz || [] },
    { name: "results", data: dbData.results || [] },
    { name: "exams", data: dbData.exams || [] },
    { name: "submissions", data: dbData.submissions || [] },
    { name: "notifications", data: dbData.notifications || [] },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    console.log(`\n🔄 Migration de "${table.name}"...`);

    if (table.data.length === 0) {
      console.log(`   ⏭️  Aucune donnée à migrer`);
      successCount++;
      continue;
    }

    // Vérifier si la table existe en tentant un select
    const { error: checkError } = await supabase
      .from(table.name)
      .select("id", { count: "exact", head: true });

    if (checkError) {
      console.error(`   ❌ Table "${table.name}" inexistante :`, checkError.message);
      errorCount++;
      continue;
    }

    // Insérer les données par lots de 10 (éviter les timeouts)
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < table.data.length; i += batchSize) {
      const batch = table.data.slice(i, i + batchSize);

      // Pour les résultats qui ont des champs quizQuestions, s'assurer que c'est bien du JSON
      const cleanBatch = batch.map((item) => {
        const cleaned = { ...item };
        // Convertir les champs JSONB si nécessaire
        for (const key of Object.keys(cleaned)) {
          if (Array.isArray(cleaned[key]) || (typeof cleaned[key] === "object" && cleaned[key] !== null)) {
            // Already valid JSON for Supabase JS SDK
          }
        }
        return cleaned;
      });

      const { error: insertError } = await supabase
        .from(table.name)
        .insert(cleanBatch);

      if (insertError) {
        // Si erreur de doublon, essayer un par un
        console.log(`   ⚠️  Erreur batch, tentative individuelle...`);
        for (const item of cleanBatch) {
          const { error: singleError } = await supabase
            .from(table.name)
            .insert(item);
          if (singleError) {
            if (singleError.code === "23505") {
              // Duplicate key, skip
              console.log(`   ⏭️  Doublon ignoré: ${item.id || item.name}`);
            } else {
              console.error(`   ❌ Erreur insertion:`, singleError.message);
              console.error(`      Item:`, JSON.stringify(item).substring(0, 100));
            }
          } else {
            insertedCount++;
          }
        }
      } else {
        insertedCount += cleanBatch.length;
      }
    }

    console.log(`   ✅ ${insertedCount}/${table.data.length} enregistrements migrés`);
    successCount++;
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`📊 RÉSULTAT DE LA MIGRATION`);
  console.log(`   ✅ Tables traitées: ${successCount}/${tables.length}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`═══════════════════════════════════`);
}

migrate().catch((err) => {
  console.error("❌ Erreur fatale:", err);
  process.exit(1);
});
