import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Theme {
  id: string
  name: string
  icon: string
  created_at: string
}

interface SubTheme {
  id: string
  theme_id: string
  name: string
  created_at: string
}

export default function ThemesManager({ onUpdate }: { onUpdate: () => void }) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [showAddSubTheme, setShowAddSubTheme] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', icon: '' });
  const [newSubTheme, setNewSubTheme] = useState({ name: '', theme_id: '' });

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      loadSubThemes(selectedTheme);
    }
  }, [selectedTheme]);

  const loadThemes = async () => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name');

    if (!error && data) {
      setThemes(data);
      if (data.length > 0 && !selectedTheme) {
        setSelectedTheme(data[0].id);
      }
    }
  };

  const loadSubThemes = async (themeId: string) => {
    const { data, error } = await supabase
      .from('sub_themes')
      .select('*')
      .eq('theme_id', themeId)
      .order('name');

    if (!error && data) {
      setSubThemes(data);
    }
  };

  const addTheme = async () => {
    if (!newTheme.name) return;

    const { error } = await supabase
      .from('themes')
      .insert([{ name: newTheme.name, icon: newTheme.icon || '📚' }]);

    if (!error) {
      setNewTheme({ name: '', icon: '' });
      setShowAddTheme(false);
      loadThemes();
      onUpdate();
    }
  };

  const addSubTheme = async () => {
    if (!newSubTheme.name || !newSubTheme.theme_id) return;

    const { error } = await supabase
      .from('sub_themes')
      .insert([{ name: newSubTheme.name, theme_id: newSubTheme.theme_id }]);

    if (!error) {
      setNewSubTheme({ name: '', theme_id: '' });
      setShowAddSubTheme(false);
      loadSubThemes(newSubTheme.theme_id);
      onUpdate();
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm('Supprimer ce thème et tous ses sous-thèmes ?')) return;

    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (!error) {
      loadThemes();
      onUpdate();
    }
  };

  const deleteSubTheme = async (id: string) => {
    if (!confirm('Supprimer ce sous-thème ?')) return;

    const { error } = await supabase
      .from('sub_themes')
      .delete()
      .eq('id', id);

    if (!error) {
      loadSubThemes(selectedTheme);
      onUpdate();
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Thèmes</h2>
          <button className="btn" onClick={() => setShowAddTheme(true)}>
            + Nouveau Thème
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {themes.map(theme => (
            <div
              key={theme.id}
              className="card"
              style={{
                cursor: 'pointer',
                border: selectedTheme === theme.id ? '2px solid #dc2626' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '2rem' }}>{theme.icon}</div>
                  <div style={{ marginTop: '0.5rem' }}>{theme.name}</div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTheme(theme.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTheme && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sous-thèmes de {themes.find(t => t.id === selectedTheme)?.name}</h2>
            <button
              className="btn"
              onClick={() => {
                setNewSubTheme({ name: '', theme_id: selectedTheme });
                setShowAddSubTheme(true);
              }}
            >
              + Nouveau Sous-thème
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subThemes.map(subTheme => (
                <tr key={subTheme.id}>
                  <td>{subTheme.name}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem' }}
                      onClick={() => deleteSubTheme(subTheme.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddTheme && (
        <div className="modal" onClick={() => setShowAddTheme(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Nouveau Thème</h2>
            <input
              type="text"
              className="input"
              placeholder="Nom du thème"
              value={newTheme.name}
              onChange={e => setNewTheme({ ...newTheme, name: e.target.value })}
            />
            <input
              type="text"
              className="input"
              placeholder="Emoji (ex: 📚)"
              value={newTheme.icon}
              onChange={e => setNewTheme({ ...newTheme, icon: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={addTheme}>Ajouter</button>
              <button className="btn btn-secondary" onClick={() => setShowAddTheme(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubTheme && (
        <div className="modal" onClick={() => setShowAddSubTheme(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Nouveau Sous-thème</h2>
            <input
              type="text"
              className="input"
              placeholder="Nom du sous-thème"
              value={newSubTheme.name}
              onChange={e => setNewSubTheme({ ...newSubTheme, name: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={addSubTheme}>Ajouter</button>
              <button className="btn btn-secondary" onClick={() => setShowAddSubTheme(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
