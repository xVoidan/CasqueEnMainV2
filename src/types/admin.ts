// Types pour l'administration

export interface IAdmin {
  id: string;
  user_id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface IExportData {
  themes: unknown[];
  questions: unknown[];
  users: unknown[];
  sessions: unknown[];
  timestamp: string;
  version: string;
}

export interface IImportResult {
  success: boolean;
  imported: {
    themes: number;
    questions: number;
    users: number;
    sessions: number;
  };
  errors: string[];
}

