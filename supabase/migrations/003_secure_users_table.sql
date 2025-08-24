-- ==========================================
-- SCRIPT 3 : Sécuriser la table users
-- À exécuter pour corriger le warning "unrestricted"
-- ==========================================

-- 1. Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 3. Créer les politiques pour users
-- Tous les utilisateurs authentifiés peuvent voir les autres utilisateurs (pour le classement, etc.)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT 
  USING (true);

-- Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Seuls les admins peuvent supprimer des utilisateurs
CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE 
  USING (is_admin());

-- 4. Vérifier que RLS est bien activé
DO $$
BEGIN
  RAISE NOTICE 'RLS activé sur la table users';
  RAISE NOTICE 'Les utilisateurs peuvent : voir tous les profils, modifier le leur';
  RAISE NOTICE 'Seuls les admins peuvent : supprimer des utilisateurs';
END $$;