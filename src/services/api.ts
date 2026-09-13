import {
  User,
  CompanySettings,
  Project,
  ProjectUnit,
  InventoryItem,
  TeamMember,
  ConstructionDocument,
  ConstructionDrawing,
  DashboardMetrics,
  ActivityLog,
  TodoItem,
  ScheduleItem
} from '../types';

const TOKEN_KEY = 'constructpulse_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string, remember: boolean = false) => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string; rememberMe?: boolean }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  getUsers: () => request<{ users: User[] }>('/api/auth/users'),

  createUser: (userData: any) =>
    request<{ message: string; user: User }>('/api/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  updateUser: (id: string, userData: any) =>
    request<{ message: string; user: User }>(`/api/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/auth/users/${id}`, {
      method: 'DELETE'
    }),

  // Projects & Units
  getProjects: () => request<{ projects: Project[] }>('/api/projects'),

  createProject: (projectData: Partial<Project>) =>
    request<{ message: string; project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    }),

  updateProject: (id: string, projectData: Partial<Project>) =>
    request<{ message: string; project: Project }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    }),

  deleteProject: (id: string) =>
    request<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE'
    }),

  getProjectById: (id: string) =>
    request<{
      project: Project;
      units: ProjectUnit[];
      inventory: InventoryItem[];
      documents: ConstructionDocument[];
      drawings: ConstructionDrawing[];
    }>(`/api/projects/${id}`),

  getUnits: (params?: { siteId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.status) q.append('status', params.status);
    return request<{ units: ProjectUnit[] }>(`/api/units?${q.toString()}`);
  },

  createUnit: (unitData: Partial<ProjectUnit>) =>
    request<{ message: string; unit: ProjectUnit }>('/api/units', {
      method: 'POST',
      body: JSON.stringify(unitData)
    }),

  updateUnit: (id: string, unitData: Partial<ProjectUnit>) =>
    request<{ message: string; unit: ProjectUnit }>(`/api/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unitData)
    }),

  deleteUnit: (id: string) =>
    request<{ message: string }>(`/api/units/${id}`, {
      method: 'DELETE'
    }),

  // Inventory
  getInventory: (params?: { siteId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.status) q.append('status', params.status);
    return request<{ inventory: InventoryItem[] }>(`/api/inventory?${q.toString()}`);
  },

  createInventory: (item: Partial<InventoryItem>) =>
    request<{ message: string; item: InventoryItem }>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(item)
    }),

  updateInventory: (id: string, item: Partial<InventoryItem>) =>
    request<{ message: string; item: InventoryItem }>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    }),

  deleteInventory: (id: string) =>
    request<{ message: string }>(`/api/inventory/${id}`, {
      method: 'DELETE'
    }),

  // Team
  getTeam: (site?: string) => {
    const q = site ? `?site=${encodeURIComponent(site)}` : '';
    return request<{ team: TeamMember[] }>(`/api/team${q}`);
  },

  createTeamMember: (member: Partial<TeamMember>) =>
    request<{ message: string; member: TeamMember }>('/api/team', {
      method: 'POST',
      body: JSON.stringify(member)
    }),

  updateTeamMember: (id: string, member: Partial<TeamMember>) =>
    request<{ message: string; member: TeamMember }>(`/api/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member)
    }),

  deleteTeamMember: (id: string) =>
    request<{ message: string }>(`/api/team/${id}`, {
      method: 'DELETE'
    }),

  // Documents
  getDocuments: (params?: { siteId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.status) q.append('status', params.status);
    return request<{ documents: ConstructionDocument[] }>(`/api/documents?${q.toString()}`);
  },

  createDocument: (doc: Partial<ConstructionDocument>) =>
    request<{ message: string; document: ConstructionDocument }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(doc)
    }),

  updateDocument: (id: string, doc: Partial<ConstructionDocument>) =>
    request<{ message: string; document: ConstructionDocument }>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doc)
    }),

  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/documents/${id}`, {
      method: 'DELETE'
    }),

  // Drawings
  getDrawings: (params?: { siteId?: string; system?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.system) q.append('system', params.system);
    if (params?.status) q.append('status', params.status);
    return request<{ drawings: ConstructionDrawing[] }>(`/api/drawings?${q.toString()}`);
  },

  createDrawing: (drawing: Partial<ConstructionDrawing>) =>
    request<{ message: string; drawing: ConstructionDrawing }>('/api/drawings', {
      method: 'POST',
      body: JSON.stringify(drawing)
    }),

  updateDrawing: (id: string, drawing: Partial<ConstructionDrawing>) =>
    request<{ message: string; drawing: ConstructionDrawing }>(`/api/drawings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drawing)
    }),

  deleteDrawing: (id: string) =>
    request<{ message: string }>(`/api/drawings/${id}`, {
      method: 'DELETE'
    }),

  // To Do
  getTodos: (params?: { siteId?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return request<{ todos: TodoItem[] }>(`/api/todos?${q.toString()}`);
  },

  createTodo: (todo: Partial<TodoItem>) =>
    request<{ message: string; todo: TodoItem }>('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todo)
    }),

  updateTodo: (id: string, todo: Partial<TodoItem>) =>
    request<{ message: string; todo: TodoItem }>(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todo)
    }),

  deleteTodo: (id: string) =>
    request<{ message: string }>(`/api/todos/${id}`, {
      method: 'DELETE'
    }),

  // Schedule
  getSchedules: (params?: { siteId?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.siteId) q.append('siteId', params.siteId);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return request<{ schedules: ScheduleItem[] }>(`/api/schedules?${q.toString()}`);
  },

  createSchedule: (schedule: Partial<ScheduleItem>) =>
    request<{ message: string; schedule: ScheduleItem }>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    }),

  updateSchedule: (id: string, schedule: Partial<ScheduleItem>) =>
    request<{ message: string; schedule: ScheduleItem }>(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule)
    }),

  deleteSchedule: (id: string) =>
    request<{ message: string }>(`/api/schedules/${id}`, {
      method: 'DELETE'
    }),

  // Settings & Overview
  getSettings: () => request<{ settings: CompanySettings }>('/api/settings'),

  updateSettings: (settings: Partial<CompanySettings>) =>
    request<{ message: string; settings: CompanySettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  getDashboardSummary: () =>
    request<{ metrics: DashboardMetrics; activities: ActivityLog[] }>('/api/dashboard/summary'),

  search: (query: string) =>
    request<{
      results: {
        projects: Project[];
        units: ProjectUnit[];
        inventory: InventoryItem[];
        team: TeamMember[];
        documents: ConstructionDocument[];
        drawings: ConstructionDrawing[];
      };
    }>(`/api/search?q=${encodeURIComponent(query)}`)
};
