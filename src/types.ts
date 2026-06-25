// BOMICO HQ – shared TypeScript types

export interface Project {
  id: string;
  title: string;
  description?: string;
  goals?: string[];
  color?: string;
  checklist?: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  goals?: string[];
  color?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  goals?: string[];
  color?: string;
  checklist?: ChecklistItem[];
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatSendResponse {
  ok: boolean;
  sessionLabel: string;
  result: string;
}

export interface ChatHistoryResponse {
  ok: boolean;
  messages: ChatMessage[];
}

export interface Usage {
  estimatedCostUsd: number;
  budgetUsedPct: number;
  totalTokens: number;
  activeSessions: number;
  budgetMonthlyUsd: number;
}

export interface Approval {
  id: string;
  command?: string;
  description?: string;
  createdAt?: string;
}

export interface ApprovalsResponse {
  pending: Approval[];
}

export type View = 'home' | 'project';
