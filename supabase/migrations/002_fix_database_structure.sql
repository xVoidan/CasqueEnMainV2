-- =============================================
-- MIGRATION: Correction et alignement de la structure
-- Date: 2025-08-22
-- Description: Réinitialise proprement toutes les tables avec la bonne structure
-- =============================================

-- 1. Supprimer les tables existantes pour repartir sur une base propre
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.user_challenges CASCADE;
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
DROP TABLE IF EXISTS public.rankings CASCADE;
DROP TABLE IF EXISTS public.user_grades CASCADE;
DROP TABLE IF EXISTS public.session_answers CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Supprimer les types enum existants
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS ranking_type CASCADE;
DROP TYPE IF EXISTS badge_category CASCADE;
DROP TYPE IF EXISTS theme_type CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;

-- 3. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_points() CASCADE;

-- 4. Enable extensions si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. Recréer les types enum
CREATE TYPE theme_type AS ENUM ('Mathématiques', 'Français', 'Métier');
CREATE TYPE question_type AS ENUM ('QCU', 'QCM');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE ranking_type AS ENUM ('global', 'weekly', 'monthly', 'theme');
CREATE TYPE badge_category AS ENUM ('performance', 'streak', 'milestone', 'special');

-- 6. Recréer la table profiles
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    current_grade INTEGER DEFAULT 1 CHECK (current_grade >= 1 AND current_grade <= 15),
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Recréer la table questions avec TOUTES les colonnes nécessaires
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme theme_type NOT NULL,
    sub_theme VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    question_type question_type DEFAULT 'QCU' NOT NULL,
    type VARCHAR(20) DEFAULT 'single' CHECK (type IN ('single', 'multiple')), -- Colonne pour compatibilité
    image_url TEXT,
    explanation TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
    points INTEGER DEFAULT 1, -- Points par question
    answers JSONB, -- Stockage JSON des réponses
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() -- Timestamp de modification
);

-- 8. Recréer la table answers
CREATE TABLE public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    order_position INTEGER NOT NULL CHECK (order_position >= 1 AND order_position <= 4),
    UNIQUE(question_id, order_position)
);

-- 9. Recréer la table sessions
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    score DECIMAL(5,2) DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    status session_status DEFAULT 'in_progress' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Pour compatibilité
    completed_at TIMESTAMPTZ, -- Alias pour ended_at
    CONSTRAINT ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- 10. Recréer la table session_answers
CREATE TABLE public.session_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_answers UUID[] DEFAULT ARRAY[]::UUID[],
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    is_partial BOOLEAN DEFAULT FALSE NOT NULL,
    time_taken INTEGER DEFAULT 0 CHECK (time_taken >= 0),
    points_earned DECIMAL(5,2) DEFAULT 0,
    UNIQUE(session_id, question_id)
);

-- 11. Recréer la table user_grades
CREATE TABLE public.user_grades (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 15),
    grade_name VARCHAR(100) NOT NULL,
    reached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY(user_id, grade_level)
);

-- 12. Recréer la table rankings
CREATE TABLE public.rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ranking_type ranking_type NOT NULL,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    rank INTEGER CHECK (rank >= 1),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    CONSTRAINT period_valid CHECK (period_end >= period_start)
);

-- 13. Recréer la table daily_challenges
CREATE TABLE public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    theme theme_type NOT NULL,
    questions_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    reward_points INTEGER DEFAULT 100 CHECK (reward_points > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Recréer la table user_challenges
CREATE TABLE public.user_challenges (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
    PRIMARY KEY(user_id, challenge_id)
);

-- 15. Recréer la table badges
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    category badge_category NOT NULL,
    requirement JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 16. Recréer la table user_badges
CREATE TABLE public.user_badges (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY(user_id, badge_id)
);

-- 17. Recréer la table user_stats
CREATE TABLE public.user_stats (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme theme_type NOT NULL,
    total_questions INTEGER DEFAULT 0 CHECK (total_questions >= 0),
    correct_answers INTEGER DEFAULT 0 CHECK (correct_answers >= 0),
    avg_time_per_question DECIMAL(5,2) DEFAULT 0 CHECK (avg_time_per_question >= 0),
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY(user_id, theme),
    CONSTRAINT correct_not_more_than_total CHECK (correct_answers <= total_questions)
);

-- 18. Créer les index pour les performances
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);
CREATE INDEX idx_profiles_current_grade ON public.profiles(current_grade);

CREATE INDEX idx_questions_theme ON public.questions(theme);
CREATE INDEX idx_questions_sub_theme ON public.questions(sub_theme);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_theme_subtheme ON public.questions(theme, sub_theme);

CREATE INDEX idx_answers_question_id ON public.answers(question_id);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at DESC);

CREATE INDEX idx_session_answers_session_id ON public.session_answers(session_id);
CREATE INDEX idx_session_answers_question_id ON public.session_answers(question_id);

CREATE INDEX idx_rankings_user_id ON public.rankings(user_id);
CREATE INDEX idx_rankings_type_period ON public.rankings(ranking_type, period_start, period_end);
CREATE INDEX idx_rankings_rank ON public.rankings(rank);

CREATE INDEX idx_daily_challenges_date ON public.daily_challenges(date DESC);

CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges(challenge_id);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);

-- 19. Fonction pour mettre à jour updated_at avec search_path sécurisé
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 20. Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_last_updated
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 21. Fonction pour créer un profil avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 22. Trigger pour créer le profil après inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 23. Fonction pour calculer les points avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.profiles
        SET total_points = total_points + NEW.total_points_earned
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 24. Trigger pour mettre à jour les points
CREATE TRIGGER update_points_after_session
    AFTER UPDATE OF status ON public.sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION public.update_user_points();

-- 25. Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- 26. Créer les policies RLS
-- Policies pour profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour questions et answers
CREATE POLICY "questions_select" ON public.questions FOR SELECT USING (true);
CREATE POLICY "answers_select" ON public.answers FOR SELECT USING (true);

-- Policies pour sessions
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour session_answers
CREATE POLICY "session_answers_select" ON public.session_answers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = session_answers.session_id
        AND sessions.user_id = auth.uid()
    ));

CREATE POLICY "session_answers_insert" ON public.session_answers FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = session_answers.session_id
        AND sessions.user_id = auth.uid()
    ));

-- Policies pour user_grades (AJOUT DES POLICIES MANQUANTES)
CREATE POLICY "user_grades_select" ON public.user_grades FOR SELECT USING (true);
CREATE POLICY "user_grades_insert" ON public.user_grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_grades_update" ON public.user_grades FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour rankings
CREATE POLICY "rankings_select" ON public.rankings FOR SELECT USING (true);

-- Policies pour daily_challenges
CREATE POLICY "daily_challenges_select" ON public.daily_challenges FOR SELECT USING (true);

-- Policies pour user_challenges
CREATE POLICY "user_challenges_select" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_challenges_insert" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour badges
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (true);

-- Policies pour user_badges
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour user_stats
CREATE POLICY "user_stats_select" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "user_stats_insert" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_stats_update" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- 27. Insérer les badges des grades pompier
INSERT INTO public.badges (name, description, icon_name, category, requirement) VALUES
('Aspirant', 'Grade initial - Bienvenue chez les pompiers!', 'grade_1', 'milestone', '{"min_points": 0}'::jsonb),
('Sapeur 2ème classe', 'Premier grade de sapeur', 'grade_2', 'milestone', '{"min_points": 100}'::jsonb),
('Sapeur 1ère classe', 'Sapeur confirmé', 'grade_3', 'milestone', '{"min_points": 250}'::jsonb),
('Caporal', 'Premier grade de gradé', 'grade_4', 'milestone', '{"min_points": 500}'::jsonb),
('Caporal-chef', 'Gradé expérimenté', 'grade_5', 'milestone', '{"min_points": 1000}'::jsonb),
('Sergent', 'Sous-officier', 'grade_6', 'milestone', '{"min_points": 2000}'::jsonb),
('Sergent-chef', 'Sous-officier confirmé', 'grade_7', 'milestone', '{"min_points": 3500}'::jsonb),
('Adjudant', 'Sous-officier supérieur', 'grade_8', 'milestone', '{"min_points": 5500}'::jsonb),
('Adjudant-chef', 'Plus haut grade de sous-officier', 'grade_9', 'milestone', '{"min_points": 8000}'::jsonb),
('Lieutenant', 'Premier grade d''officier', 'grade_10', 'milestone', '{"min_points": 11000}'::jsonb),
('Capitaine', 'Officier confirmé', 'grade_11', 'milestone', '{"min_points": 15000}'::jsonb),
('Commandant', 'Officier supérieur', 'grade_12', 'milestone', '{"min_points": 20000}'::jsonb),
('Lieutenant-colonel', 'Officier supérieur confirmé', 'grade_13', 'milestone', '{"min_points": 27000}'::jsonb),
('Colonel', 'Haut gradé', 'grade_14', 'milestone', '{"min_points": 35000}'::jsonb),
('Contrôleur général', 'Plus haut grade', 'grade_15', 'milestone', '{"min_points": 50000}'::jsonb);

-- =============================================
-- FIN DE LA MIGRATION DE CORRECTION
-- =============================================

-- Note: Cette migration réinitialise complètement la structure de la base de données.
-- Elle supprime toutes les tables existantes et les recrée avec la bonne structure.
-- Les fonctions ont maintenant un search_path sécurisé et les policies RLS sont complètes.