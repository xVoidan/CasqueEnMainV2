#!/usr/bin/env node

/**
 * Script de sauvegarde automatique pour Supabase
 * Sauvegarde les tables, données et migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const PROJECT_REF = 'ucwgtiaebljfbvhokicf';

// Créer le dossier de backup s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Génère un timestamp pour les fichiers de backup
 */
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Exécute une commande et retourne le résultat
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Sauvegarde la structure de la base de données
 */
function backupSchema() {
  console.log('🔍 Sauvegarde du schéma de la base de données...');

  const timestamp = getTimestamp();
  const schemaFile = path.join(BACKUP_DIR, `schema-${timestamp}.sql`);

  // Commande pour exporter le schéma (nécessite supabase CLI)
  const command = `supabase db dump --project-ref ${PROJECT_REF} --schema-only > "${schemaFile}"`;

  const result = runCommand(command);
  if (result !== null) {
    console.log(`✅ Schéma sauvegardé: ${schemaFile}`);
    return schemaFile;
  }
  return null;
}

/**
 * Sauvegarde les données de toutes les tables
 */
function backupData() {
  console.log('💾 Sauvegarde des données...');

  const timestamp = getTimestamp();
  const dataFile = path.join(BACKUP_DIR, `data-${timestamp}.sql`);

  // Commande pour exporter les données
  const command = `supabase db dump --project-ref ${PROJECT_REF} --data-only > "${dataFile}"`;

  const result = runCommand(command);
  if (result !== null) {
    console.log(`✅ Données sauvegardées: ${dataFile}`);
    return dataFile;
  }
  return null;
}

/**
 * Sauvegarde complète (schéma + données)
 */
function fullBackup() {
  console.log('🔄 Sauvegarde complète...');

  const timestamp = getTimestamp();
  const fullFile = path.join(BACKUP_DIR, `full-backup-${timestamp}.sql`);

  // Commande pour export complet
  const command = `supabase db dump --project-ref ${PROJECT_REF} > "${fullFile}"`;

  const result = runCommand(command);
  if (result !== null) {
    console.log(`✅ Sauvegarde complète: ${fullFile}`);
    return fullFile;
  }
  return null;
}

/**
 * Crée un backup JSON des métadonnées du projet
 */
function backupMetadata() {
  console.log('📋 Sauvegarde des métadonnées...');

  const timestamp = getTimestamp();
  const metadataFile = path.join(BACKUP_DIR, `metadata-${timestamp}.json`);

  const metadata = {
    timestamp: new Date().toISOString(),
    project_ref: PROJECT_REF,
    backup_type: 'metadata',
    expo_version: getExpoVersion(),
    supabase_version: getSupabaseVersion(),
  };

  try {
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log(`✅ Métadonnées sauvegardées: ${metadataFile}`);
    return metadataFile;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des métadonnées:', error.message);
    return null;
  }
}

/**
 * Récupère la version d'Expo
 */
function getExpoVersion() {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
    );
    return packageJson.dependencies?.expo || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Récupère la version de Supabase CLI
 */
function getSupabaseVersion() {
  try {
    const result = runCommand('supabase --version');
    return result?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Nettoie les anciens backups (garde les 10 plus récents)
 */
function cleanOldBackups() {
  console.log('🧹 Nettoyage des anciens backups...');

  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.endsWith('.sql') || file.endsWith('.json'))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Garde les 10 plus récents, supprime les autres
    const filesToDelete = files.slice(10);

    filesToDelete.forEach((file) => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Supprimé: ${file.name}`);
    });

    console.log(`✅ Nettoyage terminé. ${files.length - filesToDelete.length} fichiers conservés.`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Démarrage de la sauvegarde Supabase...');
  console.log(`📁 Dossier de backup: ${BACKUP_DIR}`);

  const args = process.argv.slice(2);
  const backupType = args[0] || 'full';

  switch (backupType) {
    case 'schema':
      backupSchema();
      break;
    case 'data':
      backupData();
      break;
    case 'metadata':
      backupMetadata();
      break;
    case 'full':
    default:
      fullBackup();
      backupMetadata();
      break;
  }

  // Nettoyage automatique
  if (!args.includes('--no-clean')) {
    cleanOldBackups();
  }

  console.log('✨ Sauvegarde terminée!');
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  backupSchema,
  backupData,
  fullBackup,
  backupMetadata,
  cleanOldBackups,
};
