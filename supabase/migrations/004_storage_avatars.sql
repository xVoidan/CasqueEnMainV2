-- Configuration du Storage pour les avatars
-- NOTE: Le bucket doit être créé via l'interface Supabase ou via l'API

-- Créer une fonction pour obtenir l'URL publique d'un avatar
CREATE OR REPLACE FUNCTION get_avatar_url(file_path TEXT)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Remplacer par votre URL Supabase
  SELECT 'https://ucwgtiaebljfbvhokicf.supabase.co/storage/v1/object/public/avatars/' || file_path
  INTO base_url;
  
  RETURN base_url;
END;
$$ LANGUAGE plpgsql;

-- Politique pour permettre aux utilisateurs de gérer leurs avatars
-- Ces policies doivent être créées dans l'interface Supabase Storage :
-- 1. SELECT: Permettre à tous de voir les avatars (public)
-- 2. INSERT: Permettre aux utilisateurs authentifiés d'uploader
-- 3. UPDATE: Permettre aux utilisateurs de modifier leurs propres avatars
-- 4. DELETE: Permettre aux utilisateurs de supprimer leurs propres avatars

-- Fonction pour nettoyer l'ancien avatar lors d'un changement
CREATE OR REPLACE FUNCTION cleanup_old_avatar()
RETURNS TRIGGER AS $$
DECLARE
  old_file_name TEXT;
BEGIN
  -- Si l'avatar_url a changé et n'est pas null
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    -- Extraire le nom du fichier de l'ancienne URL
    old_file_name := regexp_replace(OLD.avatar_url, '.*/avatars/', '');
    
    -- Note: La suppression réelle du fichier doit être faite via l'API Storage
    -- Cette fonction peut être utilisée pour logger ou déclencher une action
    RAISE NOTICE 'Avatar à supprimer: %', old_file_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer les anciens avatars
DROP TRIGGER IF EXISTS cleanup_avatar_trigger ON user_profiles;
CREATE TRIGGER cleanup_avatar_trigger
BEFORE UPDATE OF avatar_url ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_avatar();