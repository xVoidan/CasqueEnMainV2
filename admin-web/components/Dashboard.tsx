import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ThemesManager from './ThemesManager';
import QuestionsManager from './QuestionsManager';
import ImportExport from './ImportExport';

export default function Dashboard({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState('themes');
  const [stats, setStats] = useState({
    themes: 0,
    subThemes: 0,
    questions: 0,
    users: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [themesData, subThemesData, questionsData, usersData] = await Promise.all([
        supabase.from('themes').select('*', { count: 'exact', head: true }),
        supabase.from('sub_themes').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        themes: themesData.count || 0,
        subThemes: subThemesData.count || 0,
        questions: questionsData.count || 0,
        users: usersData.count || 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓 CasqueEnMains Admin</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Connecté en tant que : {session.user.email}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleSignOut}>
          Déconnexion
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.themes}</div>
          <div className="stat-label">Thèmes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.subThemes}</div>
          <div className="stat-label">Sous-thèmes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.questions}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">Utilisateurs</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          📚 Thèmes & Sous-thèmes
        </button>
        <button
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          ❓ Questions
        </button>
        <button
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 Import/Export
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'themes' && <ThemesManager onUpdate={loadStats} />}
        {activeTab === 'questions' && <QuestionsManager onUpdate={loadStats} />}
        {activeTab === 'import' && <ImportExport onUpdate={loadStats} />}
      </div>
    </div>
  );
}
