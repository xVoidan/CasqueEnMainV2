export interface Exam {
  id: string;
  title: string;
  description?: string;
  year: number;
  exam_date?: string;
  duration_minutes: number;
  max_questions: number;
  passing_score: number;
  is_active: boolean;
  is_practice_mode: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  problems?: ExamProblem[];
  user_session?: ExamSession;
  ranking_position?: number;
  total_participants?: number;
}

export interface ExamProblem {
  id: string;
  exam_id: string;
  title: string;
  context?: string;
  order_index: number;
  points: number;
  created_at: string;
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  problem_id: string;
  question_text: string;
  explanation?: string;
  order_index: number;
  points: number;
  created_at: string;
  options?: ExamQuestionOption[];
  user_answer?: ExamUserAnswer;
}

export interface ExamQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'timeout';
  score?: number;
  max_score?: number;
  percentage?: number;
  duration_seconds?: number;
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
  app_blur_count: number;
  integrity_score: number;
  warnings: string[];
  answers?: ExamUserAnswer[];
  current_question_index?: number;
  time_remaining_seconds?: number;
}

export interface ExamUserAnswer {
  id?: string;
  session_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct?: boolean;
  points_earned: number;
  answered_at: string;
  time_spent_seconds?: number;
}

export interface ExamRanking {
  id: string;
  exam_id: string;
  user_id: string;
  session_id: string;
  rank: number;
  score: number;
  duration_seconds: number;
  percentile?: number;
  created_at: string;
  user?: {
    name: string;
    department?: string;
  };
}

export interface ExamCertificate {
  id: string;
  session_id: string;
  user_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url?: string;
  metadata?: any;
}

export interface ExamStatistics {
  total_participants: number;
  average_score: number;
  median_score: number;
  pass_rate: number;
  average_duration_minutes: number;
  difficulty_index: number;
  score_distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  problem_statistics: {
    problem_id: string;
    problem_title: string;
    success_rate: number;
    average_points: number;
  }[];
}

export interface ExamWarning {
  type: 'APP_BLUR' | 'RAPID_ANSWERS' | 'NETWORK_ISSUE' | 'SUSPICIOUS_PATTERN';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ExamConfig {
  allow_pause: boolean;
  show_timer: boolean;
  show_progress: boolean;
  auto_save_interval_seconds: number;
  warning_time_minutes: number;
  blur_tolerance: number;
  min_time_per_question_seconds: number;
  enable_anti_cheat: boolean;
  enable_certificates: boolean;
  enable_revision_mode: boolean;
}
