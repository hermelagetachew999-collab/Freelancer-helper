import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
const API_BASE = envUrl 
  ? (envUrl.endsWith('/api') ? envUrl : envUrl.replace(/\/$/, '') + '/api')
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ScamResult {
  riskLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
  explanation: string;
  recommendation: string;
}

export const chatApi = {
  sendMessage: (sessionId: string, message: string, conversationId?: string) =>
    api.post<{ conversationId: string; response: string }>('/chat', {
      sessionId, message, conversationId,
    }),

  getConversations: (sessionId: string) =>
    api.get<Conversation[]>(`/chat/conversations/${sessionId}`),

  getMessages: (conversationId: string) =>
    api.get<Message[]>(`/chat/conversation/${conversationId}/messages`),

  deleteConversation: (conversationId: string) =>
    api.delete(`/chat/conversation/${conversationId}`),
};

export const scamApi = {
  analyze: (text: string) =>
    api.post<ScamResult>('/scam/analyze', { text }),

  report: (content: string, patternType?: string) =>
    api.post('/scam/report', { content, patternType }),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export interface GuideListItem {
  id: string;
  slug: string;
  title: string;
  last_verified: string | null;
  updated_at: string;
}

export interface GuideDetail {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  last_verified: string | null;
  updated_at: string;
  votes: { helpful: number | null; not_helpful: number | null };
}

export const guidesApi = {
  list: (type: 'payment' | 'platform' | 'blog') =>
    api.get<GuideListItem[]>(`/guides/${type}`),
  get: (type: 'payment' | 'platform' | 'blog', slug: string) =>
    api.get<GuideDetail>(`/guides/${type}/${slug}`),
  vote: (type: 'payment' | 'platform' | 'blog', slug: string, sessionId: string, helpful: boolean) =>
    api.post(`/guides/${type}/${slug}/vote`, { sessionId, helpful }),
};

export interface Account {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  created_at: string;
}

export const authApi = {
  me: () => api.get<{ account: Account | null }>('/auth/me'),
  signup: (email: string, password: string, firstName?: string, lastName?: string, sessionId?: string) =>
    api.post<{ account: Account }>('/auth/signup', { email, password, firstName, lastName, sessionId }),
  login: (email: string, password: string, sessionId?: string) =>
    api.post<{ account: Account }>('/auth/login', { email, password, sessionId }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', { email, code, newPassword }),
};
