export type IncidentType = 'police' | 'hazard' | 'jam' | 'closure' | 'accident';

export interface Incident {
  id: string;
  type: IncidentType;
  subtype?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  title: string;
  description?: string;
  idempotency_key?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  status?: 'active' | 'resolved' | 'expired';
  active: number;
}

export interface CreateIncidentPayload {
  type: IncidentType;
  subtype?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  title?: string;
  description?: string;
  idempotency_key?: string;
}

export interface VoteIncidentPayload {
  id: string;
  vote: 'up' | 'down';
}

export interface WazeCategory {
  type: IncidentType;
  label: string;
  emoji: string;
  color: string;
  desc: string;
  subtypes: string[];
}

export const WAZE_INCIDENT_CATEGORIES: WazeCategory[] = [
  {
    type: 'police',
    label: 'Police',
    emoji: '👮',
    color: 'from-blue-600 to-indigo-700',
    desc: 'Speed trap or patrol unit',
    subtypes: ['Speed Trap', 'Hidden', 'Visible', 'Other Side'],
  },
  {
    type: 'jam',
    label: 'Traffic',
    emoji: '🚗',
    color: 'from-rose-600 to-red-700',
    desc: 'Congestion & slow down',
    subtypes: ['Heavy Traffic', 'Standstill', 'Moderate Slowdown'],
  },
  {
    type: 'hazard',
    label: 'Hazard',
    emoji: '⚠️',
    color: 'from-amber-500 to-amber-700',
    desc: 'Pothole, debris or weather',
    subtypes: ['Object on Road', 'Pothole', 'Road Works', 'Heavy Rain'],
  },
  {
    type: 'accident',
    label: 'Crash',
    emoji: '💥',
    color: 'from-orange-600 to-red-600',
    desc: 'Vehicle collision or breakdown',
    subtypes: ['Minor Crash', 'Major Accident', 'Blocked Lane'],
  },
  {
    type: 'closure',
    label: 'Closure',
    emoji: '🚧',
    color: 'from-purple-600 to-indigo-800',
    desc: 'Closed road or ramp',
    subtypes: ['Road Closed', 'Ramp Closed', 'Detour in Effect'],
  },
];
