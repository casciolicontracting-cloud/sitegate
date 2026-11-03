import type { Box, Features, RoomKind, Topic } from './template';
import type { Schedule } from './progress';

export type Stage = 'drawings' | 'review' | 'active';

export interface Project {
  id: string;
  name: string;
  address: string | null;
  municipality: string | null;
  permit_no: string | null;
  owner_name: string | null;
  stage: Stage;
  features: Partial<Features>;
  code_edition: string;
  schedule: Schedule; // planned phase dates for the Gantt chart
  created_by: string | null;
  created_at: string;
}

export interface SheetNote {
  topic: Topic | string;
  text: string;
  where?: string;
  keep?: boolean;
  box?: Box;
  code?: string; // building code clause the sheet cites for this note, if any
}

/** A room Claude found on a floor plan sheet. */
export interface SheetRoom {
  name: string;
  level: string;
  kind: RoomKind;
  box?: Box;
}

/** A drawing view on a sheet (plan, section, detail, schedule) and the topic it covers. */
export interface SheetRegion {
  topic: Topic | string;
  label: string;
  box: Box;
}

export interface Sheet {
  id: string;
  project_id: string;
  sort: number;
  file_name: string | null;
  page: number | null;
  image_path: string | null;
  number: string;
  title: string;
  discipline: string;
  revision: string;
  topics: string[];
  notes: SheetNote[];
  questions: string[];
  features: Partial<Features>;
  rooms: SheetRoom[];
  regions: SheetRegion[];
  text_layer: string | null;
  status: 'new' | 'analyzing' | 'analyzed' | 'failed' | 'manual';
  analyzed_at: string | null;
  created_at: string;
}

export interface TaskState {
  project_id: string;
  task_key: string;
  checks: Record<string, boolean>;
  photos: string[];
  assignee_contact: string | null;
  started_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  sheet_revs: Record<string, string>;
  updated_at?: string;
}

export type InspStatus = 'pending' | 'requested' | 'scheduled' | 'passed' | 'failed' | 'na';

export interface Inspection {
  project_id: string;
  insp_key: string;
  status: InspStatus;
  requested_on: string | null;
  scheduled_on: string | null;
  inspector: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface Contact {
  id: string;
  project_id: string;
  trade: string;
  company: string | null;
  person: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export interface Note {
  id: string;
  project_id: string;
  task_key: string | null;
  phase_key: string | null;
  trade: string | null;
  kind: 'note' | 'question';
  body: string;
  answer: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Deficiency {
  id: string;
  project_id: string;
  task_key: string | null;
  phase_key: string | null;
  title: string;
  trade: string | null;
  status: 'open' | 'fixed' | 'closed';
  due_on: string | null;
  photo_path: string | null; // older rows; copied into photos by migration 0005
  photos: string[];
  created_by: string | null;
  created_at: string;
  closed_by: string | null;
  closed_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
}

export interface ProjectBundle {
  project: Project;
  sheets: Sheet[];
  tasks: Record<string, TaskState>;
  insps: Record<string, Inspection>;
  contacts: Contact[];
  notes: Note[];
  defs: Deficiency[];
  profiles: Record<string, Profile>;
}
