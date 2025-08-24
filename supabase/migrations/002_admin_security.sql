-- ⚠️ IMPORTANT: Script de sécurisation des fonctions admin
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Créer une table pour les administrateurs
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Ajouter l'admin principal (remplacer par votre email)
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users 
WHERE email = 'jonathan.valsaque@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- 3. Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Activer RLS (Row Level Security) sur toutes les tables
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Themes viewable by all" ON themes;
DROP POLICY IF EXISTS "Themes modifiable by admins only" ON themes;
DROP POLICY IF EXISTS "Themes updatable by admins only" ON themes;
DROP POLICY IF EXISTS "Themes deletable by admins only" ON themes;

DROP POLICY IF EXISTS "SubThemes viewable by all" ON sub_themes;
DROP POLICY IF EXISTS "SubThemes modifiable by admins only" ON sub_themes;
DROP POLICY IF EXISTS "SubThemes updatable by admins only" ON sub_themes;
DROP POLICY IF EXISTS "SubThemes deletable by admins only" ON sub_themes;

DROP POLICY IF EXISTS "Questions viewable by all" ON questions;
DROP POLICY IF EXISTS "Questions modifiable by admins only" ON questions;
DROP POLICY IF EXISTS "Questions updatable by admins only" ON questions;
DROP POLICY IF EXISTS "Questions deletable by admins only" ON questions;

DROP POLICY IF EXISTS "Admins viewable by admins only" ON admins;
DROP POLICY IF EXISTS "Admins not modifiable" ON admins;

-- 6. Créer les politiques pour les thèmes
-- Lecture pour tous
CREATE POLICY "Themes viewable by all" ON themes
  FOR SELECT USING (true);

-- Écriture pour admins seulement
CREATE POLICY "Themes modifiable by admins only" ON themes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Themes updatable by admins only" ON themes
  FOR UPDATE USING (is_admin());

CREATE POLICY "Themes deletable by admins only" ON themes
  FOR DELETE USING (is_admin());

-- 7. Politiques pour les sous-thèmes
-- Lecture pour tous
CREATE POLICY "SubThemes viewable by all" ON sub_themes
  FOR SELECT USING (true);

-- Écriture pour admins seulement
CREATE POLICY "SubThemes modifiable by admins only" ON sub_themes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "SubThemes updatable by admins only" ON sub_themes
  FOR UPDATE USING (is_admin());

CREATE POLICY "SubThemes deletable by admins only" ON sub_themes
  FOR DELETE USING (is_admin());

-- 8. Politiques pour les questions
-- Lecture pour tous
CREATE POLICY "Questions viewable by all" ON questions
  FOR SELECT USING (true);

-- Écriture pour admins seulement
CREATE POLICY "Questions modifiable by admins only" ON questions
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Questions updatable by admins only" ON questions
  FOR UPDATE USING (is_admin());

CREATE POLICY "Questions deletable by admins only" ON questions
  FOR DELETE USING (is_admin());

-- 9. Sécuriser la table admins elle-même
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins viewable by admins only" ON admins
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins not modifiable" ON admins
  FOR ALL USING (false);

-- 9. Vue pour vérifier le statut admin (optionnel)
CREATE OR REPLACE VIEW user_admin_status AS
SELECT 
  auth.uid() as user_id,
  auth.email() as email,
  is_admin() as is_admin;

-- 10. Fonction publique pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;