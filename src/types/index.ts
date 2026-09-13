export type UserRole = 'superuser' | 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  loginBannerUrl: string;
  dashboardBannerUrl: string;
  contactEmail: string;
  currencySymbol: string;
  primaryColor: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  projectType: 'Subdivision' | 'Condominium' | 'Manufacturing' | 'Commercial';
  imageUrl: string;
  siteMapUrl: string;
  totalUnits: number;
  completedUnits: number;
  startDate: string;
  targetCompletionDate: string;
  budget: number;
  spent: number;
  status: 'Active' | 'Under Review' | 'Completed';
  description: string;
}

export type UnitStatus = 'Planning' | 'Ongoing' | 'T&C' | 'Punchlist' | 'Completed' | 'Handover';

export interface ProjectUnit {
  id: string;
  siteId: string;
  siteName: string;
  unitId: string;
  model: string;
  progress: number;
  status: UnitStatus;
  system?: string;
  notes?: string;
  targetDate: string;
  updatedAt: string;
}

export type SystemType = 'Civil' | 'Electrical' | 'Mechanical' | 'ELV' | 'HVAC' | 'Units' | 'Exterior';

export interface InventoryItem {
  id: string;
  equipment: string;
  specs: string;
  location: string;
  siteId: string;
  siteName: string;
  status: 'Operational' | 'Under Maintenance' | 'Deployed' | 'Standby' | 'Decommissioned';
  quantity: number;
  notes: string;
  lastInspected: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  idPhoto: string;
  mobileNo: string;
  email: string;
  sites: string[];
  department: string;
}

export type DocumentStatus = 'Received' | 'Approved' | 'Handover';

export interface ConstructionDocument {
  id: string;
  siteId: string;
  siteName: string;
  documentName: string;
  category: string;
  status: DocumentStatus;
  uploadedBy: string;
  fileSize: string;
  updatedAt: string;
}

export interface ConstructionDrawing {
  id: string;
  siteId: string;
  siteName: string;
  drawingTitle: string;
  system: SystemType;
  revision: string;
  status: DocumentStatus;
  architectEngineer: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  category: string;
  userName: string;
  timestamp: string;
}

export type TodoStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed';

export interface TodoItem {
  id: string;
  siteId: string;
  siteName: string;
  dateAssigned: string;
  name: string; // Staff member name
  task: string;
  dueDate: string;
  notes: string;
  status: TodoStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduleStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Postponed' | 'Cancelled';

export interface ScheduleItem {
  id: string;
  siteId: string;
  siteName: string;
  date: string;
  activity: string;
  attendees: string;
  notes: string;
  status: ScheduleStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  planningUnits: number;
  overallProgress: number;
  totalInventory: number;
  operationalInventory: number;
  maintenanceInventory: number;
  totalDrawings: number;
  approvedDrawings: number;
  totalDocuments: number;
  approvedDocuments: number;
  totalBudget: number;
  totalSpent: number;
}
