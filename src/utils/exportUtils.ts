import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface SessionData {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  themePerformance: {
    theme: string;
    percentage: number;
    correct: number;
    total: number;
  }[];
  totalTime: number;
  grade: string;
  totalPoints: number;
  date: Date;
}

export async function exportToPDF(sessionData: SessionData): Promise<void> {
  const html = generateHTMLReport(sessionData);

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri);
    } else {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    }
  } catch (error) {
    console.error('Erreur export PDF:', error);
    throw error;
  }
}

function generateHTMLReport(data: SessionData): string {
  const formattedDate = data.date.toLocaleDateString('fr-FR');
  const formattedTime = Math.floor(data.totalTime / 60);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          color: #FFD700;
        }
        .date {
          margin-top: 10px;
          font-size: 14px;
          opacity: 0.8;
        }
        .section {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 10px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #FFD700;
        }
        .score-main {
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 10px;
          border-radius: 8px;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.7;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          margin-top: 5px;
        }
        .theme-performance {
          margin-top: 15px;
        }
        .theme-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .theme-name {
          flex: 1;
        }
        .theme-score {
          font-weight: bold;
        }
        .progress-bar {
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #3B82F6);
          border-radius: 10px;
        }
        .grade-section {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
          border-radius: 10px;
        }
        .grade-title {
          font-size: 24px;
          font-weight: bold;
          color: #FFD700;
        }
        .points {
          font-size: 18px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 15px;
          opacity: 0.7;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'Entraînement CasqueEnMains</h1>
        <div class="date">${formattedDate}</div>
      </div>

      <div class="section">
        <div class="score-main">${data.score}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${data.score}%"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Statistiques</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Questions répondues</div>
            <div class="stat-value">${data.totalQuestions}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Réponses correctes</div>
            <div class="stat-value" style="color: #10B981">${data.correctAnswers}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Réponses incorrectes</div>
            <div class="stat-value" style="color: #EF4444">${data.incorrectAnswers}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Temps total</div>
            <div class="stat-value">${formattedTime} min</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🎯 Performance par thème</div>
        <div class="theme-performance">
          ${data.themePerformance.map(theme => `
            <div class="theme-item">
              <span class="theme-name">${theme.theme}</span>
              <span class="theme-score">${theme.percentage.toFixed(0)}% (${theme.correct}/${theme.total})</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="grade-section">
        <div class="grade-title">${data.grade}</div>
        <div class="points">${data.totalPoints} points au total</div>
      </div>

      <div class="footer">
        CasqueEnMains - Application d'entraînement pour sapeurs-pompiers<br>
        Généré automatiquement le ${new Date().toLocaleString('fr-FR')}
      </div>
    </body>
    </html>
  `;
}

export async function shareResults(sessionData: SessionData): Promise<void> {
  const message = `
🚒 Résultats CasqueEnMains

📊 Score: ${sessionData.score}%
✅ Réponses correctes: ${sessionData.correctAnswers}
❌ Réponses incorrectes: ${sessionData.incorrectAnswers}
⏱️ Temps: ${Math.floor(sessionData.totalTime / 60)} minutes
🎖️ Grade: ${sessionData.grade}
💎 Points: ${sessionData.totalPoints}

#CasqueEnMains #Pompiers #Entraînement
  `.trim();

  try {
    await Sharing.shareAsync(message);
  } catch (error) {
    console.error('Erreur partage:', error);
    throw error;
  }
}
