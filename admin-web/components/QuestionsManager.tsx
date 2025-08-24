import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Question {
  id: string
  sub_theme_id: string
  question: string
  correct_answer: string
  wrong_answer_1: string
  wrong_answer_2: string
  wrong_answer_3: string
  explanation: string | null
  created_at: string
}

interface SubTheme {
  id: string
  theme_id: string
  name: string
}

interface Theme {
  id: string
  name: string
  icon: string
}

export default function QuestionsManager({ onUpdate }: { onUpdate: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedSubTheme, setSelectedSubTheme] = useState<string>('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    sub_theme_id: '',
    question: '',
    correct_answer: '',
    wrong_answer_1: '',
    wrong_answer_2: '',
    wrong_answer_3: '',
    explanation: '',
  });

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      loadSubThemes(selectedTheme);
    }
  }, [selectedTheme]);

  useEffect(() => {
    if (selectedSubTheme) {
      loadQuestions(selectedSubTheme);
    }
  }, [selectedSubTheme]);

  const loadThemes = async () => {
    const { data } = await supabase
      .from('themes')
      .select('*')
      .order('name');

    if (data) {
      setThemes(data);
      if (data.length > 0) {
        setSelectedTheme(data[0].id);
      }
    }
  };

  const loadSubThemes = async (themeId: string) => {
    const { data } = await supabase
      .from('sub_themes')
      .select('*')
      .eq('theme_id', themeId)
      .order('name');

    if (data) {
      setSubThemes(data);
      if (data.length > 0) {
        setSelectedSubTheme(data[0].id);
      }
    }
  };

  const loadQuestions = async (subThemeId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('sub_theme_id', subThemeId)
      .order('created_at', { ascending: false });

    if (data) {
      setQuestions(data);
    }
  };

  const saveQuestion = async () => {
    const questionData = {
      ...newQuestion,
      sub_theme_id: selectedSubTheme,
      explanation: newQuestion.explanation || null,
    };

    if (editingQuestion) {
      const { error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', editingQuestion.id);

      if (!error) {
        setEditingQuestion(null);
        resetForm();
        loadQuestions(selectedSubTheme);
        onUpdate();
      }
    } else {
      const { error } = await supabase
        .from('questions')
        .insert([questionData]);

      if (!error) {
        resetForm();
        loadQuestions(selectedSubTheme);
        onUpdate();
      }
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (!error) {
      loadQuestions(selectedSubTheme);
      onUpdate();
    }
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      sub_theme_id: question.sub_theme_id,
      question: question.question,
      correct_answer: question.correct_answer,
      wrong_answer_1: question.wrong_answer_1,
      wrong_answer_2: question.wrong_answer_2,
      wrong_answer_3: question.wrong_answer_3,
      explanation: question.explanation || '',
    });
    setShowAddQuestion(true);
  };

  const resetForm = () => {
    setNewQuestion({
      sub_theme_id: '',
      question: '',
      correct_answer: '',
      wrong_answer_1: '',
      wrong_answer_2: '',
      wrong_answer_3: '',
      explanation: '',
    });
    setShowAddQuestion(false);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select
            className="select"
            value={selectedTheme}
            onChange={e => setSelectedTheme(e.target.value)}
          >
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.icon} {theme.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={selectedSubTheme}
            onChange={e => setSelectedSubTheme(e.target.value)}
          >
            {subThemes.map(subTheme => (
              <option key={subTheme.id} value={subTheme.id}>
                {subTheme.name}
              </option>
            ))}
          </select>

          <button
            className="btn"
            onClick={() => {
              setEditingQuestion(null);
              resetForm();
              setShowAddQuestion(true);
            }}
          >
            + Nouvelle Question
          </button>
        </div>

        <div style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          {questions.length} question(s) dans ce sous-thème
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {questions.map((question, index) => (
            <div key={question.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Q{index + 1}:</strong> {question.question}
              </div>
              <div style={{ marginBottom: '0.5rem', color: '#10b981' }}>
                ✓ {question.correct_answer}
              </div>
              <div style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                ✗ {question.wrong_answer_1}
              </div>
              <div style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                ✗ {question.wrong_answer_2}
              </div>
              <div style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                ✗ {question.wrong_answer_3}
              </div>
              {question.explanation && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                  💡 {question.explanation}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => editQuestion(question)}
                >
                  Modifier
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => deleteQuestion(question.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddQuestion && (
        <div className="modal" onClick={() => setShowAddQuestion(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingQuestion ? 'Modifier' : 'Nouvelle'} Question</h2>

            <textarea
              className="input"
              placeholder="Question"
              rows={3}
              value={newQuestion.question}
              onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
            />

            <input
              type="text"
              className="input"
              placeholder="Réponse correcte"
              style={{ borderColor: '#10b981' }}
              value={newQuestion.correct_answer}
              onChange={e => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
            />

            <input
              type="text"
              className="input"
              placeholder="Mauvaise réponse 1"
              value={newQuestion.wrong_answer_1}
              onChange={e => setNewQuestion({ ...newQuestion, wrong_answer_1: e.target.value })}
            />

            <input
              type="text"
              className="input"
              placeholder="Mauvaise réponse 2"
              value={newQuestion.wrong_answer_2}
              onChange={e => setNewQuestion({ ...newQuestion, wrong_answer_2: e.target.value })}
            />

            <input
              type="text"
              className="input"
              placeholder="Mauvaise réponse 3"
              value={newQuestion.wrong_answer_3}
              onChange={e => setNewQuestion({ ...newQuestion, wrong_answer_3: e.target.value })}
            />

            <textarea
              className="input"
              placeholder="Explication (optionnel)"
              rows={2}
              value={newQuestion.explanation}
              onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={saveQuestion}>
                {editingQuestion ? 'Modifier' : 'Ajouter'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddQuestion(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
