# Backup Complet Base de Données Supabase
**Projet**: ucwgtiaebljfbvhokicf  
**Date**: 2025-08-25  
**Tables**: 19  

## 📊 Vue d'ensemble du Schéma

### Tables Principales (Schéma public)

1. **users** - Utilisateurs de l'application
2. **profiles** - Profils utilisateurs étendus
3. **sessions** - Sessions d'entraînement
4. **session_answers** - Réponses données pendant les sessions
5. **themes** - Thèmes principaux (Mathématiques, Français, Métier)
6. **sub_themes** - Sous-thèmes
7. **questions** - Questions du quiz
8. **answers** - Réponses possibles (ancienne structure)
9. **daily_challenges** - Défis quotidiens
10. **user_challenges** - Participation aux défis
11. **badges** - Système de badges
12. **user_badges** - Badges obtenus par les utilisateurs
13. **user_grades** - Historique des grades
14. **user_stats** - Statistiques par thème
15. **user_question_stats** - Statistiques détaillées par question
16. **rankings** - Classements
17. **admins** - Administrateurs
18. **user_admin_status** (Vue) - Statut administrateur des utilisateurs
19. **user_profiles** (Vue) - Vue consolidée des profils

## 🔧 Types Personnalisés (ENUM)

### session_status
- `in_progress` - Session en cours
- `paused` - Session en pause
- `completed` - Session terminée
- `abandoned` - Session abandonnée

### theme_type
- `Mathématiques`
- `Français` 
- `Métier`

### badge_category
- `performance` - Badges de performance
- `streak` - Badges de régularité
- `milestone` - Badges d'étapes
- `special` - Badges spéciaux

### ranking_type
- `global` - Classement global
- `weekly` - Classement hebdomadaire
- `monthly` - Classement mensuel
- `theme` - Classement par thème

## 📋 Structure Détaillée des Tables

### Table: users
- **id** (uuid, PK) - Identifiant unique
- **email** (text, UNIQUE, NOT NULL) - Email de l'utilisateur
- **username** (text) - Nom d'utilisateur
- **created_at** (timestamptz) - Date de création
- **updated_at** (timestamptz) - Dernière mise à jour
- **Relation**: FK vers auth.users

### Table: profiles
- **user_id** (uuid, PK, FK) - Référence vers auth.users
- **username** (varchar, UNIQUE, NOT NULL) - Nom d'utilisateur
- **department** (varchar) - Département
- **avatar_url** (text) - URL de l'avatar
- **total_points** (int, DEFAULT 0, CHECK >= 0) - Points totaux
- **current_grade** (int, DEFAULT 1, CHECK 1-15) - Grade actuel
- **streak_days** (int, DEFAULT 0, CHECK >= 0) - Jours consécutifs
- **created_at** (timestamptz, NOT NULL) - Date de création
- **updated_at** (timestamptz, NOT NULL) - Dernière mise à jour
- **best_score** (int, DEFAULT 0) - Meilleur score
- **sessions_completed** (int, DEFAULT 0) - Sessions terminées
- **total_time_played** (int, DEFAULT 0) - Temps total joué
- **preferences** (jsonb, DEFAULT '{"theme": "light"}') - Préférences

### Table: sessions
- **id** (uuid, PK) - Identifiant unique
- **user_id** (uuid, FK, NOT NULL) - Référence utilisateur
- **config** (jsonb, DEFAULT '{}') - Configuration de la session
- **started_at** (timestamptz, NOT NULL) - Heure de début
- **ended_at** (timestamptz) - Heure de fin
- **paused_at** (timestamptz) - Heure de pause
- **score** (numeric, DEFAULT 0) - Score de la session
- **total_points_earned** (int, DEFAULT 0) - Points gagnés
- **status** (session_status, DEFAULT 'in_progress') - Statut
- **created_at** (timestamptz) - Date de création
- **completed_at** (timestamptz) - Date de fin

### Table: session_answers
- **id** (uuid, PK) - Identifiant unique
- **session_id** (uuid, FK, NOT NULL) - Référence session
- **question_id** (uuid, NOT NULL) - ID de la question
- **is_correct** (boolean, DEFAULT false) - Réponse correcte ?
- **is_partial** (boolean, DEFAULT false) - Réponse partielle ?
- **time_taken** (int, DEFAULT 0, CHECK >= 0) - Temps en secondes
- **points_earned** (numeric, DEFAULT 0) - Points gagnés
- **selected_answers** (text[], DEFAULT '{}') - Réponses sélectionnées

### Table: themes
- **id** (uuid, PK) - Identifiant unique
- **name** (text, UNIQUE, NOT NULL) - Nom du thème
- **icon** (text, DEFAULT '📚') - Icône
- **created_at** (timestamptz) - Date de création
- **updated_at** (timestamptz) - Dernière mise à jour

### Table: sub_themes
- **id** (uuid, PK) - Identifiant unique
- **theme_id** (uuid, FK, NOT NULL) - Référence thème
- **name** (text, NOT NULL) - Nom du sous-thème
- **created_at** (timestamptz) - Date de création
- **updated_at** (timestamptz) - Dernière mise à jour

### Table: questions
- **id** (uuid, PK) - Identifiant unique
- **sub_theme_id** (uuid, FK, NOT NULL) - Référence sous-thème
- **question** (text, NOT NULL) - Texte de la question
- **correct_answer** (text, NOT NULL) - Bonne réponse
- **wrong_answer_1** (text, NOT NULL) - Mauvaise réponse 1
- **wrong_answer_2** (text, NOT NULL) - Mauvaise réponse 2
- **wrong_answer_3** (text, NOT NULL) - Mauvaise réponse 3
- **explanation** (text) - Explication
- **created_at** (timestamptz) - Date de création
- **updated_at** (timestamptz) - Dernière mise à jour

### Table: daily_challenges
- **id** (uuid, PK) - Identifiant unique
- **date** (date, UNIQUE, NOT NULL, DEFAULT CURRENT_DATE) - Date du défi
- **theme** (theme_type, NOT NULL) - Thème du défi
- **questions_ids** (uuid[], DEFAULT '{}') - IDs des questions
- **reward_points** (int, DEFAULT 100, CHECK > 0) - Points de récompense
- **created_at** (timestamptz, NOT NULL) - Date de création

### Table: badges
- **id** (uuid, PK) - Identifiant unique
- **name** (varchar, UNIQUE, NOT NULL) - Nom du badge
- **description** (text, NOT NULL) - Description
- **icon_name** (varchar, NOT NULL) - Nom de l'icône
- **category** (badge_category, NOT NULL) - Catégorie
- **requirement** (jsonb, DEFAULT '{}') - Conditions d'obtention

### Table: user_badges
- **user_id** (uuid, PK, FK) - Référence utilisateur
- **badge_id** (uuid, PK, FK) - Référence badge
- **earned_at** (timestamptz, NOT NULL) - Date d'obtention

### Table: user_stats
- **user_id** (uuid, PK, FK) - Référence utilisateur
- **theme** (theme_type, PK) - Thème
- **total_questions** (int, DEFAULT 0, CHECK >= 0) - Questions totales
- **correct_answers** (int, DEFAULT 0, CHECK >= 0) - Bonnes réponses
- **avg_time_per_question** (numeric, DEFAULT 0, CHECK >= 0) - Temps moyen
- **last_updated** (timestamptz, NOT NULL) - Dernière mise à jour

### Table: rankings
- **id** (uuid, PK) - Identifiant unique
- **user_id** (uuid, FK, NOT NULL) - Référence utilisateur
- **ranking_type** (ranking_type, NOT NULL) - Type de classement
- **points** (int, DEFAULT 0, CHECK >= 0) - Points
- **rank** (int, CHECK >= 1) - Position
- **period_start** (date, NOT NULL) - Début de période
- **period_end** (date, NOT NULL) - Fin de période

### Table: admins
- **id** (uuid, PK) - Identifiant unique
- **user_id** (uuid, FK, UNIQUE) - Référence utilisateur (optionnelle)
- **email** (text, UNIQUE, NOT NULL) - Email administrateur
- **created_at** (timestamptz) - Date de création

## 🔄 Extensions Installées

- **uuid-ossp** (1.1) - Génération d'UUID
- **pgcrypto** (1.3) - Fonctions cryptographiques
- **pg_graphql** (1.5.11) - Support GraphQL
- **pg_trgm** (1.6) - Recherche par trigrammes
- **pg_stat_statements** (1.11) - Statistiques des requêtes
- **supabase_vault** (0.3.1) - Coffre-fort Supabase

## 📈 Statistiques Actuelles

- **17 tables** dans le schéma public
- **2 vues** personnalisées
- **0 migrations** appliquées (structure créée directement)
- **Données présentes** : 
  - Sessions: ~170 enregistrements
  - Session_answers: ~161 enregistrements
  - User_grades: 30 enregistrements
  - Badges: 15 enregistrements
  - Themes: 3 enregistrements
  - Sub_themes: 18 enregistrements
  - Questions: 13 enregistrements
  - User_challenges: 50 enregistrements

## 🔒 Sécurité (RLS)

**Row Level Security activé** sur toutes les tables principales pour garantir l'isolation des données par utilisateur.

## 📝 Notes de Backup

- Backup automatique configuré via scripts npm
- Localisation : `./backups/`
- Format : SQL + métadonnées JSON
- Rétention : 10 derniers backups