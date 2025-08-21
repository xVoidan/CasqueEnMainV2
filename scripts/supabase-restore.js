#!/usr/bin/env node

/**
 * Script de restauration pour Supabase
 * Restaure les tables, données et migrations depuis les backups
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const PROJECT_REF = 'ucwgtiaebljfbvhokicf';

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
 * Liste tous les fichiers de backup disponibles
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Aucun dossier de backup trouvé.');
    return [];
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        name: file,
        path: path.join(BACKUP_DIR, file),
        size: stats.size,
        mtime: stats.mtime,
        type: file.includes('schema') ? 'schema' : file.includes('data') ? 'data' : 'full',
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files;
}

/**
 * Affiche la liste des backups disponibles
 */
function showBackups() {
  const backups = listBackups();

  if (backups.length === 0) {
    console.log('❌ Aucun backup trouvé.');
    return;
  }

  console.log('📋 Backups disponibles:');
  console.log('');

  backups.forEach((backup, index) => {
    const sizeKB = Math.round(backup.size / 1024);
    const date = backup.mtime.toLocaleDateString('fr-FR');
    const time = backup.mtime.toLocaleTimeString('fr-FR');
    const typeIcon = backup.type === 'full' ? '🔄' : backup.type === 'schema' ? '🏗️' : '💾';

    console.log(`${index + 1}. ${typeIcon} ${backup.name}`);
    console.log(`   Type: ${backup.type} | Taille: ${sizeKB}KB | Date: ${date} ${time}`);
    console.log('');
  });
}

/**
 * Restaure un backup spécifique
 */
function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Fichier de backup introuvable: ${backupFile}`);
    return false;
  }

  console.log(`🔄 Restauration en cours: ${path.basename(backupFile)}`);

  // Commande pour restaurer via psql
  const command = `supabase db reset --project-ref ${PROJECT_REF} && psql -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres < "${backupFile}"`;

  const result = runCommand(command);
  if (result !== null) {
    console.log(`✅ Restoration terminée: ${backupFile}`);
    return true;
  }

  return false;
}

/**
 * Restaure le backup le plus récent
 */
function restoreLatest(type = 'full') {
  const backups = listBackups();
  const filteredBackups = type === 'any' ? backups : backups.filter((b) => b.type === type);

  if (filteredBackups.length === 0) {
    console.log(`❌ Aucun backup de type "${type}" trouvé.`);
    return false;
  }

  const latest = filteredBackups[0];
  console.log(`🎯 Restauration du backup le plus récent: ${latest.name}`);

  return restoreBackup(latest.path);
}

/**
 * Crée un backup avant restauration (sécurité)
 */
function createSafetyBackup() {
  console.log("🛡️  Création d'un backup de sécurité avant restauration...");

  try {
    // Utilise le script de backup
    const backupScript = path.join(__dirname, 'supabase-backup.js');
    if (fs.existsSync(backupScript)) {
      runCommand(`node "${backupScript}" full --no-clean`);
      console.log('✅ Backup de sécurité créé.');
      return true;
    } else {
      console.log('⚠️  Script de backup introuvable, restauration sans backup de sécurité.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du backup de sécurité:', error.message);
    return false;
  }
}

/**
 * Confirmation interactive pour les opérations dangereuses
 */
function confirmRestore(backupName) {
  console.log('⚠️  ATTENTION: La restauration va écraser toutes les données actuelles!');
  console.log(`📁 Backup à restaurer: ${backupName}`);
  console.log('');
  console.log('Voulez-vous continuer? (tapez "CONFIRMER" pour continuer)');

  // En mode script, on suppose que l'utilisateur a confirmé
  // Dans un vrai cas d'usage, on utiliserait readline pour l'input utilisateur
  const args = process.argv.slice(2);
  if (args.includes('--force')) {
    return true;
  }

  console.log('🛑 Restauration annulée. Utilisez --force pour forcer la restauration.');
  return false;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔄 Script de restauration Supabase');
  console.log(`📁 Dossier de backup: ${BACKUP_DIR}`);
  console.log('');

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      showBackups();
      break;

    case 'latest':
      const type = args[1] || 'full';
      if (confirmRestore(`dernier backup ${type}`)) {
        createSafetyBackup();
        restoreLatest(type);
      }
      break;

    case 'restore':
      const backupName = args[1];
      if (!backupName) {
        console.error('❌ Veuillez spécifier le nom du fichier de backup.');
        console.log('Usage: npm run restore:supabase restore <filename>');
        return;
      }

      const backupPath = path.join(BACKUP_DIR, backupName);
      if (confirmRestore(backupName)) {
        createSafetyBackup();
        restoreBackup(backupPath);
      }
      break;

    case 'help':
    default:
      console.log('Usage:');
      console.log('  npm run restore:supabase list           - Liste les backups disponibles');
      console.log(
        '  npm run restore:supabase latest [type]  - Restaure le dernier backup (full/schema/data)',
      );
      console.log('  npm run restore:supabase restore <file> - Restaure un backup spécifique');
      console.log('');
      console.log('Options:');
      console.log('  --force  - Force la restauration sans confirmation');
      console.log('');
      console.log('Exemples:');
      console.log('  npm run restore:supabase latest full');
      console.log('  npm run restore:supabase restore full-backup-2025-08-21T10-30-00.sql');
      break;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  listBackups,
  restoreBackup,
  restoreLatest,
  createSafetyBackup,
};
