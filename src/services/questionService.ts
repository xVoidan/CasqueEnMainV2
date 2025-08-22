import { supabase } from './supabase';

export interface IQuestion {
  id: string;
  theme: string;
  subTheme: string;
  question: string;
  image?: string;
  answers: IAnswer[];
  type: 'single' | 'multiple';
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface IAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IThemeFilter {
  theme: string;
  subThemes: string[];
}

class QuestionService {
  /**
   * Récupère des questions selon les thèmes sélectionnés
   */
  async getQuestions(
    themes: IThemeFilter[],
    count: number = -1,
  ): Promise<IQuestion[]> {
    try {
      // Construction de la requête
      let query = supabase
        .from('questions')
        .select('*');

      // Filtrage par thèmes
      if (themes.length > 0) {
        const conditions = themes.map(t => {
          const subThemeConditions = t.subThemes.map(st => `sub_theme.eq.${st}`).join(',');
          return `and(theme.eq.${t.theme},or(${subThemeConditions}))`;
        });
        query = query.or(conditions.join(','));
      }

      // Limite du nombre de questions
      if (count > 0) {
        query = query.limit(count);
      }

      // Ordre aléatoire
      query = query.order('random()');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }

      // Transformer les données pour correspondre à notre interface
      return (data || []).map(this.transformQuestion);
    } catch (error) {
      console.error('Error in getQuestions:', error);
      // Retourner des questions d'exemple en cas d'erreur
      return this.getSampleQuestions(count);
    }
  }

  /**
   * Récupère des questions aléatoires
   */
  async getRandomQuestions(count: number = 20): Promise<IQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('random()')
        .limit(count);

      if (error) {
        console.error('Error fetching random questions:', error);
        throw error;
      }

      return (data || []).map(this.transformQuestion);
    } catch (error) {
      console.error('Error in getRandomQuestions:', error);
      return this.getSampleQuestions(count);
    }
  }

  /**
   * Récupère les questions du défi quotidien
   */
  async getDailyChallengeQuestions(): Promise<IQuestion[]> {
    try {
      // Utiliser la date du jour comme seed pour avoir les mêmes questions pour tous
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id')
        .limit(20);

      if (error) {
        console.error('Error fetching daily challenge questions:', error);
        throw error;
      }

      // Mélanger de manière déterministe basée sur la date
      const shuffled = this.deterministicShuffle(data || [], today);
      return shuffled.slice(0, 20).map(this.transformQuestion);
    } catch (error) {
      console.error('Error in getDailyChallengeQuestions:', error);
      return this.getSampleQuestions(20);
    }
  }

  /**
   * Transforme une question de la BDD vers notre format
   */
  private transformQuestion(dbQuestion: any): IQuestion {
    return {
      id: dbQuestion.id,
      theme: dbQuestion.theme,
      subTheme: dbQuestion.sub_theme,
      question: dbQuestion.question,
      image: dbQuestion.image_url,
      type: dbQuestion.type || 'single',
      explanation: dbQuestion.explanation,
      difficulty: dbQuestion.difficulty,
      points: dbQuestion.points,
      answers: dbQuestion.answers || [],
    };
  }

  /**
   * Mélange déterministe basé sur une seed
   */
  private deterministicShuffle<T>(array: T[], seed: string): T[] {
    const result = [...array];
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let i = result.length - 1; i > 0; i--) {
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Questions d'exemple pour le développement
   */
  private getSampleQuestions(count: number): IQuestion[] {
    const sampleQuestions: IQuestion[] = [
      {
        id: '1',
        theme: 'math',
        subTheme: 'geometry',
        question: 'Quelle est la formule pour calculer l\'aire d\'un cercle ?',
        type: 'single',
        difficulty: 'easy',
        points: 1,
        answers: [
          { id: 'a', text: 'πr²', isCorrect: true },
          { id: 'b', text: '2πr', isCorrect: false },
          { id: 'c', text: 'πd', isCorrect: false },
          { id: 'd', text: 'r²/π', isCorrect: false },
        ],
        explanation: 'L\'aire d\'un cercle se calcule avec la formule A = πr² où r est le rayon.',
      },
      {
        id: '2',
        theme: 'profession',
        subTheme: 'operations',
        question: 'Quels sont les éléments essentiels d\'une reconnaissance opérationnelle ?',
        type: 'multiple',
        difficulty: 'medium',
        points: 2,
        answers: [
          { id: 'a', text: 'Évaluation des risques', isCorrect: true },
          { id: 'b', text: 'Identification des victimes', isCorrect: true },
          { id: 'c', text: 'Mise en place du périmètre', isCorrect: true },
          { id: 'd', text: 'Rédaction du rapport', isCorrect: false },
        ],
        explanation: 'La reconnaissance opérationnelle comprend l\'évaluation des risques, l\'identification des victimes et la mise en place du périmètre de sécurité.',
      },
      {
        id: '3',
        theme: 'french',
        subTheme: 'grammar',
        question: 'Quel est le participe passé du verbe "acquérir" ?',
        type: 'single',
        difficulty: 'medium',
        points: 1,
        answers: [
          { id: 'a', text: 'Acquis', isCorrect: true },
          { id: 'b', text: 'Acquéri', isCorrect: false },
          { id: 'c', text: 'Acquiert', isCorrect: false },
          { id: 'd', text: 'Acqueru', isCorrect: false },
        ],
        explanation: 'Le participe passé du verbe "acquérir" est "acquis".',
      },
      {
        id: '4',
        theme: 'math',
        subTheme: 'percentage',
        question: 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?',
        type: 'single',
        difficulty: 'easy',
        points: 1,
        answers: [
          { id: 'a', text: '60€', isCorrect: true },
          { id: 'b', text: '55€', isCorrect: false },
          { id: 'c', text: '65€', isCorrect: false },
          { id: 'd', text: '70€', isCorrect: false },
        ],
        explanation: '80€ × 0.75 = 60€ (ou 80€ - 20€ = 60€)',
      },
      {
        id: '5',
        theme: 'profession',
        subTheme: 'first-aid',
        question: 'Quelle est la fréquence des compressions thoraciques lors d\'un massage cardiaque ?',
        type: 'single',
        difficulty: 'easy',
        points: 1,
        answers: [
          { id: 'a', text: '100 à 120 par minute', isCorrect: true },
          { id: 'b', text: '60 à 80 par minute', isCorrect: false },
          { id: 'c', text: '140 à 160 par minute', isCorrect: false },
          { id: 'd', text: '80 à 100 par minute', isCorrect: false },
        ],
        explanation: 'Les compressions thoraciques doivent être effectuées à une fréquence de 100 à 120 par minute.',
      },
    ];

    // Retourner le nombre demandé de questions
    const result: IQuestion[] = [];
    for (let i = 0; i < count && i < sampleQuestions.length; i++) {
      result.push(sampleQuestions[i]);
    }

    // Si on demande plus de questions que disponibles, répéter
    while (result.length < count) {
      const index = result.length % sampleQuestions.length;
      result.push({
        ...sampleQuestions[index],
        id: `${sampleQuestions[index].id}_${result.length}`,
      });
    }

    return result;
  }
}

export const questionService = new QuestionService();
