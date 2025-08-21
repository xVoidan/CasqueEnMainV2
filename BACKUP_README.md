# 💾 Guide de Sauvegarde Supabase

## Vue d'ensemble

Ce projet inclut un système complet de sauvegarde et restauration pour votre base de données
Supabase. Les scripts permettent de sauvegarder automatiquement vos données, schémas et métadonnées.

## 🚀 Utilisation Rapide

### Créer une sauvegarde

```bash
# Sauvegarde complète (recommandé)
npm run backup:supabase

# Sauvegardes spécialisées
npm run backup:supabase:schema    # Schéma uniquement
npm run backup:supabase:data      # Données uniquement
```

### Restaurer une sauvegarde

```bash
# Voir les backups disponibles
npm run restore:supabase list

# Restaurer le dernier backup
npm run restore:supabase latest --force

# Restaurer un backup spécifique
npm run restore:supabase restore full-backup-2025-08-21T10-30-00.sql --force
```

## 📁 Structure des Fichiers

### Dossier de sauvegarde

```
backups/
├── full-backup-2025-08-21T10-30-00.sql      # Backup complet
├── schema-2025-08-21T10-30-00.sql           # Schéma uniquement
├── data-2025-08-21T10-30-00.sql             # Données uniquement
└── metadata-2025-08-21T10-30-00.json        # Métadonnées du projet
```

### Format des noms de fichiers

- **full-backup-{timestamp}.sql**: Sauvegarde complète (schéma + données)
- **schema-{timestamp}.sql**: Structure de la base uniquement
- **data-{timestamp}.sql**: Données uniquement
- **metadata-{timestamp}.json**: Informations sur le projet

## 🔧 Scripts Détaillés

### Script de Sauvegarde (`scripts/supabase-backup.js`)

**Fonctionnalités:**

- ✅ Sauvegarde complète ou partielle
- ✅ Génération automatique des timestamps
- ✅ Sauvegarde des métadonnées du projet
- ✅ Nettoyage automatique des anciens backups (garde les 10 derniers)
- ✅ Support de différents formats d'export

**Options:**

```bash
node scripts/supabase-backup.js [type] [options]

Types:
  full      # Sauvegarde complète (défaut)
  schema    # Schéma uniquement
  data      # Données uniquement
  metadata  # Métadonnées uniquement

Options:
  --no-clean    # Désactive le nettoyage automatique
```

### Script de Restauration (`scripts/supabase-restore.js`)

**Fonctionnalités:**

- ✅ Liste des backups disponibles avec détails
- ✅ Restauration sélective par type ou fichier
- ✅ Backup de sécurité automatique avant restauration
- ✅ Confirmation interactive pour éviter les erreurs
- ✅ Support du mode force pour l'automatisation

**Commandes:**

```bash
node scripts/supabase-restore.js <command> [options]

Commandes:
  list                    # Liste tous les backups
  latest [type]          # Restaure le dernier backup
  restore <filename>     # Restaure un fichier spécifique
  help                   # Affiche l'aide

Options:
  --force               # Force l'opération sans confirmation
```

## ⚠️ Importantes Sécurités

### Backup de Sécurité Automatique

- Avant chaque restauration, un backup automatique est créé
- Ce backup de sécurité n'est pas supprimé par le nettoyage automatique
- Permet de revenir en arrière en cas de problème

### Confirmations Obligatoires

- Les restaurations nécessitent une confirmation explicite
- Utiliser `--force` pour les scripts automatisés uniquement
- Messages d'avertissement clairs sur les risques

### Gestion des Versions

- Les métadonnées incluent les versions d'Expo et Supabase
- Permet de vérifier la compatibilité avant restauration
- Traçabilité complète des sauvegardes

## 🔄 Automatisation

### GitHub Actions (exemple)

```yaml
name: Backup Supabase
on:
  schedule:
    - cron: '0 2 * * *' # Tous les jours à 2h du matin

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Create backup
        run: npm run backup:supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Cron Local (Linux/macOS)

```bash
# Ajouter à crontab -e
0 2 * * * cd /path/to/project && npm run backup:supabase
```

## 🛠️ Prérequis

### Outils Nécessaires

1. **Supabase CLI**: `npm install -g supabase`
2. **Node.js**: Version 18+ recommandée
3. **psql**: Pour les restaurations (inclus avec PostgreSQL)

### Variables d'Environnement

```bash
# Dans votre .env
SUPABASE_ACCESS_TOKEN=your-access-token
```

### Configuration MCP

Le fichier `.mcp.json` doit être configuré avec votre project-ref:

```json
{
  "mcpServers": {
    "supabase": {
      "args": ["--project-ref=your-project-ref"]
    }
  }
}
```

## 🐛 Dépannage

### Erreurs Communes

**"Command not found: supabase"**

```bash
npm install -g supabase
```

**"psql: command not found"**

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Installer PostgreSQL depuis https://www.postgresql.org/download/
```

**"Permission denied"**

```bash
chmod +x scripts/supabase-backup.js
chmod +x scripts/supabase-restore.js
```

### Logs de Debug

Les scripts affichent des messages détaillés. En cas de problème:

1. Vérifiez les messages d'erreur complets
2. Assurez-vous que les tokens d'accès sont valides
3. Vérifiez la connectivité réseau vers Supabase

## 📞 Support

En cas de problème avec les scripts de sauvegarde:

1. Vérifiez d'abord ce guide de dépannage
2. Consultez les logs détaillés des scripts
3. Vérifiez la configuration Supabase dans `.mcp.json`
4. Testez la connectivité avec `supabase projects list`

---

**Dernière mise à jour**: 21 août 2025
