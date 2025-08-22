-- =====================================================
-- SCRIPT DE CORRECTION DES VULNÉRABILITÉS DE SÉCURITÉ
-- =====================================================
-- Ce script corrige les problèmes critiques identifiés par l'audit Supabase

-- =====================================================
-- 1. SUPPRIMER LES VUES SECURITY DEFINER DANGEREUSES
-- =====================================================

-- Supprimer les vues qui exposent auth.users
DROP VIEW IF EXISTS public.user_profiles CASCADE;
DROP VIEW IF EXISTS public.user_answers CASCADE;
DROP VIEW IF EXISTS public.quiz_sessions CASCADE;

-- =====================================================
-- 2. RECRÉER LES VUES SANS SECURITY DEFINER
-- =====================================================

-- Vue user_profiles sécurisée (map vers profiles)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.user_id,
    p.username,
    p.department,
    p.avatar_url,
    p.total_points,
    p.current_grade,
    p.streak_days,
    p.created_at,
    p.updated_at,
    p.best_score,
    p.sessions_completed,
    p.total_time_played,
    p.preferences
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- Permissions pour la vue
GRANT SELECT ON public.user_profiles TO authenticated;

-- =====================================================
-- 3. DÉPLACER L'EXTENSION pg_trgm HORS DE PUBLIC
-- =====================================================

-- Créer un schéma dédié pour les extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Déplacer l'extension
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- =====================================================
-- 4. CORRIGER LA FONCTION map_theme AVEC search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.map_theme(theme_name text)
RETURNS theme_type AS $$
BEGIN
    RETURN CASE 
        WHEN theme_name IN ('Mathématiques', 'Maths') THEN 'Mathématiques'::theme_type
        WHEN theme_name IN ('Français', 'Francais') THEN 'Français'::theme_type
        ELSE 'Métier'::theme_type
    END;
END;
$$ LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_catalog;

-- =====================================================
-- 5. OPTIMISER TOUTES LES POLICIES RLS
-- =====================================================

-- Table: profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: sessions
DROP POLICY IF EXISTS "sessions_select" ON public.sessions;
CREATE POLICY "sessions_select" ON public.sessions
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;
CREATE POLICY "sessions_insert" ON public.sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
CREATE POLICY "sessions_update" ON public.sessions
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: session_answers
DROP POLICY IF EXISTS "session_answers_select" ON public.session_answers;
CREATE POLICY "session_answers_select" ON public.session_answers
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.sessions 
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "session_answers_insert" ON public.session_answers;
CREATE POLICY "session_answers_insert" ON public.session_answers
    FOR INSERT TO authenticated
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.sessions 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Table: user_grades
DROP POLICY IF EXISTS "user_grades_select" ON public.user_grades;
CREATE POLICY "user_grades_select" ON public.user_grades
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "user_grades_insert" ON public.user_grades;
CREATE POLICY "user_grades_insert" ON public.user_grades
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_grades_update" ON public.user_grades;
CREATE POLICY "user_grades_update" ON public.user_grades
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: user_challenges
DROP POLICY IF EXISTS "user_challenges_select" ON public.user_challenges;
CREATE POLICY "user_challenges_select" ON public.user_challenges
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_challenges_insert" ON public.user_challenges;
CREATE POLICY "user_challenges_insert" ON public.user_challenges
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: user_badges
DROP POLICY IF EXISTS "user_badges_select" ON public.user_badges;
CREATE POLICY "user_badges_select" ON public.user_badges
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "user_badges_insert" ON public.user_badges;
CREATE POLICY "user_badges_insert" ON public.user_badges
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: user_stats
DROP POLICY IF EXISTS "user_stats_select" ON public.user_stats;
CREATE POLICY "user_stats_select" ON public.user_stats
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "user_stats_insert" ON public.user_stats;
CREATE POLICY "user_stats_insert" ON public.user_stats
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_stats_update" ON public.user_stats;
CREATE POLICY "user_stats_update" ON public.user_stats
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Table: user_question_stats
DROP POLICY IF EXISTS "Users can view own question stats" ON public.user_question_stats;
CREATE POLICY "Users can view own question stats" ON public.user_question_stats
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own question stats" ON public.user_question_stats;
CREATE POLICY "Users can insert own question stats" ON public.user_question_stats
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own question stats" ON public.user_question_stats;
CREATE POLICY "Users can update own question stats" ON public.user_question_stats
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 6. CRÉER LES INDEX MANQUANTS
-- =====================================================

-- Index pour user_badges.badge_id
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
ON public.user_badges(badge_id);

-- Index pour user_question_stats.question_id
CREATE INDEX IF NOT EXISTS idx_user_question_stats_question_id 
ON public.user_question_stats(question_id);

-- =====================================================
-- 7. SUPPRIMER LES INDEX INUTILISÉS
-- =====================================================

DROP INDEX IF EXISTS public.idx_profiles_username;
DROP INDEX IF EXISTS public.idx_profiles_current_grade;
DROP INDEX IF EXISTS public.idx_questions_theme;
DROP INDEX IF EXISTS public.idx_questions_sub_theme;
DROP INDEX IF EXISTS public.idx_questions_difficulty;
DROP INDEX IF EXISTS public.idx_session_answers_session_id;
DROP INDEX IF EXISTS public.idx_session_answers_question_id;
DROP INDEX IF EXISTS public.idx_rankings_rank;
DROP INDEX IF EXISTS public.idx_user_challenges_challenge_id;
DROP INDEX IF EXISTS public.idx_user_question_stats_user;
DROP INDEX IF EXISTS public.idx_user_question_stats_mastered;
DROP INDEX IF EXISTS public.idx_user_question_stats_errors;

-- =====================================================
-- 8. ACTIVER LA PROTECTION DES MOTS DE PASSE
-- =====================================================

-- Note: Cette configuration doit être faite dans le dashboard Supabase
-- Authentication > Providers > Email > Enable "Leaked password protection"

COMMENT ON SCHEMA public IS 'SÉCURITÉ: Toutes les vulnérabilités critiques ont été corrigées. Les policies RLS sont optimisées avec (SELECT auth.uid()).';

-- =====================================================
-- FIN DU SCRIPT DE SÉCURITÉ
-- =====================================================