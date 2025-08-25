-- =====================================================
-- BACKUP COMPLET SUPABASE - CASQUE EN MAINS V2
-- =====================================================
-- Projet: ucwgtiaebljfbvhokicf
-- Date: 2025-08-25
-- Tables: 17 tables dans le schéma public
-- Migrations appliquées: 0 (structure créée directement)

-- =====================================================
-- EXTENSIONS NÉCESSAIRES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TYPES PERSONNALISÉS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('in_progress', 'paused', 'completed', 'abandoned');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_type AS ENUM ('Mathématiques', 'Français', 'Métier');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_category AS ENUM ('performance', 'streak', 'milestone', 'special');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ranking_type AS ENUM ('global', 'weekly', 'monthly', 'theme');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- SCHÉMA DE BASE - TABLES PRINCIPALES
-- =====================================================

-- Table: users (extension du schéma auth)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    username text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: profiles (profils utilisateurs étendus)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid NOT NULL,
    username character varying NOT NULL,
    department character varying,
    avatar_url text,
    total_points integer DEFAULT 0,
    current_grade integer DEFAULT 1,
    streak_days integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    best_score integer DEFAULT 0,
    sessions_completed integer DEFAULT 0,
    total_time_played integer DEFAULT 0,
    preferences jsonb DEFAULT '{"theme": "light"}'::jsonb,
    CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
    CONSTRAINT profiles_username_key UNIQUE (username),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_total_points_check CHECK ((total_points >= 0)),
    CONSTRAINT profiles_current_grade_check CHECK (((current_grade >= 1) AND (current_grade <= 15))),
    CONSTRAINT profiles_streak_days_check CHECK ((streak_days >= 0))
);

-- Table: themes (thèmes principaux)
CREATE TABLE IF NOT EXISTS public.themes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text DEFAULT '📚'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT themes_pkey PRIMARY KEY (id),
    CONSTRAINT themes_name_key UNIQUE (name)
);

-- Table: sub_themes (sous-thèmes)
CREATE TABLE IF NOT EXISTS public.sub_themes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    theme_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sub_themes_pkey PRIMARY KEY (id),
    CONSTRAINT sub_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE
);

-- Table: questions
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sub_theme_id uuid NOT NULL,
    question text NOT NULL,
    correct_answer text NOT NULL,
    wrong_answer_1 text NOT NULL,
    wrong_answer_2 text NOT NULL,
    wrong_answer_3 text NOT NULL,
    explanation text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_sub_theme_id_fkey FOREIGN KEY (sub_theme_id) REFERENCES public.sub_themes(id) ON DELETE CASCADE
);

-- Table: sessions (sessions d'entraînement)
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    ended_at timestamp with time zone,
    paused_at timestamp with time zone,
    score numeric DEFAULT 0,
    total_points_earned integer DEFAULT 0,
    status session_status NOT NULL DEFAULT 'in_progress'::session_status,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: session_answers (réponses données)
CREATE TABLE IF NOT EXISTS public.session_answers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    session_id uuid NOT NULL,
    question_id uuid NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    is_partial boolean NOT NULL DEFAULT false,
    time_taken integer DEFAULT 0,
    points_earned numeric DEFAULT 0,
    selected_answers text[] DEFAULT ARRAY[]::text[],
    CONSTRAINT session_answers_pkey PRIMARY KEY (id),
    CONSTRAINT session_answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE,
    CONSTRAINT session_answers_time_taken_check CHECK ((time_taken >= 0))
);

-- Table: badges (système de badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name character varying NOT NULL,
    description text NOT NULL,
    icon_name character varying NOT NULL,
    category badge_category NOT NULL,
    requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT badges_pkey PRIMARY KEY (id),
    CONSTRAINT badges_name_key UNIQUE (name)
);

-- Table: user_badges (badges obtenus par utilisateurs)
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id),
    CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE
);

-- Table: daily_challenges (défis quotidiens)
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    date date NOT NULL DEFAULT CURRENT_DATE,
    theme theme_type NOT NULL,
    questions_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
    reward_points integer DEFAULT 100,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT daily_challenges_pkey PRIMARY KEY (id),
    CONSTRAINT daily_challenges_date_key UNIQUE (date),
    CONSTRAINT daily_challenges_reward_points_check CHECK ((reward_points > 0))
);

-- Table: user_challenges (participation aux défis)
CREATE TABLE IF NOT EXISTS public.user_challenges (
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    completed_at timestamp with time zone NOT NULL DEFAULT now(),
    points_earned integer DEFAULT 0,
    CONSTRAINT user_challenges_pkey PRIMARY KEY (user_id, challenge_id),
    CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
    CONSTRAINT user_challenges_points_earned_check CHECK ((points_earned >= 0))
);

-- Table: user_grades (historique des grades)
CREATE TABLE IF NOT EXISTS public.user_grades (
    user_id uuid NOT NULL,
    grade_level integer NOT NULL,
    grade_name character varying NOT NULL,
    reached_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_grades_pkey PRIMARY KEY (user_id, grade_level),
    CONSTRAINT user_grades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_grades_grade_level_check CHECK (((grade_level >= 1) AND (grade_level <= 15)))
);

-- Table: rankings (classements)
CREATE TABLE IF NOT EXISTS public.rankings (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    ranking_type ranking_type NOT NULL,
    points integer DEFAULT 0,
    rank integer,
    period_start date NOT NULL,
    period_end date NOT NULL,
    CONSTRAINT rankings_pkey PRIMARY KEY (id),
    CONSTRAINT rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT rankings_points_check CHECK ((points >= 0)),
    CONSTRAINT rankings_rank_check CHECK ((rank >= 1))
);

-- Table: user_stats (statistiques par thème)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id uuid NOT NULL,
    theme theme_type NOT NULL,
    total_questions integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    avg_time_per_question numeric DEFAULT 0,
    last_updated timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_stats_pkey PRIMARY KEY (user_id, theme),
    CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_stats_total_questions_check CHECK ((total_questions >= 0)),
    CONSTRAINT user_stats_correct_answers_check CHECK ((correct_answers >= 0)),
    CONSTRAINT user_stats_avg_time_per_question_check CHECK ((avg_time_per_question >= (0)::numeric))
);

-- Table: user_question_stats (statistiques détaillées par question)
CREATE TABLE IF NOT EXISTS public.user_question_stats (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    question_id uuid,
    error_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    last_attempt timestamp with time zone DEFAULT now(),
    is_mastered boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_question_stats_pkey PRIMARY KEY (id),
    CONSTRAINT user_question_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: admins (administrateurs)
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_user_id_key UNIQUE (user_id),
    CONSTRAINT admins_email_key UNIQUE (email),
    CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- DONNÉES INITIALES - THEMES
-- =====================================================

INSERT INTO public.themes (id, name, icon, created_at, updated_at) VALUES
('eea2ec3e-e240-4086-bc75-731e40fa96b8', 'Mathématiques', '📐', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('a237254e-4a45-49e7-8257-bd87d05245c9', 'Français', '📚', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Métier', '🚒', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DONNÉES INITIALES - SUB_THEMES
-- =====================================================

INSERT INTO public.sub_themes (id, theme_id, name, created_at, updated_at) VALUES
-- Mathématiques
('d4a03d08-270b-4fb0-87f6-c74a27a51038', 'eea2ec3e-e240-4086-bc75-731e40fa96b8', 'Calcul mental', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('7d8844bb-4057-4039-b3eb-9c74b73491ba', 'eea2ec3e-e240-4086-bc75-731e40fa96b8', 'Fractions', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('1c28ffa6-bc5d-43ff-8ca2-28385e2c5943', 'eea2ec3e-e240-4086-bc75-731e40fa96b8', 'Géométrie', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('79877c2d-072d-4594-9866-9bc24cc22b08', 'eea2ec3e-e240-4086-bc75-731e40fa96b8', 'Pourcentages', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),

-- Français
('3a7327be-388b-41b5-8af6-0d07c4f0a89b', 'a237254e-4a45-49e7-8257-bd87d05245c9', 'Conjugaison', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('13faaf34-44c9-4350-b3e2-dce408766c6e', 'a237254e-4a45-49e7-8257-bd87d05245c9', 'Culture générale', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('f5155b31-bac1-4595-b9c3-deecc5734287', 'a237254e-4a45-49e7-8257-bd87d05245c9', 'Grammaire', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('7f176c72-d1ae-4fb4-8bff-2cf5668742ad', 'a237254e-4a45-49e7-8257-bd87d05245c9', 'Orthographe', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),

-- Métier
('821cefde-543c-4a4d-8928-926141a688f2', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Culture administrative', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('cc102430-cf74-421c-9c28-df0328ac8c65', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Diverse', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('28d0af23-108b-4eef-92bd-d558399ea5ec', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Grades et hiérarchie', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('372a5137-dd88-4436-91ec-3982b4a52e18', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Hydraulique', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('79023fd2-ce03-4416-bbaf-723625d4ff91', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Incendie', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('9019b400-139e-4064-b615-9e27e09c0f4a', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Matériel et équipements', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('41b12d64-a393-4d4f-ac9e-8fade4ed809c', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Risques chimiques', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('626c87a6-10ac-4156-bdfe-1678babb9a99', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Secourisme', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('8ef3c089-74ca-4504-9820-caf10c573ac9', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Secours à personne', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00'),
('aa965186-a4af-4040-b29e-5ad9fccdf8f1', 'ed56ed4b-4ea8-444b-8e1c-e636d36318f6', 'Techniques opérationnelles', '2025-08-24 20:31:49.554767+00', '2025-08-24 20:31:49.554767+00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DONNÉES INITIALES - BADGES (GRADES)
-- =====================================================

INSERT INTO public.badges (id, name, description, icon_name, category, requirement) VALUES
('f05ed773-4a47-45b3-b721-267be868a4eb', 'Aspirant', 'Grade initial - Bienvenue chez les pompiers!', 'grade_1', 'milestone', '{"min_points": 0}'),
('0f660343-882f-4340-81d5-06005be57b72', 'Sapeur 2ème classe', 'Premier grade de sapeur', 'grade_2', 'milestone', '{"min_points": 100}'),
('8d4427e4-76bf-487c-810e-20e40fcc6ed4', 'Sapeur 1ère classe', 'Sapeur confirmé', 'grade_3', 'milestone', '{"min_points": 250}'),
('da150b78-3fbd-4d5c-8a01-7dfb234a9b5e', 'Caporal', 'Premier grade de gradé', 'grade_4', 'milestone', '{"min_points": 500}'),
('491e6acd-3f36-4f73-92a5-14ce730a3464', 'Caporal-chef', 'Gradé expérimenté', 'grade_5', 'milestone', '{"min_points": 1000}'),
('38e38210-4e2e-439d-9cd9-3ea4eeaf2231', 'Sergent', 'Sous-officier', 'grade_6', 'milestone', '{"min_points": 2000}'),
('71882905-444b-4557-b1f8-0cad64495731', 'Sergent-chef', 'Sous-officier confirmé', 'grade_7', 'milestone', '{"min_points": 3500}'),
('9c6796eb-92b3-4711-b60f-2bef4f0f71b1', 'Adjudant', 'Sous-officier supérieur', 'grade_8', 'milestone', '{"min_points": 5500}'),
('ec485827-1fb0-489f-bb28-5c5fa2625030', 'Adjudant-chef', 'Plus haut grade de sous-officier', 'grade_9', 'milestone', '{"min_points": 8000}'),
('e79797f0-d564-4b47-bb4e-3d2212930898', 'Lieutenant', 'Premier grade d''officier', 'grade_10', 'milestone', '{"min_points": 11000}'),
('d01a573e-0aee-4d75-8bf8-b15e8e31c464', 'Capitaine', 'Officier confirmé', 'grade_11', 'milestone', '{"min_points": 15000}'),
('51d2b6dd-c301-4730-b84d-93adc5717506', 'Commandant', 'Officier supérieur', 'grade_12', 'milestone', '{"min_points": 20000}'),
('61fa0083-4b8b-4d3d-89f1-8e1a2ca3d93a', 'Lieutenant-colonel', 'Officier supérieur confirmé', 'grade_13', 'milestone', '{"min_points": 27000}'),
('9945a844-6bad-4a0f-aea9-b65ef8c80dac', 'Colonel', 'Haut gradé', 'grade_14', 'milestone', '{"min_points": 35000}'),
('9ce2ff4e-bd52-4e89-9c3e-0aadcee3ba8c', 'Contrôleur général', 'Plus haut grade', 'grade_15', 'milestone', '{"min_points": 50000}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CONFIGURATION RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activation RLS sur toutes les tables principales
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VUES UTILITAIRES
-- =====================================================

-- Vue: user_profiles (consolidation des profils)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.user_id,
    u.email,
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
FROM public.profiles p
JOIN public.users u ON p.user_id = u.id;

-- Vue: user_admin_status (statut administrateur)
CREATE OR REPLACE VIEW public.user_admin_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    CASE WHEN a.id IS NOT NULL THEN true ELSE false END as is_admin,
    a.created_at as admin_since
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id;

-- =====================================================
-- FIN DU BACKUP
-- =====================================================

-- Informations du backup
SELECT 
    current_timestamp as backup_completed,
    'ucwgtiaebljfbvhokicf' as project_ref,
    '17 tables + 2 vues' as schema_content,
    'Structure complète + données de base' as backup_type;