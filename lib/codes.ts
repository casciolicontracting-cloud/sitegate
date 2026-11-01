// Code and regulation reference library.
//
// These are pointers to where a requirement lives, with a plain-language note on
// what the section covers. They are NOT a substitute for the code text. The site
// supervisor or a qualified professional confirms the applicable requirement in the
// current consolidated edition before relying on it. Versioned so a project can be
// pinned to the edition its permit was issued under.

export type CodeKind = 'OBC' | 'Electrical' | 'Gas' | 'Warranty' | 'Safety' | 'Standard' | 'Utility';

export interface CodeRef {
  id: string;
  kind: CodeKind;
  label: string; // e.g. "OBC Div. B 9.15"
  title: string;
  covers: string; // plain-language summary of scope, not the requirement itself
  url?: string;
}

export const OBC_EDITION = '2024 Ontario Building Code (O. Reg. 163/24), as amended';
const OBC_URL = 'https://www.ontario.ca/laws/regulation/r24163';

const obc = (id: string, label: string, title: string, covers: string): CodeRef => ({
  id, kind: 'OBC', label: `OBC ${label}`, title, covers, url: OBC_URL,
});

export const CODES: Record<string, CodeRef> = {
  'C1.3.5': obc('C1.3.5', 'Div. C 1.3.5', 'Notices and inspections', 'The permit holder must notify the chief building official at each prescribed construction stage so the work can be inspected before it proceeds or is covered.'),
  'B9.4': obc('B9.4', 'Div. B 9.4', 'Structural requirements', 'Loads, spans and design basis for Part 9 structural members; when engineered design is required instead.'),
  'B9.7': obc('B9.7', 'Div. B 9.7', 'Windows, doors and skylights', 'Window and door performance, installation, glazing, and protection against falls at low sills.'),
  'B9.8': obc('B9.8', 'Div. B 9.8', 'Stairs, ramps, handrails and guards', 'Rise, run, width, headroom, landings, handrail heights and continuity, guard heights and openings.'),
  'B9.9': obc('B9.9', 'Div. B 9.9', 'Means of egress', 'Exits and egress, including the bedroom egress window provisions.'),
  'B9.10': obc('B9.10', 'Div. B 9.10', 'Fire protection', 'Fire separations (including house-to-attached-garage), fire stopping, and smoke alarms.'),
  'B9.12': obc('B9.12', 'Div. B 9.12', 'Excavation', 'Excavation, depth of foundations relative to frost penetration, and backfill.'),
  'B9.13': obc('B9.13', 'Div. B 9.13', 'Dampproofing, waterproofing and soil gas control', 'Moisture protection of foundation walls and floors, and soil gas (radon) control.'),
  'B9.14': obc('B9.14', 'Div. B 9.14', 'Drainage', 'Foundation drainage, drainage tile or pipe, granular layers, sumps and surface drainage.'),
  'B9.15': obc('B9.15', 'Div. B 9.15', 'Footings and foundations', 'Footing sizes, foundation wall thickness and reinforcement, and anchorage of the building to the foundation.'),
  'B9.16': obc('B9.16', 'Div. B 9.16', 'Floors-on-ground', 'Slab base material, thickness, and moisture and soil gas protection under slabs.'),
  'B9.17': obc('B9.17', 'Div. B 9.17', 'Columns', 'Steel, wood and masonry columns supporting beams.'),
  'B9.18': obc('B9.18', 'Div. B 9.18', 'Crawl spaces', 'Crawl space access, ventilation or conditioning, and ground cover.'),
  'B9.19': obc('B9.19', 'Div. B 9.19', 'Roof spaces', 'Attic and roof-space venting and access hatches.'),
  'B9.20': obc('B9.20', 'Div. B 9.20', 'Masonry and ICF walls not in contact with the ground', 'Masonry veneer, ties, lintels over openings, flashing and weep holes.'),
  'B9.21': obc('B9.21', 'Div. B 9.21', 'Masonry and concrete chimneys and flues', 'Chimney construction, height, clearances and flue liners.'),
  'B9.22': obc('B9.22', 'Div. B 9.22', 'Fireplaces', 'Site-built and factory-built fireplace requirements, hearths and clearances.'),
  'B9.23': obc('B9.23', 'Div. B 9.23', 'Wood-frame construction', 'Framing members, spans, fastening, anchorage, lintels/headers, sheathing and subflooring.'),
  'B9.25': obc('B9.25', 'Div. B 9.25', 'Heat transfer, air leakage and condensation control', 'Insulation installation, air barrier systems and vapour barriers.'),
  'B9.26': obc('B9.26', 'Div. B 9.26', 'Roofing', 'Roof coverings, underlayment, eave protection and flashing.'),
  'B9.27': obc('B9.27', 'Div. B 9.27', 'Cladding', 'Exterior cladding, sheathing membranes, clearances and flashing at openings.'),
  'B9.28': obc('B9.28', 'Div. B 9.28', 'Stucco', 'Stucco materials, lath, application and clearances.'),
  'B9.29': obc('B9.29', 'Div. B 9.29', 'Interior wall and ceiling finishes', 'Gypsum board and other interior finishes, including in wet areas.'),
  'B9.30': obc('B9.30', 'Div. B 9.30', 'Flooring', 'Finish flooring and underlay requirements.'),
  'B9.31': obc('B9.31', 'Div. B 9.31', 'Plumbing facilities', 'Required plumbing fixtures and hot water supply for dwellings.'),
  'B9.32': obc('B9.32', 'Div. B 9.32', 'Ventilation', 'Mechanical ventilation of dwellings, exhaust fans, and HRV/ERV systems.'),
  'B9.33': obc('B9.33', 'Div. B 9.33', 'Heating and air-conditioning', 'Heating system design and installation, ducts, and carbon monoxide alarms.'),
  'B9.34': obc('B9.34', 'Div. B 9.34', 'Electrical facilities', 'Required lighting outlets and electrical facilities (installation itself is governed by the Ontario Electrical Safety Code).'),
  'B9.35': obc('B9.35', 'Div. B 9.35', 'Garages and carports', 'Garage construction, slabs, and separation from the dwelling.'),
  'B7': obc('B7', 'Div. B Part 7', 'Plumbing', 'Drainage, venting and water distribution systems, materials and testing.'),
  'B8': obc('B8', 'Div. B Part 8', 'Sewage systems', 'On-site sewage system design, installation and inspection.'),
  'B12': obc('B12', 'Div. B Part 12 / SB-12', 'Energy efficiency', 'Energy efficiency compliance path (prescriptive package or performance) under Supplementary Standard SB-12.'),
  'OESC': { id: 'OESC', kind: 'Electrical', label: 'OESC / ESA', title: 'Ontario Electrical Safety Code', covers: 'Electrical installation rules. A licensed electrical contractor files the notification of work with the Electrical Safety Authority, which inspects rough-in and final.', url: 'https://esasafe.com' },
  'GAS': { id: 'GAS', kind: 'Gas', label: 'TSSA / CSA B149.1', title: 'Natural gas and propane installation', covers: 'Gas piping and appliance installation by a TSSA-registered contractor with a certified gas technician, including pressure testing.', url: 'https://www.tssa.org' },
  'F280': { id: 'F280', kind: 'Standard', label: 'CSA F280', title: 'Heat loss / heat gain calculation', covers: 'Room-by-room heating and cooling load calculation used to size equipment and ducts; normally submitted with the permit.' },
  'TARION': { id: 'TARION', kind: 'Warranty', label: 'Tarion / ONHWPA', title: 'New home warranty', covers: 'Home enrolment before construction, pre-delivery inspection (PDI), Certificate of Completion and Possession, and warranty forms.', url: 'https://www.tarion.com' },
  'HCRA': { id: 'HCRA', kind: 'Warranty', label: 'HCRA', title: 'Builder licensing', covers: 'Ontario builders and vendors of new homes must be licensed by the Home Construction Regulatory Authority.', url: 'https://www.hcraontario.ca' },
  'OHSA': { id: 'OHSA', kind: 'Safety', label: 'OHSA O. Reg. 213/91', title: 'Construction projects regulation', covers: 'Site safety: notice of project, PPE, fall protection, trenching and excavation safety.', url: 'https://www.ontario.ca/laws/regulation/910213' },
  'ONECALL': { id: 'ONECALL', kind: 'Utility', label: 'Ontario One Call', title: 'Underground locates', covers: 'Locate requests for buried utilities before digging; private locates for owner-side services.', url: 'https://www.ontarioonecall.ca' },
};

export function codeRef(id: string): CodeRef | undefined {
  return CODES[id];
}
