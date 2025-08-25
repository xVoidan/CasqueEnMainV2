-- ========================================
-- MODE EXAMEN - MIGRATION SÉCURISÉE
-- ========================================
-- Version qui vérifie l'existence des objets avant création
-- Date: 25 janvier 2025
-- Version: 1.0.1

-- ========================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (SI NÉCESSAIRE)
-- ========================================

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view active exams" ON exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
DROP POLICY IF EXISTS "Users can view exam problems" ON exam_problems;
DROP POLICY IF EXISTS "Admins can manage problems" ON exam_problems;
DROP POLICY IF EXISTS "Users can view exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can view exam options" ON exam_question_options;
DROP POLICY IF EXISTS "Admins can manage options" ON exam_question_options;
DROP POLICY IF EXISTS "Users can view their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can view their own answers" ON exam_user_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON exam_user_answers;
DROP POLICY IF EXISTS "Users can view rankings" ON exam_rankings;
DROP POLICY IF EXISTS "System can manage rankings" ON exam_rankings;
DROP POLICY IF EXISTS "Users can view their certificates" ON exam_certificates;

-- ========================================
-- 2. CRÉATION DES TABLES (SI ELLES N'EXISTENT PAS)
-- ========================================

-- Table des annales d'examen
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    exam_date DATE,
    duration_minutes INTEGER DEFAULT 60,
    max_questions INTEGER DEFAULT 20,
    passing_score DECIMAL(5,2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT true,
    is_practice_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table des problèmes d'examen
CREATE TABLE IF NOT EXISTS exam_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    context TEXT,
    order_index INTEGER NOT NULL,
    points DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, order_index)
);

-- Table des questions d'examen
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES exam_problems(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    points DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(problem_id, order_index)
);

-- Table des réponses possibles
CREATE TABLE IF NOT EXISTS exam_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, order_index)
);

-- Table des sessions d'examen
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    exam_id UUID NOT NULL REFERENCES exams(id),
    status VARCHAR(50) DEFAULT 'in_progress',
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    app_blur_count INTEGER DEFAULT 0,
    integrity_score INTEGER DEFAULT 100,
    warnings TEXT[]
);

-- Table des réponses utilisateur
CREATE TABLE IF NOT EXISTS exam_user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id),
    selected_option_id UUID REFERENCES exam_question_options(id),
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER,
    UNIQUE(session_id, question_id)
);

-- Table des classements
CREATE TABLE IF NOT EXISTS exam_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_id UUID NOT NULL REFERENCES exam_sessions(id),
    rank INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    percentile DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, user_id, session_id)
);

-- Table des certificats
CREATE TABLE IF NOT EXISTS exam_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    certificate_number VARCHAR(100) UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    metadata JSONB
);

-- ========================================
-- 3. CRÉATION DES INDEX (SI ILS N'EXISTENT PAS)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_rankings_exam_id ON exam_rankings(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_rankings_score ON exam_rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_exam_user_answers_session_id ON exam_user_answers(session_id);

-- ========================================
-- 4. FONCTION ET TRIGGER POUR updated_at
-- ========================================

-- Créer ou remplacer la fonction
CREATE OR REPLACE FUNCTION update_exam_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger (après suppression au début)
CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams
    FOR EACH ROW 
    EXECUTE FUNCTION update_exam_updated_at_column();

-- ========================================
-- 5. ACTIVATION ROW LEVEL SECURITY
-- ========================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_certificates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. CRÉATION DES NOUVELLES POLICIES
-- ========================================

-- Policies pour les examens
CREATE POLICY "Users can view active exams" ON exams
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage exams" ON exams
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Policies pour les problèmes
CREATE POLICY "Users can view exam problems" ON exam_problems
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exams WHERE exams.id = exam_problems.exam_id AND exams.is_active = true
    ));

CREATE POLICY "Admins can manage problems" ON exam_problems
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Policies pour les questions
CREATE POLICY "Users can view exam questions" ON exam_questions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON exam_questions
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Policies pour les options
CREATE POLICY "Users can view exam options" ON exam_question_options
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage options" ON exam_question_options
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Policies pour les sessions
CREATE POLICY "Users can view their own sessions" ON exam_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON exam_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON exam_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour les réponses
CREATE POLICY "Users can view their own answers" ON exam_user_answers
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exam_sessions 
        WHERE exam_sessions.id = exam_user_answers.session_id 
        AND exam_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own answers" ON exam_user_answers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exam_sessions 
        WHERE exam_sessions.id = exam_user_answers.session_id 
        AND exam_sessions.user_id = auth.uid()
    ));

-- Policies pour les classements
CREATE POLICY "Users can view rankings" ON exam_rankings
    FOR SELECT USING (true);

CREATE POLICY "System can manage rankings" ON exam_rankings
    FOR ALL USING (true);

-- Policies pour les certificats
CREATE POLICY "Users can view their certificates" ON exam_certificates
    FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 7. INSERTION DES DONNÉES D'EXEMPLE
-- ========================================

-- Vérifier si les données existent déjà
DO $$
BEGIN
    -- Insérer seulement si l'examen n'existe pas
    IF NOT EXISTS (SELECT 1 FROM exams WHERE id = '11111111-1111-1111-1111-111111111111') THEN
        
        -- Insertion des examens
        INSERT INTO exams (id, title, description, year, exam_date, duration_minutes, max_questions, passing_score, is_active, is_practice_mode)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', 
           'Concours Officiel - Conditions Réelles', 
           'Mettez-vous en conditions réelles du concours',
           2025, 
           '2025-03-15', 
           60, 
           20, 
           10.0, 
           true, 
           false);
           
        -- Problème 1 : Mathématiques
        INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
        VALUES 
          ('33333333-3333-3333-3333-333333333333',
           '11111111-1111-1111-1111-111111111111',
           'Calculs de débit',
           'Une motopompe débite 1500 litres par minute. Elle alimente une lance qui consomme 500 litres par minute et remplit simultanément une citerne.',
           1,
           4.0);

        -- Questions du problème 1
        INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
        VALUES 
          ('44444444-4444-4444-4444-444444444444',
           '33333333-3333-3333-3333-333333333333',
           'Quel est le débit disponible pour remplir la citerne ?',
           'Le débit disponible est la différence entre le débit de la motopompe et la consommation de la lance : 1500 - 500 = 1000 L/min',
           1,
           1.0),
          ('55555555-5555-5555-5555-555555555555',
           '33333333-3333-3333-3333-333333333333',
           'Combien de temps faut-il pour remplir une citerne de 10 000 litres ?',
           'Temps = Volume / Débit = 10 000 / 1000 = 10 minutes',
           2,
           1.0);

        -- Options pour les questions
        INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
        VALUES 
          ('44444444-4444-4444-4444-444444444444', '500 L/min', false, 1),
          ('44444444-4444-4444-4444-444444444444', '1000 L/min', true, 2),
          ('44444444-4444-4444-4444-444444444444', '1500 L/min', false, 3),
          ('44444444-4444-4444-4444-444444444444', '2000 L/min', false, 4),
          ('55555555-5555-5555-5555-555555555555', '5 minutes', false, 1),
          ('55555555-5555-5555-5555-555555555555', '10 minutes', true, 2),
          ('55555555-5555-5555-5555-555555555555', '15 minutes', false, 3),
          ('55555555-5555-5555-5555-555555555555', '20 minutes', false, 4);

        -- Problème 2 : Français
        INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
        VALUES 
          ('66666666-6666-6666-6666-666666666666',
           '11111111-1111-1111-1111-111111111111',
           'Compréhension de texte',
           'Le sapeur-pompier doit posséder des qualités physiques et morales exceptionnelles. Il doit faire preuve de courage, de dévouement et d''altruisme dans l''exercice de ses missions.',
           2,
           3.0);

        -- Question du problème 2
        INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
        VALUES 
          ('77777777-7777-7777-7777-777777777777',
           '66666666-6666-6666-6666-666666666666',
           'Quelle qualité n''est PAS mentionnée dans le texte ?',
           'La patience n''est pas mentionnée dans le texte, contrairement au courage, au dévouement et à l''altruisme.',
           1,
           1.0);

        -- Options pour la question du problème 2
        INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
        VALUES 
          ('77777777-7777-7777-7777-777777777777', 'Le courage', false, 1),
          ('77777777-7777-7777-7777-777777777777', 'La patience', true, 2),
          ('77777777-7777-7777-7777-777777777777', 'Le dévouement', false, 3),
          ('77777777-7777-7777-7777-777777777777', 'L''altruisme', false, 4);

        -- Problème 3 : Connaissances métier
        INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
        VALUES 
          ('88888888-8888-8888-8888-888888888888',
           '11111111-1111-1111-1111-111111111111',
           'Grades et hiérarchie',
           'La hiérarchie des sapeurs-pompiers professionnels est organisée en différents grades et échelons.',
           3,
           2.0);

        -- Question du problème 3
        INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
        VALUES 
          ('99999999-9999-9999-9999-999999999999',
           '88888888-8888-8888-8888-888888888888',
           'Quel est le premier grade d''officier chez les sapeurs-pompiers professionnels ?',
           'Le lieutenant est le premier grade d''officier dans la hiérarchie des sapeurs-pompiers professionnels.',
           1,
           1.0);

        -- Options pour la question du problème 3
        INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
        VALUES 
          ('99999999-9999-9999-9999-999999999999', 'Sergent', false, 1),
          ('99999999-9999-9999-9999-999999999999', 'Adjudant', false, 2),
          ('99999999-9999-9999-9999-999999999999', 'Lieutenant', true, 3),
          ('99999999-9999-9999-9999-999999999999', 'Capitaine', false, 4);
    END IF;

    -- Insérer le deuxième examen s'il n'existe pas
    IF NOT EXISTS (SELECT 1 FROM exams WHERE id = '22222222-2222-2222-2222-222222222222') THEN
        INSERT INTO exams (id, title, description, year, exam_date, duration_minutes, max_questions, passing_score, is_active, is_practice_mode)
        VALUES 
          ('22222222-2222-2222-2222-222222222222', 
           'Examen Blanc - Mode Entraînement', 
           'Examen d''entraînement non comptabilisé dans le classement officiel',
           2025, 
           '2025-01-10', 
           60, 
           20, 
           10.0, 
           true, 
           true);
    END IF;
END $$;

-- ========================================
-- 8. VÉRIFICATION FINALE
-- ========================================

-- Afficher les tables créées
SELECT 'Tables du mode examen créées avec succès:' as status;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'exam%'
ORDER BY table_name;

-- Compter les données insérées
SELECT 'Données insérées:' as status;
SELECT 
    (SELECT COUNT(*) FROM exams) as nb_examens,
    (SELECT COUNT(*) FROM exam_problems) as nb_problemes,
    (SELECT COUNT(*) FROM exam_questions) as nb_questions,
    (SELECT COUNT(*) FROM exam_question_options) as nb_options;

-- ========================================
-- FIN DE LA MIGRATION SÉCURISÉE
-- ========================================