-- ========================================
-- POLICIES POUR LE BUCKET AVATARS
-- Exécutez ce script dans SQL Editor de Supabase
-- ========================================

-- Note: Les policies de storage utilisent une syntaxe particulière
-- Elles doivent être créées via les fonctions RLS de Supabase

-- ========================================
-- ÉTAPE 1: Activer RLS sur le bucket
-- ========================================

-- Activer RLS pour le bucket avatars
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- ========================================
-- ÉTAPE 2: Créer les policies
-- ========================================

-- Policy 1: SELECT - Tout le monde peut voir les avatars
INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  id,
  'Public avatar access',
  'true'::text,
  'SELECT'::storage.operation
FROM storage.buckets
WHERE name = 'avatars'
ON CONFLICT (bucket_id, operation, name) 
DO UPDATE SET definition = 'true'::text;

-- Policy 2: INSERT - Les utilisateurs authentifiés peuvent uploader
INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  id,
  'Users can upload avatars',
  '(auth.uid())::text = (storage.foldername(name))[1]'::text,
  'INSERT'::storage.operation
FROM storage.buckets
WHERE name = 'avatars'
ON CONFLICT (bucket_id, operation, name) 
DO UPDATE SET definition = '(auth.uid())::text = (storage.foldername(name))[1]'::text;

-- Policy 3: UPDATE - Les utilisateurs peuvent modifier leurs avatars
INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  id,
  'Users can update own avatars',
  '(auth.uid())::text = (storage.foldername(name))[1]'::text,
  'UPDATE'::storage.operation
FROM storage.buckets
WHERE name = 'avatars'
ON CONFLICT (bucket_id, operation, name) 
DO UPDATE SET definition = '(auth.uid())::text = (storage.foldername(name))[1]'::text;

-- Policy 4: DELETE - Les utilisateurs peuvent supprimer leurs avatars
INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  id,
  'Users can delete own avatars',
  '(auth.uid())::text = (storage.foldername(name))[1]'::text,
  'DELETE'::storage.operation
FROM storage.buckets
WHERE name = 'avatars'
ON CONFLICT (bucket_id, operation, name) 
DO UPDATE SET definition = '(auth.uid())::text = (storage.foldername(name))[1]'::text;

-- ========================================
-- MÉTHODE ALTERNATIVE (si la première ne fonctionne pas)
-- ========================================

-- Si les insertions directes ne fonctionnent pas, utilisez ces commandes RPC :

-- Policy SELECT (publique)
DO $$
BEGIN
  PERFORM storage.create_policy(
    'avatars',
    'Public avatar access',
    'SELECT',
    'anon, authenticated',
    'true'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy SELECT peut déjà exister ou nécessite création manuelle';
END $$;

-- Policy INSERT (authentifié)
DO $$
BEGIN
  PERFORM storage.create_policy(
    'avatars',
    'Users can upload avatars',
    'INSERT',
    'authenticated',
    '(auth.uid())::text = (storage.foldername(name))[1]'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy INSERT peut déjà exister ou nécessite création manuelle';
END $$;

-- Policy UPDATE (authentifié)
DO $$
BEGIN
  PERFORM storage.create_policy(
    'avatars',
    'Users can update own avatars',
    'UPDATE',
    'authenticated',
    '(auth.uid())::text = (storage.foldername(name))[1]'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy UPDATE peut déjà exister ou nécessite création manuelle';
END $$;

-- Policy DELETE (authentifié)
DO $$
BEGIN
  PERFORM storage.create_policy(
    'avatars',
    'Users can delete own avatars',
    'DELETE',
    'authenticated',
    '(auth.uid())::text = (storage.foldername(name))[1]'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy DELETE peut déjà exister ou nécessite création manuelle';
END $$;

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier que les policies sont créées
SELECT 
  p.name as policy_name,
  p.operation,
  p.definition,
  b.name as bucket_name
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'avatars'
ORDER BY p.operation;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Script terminé !';
  RAISE NOTICE '';
  RAISE NOTICE 'Si les policies n''apparaissent pas, créez-les manuellement :';
  RAISE NOTICE '1. Storage → avatars → Policies → New policy';
  RAISE NOTICE '2. Pour chaque opération (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '3. Utilisez les expressions fournies dans ce script';
END $$;