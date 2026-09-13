import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'superuser' | 'admin' | 'user';
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
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

export interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  mobileNo: string;
  email: string;
}

export interface Contractor {
  id: string;
  companyName: string;
  staffCount: number;
  siteId: string;
  siteName: string;
  scopeOfWork: string;
  contactPerson: string;
  contactMobileNo: string;
  contactEmail: string;
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
  siteId: string;
  siteName: string;
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
  name: string; // Staff name
  task: string;
  dueDate: string;
  notes: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseState {
  settings: CompanySettings;
  users: User[];
  projects: Project[];
  units: ProjectUnit[];
  inventory: InventoryItem[];
  team: TeamMember[];
  contacts: Contact[];
  contractors: Contractor[];
  documents: ConstructionDocument[];
  drawings: ConstructionDrawing[];
  activities: ActivityLog[];
  todos: TodoItem[];
  schedules: ScheduleItem[];
}

// Initial default seed state
const initialData: DatabaseState = {
  settings: {
    id: 'default',
    companyName: 'ApexBuild Construction & Engineering SaaS',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=128&auto=format&fit=crop&q=80',
    faviconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230090FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    loginBannerUrl: '',
    dashboardBannerUrl: '',
    contactEmail: 'operations@apexbuild-saas.com',
    currencySymbol: '₱',
    primaryColor: '#0090FF',
    updatedAt: new Date().toISOString()
  },
  users: [
    {
      id: 'usr-1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('niceday1%', 10),
      role: 'superuser',
      fullName: 'Chief Operations Administrator',
      email: 'admin@apexbuild-saas.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'usr-2',
      username: 'manager',
      passwordHash: bcrypt.hashSync('qwerty1%', 10),
      role: 'admin',
      fullName: 'Project Director Alex Mercer',
      email: 'alex.mercer@apexbuild-saas.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-12T09:30:00.000Z'
    },
    {
      id: 'usr-3',
      username: 'staff',
      passwordHash: bcrypt.hashSync('abc123%', 10),
      role: 'user',
      fullName: 'Site Engineer Sara Tan',
      email: 'sara.tan@apexbuild-saas.com',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-15T11:00:00.000Z'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Oakwood Heights Subdivision',
      location: 'Brgy. Don Jose, Santa Rosa, Laguna',
      projectType: 'Subdivision',
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
      siteMapUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=600&auto=format&fit=crop&q=80',
      totalUnits: 6,
      completedUnits: 2,
      startDate: '2025-08-01',
      targetCompletionDate: '2026-11-30',
      budget: 84500000,
      spent: 56200000,
      status: 'Active',
      description: 'Masterplanned residential community featuring 6 executive 2-storey housing units, centralized deep-well pumps, perimeter CCTV grid, and underground utilities.'
    },
    {
      id: 'proj-2',
      name: 'Pinecrest Valley Subdivision',
      location: 'Brgy. Lalaan, Silang, Cavite',
      projectType: 'Subdivision',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      siteMapUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
      totalUnits: 6,
      completedUnits: 1,
      startDate: '2025-10-01',
      targetCompletionDate: '2027-01-15',
      budget: 92000000,
      spent: 47800000,
      status: 'Active',
      description: 'Eco-modern highland community with 6 contemporary housing models, dedicated pump house, security surveillance network, and clubhouse amenities.'
    },
    {
      id: 'proj-3',
      name: 'Horizon Grand Towers',
      location: '7th Avenue cor. 28th St., Bonifacio Global City, Taguig',
      projectType: 'Condominium',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      siteMapUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
      totalUnits: 16,
      completedUnits: 8,
      startDate: '2025-06-01',
      targetCompletionDate: '2026-08-20',
      budget: 185000000,
      spent: 142000000,
      status: 'Active',
      description: 'Premium 4-storey boutique condominium with 4 spacious units per floor (16 units total), ground floor swimming pool, dual booster pump rooms, and dedicated access roads.'
    },
    {
      id: 'proj-4',
      name: 'Apex Precision Industrial Facility',
      location: 'Light Industry & Science Park II, Calamba, Laguna',
      projectType: 'Manufacturing',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
      siteMapUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      totalUnits: 6,
      completedUnits: 2,
      startDate: '2025-12-01',
      targetCompletionDate: '2026-10-10',
      budget: 240000000,
      spent: 188500000,
      status: 'Active',
      description: 'High-tech manufacturing complex comprising cleanrooms (Room-1), CNC line bays (Area-2), twin cooling towers, dual 1250kVA generators, SPU-3 substation, and LED street light loop.'
    }
  ],
  units: [
    // Project 1: Oakwood Heights (6 units)
    {
      id: 'u-101',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-1',
      model: 'Sapphire Villa (2-Storey 220sqm)',
      progress: 100,
      status: 'Completed',
      system: 'Units',
      notes: 'Final structural and architectural sign-off complete. Ready for turnover.',
      targetDate: '2026-03-15',
      updatedAt: '2026-03-10'
    },
    {
      id: 'u-102',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-2',
      model: 'Emerald Twin (185sqm)',
      progress: 88,
      status: 'Punchlist',
      system: 'Units',
      notes: 'Touch-up paint, tile grouting, and ELV intercom verification in progress.',
      targetDate: '2026-05-30',
      updatedAt: '2026-04-12'
    },
    {
      id: 'u-103',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-3',
      model: 'Diamond Executive (260sqm)',
      progress: 68,
      status: 'Ongoing',
      system: 'Civil',
      notes: 'Roof framing completed. Drywall partition and electrical roughing active.',
      targetDate: '2026-07-20',
      updatedAt: '2026-04-18'
    },
    {
      id: 'u-104',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-4',
      model: 'Sapphire Villa (2-Storey 220sqm)',
      progress: 45,
      status: 'Ongoing',
      system: 'Electrical',
      notes: '2nd level floor slab poured. Concrete curing and beam rebars.',
      targetDate: '2026-09-15',
      updatedAt: '2026-04-20'
    },
    {
      id: 'u-105',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-5',
      model: 'Ruby Single (160sqm)',
      progress: 25,
      status: 'Planning',
      system: 'Civil',
      notes: 'Soil compaction tested. Foundation excavation and column footing prep.',
      targetDate: '2026-10-30',
      updatedAt: '2026-04-05'
    },
    {
      id: 'u-106',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      unitId: 'Block-1 Lot-6',
      model: 'Emerald Twin (185sqm)',
      progress: 100,
      status: 'Handover',
      system: 'Units',
      notes: 'Occupancy permit issued. Client walkthrough and key handover finalized.',
      targetDate: '2026-02-28',
      updatedAt: '2026-03-02'
    },

    // Project 2: Pinecrest Valley (6 units)
    {
      id: 'u-201',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-1',
      model: 'Pine Luxury Villa (240sqm)',
      progress: 100,
      status: 'Handover',
      system: 'Units',
      notes: 'Full homeowner orientation conducted and warranties accepted.',
      targetDate: '2026-01-20',
      updatedAt: '2026-01-22'
    },
    {
      id: 'u-202',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-2',
      model: 'Cedar Duplex (190sqm)',
      progress: 94,
      status: 'T&C',
      system: 'Mechanical',
      notes: 'Testing & Commissioning of booster pump loop and solar heater array.',
      targetDate: '2026-06-15',
      updatedAt: '2026-04-14'
    },
    {
      id: 'u-203',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-3',
      model: 'Oak Single Detached (210sqm)',
      progress: 72,
      status: 'Ongoing',
      system: 'HVAC',
      notes: 'Multi-split refrigerant piping rough-ins and ceiling drop installation.',
      targetDate: '2026-08-10',
      updatedAt: '2026-04-16'
    },
    {
      id: 'u-204',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-4',
      model: 'Pine Luxury Villa (240sqm)',
      progress: 52,
      status: 'Ongoing',
      system: 'Civil',
      notes: 'Masonry exterior plastering and window subframes anchored.',
      targetDate: '2026-10-05',
      updatedAt: '2026-04-17'
    },
    {
      id: 'u-205',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-5',
      model: 'Cedar Duplex (190sqm)',
      progress: 30,
      status: 'Planning',
      system: 'Civil',
      notes: 'Ground beams poured. Awaiting soil treatment certification.',
      targetDate: '2026-11-20',
      updatedAt: '2026-04-02'
    },
    {
      id: 'u-206',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      unitId: 'Block-1 Lot-6',
      model: 'Maple Single (175sqm)',
      progress: 15,
      status: 'Planning',
      system: 'Civil',
      notes: 'Permit approval finalized. Site grading and staking scheduled.',
      targetDate: '2026-12-15',
      updatedAt: '2026-03-29'
    },

    // Project 3: Horizon Grand Towers (4 storeys, 4 units per floor = 16 units)
    {
      id: 'u-301',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '1F Unit-1',
      model: 'Garden Suite A (110sqm)',
      progress: 100,
      status: 'Completed',
      system: 'Units',
      notes: 'Interior fit-out, patio glazing, and smart locks tested.',
      targetDate: '2026-02-15',
      updatedAt: '2026-02-20'
    },
    {
      id: 'u-302',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '1F Unit-2',
      model: 'Garden Suite B (110sqm)',
      progress: 100,
      status: 'Completed',
      system: 'Units',
      notes: 'Completed. Swimming pool deck corridor adjacent.',
      targetDate: '2026-02-15',
      updatedAt: '2026-02-20'
    },
    {
      id: 'u-303',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '2F Unit-1',
      model: 'Horizon Loft (85sqm)',
      progress: 100,
      status: 'Completed',
      system: 'Units',
      notes: 'Electrical fixtures and glass balustrades installed.',
      targetDate: '2026-03-01',
      updatedAt: '2026-03-05'
    },
    {
      id: 'u-304',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '2F Unit-2',
      model: 'Horizon Loft (85sqm)',
      progress: 100,
      status: 'Completed',
      system: 'Units',
      notes: 'Final deep cleaning and QA punchlist rectified.',
      targetDate: '2026-03-01',
      updatedAt: '2026-03-05'
    },
    {
      id: 'u-305',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '3F Unit-1',
      model: 'Executive Corner Suite (135sqm)',
      progress: 92,
      status: 'T&C',
      system: 'Mechanical',
      notes: 'Testing & Commissioning of FCU cooling, chilled water valves, and fire sprinklers.',
      targetDate: '2026-06-30',
      updatedAt: '2026-04-19'
    },
    {
      id: 'u-306',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '3F Unit-2',
      model: 'Horizon Loft (85sqm)',
      progress: 86,
      status: 'Punchlist',
      system: 'Units',
      notes: 'Cabinets, wood veneer touch-ups, and kitchen countertop resealing.',
      targetDate: '2026-06-30',
      updatedAt: '2026-04-15'
    },
    {
      id: 'u-307',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: '4F Unit-1',
      model: 'Penthouse Sky Suite (210sqm)',
      progress: 74,
      status: 'Ongoing',
      system: 'HVAC',
      notes: 'Central ducted VRF system installed. Acoustic dampeners in ceiling.',
      targetDate: '2026-08-15',
      updatedAt: '2026-04-18'
    },
    {
      id: 'u-308',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      unitId: 'Amenities & Pool Deck',
      model: 'Swimming Pool & Access Roads',
      progress: 96,
      status: 'T&C',
      system: 'Exterior',
      notes: 'Pool filtration pressure tests passed. Perimeter access road asphalt sealed.',
      targetDate: '2026-05-20',
      updatedAt: '2026-04-19'
    },

    // Project 4: Apex Precision Industrial Facility (Manufacturing)
    {
      id: 'u-401',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'Room-1',
      model: 'ISO-Class 7 Cleanroom & Metrology',
      progress: 100,
      status: 'Completed',
      system: 'HVAC',
      notes: 'HEPA filtration balance and particle count certification passed.',
      targetDate: '2026-02-28',
      updatedAt: '2026-03-01'
    },
    {
      id: 'u-402',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'Area-2',
      model: 'Assembly Bay & Automated CNC Line',
      progress: 82,
      status: 'Ongoing',
      system: 'Electrical',
      notes: 'Busduct power feeder energized. Epoxy floor coating in curing phase.',
      targetDate: '2026-06-25',
      updatedAt: '2026-04-17'
    },
    {
      id: 'u-403',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'Cooling Tower',
      model: 'Closed-Circuit Cooling Tower (750 TR)',
      progress: 95,
      status: 'T&C',
      system: 'Mechanical',
      notes: 'Chemical water treatment dosing and condenser pump flow tests active.',
      targetDate: '2026-05-15',
      updatedAt: '2026-04-18'
    },
    {
      id: 'u-404',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'Generator-1',
      model: '1250kVA Emergency Diesel GenSet',
      progress: 100,
      status: 'Completed',
      system: 'Electrical',
      notes: 'Automatic Transfer Switch (ATS) 4-hour load bank test certified.',
      targetDate: '2026-03-10',
      updatedAt: '2026-03-12'
    },
    {
      id: 'u-405',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'SPU-3',
      model: 'Secondary Power Unit (34.5kV Substation)',
      progress: 70,
      status: 'Ongoing',
      system: 'Electrical',
      notes: 'SF6 gas circuit breaker positioning and grounding grid verification.',
      targetDate: '2026-08-30',
      updatedAt: '2026-04-11'
    },
    {
      id: 'u-406',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      unitId: 'Street Lights & Ring',
      model: 'Solar-Grid Tied Perimeter & Logistics Bay',
      progress: 88,
      status: 'Punchlist',
      system: 'Exterior',
      notes: 'Light pole lux level surveys and dusk-to-dawn photodiode commissioning.',
      targetDate: '2026-05-30',
      updatedAt: '2026-04-19'
    }
  ],
  inventory: [
    {
      id: 'inv-1',
      equipment: 'Submersible Deep-Well Pump Station (15HP)',
      specs: 'Grundfos SP-30 Series, 460V 3-Phase, 120 GPM @ 280ft head',
      location: 'Oakwood Pump House Station #1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      status: 'Operational',
      quantity: 2,
      notes: 'Installed with soft-starter control panel and pressure transducer.',
      lastInspected: '2026-04-10'
    },
    {
      id: 'inv-2',
      equipment: '4K Panoramic Perimeter CCTV Cameras',
      specs: 'Hikvision DarkFighter IP67, AI Vehicle & Person Recognition, IR 80m',
      location: 'Main Gate & Perimeter Fence East',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      status: 'Operational',
      quantity: 16,
      notes: 'Connected to Guardhouse 32-channel NVR with 16TB raid array.',
      lastInspected: '2026-04-15'
    },
    {
      id: 'inv-3',
      equipment: 'Duplex Hydro-Pneumatic Booster Pump',
      specs: 'Wilo Helix V1604, Dual 7.5kW, Variable Speed Inverter Control',
      location: 'Pinecrest Utilities Basement',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      status: 'Operational',
      quantity: 1,
      notes: 'Delivers stable 60 PSI across all 6 high-elevation housing units.',
      lastInspected: '2026-04-05'
    },
    {
      id: 'inv-4',
      equipment: 'Perimeter Smart PTZ CCTV Surveillance',
      specs: 'Dahua 32x Optical Zoom Starlight PTZ, Auto-tracking, Solar Backup',
      location: 'North Perimeter Boundary',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      status: 'Deployed',
      quantity: 8,
      notes: 'Fiber optic ring backbone linked to central security console.',
      lastInspected: '2026-04-14'
    },
    {
      id: 'inv-5',
      equipment: 'Commercial Swimming Pool Filtration System',
      specs: 'Hayward Commercial High-Rate Sand Filter (36in) with Dual 3HP Pumps',
      location: 'Pool Plant Room Level 1',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      status: 'Operational',
      quantity: 1,
      notes: 'Equipped with UV sterilizer and automated chlorine dosing injector.',
      lastInspected: '2026-04-18'
    },
    {
      id: 'inv-6',
      equipment: '500kVA Standby Diesel Generator',
      specs: 'Cummins QSX15-G9, 230/400V, Soundproof Canopy 68dBA @ 7m',
      location: 'Basement Generator Vault',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      status: 'Operational',
      quantity: 2,
      notes: 'Integrated with automated fuel supply day-tank and ATS-1 switchgear.',
      lastInspected: '2026-04-12'
    },
    {
      id: 'inv-7',
      equipment: 'Closed-Loop Crossflow Cooling Tower (750 TR)',
      specs: 'Baltimore Aircoil FXV-442, Stainless Steel Basin, VFD Axial Fan',
      location: 'Roof Utility Platform Bay 2',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      status: 'Operational',
      quantity: 2,
      notes: 'Provides chiller condenser water loop for cleanroom precision AC units.',
      lastInspected: '2026-04-16'
    },
    {
      id: 'inv-8',
      equipment: 'Emergency Generator Set (1250kVA)',
      specs: 'Caterpillar 3512B Heavy Fuel/Diesel, 4160V High Voltage Output',
      location: 'Central Power Station Bay 1',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      status: 'Operational',
      quantity: 1,
      notes: 'Main primary backup for cleanroom manufacturing line; synchronized to grid.',
      lastInspected: '2026-03-28'
    },
    {
      id: 'inv-9',
      equipment: 'Secondary Power Unit SPU-3 Substation Transformer',
      specs: 'ABB 2500kVA Cast Resin Dry-Type Transformer 34.5kV to 460V',
      location: 'Substation Enclosure SPU-3',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      status: 'Deployed',
      quantity: 1,
      notes: 'Pre-commissioning insulation resistance and dielectric oil tests verified.',
      lastInspected: '2026-04-11'
    },
    {
      id: 'inv-10',
      equipment: 'High-Output LED Street Light Luminaires (150W)',
      specs: 'Philips RoadFlair Gen2, IP66, 21,000 Lumens, NEMA 7-Pin Smart Receptacle',
      location: 'Logistics Access Loop & Perimeter',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      status: 'Under Maintenance',
      quantity: 42,
      notes: 'Replacing photocell sensors on poles 14 and 19 due to surge trip.',
      lastInspected: '2026-04-18'
    }
  ],
  team: [
    {
      id: 'tm-1',
      name: 'Engr. Marcus Vance',
      position: 'Project Executive Director',
      idPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 917 882 1940',
      email: 'm.vance@apexbuild-saas.com',
      sites: ['Oakwood Heights Subdivision', 'Horizon Grand Towers'],
      department: 'Executive Management'
    },
    {
      id: 'tm-2',
      name: 'Engr. Beatrice Morales',
      position: 'Senior Structural Civil Engineer',
      idPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 918 554 8219',
      email: 'b.morales@apexbuild-saas.com',
      sites: ['Oakwood Heights Subdivision', 'Pinecrest Valley Subdivision'],
      department: 'Civil Engineering'
    },
    {
      id: 'tm-3',
      name: 'Engr. Derrick Chen',
      position: 'Lead MEPFS / HVAC Consultant',
      idPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 920 331 4728',
      email: 'd.chen@apexbuild-saas.com',
      sites: ['Horizon Grand Towers', 'Apex Precision Industrial Facility'],
      department: 'Mechanical & Electrical'
    },
    {
      id: 'tm-4',
      name: 'Arch. Nicole Reyes',
      position: 'Chief Supervising Architect',
      idPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 927 662 9011',
      email: 'n.reyes@apexbuild-saas.com',
      sites: ['Oakwood Heights Subdivision', 'Pinecrest Valley Subdivision', 'Horizon Grand Towers'],
      department: 'Architecture & Design'
    },
    {
      id: 'tm-5',
      name: 'Engr. Rafael Santos',
      position: 'ELV & Automation Specialist',
      idPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 915 993 1244',
      email: 'r.santos@apexbuild-saas.com',
      sites: ['Oakwood Heights Subdivision', 'Apex Precision Industrial Facility'],
      department: 'ELV & Security Systems'
    },
    {
      id: 'tm-6',
      name: 'Carla Mendoza',
      position: 'Site Quality Assurance & Safety Manager',
      idPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      mobileNo: '+63 922 447 1823',
      email: 'c.mendoza@apexbuild-saas.com',
      sites: ['Pinecrest Valley Subdivision', 'Apex Precision Industrial Facility'],
      department: 'Health, Safety & Environment'
    }
  ],
  contacts: [
    {
      id: 'ct-1',
      name: 'Engr. Jonathan Cruz',
      company: 'Cruz Structural Consultants',
      position: 'Principal Structural Engineer',
      mobileNo: '+63 917 214 5588',
      email: 'j.cruz@cruzconsultants.ph'
    },
    {
      id: 'ct-2',
      name: 'Atty. Ma. Teresa Villanueva',
      company: 'Villanueva & Partners Law',
      position: 'Legal Counsel, Contracts',
      mobileNo: '+63 918 776 3421',
      email: 't.villanueva@vplaw.ph'
    },
    {
      id: 'ct-3',
      name: 'Mr. Kevin Lim',
      company: 'Meralco Business Center',
      position: 'Utility Account Manager',
      mobileNo: '+63 920 558 7304',
      email: 'k.lim@meralco.example'
    },
    {
      id: 'ct-4',
      name: 'Ms. Andrea Bautista',
      company: 'Philippine Institute of Civil Engineers',
      position: 'Membership & Compliance Officer',
      mobileNo: '+63 926 441 8892',
      email: 'a.bautista@pice.example'
    }
  ],
  contractors: [
    {
      id: 'cn-1',
      companyName: 'Ascend Steel Builders Inc.',
      staffCount: 45,
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      scopeOfWork: 'Structural steel erection, rebar installation, and post-tensioning works',
      contactPerson: 'Engr. Paolo Domingo',
      contactMobileNo: '+63 917 340 2288',
      contactEmail: 'p.domingo@ascendsteel.example'
    },
    {
      id: 'cn-2',
      companyName: 'PrimeFlow Plumbing & Fire Systems',
      staffCount: 28,
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      scopeOfWork: 'Plumbing rough-ins, fire sprinkler network, and booster pump installation',
      contactPerson: 'Engr. Lia Fernandez',
      contactMobileNo: '+63 918 220 9155',
      contactEmail: 'l.fernandez@primeflow.example'
    },
    {
      id: 'cn-3',
      companyName: 'VoltageWorks Electrical Services',
      staffCount: 36,
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      scopeOfWork: 'Underground distribution lines, panel boards, and perimeter street lighting',
      contactPerson: 'Mr. Ramon Garcia',
      contactMobileNo: '+63 920 661 4077',
      contactEmail: 'r.garcia@voltageworks.example'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      documentName: 'HLURB Subdivision Development Permit No. 2024-912',
      category: 'Permits & Clearances',
      status: 'Approved',
      uploadedBy: 'Engr. Beatrice Morales',
      fileSize: '4.8 MB',
      updatedAt: '2025-11-14'
    },
    {
      id: 'doc-2',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      documentName: 'DENR Environmental Compliance Certificate (ECC)',
      category: 'Environmental',
      status: 'Approved',
      uploadedBy: 'Carla Mendoza',
      fileSize: '2.4 MB',
      updatedAt: '2025-12-02'
    },
    {
      id: 'doc-3',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      documentName: 'Lot 1 & 6 Certificate of Occupancy & Handover Dossier',
      category: 'Handover Documents',
      status: 'Handover',
      uploadedBy: 'Arch. Nicole Reyes',
      fileSize: '8.1 MB',
      updatedAt: '2026-03-05'
    },
    {
      id: 'doc-4',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      documentName: 'NWRB Deep-Well Drilling & Water Rights Concession',
      category: 'Utility Permitting',
      status: 'Approved',
      uploadedBy: 'Engr. Derrick Chen',
      fileSize: '3.1 MB',
      updatedAt: '2026-01-08'
    },
    {
      id: 'doc-5',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      documentName: 'Block-1 Lot-1 Homeowner Warranty Package',
      category: 'Handover Documents',
      status: 'Handover',
      uploadedBy: 'Arch. Nicole Reyes',
      fileSize: '5.6 MB',
      updatedAt: '2026-01-25'
    },
    {
      id: 'doc-6',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      documentName: 'BFP Fire Safety Evaluation Clearance (FSEC)',
      category: 'Fire Life Safety',
      status: 'Approved',
      uploadedBy: 'Engr. Derrick Chen',
      fileSize: '6.2 MB',
      updatedAt: '2026-02-18'
    },
    {
      id: 'doc-7',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      documentName: 'Level 1-2 Units Certificate of Final Completion',
      category: 'Completion Certification',
      status: 'Received',
      uploadedBy: 'Engr. Marcus Vance',
      fileSize: '3.9 MB',
      updatedAt: '2026-04-10'
    },
    {
      id: 'doc-8',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      documentName: 'PEZA Factory Building Construction Authorization',
      category: 'Economic Zone Permits',
      status: 'Approved',
      uploadedBy: 'Engr. Marcus Vance',
      fileSize: '5.1 MB',
      updatedAt: '2025-09-18'
    },
    {
      id: 'doc-9',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      documentName: 'Cleanroom ISO-14644 Validation Report & Certificate',
      category: 'Quality Validation',
      status: 'Received',
      uploadedBy: 'Carla Mendoza',
      fileSize: '12.4 MB',
      updatedAt: '2026-03-08'
    },
    {
      id: 'doc-10',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      documentName: 'Generator-1 ATS Load Test Certificate & Warranties',
      category: 'Handover Documents',
      status: 'Handover',
      uploadedBy: 'Engr. Rafael Santos',
      fileSize: '4.3 MB',
      updatedAt: '2026-03-15'
    }
  ],
  drawings: [
    {
      id: 'drw-1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      drawingTitle: 'Site Development Master Plan & Lot Boundary Plot',
      system: 'Civil',
      revision: 'Rev-04',
      status: 'Approved',
      architectEngineer: 'Arch. Nicole Reyes / Geodetic Team',
      updatedAt: '2026-01-14'
    },
    {
      id: 'drw-2',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      drawingTitle: 'Submersible Deep-Well & Distribution Piping Network',
      system: 'Mechanical',
      revision: 'Rev-02',
      status: 'Approved',
      architectEngineer: 'Engr. Derrick Chen',
      updatedAt: '2026-02-10'
    },
    {
      id: 'drw-3',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      drawingTitle: 'Perimeter Smart CCTV & Optical Ring Line Layout',
      system: 'ELV',
      revision: 'Rev-03',
      status: 'Approved',
      architectEngineer: 'Engr. Rafael Santos',
      updatedAt: '2026-03-01'
    },
    {
      id: 'drw-4',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      drawingTitle: 'Block-1 Lot-1 to Lot-6 Architectural Floor Plans & Elevations',
      system: 'Units',
      revision: 'Rev-05',
      status: 'Handover',
      architectEngineer: 'Arch. Nicole Reyes',
      updatedAt: '2026-03-12'
    },
    {
      id: 'drw-5',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      drawingTitle: 'Highland Stormwater Drainage & Detention Basin Design',
      system: 'Civil',
      revision: 'Rev-03',
      status: 'Approved',
      architectEngineer: 'Engr. Beatrice Morales',
      updatedAt: '2026-02-22'
    },
    {
      id: 'drw-6',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      drawingTitle: 'Underground Power Feeders & Secondary Transformer Pads',
      system: 'Electrical',
      revision: 'Rev-02',
      status: 'Approved',
      architectEngineer: 'Engr. Rafael Santos',
      updatedAt: '2026-03-14'
    },
    {
      id: 'drw-7',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      drawingTitle: '4-Storey Structural Column Framing & Rebar Schedule',
      system: 'Civil',
      revision: 'Rev-06',
      status: 'Approved',
      architectEngineer: 'Engr. Beatrice Morales',
      updatedAt: '2026-01-20'
    },
    {
      id: 'drw-8',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      drawingTitle: 'Chilled Water Piping, FCU Locations & Condensate Run',
      system: 'HVAC',
      revision: 'Rev-04',
      status: 'Received',
      architectEngineer: 'Engr. Derrick Chen',
      updatedAt: '2026-04-05'
    },
    {
      id: 'drw-9',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      drawingTitle: 'Ground Floor Infinity Swimming Pool & Structural Decking',
      system: 'Exterior',
      revision: 'Rev-03',
      status: 'Approved',
      architectEngineer: 'Arch. Nicole Reyes',
      updatedAt: '2026-03-18'
    },
    {
      id: 'drw-10',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      drawingTitle: 'Cleanroom ISO-7 Air Handling Unit & Duct Velocity Balance',
      system: 'HVAC',
      revision: 'Rev-05',
      status: 'Approved',
      architectEngineer: 'Engr. Derrick Chen',
      updatedAt: '2026-02-25'
    },
    {
      id: 'drw-11',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      drawingTitle: 'SPU-3 34.5kV Substation Single-Line Diagram & ATS Schematics',
      system: 'Electrical',
      revision: 'Rev-04',
      status: 'Received',
      architectEngineer: 'Engr. Rafael Santos',
      updatedAt: '2026-04-02'
    },
    {
      id: 'drw-12',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      drawingTitle: 'Area-2 CNC Bay Heavy Duty Concrete Flooring & Trench Layout',
      system: 'Civil',
      revision: 'Rev-03',
      status: 'Approved',
      architectEngineer: 'Engr. Beatrice Morales',
      updatedAt: '2026-03-22'
    },
    {
      id: 'drw-13',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      drawingTitle: 'Industrial Perimeter Ring LED Street Light Wiring & Photocell Controls',
      system: 'Exterior',
      revision: 'Rev-02',
      status: 'Handover',
      architectEngineer: 'Engr. Rafael Santos',
      updatedAt: '2026-03-30'
    }
  ],
  // Activity Logs are MANUAL daily site records only (joint site inspections,
  // weather interruptions, deliveries, government audits, safety meetings, etc.)
  activities: [
    {
      id: 'act-1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      action: 'Joint Site Inspection',
      details: 'Joint walkthrough with client representative and structural consultant covering Block-1 Lot-2 punchlist items and pending ELV intercom tests.',
      category: 'Site Inspection',
      userName: 'Engr. David Ramos',
      timestamp: '2026-04-19T15:30:00.000Z'
    },
    {
      id: 'act-2',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      action: 'Heavy Rains Paused Construction',
      details: 'Continuous heavy rains from the southwest monsoon paused all aerial works and concrete pouring on 3F-4F for the entire day.',
      category: 'Weather',
      userName: 'Engr. Derrick Chen',
      timestamp: '2026-04-19T08:00:00.000Z'
    },
    {
      id: 'act-3',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      action: 'Delivery of Gardening Plants',
      details: '120 golden bamboo pots and 25 ornamental palms delivered for the clubhouse landscape zone; unloading supervised by site foreman.',
      category: 'Deliveries',
      userName: 'Engr. Beatrice Morales',
      timestamp: '2026-04-18T10:45:00.000Z'
    },
    {
      id: 'act-4',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      action: 'Government Engineer Audit',
      details: 'DPWH and LGU building officials conducted a surprise audit of fire exits, structural permits, and scaffolding safety compliance in Bay-2.',
      category: 'Government Audit',
      userName: 'Carla Mendoza',
      timestamp: '2026-04-18T09:15:00.000Z'
    },
    {
      id: 'act-5',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Subdivision',
      action: 'Concrete Pouring Completed',
      details: 'Block-1 Lot-4 slab-on-grade pouring completed (32 cubic meters) with 28-day concrete cylinder samples taken by QC inspector.',
      category: 'General',
      userName: 'Engr. David Ramos',
      timestamp: '2026-04-17T16:20:00.000Z'
    },
    {
      id: 'act-6',
      siteId: 'proj-3',
      siteName: 'Horizon Grand Towers',
      action: 'Safety Toolbox Meeting',
      details: 'Morning toolbox meeting on tower crane signaling protocol and PPE compliance; 42 site workers in attendance.',
      category: 'Safety',
      userName: 'Engr. Derrick Chen',
      timestamp: '2026-04-17T07:30:00.000Z'
    },
    {
      id: 'act-7',
      siteId: 'proj-4',
      siteName: 'Apex Precision Industrial Facility',
      action: 'Delivery of Structural Steel Plates',
      details: '48 sheets of 6mm steel plates and angle bars delivered for the Area-2 CNC bay trench lining; mill certificates on file.',
      category: 'Deliveries',
      userName: 'Carla Mendoza',
      timestamp: '2026-04-16T11:10:00.000Z'
    },
    {
      id: 'act-8',
      siteId: 'proj-2',
      siteName: 'Pinecrest Valley Subdivision',
      action: 'Site Progress Meeting',
      details: 'Weekly coordination meeting with foremen, QC, and safety officers; sidewalk gutter works rescheduled to next billing cycle.',
      category: 'General',
      userName: 'Engr. Beatrice Morales',
      timestamp: '2026-04-15T14:00:00.000Z'
    }
  ],
  todos: [
    {
      id: 'todo-1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Executive Village',
      dateAssigned: '2026-04-18',
      name: 'Engr. David Ramos',
      task: 'Verify structural rebar spacing on Block-1 Lot 4 column footing',
      dueDate: '2026-04-22',
      notes: 'Ensure compliance with DPWH standard code and seismic tie specifications.',
      status: 'In Progress',
      createdAt: '2026-04-18T08:00:00.000Z',
      updatedAt: '2026-04-18T08:00:00.000Z'
    },
    {
      id: 'todo-2',
      siteId: 'proj-2',
      siteName: 'Horizon Grand Towers Condominium',
      dateAssigned: '2026-04-17',
      name: 'Engr. Derrick Chen',
      task: 'Calibrate auxiliary smoke evacuation dampers on 4F Unit-4',
      dueDate: '2026-04-20',
      notes: 'Coordinate with ELV fire alarm technician for simultaneous strobe test.',
      status: 'Pending',
      createdAt: '2026-04-17T09:30:00.000Z',
      updatedAt: '2026-04-17T09:30:00.000Z'
    },
    {
      id: 'todo-3',
      siteId: 'proj-4',
      siteName: 'Apex Precision Logistics & Manufacturing Hub',
      dateAssigned: '2026-04-15',
      name: 'Carla Mendoza',
      task: 'Inspect emergency eyewash stations & fire suppression dry valves in Bay 2',
      dueDate: '2026-04-19',
      notes: 'Weekly safety certification checklist submission to DOLE-BWC.',
      status: 'Completed',
      createdAt: '2026-04-15T11:00:00.000Z',
      updatedAt: '2026-04-19T10:15:00.000Z'
    },
    {
      id: 'todo-4',
      siteId: 'proj-3',
      siteName: 'Serenity Hills Mountain Estate',
      dateAssigned: '2026-04-16',
      name: 'Engr. Rafael Santos',
      task: 'Review retaining wall drainage perforated PVC layout at Ridge-1',
      dueDate: '2026-04-21',
      notes: 'Heavy rainfall forecasted next week; confirm geotextile wrap layer thickness.',
      status: 'In Progress',
      createdAt: '2026-04-16T14:00:00.000Z',
      updatedAt: '2026-04-16T14:00:00.000Z'
    },
    {
      id: 'todo-5',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Executive Village',
      dateAssigned: '2026-04-14',
      name: 'Arch. Nicole Reyes',
      task: 'Client punchlist walkthrough inspection for Block-1 Lot 7',
      dueDate: '2026-04-18',
      notes: 'Prepare punchlist sign-off binder with warranty certificates.',
      status: 'Completed',
      createdAt: '2026-04-14T10:00:00.000Z',
      updatedAt: '2026-04-18T16:00:00.000Z'
    }
  ],
  schedules: [
    {
      id: 'sched-1',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Executive Village',
      date: '2026-04-22',
      activity: 'Ready-Mix Concrete Pouring for Block-2 Foundation',
      attendees: 'Engr. David Ramos, Concreting Crew Alpha (8 pax), QC Batching Inspector',
      notes: 'Pumping truck arrives at 07:00 AM. Slump test and cylinder test samples required.',
      status: 'Scheduled',
      createdAt: '2026-04-18T08:30:00.000Z',
      updatedAt: '2026-04-18T08:30:00.000Z'
    },
    {
      id: 'sched-2',
      siteId: 'proj-2',
      siteName: 'Horizon Grand Towers Condominium',
      date: '2026-04-23',
      activity: 'Bureau of Fire Protection (BFP) Final Safety Inspection',
      attendees: 'Chief Safety Officer, Engr. Derrick Chen, BFP Inspectorate Team',
      notes: 'Wet standpipe pressure test, fire alarm annunciator panel demonstration, and sprinkler flow testing.',
      status: 'Scheduled',
      createdAt: '2026-04-17T11:20:00.000Z',
      updatedAt: '2026-04-17T11:20:00.000Z'
    },
    {
      id: 'sched-3',
      siteId: 'proj-4',
      siteName: 'Apex Precision Logistics & Manufacturing Hub',
      date: '2026-04-21',
      activity: '1250kVA Emergency GenSet Full Load Bank Testing',
      attendees: 'Carla Mendoza, Cummins Power Technical Rep, Meralco Field Liaison',
      notes: 'Run GenSet on 100% inductive load bank for 4 consecutive hours.',
      status: 'In Progress',
      createdAt: '2026-04-16T15:00:00.000Z',
      updatedAt: '2026-04-21T09:00:00.000Z'
    },
    {
      id: 'sched-4',
      siteId: 'proj-3',
      siteName: 'Serenity Hills Mountain Estate',
      date: '2026-04-25',
      activity: 'Soil Compaction & Core Density Testing - Access Arterial Road',
      attendees: 'Engr. Rafael Santos, Geotechnical Testing Lab Technicians',
      notes: 'Nuclear density gauge test every 50 meters along Road Lot 2.',
      status: 'Scheduled',
      createdAt: '2026-04-18T13:40:00.000Z',
      updatedAt: '2026-04-18T13:40:00.000Z'
    },
    {
      id: 'sched-5',
      siteId: 'proj-1',
      siteName: 'Oakwood Heights Executive Village',
      date: '2026-04-19',
      activity: 'Pre-Turnover Joint Walkthrough with Homeowner Block-1 Lot 6',
      attendees: 'Arch. Nicole Reyes, Client Relations Head, Property Buyer',
      notes: 'All items marked Punchlist rectified; key turnover handover completed.',
      status: 'Completed',
      createdAt: '2026-04-15T09:00:00.000Z',
      updatedAt: '2026-04-19T17:00:00.000Z'
    }
  ]
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Memory cache
let dbState: DatabaseState = JSON.parse(JSON.stringify(initialData));

// Initialize local file persistence
function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with initial in case new tables were introduced
      dbState = { ...initialData, ...parsed };

      if (!dbState.todos || dbState.todos.length === 0) {
        dbState.todos = initialData.todos;
      }
      if (!dbState.schedules || dbState.schedules.length === 0) {
        dbState.schedules = initialData.schedules;
      }
      // Ensure activity log collection exists
      if (!dbState.activities) {
        dbState.activities = initialData.activities;
      }

      // Normalize legacy activity logs so every manual record carries its Site
      dbState.activities = dbState.activities.map(a => ({
        ...a,
        siteId: a.siteId || '',
        siteName: a.siteName || 'Unassigned'
      }));

      // Ensure seeded users exist with correct passwords if missing
      const adminExists = dbState.users.some(u => u.username.toLowerCase() === 'admin');
      const managerExists = dbState.users.some(u => u.username.toLowerCase() === 'manager');
      const staffExists = dbState.users.some(u => u.username.toLowerCase() === 'staff');

      if (!adminExists || !managerExists || !staffExists) {
        dbState.users = initialData.users;
        saveStorage();
      }
    } else {
      saveStorage();
    }
  } catch (err) {
    console.error('Storage initialization notice:', err);
    dbState = JSON.parse(JSON.stringify(initialData));
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

initStorage();

// Optional Supabase Client initialization
let supabase: SupabaseClient | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Connected to remote Supabase instance at:', process.env.SUPABASE_URL);
  } catch (e) {
    console.warn('Supabase initialization fallback to built-in storage:', e);
  }
}

export const db = {
  getState: () => dbState,
  save: () => saveStorage(),
  supabase
};
