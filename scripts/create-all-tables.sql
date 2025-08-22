-- ========================================
-- SCRIPT COMPLET DE CRÉATION DES TABLES SUPABASE
-- Exécutez ce script AVANT execute-all-migrations.sql
-- ========================================

-- ========================================
-- PARTIE 1: TABLES DE BASE
-- ========================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity DATE,
  streak_updated_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des thèmes
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type VARCHAR(10) CHECK (question_type IN ('QCU', 'QCM')),
  theme_name VARCHAR(50),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions de quiz
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  time_spent INTEGER, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des réponses utilisateur
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des badges utilisateur
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Table des classements
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) CHECK (period_type IN ('global', 'weekly', 'monthly')),
  period_start DATE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- Table des défis quotidiens
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- ========================================
-- PARTIE 2: INDEX
-- ========================================

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_questions_theme ON questions(theme_name);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created ON quiz_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_answers_session ON user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_period ON rankings(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user ON daily_challenges(user_id, challenge_date);

-- ========================================
-- PARTIE 3: ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTIE 4: POLICIES RLS
-- ========================================

-- Policies pour user_profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour questions (lecture seule pour tous)
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
CREATE POLICY "Questions are viewable by authenticated users"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour quiz_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON quiz_sessions;
CREATE POLICY "Users can view own sessions"
  ON quiz_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own sessions" ON quiz_sessions;
CREATE POLICY "Users can create own sessions"
  ON quiz_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON quiz_sessions;
CREATE POLICY "Users can update own sessions"
  ON quiz_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour user_answers
DROP POLICY IF EXISTS "Users can view own answers" ON user_answers;
CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = user_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own answers" ON user_answers;
CREATE POLICY "Users can create own answers"
  ON user_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = user_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- Policies pour badges
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour user_badges
DROP POLICY IF EXISTS "Users can view all user badges" ON user_badges;
CREATE POLICY "Users can view all user badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies pour rankings
DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON rankings;
CREATE POLICY "Rankings are viewable by everyone"
  ON rankings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own rankings" ON rankings;
CREATE POLICY "Users can insert own rankings"
  ON rankings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own rankings" ON rankings;
CREATE POLICY "Users can update own rankings"
  ON rankings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour daily_challenges
DROP POLICY IF EXISTS "Users can view own challenges" ON daily_challenges;
CREATE POLICY "Users can view own challenges"
  ON daily_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own challenges" ON daily_challenges;
CREATE POLICY "Users can create own challenges"
  ON daily_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON daily_challenges;
CREATE POLICY "Users can update own challenges"
  ON daily_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour themes
DROP POLICY IF EXISTS "Themes are viewable by everyone" ON themes;
CREATE POLICY "Themes are viewable by everyone"
  ON themes FOR SELECT
  TO authenticated
  USING (true);

-- ========================================
-- PARTIE 5: FONCTIONS UTILITAIRES
-- ========================================

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil à l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Fonction pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rankings_updated_at ON rankings;
CREATE TRIGGER update_rankings_updated_at
  BEFORE UPDATE ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PARTIE 6: DONNÉES INITIALES
-- ========================================

-- Insérer les thèmes de base
INSERT INTO themes (name, description, color, icon) VALUES
  ('Incendie', 'Questions sur la lutte contre les incendies', '#EF4444', '🔥'),
  ('Secourisme', 'Questions sur les premiers secours', '#10B981', '🚑'),
  ('Diverse', 'Questions diverses sur le métier de pompier', '#3B82F6', '📚')
ON CONFLICT (name) DO NOTHING;

-- Insérer les badges de base
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, category) VALUES
  ('Première Flamme', 'Complétez votre première session', '🔥', 'sessions', 1, 'Progression'),
  ('Apprenti Pompier', 'Atteignez 100 points', '👨‍🚒', 'points', 100, 'Points'),
  ('Sapeur Confirmé', 'Atteignez 500 points', '🚒', 'points', 500, 'Points'),
  ('Héros du Feu', 'Atteignez 1000 points', '🦸', 'points', 1000, 'Points'),
  ('Perfectionniste', 'Obtenez 100% sur une session', '💯', 'perfect', 1, 'Performance'),
  ('Régulier', 'Connectez-vous 7 jours de suite', '📅', 'streak', 7, 'Engagement'),
  ('Marathonien', 'Connectez-vous 30 jours de suite', '🏃', 'streak', 30, 'Engagement'),
  ('Expert Incendie', 'Répondez correctement à 50 questions Incendie', '🔥', 'theme_incendie', 50, 'Expertise'),
  ('Expert Secourisme', 'Répondez correctement à 50 questions Secourisme', '🚑', 'theme_secourisme', 50, 'Expertise'),
  ('Polyvalent', 'Maîtrisez les 3 thèmes', '🎯', 'all_themes', 3, 'Expertise')
ON CONFLICT DO NOTHING;

-- ========================================
-- MESSAGE DE CONFIRMATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Tables créées avec succès !';
  RAISE NOTICE 'Maintenant, exécutez execute-all-migrations.sql pour ajouter les fonctionnalités avancées.';
END $$;