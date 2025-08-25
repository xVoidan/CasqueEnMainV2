const fs = require('fs');
const path = require('path');

// Tables à sauvegarder
const tables = [
  'users',
  'profiles', 
  'themes',
  'sub_themes',
  'questions',
  'answers',
  'sessions',
  'session_answers',
  'badges',
  'user_badges',
  'user_grades',
  'user_stats',
  'user_challenges',
  'user_question_stats',
  'daily_challenges',
  'rankings',
  'admins'
];

// Créer le dossier de backup s'il n'existe pas
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Timestamp pour le backup
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupFile = path.join(backupDir, `data-backup-${timestamp}.json`);

// Structure du backup
const backup = {
  timestamp: new Date().toISOString(),
  project_ref: 'ucwgtiaebljfbvhokicf',
  tables: tables,
  data: {},
  metadata: {
    tables_count: tables.length,
    total_records: 0
  }
};

// Message de completion
console.log('📦 Backup de données Supabase créé (structure uniquement)');
console.log(`📁 Fichier: ${backupFile}`);
console.log(`📊 Tables référencées: ${tables.length}`);
console.log('ℹ️  Note: Les données réelles doivent être exportées via Supabase Dashboard ou CLI');

// Sauvegarder la structure
fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

console.log('✅ Structure de backup sauvegardée avec succès!');