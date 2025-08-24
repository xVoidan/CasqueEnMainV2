-- ==========================================
-- SCRIPT 4 : Ajouter l'utilisateur admin
-- À exécuter APRÈS vous être inscrit dans l'app
-- ==========================================

-- ÉTAPE 1 : D'ABORD, inscrivez-vous dans l'app avec jonathan.valsaque@gmail.com
-- ÉTAPE 2 : Ensuite, exécutez ce script

-- Vérifier si l'utilisateur existe dans auth.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id_var UUID;
BEGIN
  -- Chercher l'utilisateur
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'jonathan.valsaque@gmail.com'
  ) INTO user_exists;

  IF NOT user_exists THEN
    RAISE NOTICE '❌ ERREUR : Utilisateur jonathan.valsaque@gmail.com non trouvé !';
    RAISE NOTICE '👉 ACTION REQUISE : Inscrivez-vous d''abord dans l''app avec cet email';
    RAISE EXCEPTION 'Utilisateur non trouvé. Inscrivez-vous d''abord dans l''app.';
  ELSE
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id_var FROM auth.users WHERE email = 'jonathan.valsaque@gmail.com';
    
    -- Ajouter l'utilisateur dans la table users si pas déjà fait
    INSERT INTO users (id, email, username)
    VALUES (user_id_var, 'jonathan.valsaque@gmail.com', 'Admin')
    ON CONFLICT (id) DO UPDATE SET email = 'jonathan.valsaque@gmail.com';
    
    -- Ajouter comme admin
    INSERT INTO admins (user_id, email)
    VALUES (user_id_var, 'jonathan.valsaque@gmail.com')
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE '✅ SUCCÈS : jonathan.valsaque@gmail.com est maintenant admin !';
    RAISE NOTICE '🔐 Vous pouvez maintenant accéder aux interfaces admin';
  END IF;
END $$;

-- Vérifier le résultat
SELECT 
  'Admin configuré' as status,
  a.email,
  a.created_at as "Admin depuis"
FROM admins a
WHERE a.email = 'jonathan.valsaque@gmail.com';

-- Test de la fonction is_admin (optionnel)
-- SELECT is_admin() as "Suis-je admin ?";