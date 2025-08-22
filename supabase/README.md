# Configuration Supabase pour Casque En Mains

## 📋 Instructions pour appliquer les migrations

### 1. Via l'interface Supabase Dashboard

1. Connectez-vous à votre [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New query**
5. Copiez-collez le contenu du fichier `migrations/001_create_quiz_tables.sql`
6. Cliquez sur **Run** pour exécuter la migration

### 2. Via Supabase CLI

Si vous avez installé le Supabase CLI :

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref ucwgtiaebljfbvhokicf

# Appliquer les migrations
supabase db push
```

## 📊 Structure des tables créées

### Tables principales

1. **questions** - Stockage de toutes les questions du quiz
   - Thèmes : math, french, profession
   - Sous-thèmes multiples par thème
   - Support QCU (single) et QCM (multiple)
   - Niveaux de difficulté : easy, medium, hard

2. **sessions** - Sessions de quiz des utilisateurs
   - Configuration personnalisée (thèmes, timer, barème)
   - Statut : in_progress, completed, abandoned
   - Points gagnés et score

3. **session_answers** - Réponses données pendant une session
   - Temps passé par question
   - Correct/Incorrect/Partiel/Non répondu

4. **daily_challenges** - Défis quotidiens
   - 20 questions sélectionnées chaque jour
   - Mêmes questions pour tous les utilisateurs

5. **leaderboard** - Classements
   - Par période : daily, weekly, monthly, all_time
   - Statistiques détaillées

6. **achievements** - Système de succès
   - 14 succès pré-configurés
   - Récompenses en points

7. **profiles** (mise à jour)
   - Ajout des colonnes pour le système de quiz
   - Grade actuel, points totaux, streak

## 🔒 Sécurité (RLS)

Les politiques Row Level Security sont configurées pour :
- Questions : lecture publique
- Sessions : utilisateur peut voir/modifier ses propres données
- Classements : lecture publique
- Succès : lecture publique, débloquage personnel

## 📝 Questions d'exemple

La migration inclut 5 questions d'exemple pour tester :
- 2 questions de Mathématiques
- 1 question de Français
- 2 questions de Métier (dont 1 QCM)

## 🚀 Prochaines étapes

1. Appliquer la migration dans Supabase
2. Ajouter plus de questions via l'interface admin
3. Tester le système de quiz dans l'application
4. Configurer les triggers pour :
   - Mise à jour automatique des classements
   - Calcul des streaks
   - Débloquage automatique des succès

## 📊 Format des données

### Format JSON pour les réponses (colonne `answers`)

```json
[
  {
    "id": "a",
    "text": "Réponse A",
    "isCorrect": true
  },
  {
    "id": "b",
    "text": "Réponse B",
    "isCorrect": false
  }
]
```

### Format JSON pour la configuration de session (colonne `config`)

```json
{
  "themes": ["math", "french"],
  "questionCount": 20,
  "timerEnabled": true,
  "timerDuration": 30,
  "scoring": {
    "correct": 1,
    "incorrect": -0.25,
    "skipped": 0,
    "partial": 0.5
  }
}
```