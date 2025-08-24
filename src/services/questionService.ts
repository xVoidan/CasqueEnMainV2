import { supabase } from '@/src/lib/supabase';

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
    _questionTypeFilter: 'all' | 'single' | 'multiple' = 'all',
  ): Promise<IQuestion[]> {
    try {
      console.log('Getting questions with themes:', themes);

      // Extraire tous les IDs de sous-thèmes
      const subThemeIds: string[] = [];
      themes.forEach(theme => {
        theme.subThemes.forEach(subTheme => {
          subThemeIds.push(subTheme);
        });
      });

      console.log('Sub-theme IDs:', subThemeIds);

      // Si aucun sous-thème sélectionné, récupérer toutes les questions
      let query = supabase
        .from('questions')
        .select('*');

      // Filtrage par sous-thèmes si spécifiés
      if (subThemeIds.length > 0) {
        query = query.in('sub_theme_id', subThemeIds);
      }

      // Limite du nombre de questions
      if (count > 0) {
        query = query.limit(count);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Questions loaded:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('No questions found, using sample questions');
        return this.getSampleQuestions(count);
      }

      // Charger les informations des thèmes et sous-thèmes séparément
      const subThemeIdsFromQuestions = [...new Set(data.map(q => q.sub_theme_id))];

      const { data: subThemesData } = await supabase
        .from('sub_themes')
        .select(`
          id,
          name,
          themes (
            id,
            name,
            icon
          )
        `)
        .in('id', subThemeIdsFromQuestions);

      // Créer une map pour accès rapide
      const subThemesMap = new Map();
      if (subThemesData) {
        subThemesData.forEach(st => {
          subThemesMap.set(st.id, st);
        });
      }

      // Transformer les données pour correspondre à notre interface
      return data.map(q => this.transformQuestion(q, subThemesMap.get(q.sub_theme_id)));
    } catch (error) {
      console.error('Error loading questions:', error);
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

        throw error;
      }

      return (data || []).map(this.transformQuestion);
    } catch (_error) {

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

        throw error;
      }

      // Mélanger de manière déterministe basée sur la date
      const shuffled = this.deterministicShuffle(data || [], today);
      return shuffled.slice(0, 20).map(this.transformQuestion);
    } catch (_error) {

      return this.getSampleQuestions(20);
    }
  }

  /**
   * Transforme une question de la BDD vers notre format
   */
  private transformQuestion(dbQuestion: any, subThemeData?: any): IQuestion {
    // Extraire les informations du thème et sous-thème si disponibles
    const themeName = subThemeData?.themes?.name || dbQuestion.sub_themes?.themes?.name || 'Métier';
    const subThemeName = subThemeData?.name || dbQuestion.sub_themes?.name || 'Général';

    // Créer les réponses à partir des données de la BDD
    const answers: IAnswer[] = [
      { id: 'a', text: dbQuestion.correct_answer, isCorrect: true },
      { id: 'b', text: dbQuestion.wrong_answer_1, isCorrect: false },
      { id: 'c', text: dbQuestion.wrong_answer_2, isCorrect: false },
      { id: 'd', text: dbQuestion.wrong_answer_3, isCorrect: false },
    ];

    // Mélanger les réponses pour éviter que la bonne soit toujours en premier
    const shuffled = this.shuffleArray(answers);

    return {
      id: dbQuestion.id,
      theme: themeName,
      subTheme: subThemeName,
      question: dbQuestion.question,
      image: dbQuestion.image_url,
      type: 'single', // Par défaut, toutes les questions sont à choix unique
      explanation: dbQuestion.explanation,
      difficulty: dbQuestion.difficulty || 'medium',
      points: dbQuestion.points || 1,
      answers: shuffled,
    };
  }

  /**
   * Mélange un tableau de manière aléatoire
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
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
