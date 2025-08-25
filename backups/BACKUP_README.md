# 📦 Backup Complet Supabase - CasqueEnMainV2

**Date**: 25 août 2025  
**Projet**: ucwgtiaebljfbvhokicf  
**Type**: Backup de sécurité complet avant développement  

## 📋 Contenu du Backup

### Fichiers Créés

1. **`database-schema-backup-2025-08-25.md`** - Documentation détaillée du schéma
2. **`complete-data-backup-2025-08-25.sql`** - Script SQL complet de restauration
3. **`metadata-complete-2025-08-25.json`** - Métadonnées structurées
4. **`BACKUP_README.md`** - Ce fichier de documentation

## 🎯 État de la Base de Données

### Structure Actuelle
- **17 tables** dans le schéma public
- **2 vues** personnalisées
- **4 types ENUM** personnalisés
- **0 migration** appliquée (structure créée directement)
- **RLS activé** sur toutes les tables

### Données Présentes
- **170 sessions** d'entraînement
- **161 réponses** de session
- **13 questions** configurées
- **15 badges** de grade
- **3 thèmes** + **18 sous-thèmes**
- **14 profils** utilisateur actifs

### Extensions Installées
- `uuid-ossp` (1.1) - Génération d'UUID
- `pgcrypto` (1.3) - Cryptographie
- `pg_graphql` (1.5.11) - Support GraphQL
- `pg_trgm` (1.6) - Recherche textuelle
- `pg_stat_statements` (1.11) - Statistiques
- `supabase_vault` (0.3.1) - Coffre-fort

## 🔧 Comment Utiliser ce Backup

### Restauration Complète

```bash
# 1. Restaurer la structure et les données de base
psql -h <host> -U postgres -d <database> -f complete-data-backup-2025-08-25.sql

# 2. Vérifier la restauration
psql -h <host> -U postgres -d <database> -c "SELECT COUNT(*) FROM public.themes;"
```

### Scripts de Backup Automatiques

Le projet dispose de scripts npm pour les backups :

```bash
# Backup complet
npm run backup:supabase

# Backup du schéma uniquement
npm run backup:supabase:schema

# Backup des données uniquement
npm run backup:supabase:data

# Restauration
npm run restore:supabase latest
```

## 📊 Architecture des Données

### Tables Centrales

```
auth.users (Supabase)
    ↓
public.users (Extension)
    ↓
public.profiles (Profils détaillés)
    ↓
public.sessions → public.session_answers
```

### Système de Contenu

```
public.themes
    ↓
public.sub_themes  
    ↓
public.questions
```

### Système de Gamification

```
public.badges ← public.user_badges → auth.users
public.daily_challenges ← public.user_challenges → auth.users
public.rankings → auth.users
```

## 🔒 Sécurité (RLS)

Toutes les tables principales ont **Row Level Security** activé :

- ✅ Isolation des données par utilisateur
- ✅ Accès lecture seule aux contenus publics (themes, questions)
- ✅ Protection des profils et sessions personnelles
- ✅ Système d'administration sécurisé

## 🎮 Données de Test Disponibles

### Thèmes Configurés
- **Mathématiques** (📐) - 4 sous-thèmes
  - Calcul mental, Fractions, Géométrie, Pourcentages
- **Français** (📚) - 4 sous-thèmes  
  - Conjugaison, Culture générale, Grammaire, Orthographe
- **Métier** (🚒) - 10 sous-thèmes
  - Incendie, Secours, Hydraulique, etc.

### Système de Grades
15 badges de grade configurés d'Aspirant à Contrôleur général avec points requis.

### Données Utilisateur
- 14 profils utilisateur
- 170 sessions complétées  
- 161 réponses enregistrées
- Statistiques par thème

## 🚀 Prochaines Étapes

Après ce backup, vous pouvez :

1. **Développer en sécurité** - Structure sauvegardée
2. **Tester les modifications** - Backup de rollback disponible  
3. **Migrer vers production** - Scripts prêts
4. **Ajouter du contenu** - Structure stable

## ⚠️ Notes Importantes

- Ce backup **ne contient pas** les données auth.users (géré par Supabase)
- Les **clés étrangères** vers auth.users sont préservées
- **RLS doit être configuré** après restauration
- Extensions **uuid-ossp** et **pgcrypto** requises

## 📞 Support

En cas de problème avec la restauration :

1. Vérifiez les extensions installées
2. Consultez les logs Supabase  
3. Utilisez les scripts npm de backup/restore
4. Référez-vous à la documentation dans `database-schema-backup-2025-08-25.md`

---

**Backup créé par**: Claude MCP Tools  
**Statut**: ✅ Complet et testé  
**Sécurité**: 🔒 RLS activé partout