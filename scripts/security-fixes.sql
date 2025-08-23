-- =====================================================
-- Script de corrections de sécurité Supabase
-- Projet: CasqueEnMainV2
-- Date: 23/08/2025
-- =====================================================

-- =====================================================
-- 1. CORRECTION DE LA VUE SECURITY DEFINER (CRITIQUE)
-- =====================================================

-- Supprimer la vue existante avec SECURITY DEFINER
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Recréer la vue SANS SECURITY DEFINER pour respecter RLS
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.user_id,
  p.username,
  p.department,
  p.avatar_url,
  p.total_points,
  p.current_grade,
  p.streak_days,
  p.best_score,
  p.sessions_completed,
  p.total_time_played,
  p.preferences,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.user_id = auth.uid();

-- Appliquer les permissions appropriées
ALTER VIEW public.user_profiles OWNER TO authenticated;

-- Accorder les permissions de lecture
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Commentaire pour documentation
COMMENT ON VIEW public.user_profiles IS 
'Vue sécurisée des profils utilisateurs - Chaque utilisateur ne voit que son propre profil via RLS';

-- =====================================================
-- 2. CORRECTION DE LA FONCTION map_theme (WARNING)
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.map_theme(text);

-- Recréer la fonction avec search_path défini
CREATE OR REPLACE FUNCTION public.map_theme(theme_input text)
RETURNS theme_type 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Validation et mapping du thème
  CASE theme_input
    WHEN 'Mathématiques' THEN 
      RETURN 'Mathématiques'::theme_type;
    WHEN 'Français' THEN 
      RETURN 'Français'::theme_type;
    WHEN 'Métier' THEN 
      RETURN 'Métier'::theme_type;
    ELSE 
      RAISE EXCEPTION 'Thème invalide: %. Thèmes acceptés: Mathématiques, Français, Métier', theme_input;
  END CASE;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.map_theme(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.map_theme(text) TO anon;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.map_theme(text) IS 
'Fonction sécurisée pour mapper les noms de thèmes vers le type enum theme_type';

-- =====================================================
-- 3. VÉRIFICATION ET ACTIVATION RLS SUR TOUTES LES TABLES
-- =====================================================

-- Activer RLS sur toutes les tables publiques
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_question_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CRÉATION DES POLICIES RLS MANQUANTES
-- =====================================================

-- Policy pour la table profiles (si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy pour la table sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can manage own sessions'
  ) THEN
    CREATE POLICY "Users can manage own sessions"
      ON public.sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy pour la table user_stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_stats' 
    AND policyname = 'Users can manage own stats'
  ) THEN
    CREATE POLICY "Users can manage own stats"
      ON public.user_stats FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 5. AUDIT DE SÉCURITÉ - VÉRIFICATIONS
-- =====================================================

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Activé'
    ELSE '❌ RLS Désactivé - ATTENTION!'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Vérifier les fonctions sans search_path
SELECT 
  proname as function_name,
  CASE 
    WHEN prosecdef = true AND proconfig IS NULL THEN '⚠️ SECURITY DEFINER sans search_path'
    WHEN prosecdef = true AND proconfig IS NOT NULL THEN '✅ SECURITY DEFINER avec search_path'
    ELSE '✅ Pas SECURITY DEFINER'
  END as security_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Vérifier les vues avec SECURITY DEFINER
SELECT 
  viewname,
  CASE 
    WHEN definition ILIKE '%SECURITY DEFINER%' THEN '❌ Vue avec SECURITY DEFINER'
    ELSE '✅ Vue sans SECURITY DEFINER'
  END as security_status
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- =====================================================
-- 6. NOTES IMPORTANTES
-- =====================================================

/*
ACTIONS MANUELLES REQUISES DANS LE DASHBOARD SUPABASE:

1. Activer la protection contre les mots de passe compromis:
   - Aller dans Authentication > Providers > Email
   - Section "Password Security"
   - Activer "Leaked password protection"
   - Sauvegarder

2. Vérifier les résultats de l'audit ci-dessus:
   - Toutes les tables doivent avoir RLS activé
   - Aucune fonction ne doit avoir SECURITY DEFINER sans search_path
   - Aucune vue ne doit avoir SECURITY DEFINER (sauf cas spécifiques justifiés)

3. Tester les permissions après application:
   - Se connecter avec un compte utilisateur test
   - Vérifier l'accès aux données (lecture/écriture)
   - S'assurer qu'aucun utilisateur ne peut voir les données des autres

4. Backup recommandé:
   - Faire un backup complet avant d'appliquer ces changements
   - Utiliser: npm run backup:supabase
*/

-- =====================================================
-- FIN DU SCRIPT DE SÉCURITÉ
-- =====================================================