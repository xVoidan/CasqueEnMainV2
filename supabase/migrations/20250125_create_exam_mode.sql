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
    is_practice_mode BOOLEAN DEFAULT false, -- Mode blanc non comptabilisé
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table des problèmes d'examen
CREATE TABLE IF NOT EXISTS exam_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    context TEXT, -- Énoncé commun du problème
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
    explanation TEXT, -- Explication de la réponse correcte
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
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned, timeout
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    app_blur_count INTEGER DEFAULT 0, -- Nombre de fois où l'app a perdu le focus
    
    -- Anti-triche
    integrity_score INTEGER DEFAULT 100, -- Score d'intégrité (baisse si comportement suspect)
    warnings TEXT[], -- Avertissements détectés
    
    CONSTRAINT unique_active_session UNIQUE(user_id, exam_id, status)
);

-- Table des réponses données par l'utilisateur
CREATE TABLE IF NOT EXISTS exam_user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id),
    selected_option_id UUID REFERENCES exam_question_options(id),
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER, -- Temps passé sur cette question
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
    percentile DECIMAL(5,2), -- Position en percentile
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, user_id, session_id)
);

-- Table des certificats générés
CREATE TABLE IF NOT EXISTS exam_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    certificate_number VARCHAR(100) UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    metadata JSONB
);

-- Index pour les performances
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_rankings_exam_id ON exam_rankings(exam_id);
CREATE INDEX idx_exam_rankings_score ON exam_rankings(score DESC);
CREATE INDEX idx_exam_user_answers_session_id ON exam_user_answers(session_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_certificates ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs
CREATE POLICY "Users can view active exams" ON exams
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view exam problems" ON exam_problems
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exams WHERE exams.id = exam_problems.exam_id AND exams.is_active = true
    ));

CREATE POLICY "Users can view exam questions" ON exam_questions
    FOR SELECT USING (true);

CREATE POLICY "Users can view exam options" ON exam_question_options
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own sessions" ON exam_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON exam_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON exam_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers" ON exam_user_answers
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exam_sessions WHERE exam_sessions.id = exam_user_answers.session_id AND exam_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own answers" ON exam_user_answers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exam_sessions WHERE exam_sessions.id = exam_user_answers.session_id AND exam_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can view rankings" ON exam_rankings
    FOR SELECT USING (true);

CREATE POLICY "Users can view their certificates" ON exam_certificates
    FOR SELECT USING (auth.uid() = user_id);