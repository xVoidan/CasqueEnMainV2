import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ImportExport({ onUpdate }: { onUpdate: () => void }) {
  const [importing, setImporting] = useState(false);
  const [_exportData, _setExportData] = useState('');
  const [importResult, setImportResult] = useState('');

  const exportAllData = async () => {
    try {
      const [themes, subThemes, questions] = await Promise.all([
        supabase.from('themes').select('*'),
        supabase.from('sub_themes').select('*'),
        supabase.from('questions').select('*'),
      ]);

      const data = {
        themes: themes.data || [],
        sub_themes: subThemes.data || [],
        questions: questions.data || [],
        exported_at: new Date().toISOString(),
      };

      const jsonData = JSON.stringify(data, null, 2);
      _setExportData(jsonData);

      // Créer un fichier téléchargeable
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casque-en-mains-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const importData = async (file: File) => {
    setImporting(true);
    setImportResult('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let themesImported = 0;
      let subThemesImported = 0;
      let questionsImported = 0;

      // Import des thèmes
      if (data.themes && Array.isArray(data.themes)) {
        for (const theme of data.themes) {
          const { id: _id, created_at: _created_at, ...themeData } = theme;
          const { error } = await supabase
            .from('themes')
            .upsert(themeData, { onConflict: 'name' });

          if (!error) themesImported++;
        }
      }

      // Import des sous-thèmes
      if (data.sub_themes && Array.isArray(data.sub_themes)) {
        for (const subTheme of data.sub_themes) {
          const { id: _id, created_at: _created_at, ...subThemeData } = subTheme;
          const { error } = await supabase
            .from('sub_themes')
            .upsert(subThemeData, { onConflict: 'name,theme_id' });

          if (!error) subThemesImported++;
        }
      }

      // Import des questions
      if (data.questions && Array.isArray(data.questions)) {
        for (const question of data.questions) {
          const { id: _id, created_at: _created_at, ...questionData } = question;
          const { error } = await supabase
            .from('questions')
            .insert(questionData);

          if (!error) questionsImported++;
        }
      }

      setImportResult(`Import réussi ! 
        - ${themesImported} thème(s) importé(s)
        - ${subThemesImported} sous-thème(s) importé(s)
        - ${questionsImported} question(s) importée(s)`);

      onUpdate();
    } catch (error) {
      setImportResult(`Erreur lors de l'import: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `theme_name,theme_icon,sub_theme_name,question,correct_answer,wrong_answer_1,wrong_answer_2,wrong_answer_3,explanation
"Sécurité Routière","🚗","Code de la route","Quelle est la vitesse maximale en ville ?","50 km/h","30 km/h","70 km/h","90 km/h","La vitesse est limitée à 50 km/h en agglomération sauf indication contraire"
"Sécurité Routière","🚗","Signalisation","Que signifie un panneau triangulaire rouge ?","Danger","Interdiction","Obligation","Information","Les panneaux triangulaires signalent un danger"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-questions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async (file: File) => {
    setImporting(true);
    setImportResult('');

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const _headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      let imported = 0;
      const themeMap = new Map();
      const subThemeMap = new Map();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim());
        if (!values || values.length < 9) continue;

        const [themeName, themeIcon, subThemeName, question, correctAnswer, wrong1, wrong2, wrong3, explanation] = values;

        // Créer ou récupérer le thème
        if (!themeMap.has(themeName)) {
          const { data } = await supabase
            .from('themes')
            .select('id')
            .eq('name', themeName)
            .single();

          if (data) {
            themeMap.set(themeName, data.id);
          } else {
            const { data: newTheme } = await supabase
              .from('themes')
              .insert({ name: themeName, icon: themeIcon || '📚' })
              .select('id')
              .single();

            if (newTheme) themeMap.set(themeName, newTheme.id);
          }
        }

        const themeId = themeMap.get(themeName);
        if (!themeId) continue;

        // Créer ou récupérer le sous-thème
        const subThemeKey = `${themeId}-${subThemeName}`;
        if (!subThemeMap.has(subThemeKey)) {
          const { data } = await supabase
            .from('sub_themes')
            .select('id')
            .eq('theme_id', themeId)
            .eq('name', subThemeName)
            .single();

          if (data) {
            subThemeMap.set(subThemeKey, data.id);
          } else {
            const { data: newSubTheme } = await supabase
              .from('sub_themes')
              .insert({ theme_id: themeId, name: subThemeName })
              .select('id')
              .single();

            if (newSubTheme) subThemeMap.set(subThemeKey, newSubTheme.id);
          }
        }

        const subThemeId = subThemeMap.get(subThemeKey);
        if (!subThemeId) continue;

        // Ajouter la question
        const { error } = await supabase
          .from('questions')
          .insert({
            sub_theme_id: subThemeId,
            question,
            correct_answer: correctAnswer,
            wrong_answer_1: wrong1,
            wrong_answer_2: wrong2,
            wrong_answer_3: wrong3,
            explanation: explanation || null,
          });

        if (!error) imported++;
      }

      setImportResult(`Import CSV réussi ! ${imported} question(s) importée(s)`);
      onUpdate();
    } catch (error) {
      setImportResult(`Erreur lors de l'import CSV: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importCSV(file);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Export des Données</h2>
        <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Exportez toutes vos données (thèmes, sous-thèmes et questions) au format JSON.
        </p>
        <button className="btn" onClick={exportAllData}>
          📥 Exporter tout en JSON
        </button>
      </div>

      <div className="card">
        <h2>Import JSON</h2>
        <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Importez des données depuis un fichier JSON exporté précédemment.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          disabled={importing}
          style={{ marginBottom: '1rem' }}
        />
        {importing && <p>Import en cours...</p>}
        {importResult && (
          <div style={{
            padding: '1rem',
            background: importResult.includes('Erreur') ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            marginTop: '1rem',
          }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{importResult}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Import CSV</h2>
        <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Importez des questions en masse depuis un fichier CSV (Excel).
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={downloadCSVTemplate}>
            📄 Télécharger le modèle CSV
          </button>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          disabled={importing}
        />
      </div>

      <div className="card">
        <h2>Format CSV attendu</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
          Le fichier CSV doit contenir les colonnes suivantes :
        </p>
        <ul style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.8' }}>
          <li>theme_name - Nom du thème</li>
          <li>theme_icon - Emoji du thème (optionnel)</li>
          <li>sub_theme_name - Nom du sous-thème</li>
          <li>question - La question</li>
          <li>correct_answer - La bonne réponse</li>
          <li>wrong_answer_1 - Mauvaise réponse 1</li>
          <li>wrong_answer_2 - Mauvaise réponse 2</li>
          <li>wrong_answer_3 - Mauvaise réponse 3</li>
          <li>explanation - Explication (optionnel)</li>
        </ul>
      </div>
    </div>
  );
}
