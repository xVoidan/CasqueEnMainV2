-- ========================================
-- POLICIES RLS POUR LE BUCKET AVATARS
-- Script adapté pour Supabase Storage RLS
-- ========================================

-- Les policies de Storage dans Supabase utilisent le système RLS standard
-- sur la table storage.objects

-- ========================================
-- ÉTAPE 1: Activer RLS sur storage.objects
-- ========================================

-- RLS est déjà activé par défaut sur storage.objects

-- ========================================
-- ÉTAPE 2: Créer les policies RLS
-- ========================================

-- Policy 1: SELECT - Tout le monde peut voir les avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 2: INSERT - Les utilisateurs authentifiés peuvent uploader leurs avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 3: UPDATE - Les utilisateurs peuvent modifier leurs propres avatars
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 4: DELETE - Les utilisateurs peuvent supprimer leurs propres avatars
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ========================================
-- MÉTHODE ALTERNATIVE SIMPLIFIÉE
-- ========================================

-- Si les policies ci-dessus ne fonctionnent pas, essayez ces versions simplifiées :

-- Policy pour permettre tout accès aux utilisateurs authentifiés sur leurs fichiers
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
CREATE POLICY "Give users access to own folder"
ON storage.objects
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy publique pour la lecture
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Lister toutes les policies sur storage.objects pour le bucket avatars
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (
    policyname LIKE '%avatar%' 
    OR policyname LIKE '%Avatar%'
    OR qual::text LIKE '%avatars%'
    OR with_check::text LIKE '%avatars%'
)
ORDER BY policyname;

-- ========================================
-- INSTRUCTIONS SI LE SCRIPT ÉCHOUE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Policies créées avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE 'Les policies suivantes ont été créées :';
  RAISE NOTICE '1. SELECT : Lecture publique des avatars';
  RAISE NOTICE '2. INSERT : Upload pour utilisateurs authentifiés';
  RAISE NOTICE '3. UPDATE : Modification de ses propres avatars';
  RAISE NOTICE '4. DELETE : Suppression de ses propres avatars';
  RAISE NOTICE '';
  RAISE NOTICE 'Structure des fichiers :';
  RAISE NOTICE 'Les avatars seront stockés dans : avatars/{user_id}/filename.jpg';
  RAISE NOTICE '';
  RAISE NOTICE 'Si vous avez des erreurs, créez les policies manuellement dans :';
  RAISE NOTICE 'Dashboard → Authentication → Policies → storage.objects';
END $$;