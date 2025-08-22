-- Migration: Création des tables pour le système de quiz
-- Date: 2025-08-22
-- Description: Tables pour questions, sessions, réponses, défis quotidiens, classements et succès

-- =====================================================
-- 1. TABLE DES QUESTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme VARCHAR(50) NOT NULL,
  sub_theme VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  image_url TEXT,
  type VARCHAR(20) DEFAULT 'single' CHECK (type IN ('single', 'multiple')),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 1,
  explanation TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE questions IS 'Table des questions du quiz';
COMMENT ON COLUMN questions.theme IS 'Thème principal: math, french, profession';
COMMENT ON COLUMN questions.sub_theme IS 'Sous-thème: geometry, grammar, operations, etc.';
COMMENT ON COLUMN questions.type IS 'Type de question: single (QCU) ou multiple (QCM)';
COMMENT ON COLUMN questions.answers IS 'Format JSON: [{id, text, isCorrect}]';

-- =====================================================
-- 2. TABLE DES SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  score DECIMAL(5,2),
  points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'Sessions de quiz des utilisateurs';
COMMENT ON COLUMN sessions.config IS 'Configuration de la session: thèmes, timer, barème, etc.';

-- =====================================================
-- 3. TABLE DES RÉPONSES DE SESSION
-- =====================================================
CREATE TABLE IF NOT EXISTS session_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answers JSONB,
  time_spent DECIMAL(10,2),
  is_correct BOOLEAN DEFAULT FALSE,
  is_partial BOOLEAN DEFAULT FALSE,
  is_skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE session_answers IS 'Réponses données pendant une session';

-- =====================================================
-- 4. TABLE DES DÉFIS QUOTIDIENS
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE UNIQUE,
  question_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daily_challenges IS 'Questions du défi quotidien';

-- =====================================================
-- 5. TABLE DES COMPLÉTIONS DE DÉFIS
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE DEFAULT CURRENT_DATE,
  session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

COMMENT ON TABLE daily_challenge_completions IS 'Défis quotidiens complétés par utilisateur';

-- =====================================================
-- 6. TABLE DES CLASSEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_date DATE,
  score DECIMAL(10,2) DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_time DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_date)
);

COMMENT ON TABLE leaderboard IS 'Classements par période';

-- =====================================================
-- 7. TABLE DES SUCCÈS (ACHIEVEMENTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE achievements IS 'Liste des succès disponibles';

-- =====================================================
-- 8. TABLE DES SUCCÈS UTILISATEUR
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

COMMENT ON TABLE user_achievements IS 'Succès débloqués par utilisateur';

-- =====================================================
-- 9. MISE À JOUR DE LA TABLE PROFILES
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_grade INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0;

-- =====================================================
-- 10. CRÉATION DES INDEX
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_questions_theme ON questions(theme);
CREATE INDEX IF NOT EXISTS idx_questions_sub_theme ON questions(sub_theme);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);

-- =====================================================
-- 11. TRIGGER POUR MISE À JOUR AUTOMATIQUE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 12. INSERTION DES SUCCÈS DE BASE
-- =====================================================
INSERT INTO achievements (code, name, description, icon, points_reward) VALUES
  ('first_perfect_score', 'Première Perfection', 'Obtenir 100% à un quiz', '💯', 50),
  ('week_streak', 'Semaine de Feu', 'Maintenir un streak de 7 jours', '🔥', 25),
  ('month_streak', 'Mois Légendaire', 'Maintenir un streak de 30 jours', '🌟', 100),
  ('speed_demon', 'Démon de Vitesse', 'Répondre à toutes les questions en moins de 3 secondes', '⚡', 30),
  ('marathon_runner', 'Marathonien', 'Compléter 100 questions d''affilée', '🏃', 40),
  ('math_master', 'Maître des Maths', '100% de réussite en Mathématiques', '📐', 60),
  ('french_expert', 'Expert en Français', '100% de réussite en Français', '📚', 60),
  ('profession_guru', 'Guru du Métier', '100% de réussite en Métier', '🚒', 60),
  ('all_themes_unlocked', 'Polyvalent', 'Réussir tous les thèmes', '🎯', 75),
  ('daily_champion', 'Champion du Jour', 'Meilleur score du défi quotidien', '🏆', 35),
  ('beginner', 'Débutant', 'Compléter votre première session', '🎓', 10),
  ('regular', 'Régulier', 'Compléter 10 sessions', '⭐', 20),
  ('expert', 'Expert', 'Compléter 50 sessions', '💎', 50),
  ('legend', 'Légende', 'Compléter 100 sessions', '👑', 100)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 13. INSERTION DE QUESTIONS D'EXEMPLE
-- =====================================================
INSERT INTO questions (theme, sub_theme, question, type, difficulty, points, answers, explanation) VALUES
  -- Mathématiques
  ('math', 'geometry', 'Quelle est la formule pour calculer l''aire d''un cercle ?', 'single', 'easy', 1,
   '[{"id": "a", "text": "πr²", "isCorrect": true},
     {"id": "b", "text": "2πr", "isCorrect": false},
     {"id": "c", "text": "πd", "isCorrect": false},
     {"id": "d", "text": "r²/π", "isCorrect": false}]',
   'L''aire d''un cercle se calcule avec la formule A = πr² où r est le rayon.'),
   
  ('math', 'percentage', 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?', 'single', 'easy', 1,
   '[{"id": "a", "text": "60€", "isCorrect": true},
     {"id": "b", "text": "55€", "isCorrect": false},
     {"id": "c", "text": "65€", "isCorrect": false},
     {"id": "d", "text": "70€", "isCorrect": false}]',
   '80€ × 0.75 = 60€ (ou 80€ - 20€ = 60€)'),

  -- Français
  ('french', 'grammar', 'Quel est le participe passé du verbe "acquérir" ?', 'single', 'medium', 1,
   '[{"id": "a", "text": "Acquis", "isCorrect": true},
     {"id": "b", "text": "Acquéri", "isCorrect": false},
     {"id": "c", "text": "Acquiert", "isCorrect": false},
     {"id": "d", "text": "Acqueru", "isCorrect": false}]',
   'Le participe passé du verbe "acquérir" est "acquis".'),

  -- Métier
  ('profession', 'operations', 'Quels sont les éléments essentiels d''une reconnaissance opérationnelle ?', 'multiple', 'medium', 2,
   '[{"id": "a", "text": "Évaluation des risques", "isCorrect": true},
     {"id": "b", "text": "Identification des victimes", "isCorrect": true},
     {"id": "c", "text": "Mise en place du périmètre", "isCorrect": true},
     {"id": "d", "text": "Rédaction du rapport", "isCorrect": false}]',
   'La reconnaissance opérationnelle comprend l''évaluation des risques, l''identification des victimes et la mise en place du périmètre de sécurité.'),

  ('profession', 'first-aid', 'Quelle est la fréquence des compressions thoraciques lors d''un massage cardiaque ?', 'single', 'easy', 1,
   '[{"id": "a", "text": "100 à 120 par minute", "isCorrect": true},
     {"id": "b", "text": "60 à 80 par minute", "isCorrect": false},
     {"id": "c", "text": "140 à 160 par minute", "isCorrect": false},
     {"id": "d", "text": "80 à 100 par minute", "isCorrect": false}]',
   'Les compressions thoraciques doivent être effectuées à une fréquence de 100 à 120 par minute.');

-- =====================================================
-- 14. RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies pour questions (lecture publique)
CREATE POLICY "Questions visibles par tous" ON questions
  FOR SELECT USING (true);

-- Policies pour sessions (utilisateur peut voir/créer ses propres sessions)
CREATE POLICY "Utilisateur peut voir ses sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Utilisateur peut créer ses sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Utilisateur peut modifier ses sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies pour session_answers
CREATE POLICY "Utilisateur peut voir ses réponses" ON session_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_answers.session_id 
      AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Utilisateur peut créer ses réponses" ON session_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_answers.session_id 
      AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
    )
  );

-- Policies pour daily_challenges (lecture publique)
CREATE POLICY "Défis quotidiens visibles par tous" ON daily_challenges
  FOR SELECT USING (true);

-- Policies pour daily_challenge_completions
CREATE POLICY "Utilisateur peut voir ses complétions" ON daily_challenge_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut créer ses complétions" ON daily_challenge_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour leaderboard (lecture publique)
CREATE POLICY "Classements visibles par tous" ON leaderboard
  FOR SELECT USING (true);

-- Policies pour achievements (lecture publique)
CREATE POLICY "Succès visibles par tous" ON achievements
  FOR SELECT USING (true);

-- Policies pour user_achievements
CREATE POLICY "Utilisateur peut voir ses succès" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut débloquer des succès" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);