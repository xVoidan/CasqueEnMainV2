# 📋 Guide de Configuration Supabase pour CasqueEnMain

## 🚀 Étapes à suivre dans Supabase Dashboard

### 1️⃣ Exécuter les Migrations SQL

Allez dans **SQL Editor** et exécutez ces scripts dans l'ordre :

#### Migration 1: Tables de révision et statistiques
```sql
-- Copiez le contenu de: supabase/migrations/003_revision_and_stats.sql
```

#### Migration 2: Configuration avatars
```sql
-- Copiez le contenu de: supabase/migrations/004_storage_avatars.sql
```

#### Migration 3: Questions de test
```sql
-- Copiez le contenu de: scripts/seed.sql
```

### 2️⃣ Créer le Bucket Storage pour les Avatars

1. Allez dans **Storage** > **Create a new bucket**
2. Configurez :
   - Name: `avatars`
   - Public bucket: ✅ Oui
   - File size limit: `5MB`
   - Allowed MIME types: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`

### 3️⃣ Configurer les Policies du Bucket

Dans **Storage** > **avatars** > **Policies**, créez :

#### Policy 1: SELECT (Lecture publique)
```sql
-- Nom: Public avatar access
-- Operation: SELECT
-- Target roles: anon, authenticated

true -- Tous peuvent voir les avatars
```

#### Policy 2: INSERT (Upload authentifié)
```sql
-- Nom: Authenticated users can upload
-- Operation: INSERT
-- Target roles: authenticated

auth.uid()::text = (storage.foldername(name))[1]
-- L'utilisateur peut uploader dans son dossier
```

#### Policy 3: UPDATE (Modification)
```sql
-- Nom: Users can update own avatars
-- Operation: UPDATE
-- Target roles: authenticated

auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 4: DELETE (Suppression)
```sql
-- Nom: Users can delete own avatars
-- Operation: DELETE  
-- Target roles: authenticated

auth.uid()::text = (storage.foldername(name))[1]
```

### 4️⃣ Vérifier les Tables RLS

Assurez-vous que RLS est activé pour ces tables :
- ✅ `user_profiles`
- ✅ `questions`
- ✅ `quiz_sessions`
- ✅ `user_answers`
- ✅ `badges`
- ✅ `user_badges`
- ✅ `user_question_stats`
- ✅ `rankings`

### 5️⃣ Tester la Configuration

#### Test 1: Vérifier les tables
```sql
-- Dans SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

#### Test 2: Vérifier les questions
```sql
SELECT COUNT(*) as total, theme_name, difficulty 
FROM questions 
GROUP BY theme_name, difficulty
ORDER BY theme_name, difficulty;
```

Vous devriez avoir :
- 10 questions Incendie
- 10 questions Secourisme  
- 10 questions Diverse

#### Test 3: Vérifier le storage
```sql
-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE name = 'avatars';
```

## ✅ Checklist Finale

- [ ] Migration 003 exécutée (user_question_stats créée)
- [ ] Migration 004 exécutée (fonctions avatar)
- [ ] 30 questions insérées via seed.sql
- [ ] Bucket 'avatars' créé et public
- [ ] 4 policies configurées pour le bucket
- [ ] RLS activé sur toutes les tables
- [ ] Tests de vérification passés

## 🎉 Configuration Terminée!

Une fois toutes ces étapes complétées, votre application est prête avec :
- ✅ Système de profil complet avec avatars
- ✅ Système de révision avec tracking
- ✅ 30 questions de test
- ✅ Statistiques détaillées
- ✅ Mode sombre
- ✅ Notifications et sons

## 🆘 En cas de problème

1. Vérifiez les logs dans **Logs** > **API**
2. Testez les requêtes dans **API Docs**
3. Vérifiez les policies RLS dans **Authentication** > **Policies**

## 📝 Notes Importantes

- Les avatars sont stockés dans : `avatars/{user_id}-{timestamp}.jpg`
- Les questions utilisent 3 thèmes : Incendie, Secourisme, Diverse
- Le dark mode est sauvé dans `preferences.theme` du profil
- Les stats de révision sont dans `user_question_stats`