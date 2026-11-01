import { CHECK_CLAUSES, INSP_CLAUSES, TASK_CLAUSES } from './obc';

// Construction template for an Ontario custom home.
//
// The plan for a project is generated from this template plus the project's
// features (confirmed from the drawings). Phases are connected by stage gates:
// a phase unlocks only when every phase it requires has passed its gate.
// Within a phase, tasks can wait on other tasks ("after") and on inspections
// ("needs"); an inspection is a hold point recorded with its result.

export const TOPICS = [
  'site', 'grading', 'utilities', 'footings', 'foundation', 'underslab_plumbing', 'waterproofing',
  'framing_floor', 'framing_walls', 'roof_framing', 'roofing', 'windows_doors', 'stairs', 'hvac',
  'plumbing', 'electrical', 'gas', 'insulation', 'fire_separation', 'exterior_finish', 'masonry',
  'bathrooms', 'kitchen', 'interior_finish', 'energy', 'septic', 'fireplace',
] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABEL: Record<Topic, string> = {
  site: 'Site', grading: 'Grading', utilities: 'Utilities', footings: 'Footings', foundation: 'Foundation',
  underslab_plumbing: 'Under-slab plumbing', waterproofing: 'Waterproofing', framing_floor: 'Floor framing',
  framing_walls: 'Wall framing', roof_framing: 'Roof framing', roofing: 'Roofing', windows_doors: 'Windows & doors',
  stairs: 'Stairs', hvac: 'HVAC', plumbing: 'Plumbing', electrical: 'Electrical', gas: 'Gas',
  insulation: 'Insulation', fire_separation: 'Fire separation', exterior_finish: 'Exterior finish', masonry: 'Masonry',
  bathrooms: 'Bathrooms', kitchen: 'Kitchen', interior_finish: 'Interior finish', energy: 'Energy (SB-12)',
  septic: 'Septic / well', fireplace: 'Fireplace',
};

/** [x0, y0, x1, y1] as fractions of a sheet image. */
export type Box = [number, number, number, number];

export const ROOM_KINDS = [
  'kitchen', 'bathroom', 'bedroom', 'living', 'dining', 'office', 'laundry', 'hall', 'mechanical', 'storage', 'garage', 'other',
] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];
export const ROOM_KIND_LABEL: Record<RoomKind, string> = {
  kitchen: 'Kitchen', bathroom: 'Bathroom', bedroom: 'Bedroom', living: 'Living / family', dining: 'Dining', office: 'Office / den',
  laundry: 'Laundry / mud', hall: 'Hall / stair / foyer', mechanical: 'Mechanical', storage: 'Storage / closet', garage: 'Garage', other: 'Other',
};

/** A room confirmed from the floor plans. `sheet` and `box` locate it on a drawing. */
export interface Room {
  id: string;
  name: string;
  level: string;
  kind: RoomKind;
  sheet?: string;
  box?: Box;
}

export function roomId(name: string, level: string): string {
  return `${level}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'room';
}

export interface Features {
  rooms: Room[];
  storeys: number; // above-grade storeys
  foundation: 'basement' | 'walkout' | 'crawl' | 'slab';
  walls: 'poured' | 'icf' | 'block';
  garage: 'attached' | 'detached' | 'none';
  cladding: Array<'brick' | 'stone' | 'stucco' | 'siding'>;
  roof: 'asphalt' | 'metal' | 'other';
  heating: 'gas_forced' | 'heat_pump' | 'electric' | 'boiler';
  gas: boolean;
  hrv: boolean;
  fireplace: 'none' | 'gas' | 'wood';
  servicing: 'municipal' | 'septic_well';
  bathrooms: number;
}

export const DEFAULT_FEATURES: Features = {
  rooms: [], storeys: 2, foundation: 'basement', walls: 'poured', garage: 'attached', cladding: ['brick', 'siding'],
  roof: 'asphalt', heating: 'gas_forced', gas: true, hrv: true, fireplace: 'none', servicing: 'municipal', bathrooms: 3,
};

export const TRADES = [
  'General contractor', 'Surveyor', 'Excavator', 'Concrete / foundation', 'Waterproofing', 'Framer', 'Roofer',
  'Windows & doors', 'HVAC', 'Plumber', 'Electrician', 'Gas fitter', 'Insulation', 'Drywall', 'Masonry', 'Stucco',
  'Siding', 'Metal work (soffit, fascia, eaves)', 'Stairs & railings', 'Tile', 'Cabinets & counters', 'Flooring',
  'Trim & doors', 'Painter', 'Landscaping / grading', 'Septic installer', 'Energy advisor', 'Engineer',
  'Municipal building inspector', 'ESA inspector', 'Designer / architect', 'Owner',
] as const;

export type Authority = 'Municipal' | 'ESA' | 'TSSA contractor' | 'Engineer' | 'Energy advisor' | 'Health unit / municipality';

interface TaskDef {
  kind: 'task';
  id: string; // may contain {n} for repeated tasks
  name: string; // may contain {level} or {n}
  trade: string;
  topics: Topic[];
  codes: string[];
  checks: string[];
  after?: string[];
  needs?: string[]; // inspection ids that must be passed (or N/A)
  when?: (f: Features) => boolean;
  repeat?: 'storeys' | 'bathrooms';
  whenN?: (f: Features, n: number) => boolean;
  perRoom?: (r: Room) => string[]; // extra checks grouped under each confirmed room
}

interface InspDef {
  kind: 'insp';
  id: string;
  name: string;
  authority: Authority;
  codes: string[];
  after: string[]; // tasks that should be verified before requesting
  howTo: string;
  when?: (f: Features) => boolean;
}

interface PhaseDef {
  id: string;
  name: string;
  short: string;
  requires: string[];
  summary: string;
  items: Array<TaskDef | InspDef>;
}

const t = (d: Omit<TaskDef, 'kind'>): TaskDef => ({ kind: 'task', ...d });
const i = (d: Omit<InspDef, 'kind'>): InspDef => ({ kind: 'insp', ...d });
const MUNI = 'Notify the municipality through its inspection booking line or portal, quoting the permit number. Work must not be covered until passed.';
const hasBrick = (f: Features) => f.cladding.includes('brick') || f.cladding.includes('stone');
const finished = (r: Room) => !['garage', 'mechanical', 'storage'].includes(r.kind);

// Room-by-room checks added to a task once the rooms are confirmed from the floor plans.
const ROOM_CHECKS = {
  hvac: (r: Room) => (r.kind === 'garage' ? [] : ['Supply and return locations match the HVAC plan']),
  plumb: (r: Room) => (['kitchen', 'bathroom', 'laundry', 'mechanical'].includes(r.kind) ? ['Fixture rough-ins at the locations shown', 'Drain and supply sizes per plan'] : []),
  elec: (r: Room) => [
    'Outlets, switches and light boxes per the electrical plan',
    ...(r.kind === 'kitchen' ? ['Counter receptacles and appliance circuits'] : []),
    ...(r.kind === 'bathroom' ? ['GFCI protection and exhaust fan circuit'] : []),
    ...(r.kind === 'bedroom' ? ['Smoke / CO alarm location per plan'] : []),
  ],
  board: () => ['Board hung: moisture-resistant in wet areas, fire-rated where required'],
  floor: (r: Room) => (finished(r) && r.kind !== 'bathroom' ? ['Flooring per selection, transitions at doorways'] : []),
  trim: (r: Room) => (finished(r) ? ['Doors, casing and baseboard installed'] : []),
  paint: (r: Room) => (finished(r) ? ['Painted per palette, touch-ups done'] : []),
};

export const PHASES: PhaseDef[] = [
  {
    id: 'pre', name: 'Pre-construction & permits', short: 'Pre-con', requires: [],
    summary: 'Drawings, permits, licensing, survey, utilities and the site safety plan.',
    items: [
      t({ id: 'pre-drawings', name: 'Drawing set confirmed for construction', trade: 'General contractor', topics: ['site'], codes: [],
        checks: ['Every sheet in the register is the latest revision', 'Stamped structural / engineered sheets are included', 'Truss and engineered floor layouts requested from supplier', 'Open drawing questions logged and sent to the designer'] }),
      t({ id: 'pre-permit', name: 'Building permit issued and posted', trade: 'General contractor', topics: ['site'], codes: ['C1.3.5'],
        checks: ['Permit card posted where visible from the street', 'Permit-stamped drawings kept on site', 'Permit conditions reviewed and noted', 'Required inspection stages on the permit card match this app', 'Variances / committee of adjustment decisions on file (if any)'] }),
      t({ id: 'pre-hcra', name: 'Builder licence and Tarion enrolment', trade: 'General contractor', topics: ['site'], codes: ['HCRA', 'TARION'],
        checks: ['HCRA builder licence current', 'Home enrolled with Tarion before construction starts', 'Owner agreement and Tarion addendum signed'] }),
      t({ id: 'pre-survey', name: 'Survey and stake-out', trade: 'Surveyor', topics: ['site', 'grading'], codes: [],
        checks: ['Lot bars verified by Ontario Land Surveyor', 'Building corners and offsets staked', 'Setbacks match the site plan', 'Benchmark and top-of-foundation elevation set from grading plan'] }),
      t({ id: 'pre-soils', name: 'Soils report reviewed', trade: 'Engineer', topics: ['footings', 'foundation'], codes: ['B9.4', 'B9.15'],
        checks: ['Bearing capacity matches footing design', 'Groundwater and drainage recommendations noted', 'Recommendations shared with excavator and foundation trade'] }),
      t({ id: 'pre-utilities', name: 'Utilities and service upgrades', trade: 'General contractor', topics: ['utilities'], codes: [],
        checks: ['Existing services located and documented (sizes, locations)', 'Water / sewer connection permits applied for', 'Hydro service or upgrade application submitted', 'Gas service application submitted', 'Temporary power arranged'] }),
      t({ id: 'pre-safety', name: 'Site safety plan', trade: 'General contractor', topics: ['site'], codes: ['OHSA'],
        checks: ['Notice of Project filed with the Ministry of Labour (if required)', 'Site fencing, security and access set', 'Minimum PPE posted at entrance', 'Emergency contacts and nearest hospital posted', 'Fall protection and excavation safety plan'] }),
    ],
  },
  {
    id: 'site', name: 'Site preparation', short: 'Site prep', requires: ['pre'],
    summary: 'Locates, erosion control, access, excavation and temporary services.',
    items: [
      t({ id: 'site-locates', name: 'Underground locates', trade: 'General contractor', topics: ['utilities', 'site'], codes: ['ONECALL'],
        checks: ['Locate request submitted', 'Locates received and valid for the dig dates', 'Private locates for owner-side services', 'Locate sheets on site'] }),
      t({ id: 'site-erosion', name: 'Tree protection and erosion control', trade: 'Landscaping / grading', topics: ['site', 'grading'], codes: [],
        checks: ['Silt fence installed per site / grading plan', 'Tree protection hoarding installed', 'Construction entrance / mud mat', 'Conservation authority permit conditions met (if regulated)'] }),
      t({ id: 'site-access', name: 'Curb cut and site access', trade: 'General contractor', topics: ['site'], codes: [],
        checks: ['Curb cut / road occupancy permit (if applicable)', 'Driveway location matches site plan', 'Delivery and parking plan'] }),
      t({ id: 'site-septic', name: 'Septic system and well', trade: 'Septic installer', topics: ['septic'], codes: ['B8'],
        when: (f) => f.servicing === 'septic_well',
        checks: ['Septic permit issued', 'Bed location and clearances match approved design', 'Well location and separation from bed verified', 'Well record on file'] }),
      t({ id: 'site-excavate', name: 'Excavation', trade: 'Excavator', topics: ['footings', 'site'], codes: ['B9.12', 'OHSA'], after: ['site-locates'],
        checks: ['Excavated to depth and elevation on drawings', 'Footing bearing on undisturbed soil', 'Footing depth below frost per drawings and 9.12', 'Excavation sloped or shored safely', 'Water controlled / dewatered'] }),
      t({ id: 'site-temp', name: 'Temporary services', trade: 'General contractor', topics: ['site'], codes: [],
        checks: ['Temporary power', 'Washroom', 'Waste bin', 'Water supply'] }),
    ],
  },
  {
    id: 'found', name: 'Foundation', short: 'Foundation', requires: ['site'],
    summary: 'Footings, walls, under-slab services, waterproofing, drainage, backfill and slab.',
    items: [
      t({ id: 'f-forms', name: 'Footing layout, forms and reinforcing', trade: 'Concrete / foundation', topics: ['footings'], codes: ['B9.15', 'B9.4'],
        checks: ['Layout matches foundation plan dimensions', 'Footing width and depth per drawings', 'Steps in footing per detail', 'Pad footings at point loads located', 'Rebar size, spacing and cover per structural'] }),
      i({ id: 'insp-footing', name: 'Footings, before concrete', authority: 'Municipal', codes: ['C1.3.5'], after: ['f-forms'], howTo: MUNI }),
      t({ id: 'f-pour', name: 'Place footing concrete', trade: 'Concrete / foundation', topics: ['footings'], codes: ['B9.15'], needs: ['insp-footing'],
        checks: ['Concrete strength matches spec (keep tickets)', 'Keyway and dowels placed', 'Protected from freezing'] }),
      t({ id: 'f-walls', name: 'Foundation walls', trade: 'Concrete / foundation', topics: ['foundation'], codes: ['B9.15', 'B9.20'], after: ['f-pour'],
        checks: ['Wall thickness and height per drawings', 'Reinforcing per drawings', 'Window bucks, beam pockets and sleeves located', 'Anchor bolts / straps at spacing shown', 'Walls plumb, top elevation checked'] }),
      t({ id: 'f-underslab', name: 'Under-slab plumbing', trade: 'Plumber', topics: ['underslab_plumbing', 'plumbing'], codes: ['B7'], when: (f) => f.foundation !== 'crawl',
        checks: ['Drains per under-floor plumbing plan', 'Slope and cleanouts', 'Sump / ejector pit located', 'Test performed and holding'] }),
      i({ id: 'insp-plumb-ug', name: 'Under-slab plumbing, before cover', authority: 'Municipal', codes: ['C1.3.5', 'B7'], after: ['f-underslab'], howTo: MUNI, when: (f) => f.foundation !== 'crawl' }),
      t({ id: 'f-damp', name: 'Dampproofing / waterproofing', trade: 'Waterproofing', topics: ['waterproofing'], codes: ['B9.13'], after: ['f-walls'],
        checks: ['Membrane / coating type matches spec', 'Full coverage to grade line', 'Drainage board / layer installed', 'Penetrations and tie holes sealed'] }),
      t({ id: 'f-drain', name: 'Foundation drainage', trade: 'Waterproofing', topics: ['waterproofing', 'grading'], codes: ['B9.14'], after: ['f-walls'],
        checks: ['Weeping tile at footing, correct side and slope', 'Clear stone cover and filter fabric', 'Outlet to sump or storm per drawings'] }),
      i({ id: 'insp-found', name: 'Foundation, before backfill', authority: 'Municipal', codes: ['C1.3.5'], after: ['f-damp', 'f-drain'], howTo: MUNI }),
      t({ id: 'f-backfill', name: 'Backfill', trade: 'Excavator', topics: ['foundation', 'grading'], codes: ['B9.12'], needs: ['insp-found'],
        checks: ['Floor framing or bracing in place before backfill (per engineer)', 'Backfill material free of debris and frozen material', 'Placed in lifts, walls not overloaded', 'Rough grade sloped away from house'] }),
      t({ id: 'f-slab', name: 'Basement / garage slab', trade: 'Concrete / foundation', topics: ['foundation', 'energy'], codes: ['B9.16', 'B9.13', 'B12'], after: ['f-backfill'],
        checks: ['Granular base compacted', 'Soil gas / vapour barrier lapped and sealed', 'Under-slab insulation per SB-12 package (if required)', 'Radon rough-in where required', 'Slab thickness and finish'] }),
    ],
  },
  {
    id: 'frame', name: 'Framing', short: 'Framing', requires: ['found'],
    summary: 'Sill, floor systems, walls for each storey, beams and lintels, roof and rough stairs.',
    items: [
      t({ id: 'fr-sill', name: 'Sill plate and anchorage', trade: 'Framer', topics: ['framing_floor', 'foundation'], codes: ['B9.23', 'B9.15'],
        checks: ['Sill gasket installed', 'Anchors / straps fastened per spec', 'Sill level and square to layout'] }),
      t({ id: 'fr-floor-{n}', name: 'Floor system: {level}', trade: 'Framer', topics: ['framing_floor'], codes: ['B9.23', 'B9.4', 'B9.17'], repeat: 'storeys',
        whenN: (f, n) => n > 1 || f.foundation !== 'slab', after: ['fr-sill'],
        checks: ['Joist layout matches floor plan / engineered layout', 'Beams, columns and point loads per drawings', 'Hangers and bearing lengths', 'Openings framed and headed off', 'Subfloor glued and fastened'] }),
      t({ id: 'fr-ext-{n}', name: 'Exterior walls: {level}', trade: 'Framer', topics: ['framing_walls', 'windows_doors'], codes: ['B9.23'], repeat: 'storeys',
        checks: ['Stud size and spacing per drawings', 'Headers / lintels match window opening chart', 'Sheathing type and fastening', 'Corners and bracing'] }),
      t({ id: 'fr-int-{n}', name: 'Interior walls: {level}', trade: 'Framer', topics: ['framing_walls'], codes: ['B9.23'], repeat: 'storeys',
        checks: ['Layout matches floor plan', 'Bearing walls align with beams below', 'Blocking for cabinets, grab bars, railings and TV mounts'] }),
      t({ id: 'fr-roof', name: 'Roof framing and sheathing', trade: 'Framer', topics: ['roof_framing'], codes: ['B9.23', 'B9.19'],
        checks: ['Trusses per truss layout and engineered sheets', 'Permanent bracing per truss drawings', 'Girder trusses and hangers', 'Roof-to-wall connections', 'Sheathing with clips, attic vent openings provided'] }),
      t({ id: 'fr-stairs', name: 'Rough stair openings and stringers', trade: 'Framer', topics: ['stairs'], codes: ['B9.8'],
        checks: ['Opening size and headroom match stair drawings', 'Rise and run laid out per drawings'] }),
      t({ id: 'fr-garage', name: 'Attached garage framing', trade: 'Framer', topics: ['fire_separation', 'framing_walls'], codes: ['B9.35', 'B9.10'], when: (f) => f.garage === 'attached',
        checks: ['House-to-garage wall and ceiling framed for required separation', 'Door to house located per drawings'] }),
      i({ id: 'insp-eng-frame', name: 'Engineer site review of structure (if required)', authority: 'Engineer', codes: ['B9.4'], after: ['fr-roof'], howTo: 'Book the design engineer for site review of engineered elements. Mark N/A if not required by the drawings or permit.' }),
    ],
  },
  {
    id: 'env', name: 'Building envelope', short: 'Envelope', requires: ['frame'],
    summary: 'Roofing, sheathing membrane, windows and exterior doors. Ends weathertight.',
    items: [
      t({ id: 'e-roof', name: 'Roofing', trade: 'Roofer', topics: ['roofing'], codes: ['B9.26'],
        checks: ['Eave protection and underlayment', 'Valley, wall and chimney flashing', 'Roof covering per spec and manufacturer', 'Roof vents per attic venting design'] }),
      t({ id: 'e-wrap', name: 'Sheathing membrane / exterior air barrier', trade: 'Framer', topics: ['exterior_finish', 'insulation'], codes: ['B9.27', 'B9.25'],
        checks: ['Laps shingled to shed water', 'Seams taped per manufacturer', 'Penetrations sealed'] }),
      t({ id: 'e-windows', name: 'Windows', trade: 'Windows & doors', topics: ['windows_doors', 'energy'], codes: ['B9.7', 'B9.9', 'B12'], after: ['e-wrap'],
        checks: ['Delivery matches window schedule (sizes, styles)', 'Thermal rating meets SB-12 package', 'Rough openings match opening chart', 'Sill pans and flashing per detail', 'Bedroom egress windows sized correctly', 'Installed and shimmed per manufacturer'] }),
      t({ id: 'e-doors', name: 'Exterior doors', trade: 'Windows & doors', topics: ['windows_doors'], codes: ['B9.7'], after: ['e-wrap'],
        checks: ['Delivery matches door schedule', 'Sill pan and flashing', 'Installed square, hardware operates'] }),
    ],
  },
  {
    id: 'mep', name: 'Mechanical, electrical & plumbing rough-in', short: 'MEP rough-in', requires: ['env'],
    summary: 'HVAC, plumbing, electrical and gas run in parallel; all inspected before close-in.',
    items: [
      t({ id: 'm-hvac', perRoom: ROOM_CHECKS.hvac, name: 'HVAC rough-in', trade: 'HVAC', topics: ['hvac', 'energy'], codes: ['B9.33', 'B9.32', 'F280', 'B12'],
        checks: ['Heat loss / gain calculation and duct design on file', 'Duct layout matches HVAC drawing', 'Supply and return sizes per design', 'Duct joints sealed', 'Equipment specs match approved furnace / heat pump', 'Combustion venting clearances'] }),
      t({ id: 'm-hrv', name: 'HRV / ERV and exhaust ducting', trade: 'HVAC', topics: ['hvac'], codes: ['B9.32'], when: (f) => f.hrv,
        checks: ['Unit location per drawings', 'Supply / exhaust duct routing', 'Exterior hoods located away from contaminants', 'Bath fans ducted to exterior'] }),
      t({ id: 'm-plumb', perRoom: ROOM_CHECKS.plumb, name: 'Plumbing rough-in', trade: 'Plumber', topics: ['plumbing', 'bathrooms', 'kitchen'], codes: ['B7', 'B9.31'],
        checks: ['Drain, waste and vent layout', 'Water distribution and shut-offs', 'Fixture locations match drawings', 'Water service sizing on file', 'Test applied and holding'] }),
      t({ id: 'm-elec', perRoom: ROOM_CHECKS.elec, name: 'Electrical rough-in', trade: 'Electrician', topics: ['electrical', 'kitchen'], codes: ['OESC', 'B9.34', 'B9.10', 'B9.33'],
        checks: ['ESA notification filed by electrical contractor', 'Panel location and service size', 'Boxes and circuits per electrical plan', 'Smoke and CO alarm locations wired and interconnected', 'Kitchen appliance circuits per appliance specs', 'Low voltage / data runs'] }),
      t({ id: 'm-gas', name: 'Gas piping', trade: 'Gas fitter', topics: ['gas', 'kitchen'], codes: ['GAS'], when: (f) => f.gas,
        checks: ['Piping sized for connected appliances', 'Appliance locations confirmed', 'Pressure test performed and tagged'] }),
      t({ id: 'm-fireplace', name: 'Fireplace and chimney', trade: 'HVAC', topics: ['fireplace'], codes: ['B9.22', 'B9.21', 'GAS'], when: (f) => f.fireplace !== 'none',
        checks: ['Unit matches spec', 'Clearances to combustibles per manufacturer', 'Venting / chimney installed per manufacturer and code'] }),
      i({ id: 'insp-framing', name: 'Structural framing and HVAC rough-in', authority: 'Municipal', codes: ['C1.3.5'], after: ['m-hvac'], howTo: MUNI }),
      i({ id: 'insp-plumb-rough', name: 'Plumbing rough-in', authority: 'Municipal', codes: ['C1.3.5', 'B7'], after: ['m-plumb'], howTo: MUNI }),
      i({ id: 'insp-esa-rough', name: 'Electrical rough-in', authority: 'ESA', codes: ['OESC'], after: ['m-elec'], howTo: 'Your licensed electrical contractor requests the ESA rough-in inspection under their notification of work.' }),
      i({ id: 'insp-gas', name: 'Gas piping pressure test', authority: 'TSSA contractor', codes: ['GAS'], after: ['m-gas'], howTo: 'Gas contractor performs and records the pressure test; keep the tag or record.', when: (f) => f.gas }),
    ],
  },
  {
    id: 'ins', name: 'Insulation & air sealing', short: 'Insulation', requires: ['mep'],
    summary: 'Insulation, vapour and air barriers, fire separations. Inspected before drywall.',
    items: [
      t({ id: 'i-ins', name: 'Insulation', trade: 'Insulation', topics: ['insulation', 'energy'], codes: ['B9.25', 'B12'],
        checks: ['R-values match SB-12 compliance package', 'Rim joists insulated and sealed', 'No gaps, voids or compression', 'Installed per manufacturer'] }),
      t({ id: 'i-vb', name: 'Vapour barrier and air sealing', trade: 'Insulation', topics: ['insulation', 'energy'], codes: ['B9.25'], after: ['i-ins'],
        checks: ['Poly lapped and sealed at joints', 'Electrical boxes and penetrations sealed', 'Top plates and rim sealed'] }),
      t({ id: 'i-firesep', name: 'Garage fire separation and fire stopping', trade: 'Insulation', topics: ['fire_separation'], codes: ['B9.10', 'B9.35'], when: (f) => f.garage === 'attached',
        checks: ['Gas-proofing at penetrations', 'Fire stopping at openings', 'Door to house meets requirements'] }),
      i({ id: 'insp-insul', name: 'Insulation and vapour barrier', authority: 'Municipal', codes: ['C1.3.5', 'B9.25'], after: ['i-vb'], howTo: MUNI }),
      i({ id: 'insp-blower-mid', name: 'Mid-construction air leakage test (if required)', authority: 'Energy advisor', codes: ['B12'], after: ['i-vb'], howTo: 'Book the energy advisor if your SB-12 compliance path calls for testing. Mark N/A if not required.' }),
    ],
  },
  {
    id: 'dry', name: 'Drywall', short: 'Drywall', requires: ['ins'],
    summary: 'Board, fire-rated assemblies and finishing.',
    items: [
      t({ id: 'd-hang', perRoom: ROOM_CHECKS.board, name: 'Hang drywall', trade: 'Drywall', topics: ['interior_finish', 'fire_separation'], codes: ['B9.29', 'B9.10'],
        checks: ['Moisture-resistant board in wet areas', 'Fire-rated board where separations required', 'Fastening pattern per manufacturer'] }),
      i({ id: 'insp-firesep', name: 'Fire separations and closures', authority: 'Municipal', codes: ['C1.3.5', 'B9.10'], after: ['d-hang'], howTo: MUNI, when: (f) => f.garage === 'attached' }),
      t({ id: 'd-finish', name: 'Tape, finish and prime', trade: 'Drywall', topics: ['interior_finish'], codes: ['B9.29'], after: ['d-hang'],
        checks: ['Level of finish per spec', 'Corners and beads straight', 'Primed and ready for paint'] }),
    ],
  },
  {
    id: 'ext', name: 'Exterior finishes', short: 'Exterior', requires: ['env'],
    summary: 'Masonry, stucco, siding, trim and final grading. Runs alongside the interior.',
    items: [
      t({ id: 'x-masonry', name: 'Masonry veneer', trade: 'Masonry', topics: ['masonry', 'exterior_finish'], codes: ['B9.20'], when: hasBrick,
        checks: ['Steel lintels sized per drawings with required end bearing', 'Brick ties at spacing shown', 'Base and opening flashing with weep holes', 'Brick sills sloped and sealed', 'Air space kept clear of mortar'] }),
      t({ id: 'x-stucco', name: 'Stucco', trade: 'Stucco', topics: ['exterior_finish'], codes: ['B9.28'], when: (f) => f.cladding.includes('stucco'),
        checks: ['System matches technical spec', 'Drainage plane and lath', 'Clearance to grade', 'Control joints and flashing'] }),
      t({ id: 'x-siding', name: 'Siding', trade: 'Siding', topics: ['exterior_finish'], codes: ['B9.27'], when: (f) => f.cladding.includes('siding'),
        checks: ['Product and colour per spec', 'Installed per manufacturer', 'Flashing at openings and transitions', 'Clearances to grade and roof'] }),
      t({ id: 'x-trim', name: 'Window trim, soffit, fascia and eavestroughs', trade: 'Metal work (soffit, fascia, eaves)', topics: ['exterior_finish', 'roofing'], codes: ['B9.27'],
        checks: ['Window trim and flashing details', 'Vented soffit where attic venting requires', 'Downspouts discharge away from foundation'] }),
      t({ id: 'x-grade', name: 'Final grading, driveway and walks', trade: 'Landscaping / grading', topics: ['grading', 'site'], codes: ['B9.14'],
        checks: ['Final grades match lot grading plan', 'Grade slopes away from foundation', 'Window wells drained', 'Driveway and walks'] }),
      i({ id: 'insp-grading', name: 'Lot grading certificate', authority: 'Engineer', codes: [], after: ['x-grade'], howTo: 'Surveyor or engineer certifies grading for the municipality (often needed for deposit release).' }),
    ],
  },
  {
    id: 'int', name: 'Interior finishes', short: 'Interior', requires: ['dry'],
    summary: 'Stairs and railings, bathrooms, kitchen, flooring, trim and paint.',
    items: [
      t({ id: 'n-stairs', name: 'Stairs and railings', trade: 'Stairs & railings', topics: ['stairs'], codes: ['B9.8'],
        checks: ['Rise, run, width and headroom match stair drawings', 'Handrail height and continuity', 'Guard height and opening sizes', 'Railing spec and finish'] }),
      t({ id: 'n-bath-{n}', name: 'Bathroom {n}', trade: 'Tile', topics: ['bathrooms'], codes: ['B9.31', 'B9.29', 'B9.32'], repeat: 'bathrooms',
        checks: ['Shower waterproofing per manufacturer, flood-tested', 'Blocking for grab bars and accessories', 'Exhaust fan ducted outside and working', 'Finishes match selections'] }),
      t({ id: 'n-kitchen', name: 'Kitchen', trade: 'Cabinets & counters', topics: ['kitchen'], codes: ['B9.32'],
        checks: ['Cabinets match cabinet plan', 'Appliance sizes fit openings', 'Gas and electrical at each appliance match specs', 'Range hood vented outside', 'Countertops templated and installed per surface plan'] }),
      t({ id: 'n-floor', perRoom: ROOM_CHECKS.floor, name: 'Flooring', trade: 'Flooring', topics: ['interior_finish'], codes: ['B9.30'],
        checks: ['Subfloor flat and dry', 'Product and layout per selections', 'Transitions'] }),
      t({ id: 'n-trim', perRoom: ROOM_CHECKS.trim, name: 'Interior doors and trim', trade: 'Trim & doors', topics: ['interior_finish'], codes: [],
        checks: ['Doors hung and swing per plan', 'Casing and baseboard per style guide'] }),
      t({ id: 'n-paint', perRoom: ROOM_CHECKS.paint, name: 'Paint', trade: 'Painter', topics: ['interior_finish'], codes: [],
        checks: ['Colours match paint palette', 'Coats and sheen per spec', 'Touch-ups after trades'] }),
    ],
  },
  {
    id: 'fin', name: 'Final inspections & handover', short: 'Handover', requires: ['int', 'ext'],
    summary: 'Commissioning, final inspections, occupancy, Tarion PDI and closeout documents.',
    items: [
      t({ id: 'z-alarms', name: 'Smoke and CO alarms tested', trade: 'Electrician', topics: ['electrical'], codes: ['B9.10', 'B9.33'],
        checks: ['Each alarm tested', 'Interconnection works'] }),
      t({ id: 'z-hvac', name: 'HVAC and HRV commissioning', trade: 'HVAC', topics: ['hvac'], codes: ['B9.33', 'B9.32'],
        checks: ['System balanced, report on file', 'HRV / ERV balanced', 'Thermostat and controls set'] }),
      t({ id: 'z-plumb', name: 'Plumbing final', trade: 'Plumber', topics: ['plumbing'], codes: ['B7'],
        checks: ['Fixtures set and tested', 'Hot water temperature and backflow devices'] }),
      i({ id: 'insp-plumb-final', name: 'Plumbing final', authority: 'Municipal', codes: ['C1.3.5'], after: ['z-plumb'], howTo: MUNI }),
      i({ id: 'insp-esa-final', name: 'Electrical final', authority: 'ESA', codes: ['OESC'], after: ['z-alarms'], howTo: 'Electrical contractor requests the ESA final.' }),
      t({ id: 'z-energy', name: 'Energy compliance documents', trade: 'Energy advisor', topics: ['energy'], codes: ['B12'],
        checks: ['Final air leakage test (if required)', 'SB-12 compliance documents submitted'] }),
      i({ id: 'insp-occupancy', name: 'Occupancy', authority: 'Municipal', codes: ['C1.3.5'], after: ['z-alarms', 'z-hvac', 'z-plumb'], howTo: MUNI }),
      t({ id: 'z-pdi', name: 'Tarion pre-delivery inspection', trade: 'General contractor', topics: ['site'], codes: ['TARION'], needs: ['insp-occupancy'],
        checks: ['PDI walkthrough completed with owner', 'PDI form signed and items recorded as deficiencies', 'Certificate of Completion and Possession issued'] }),
      t({ id: 'z-docs', name: 'Closeout documents', trade: 'General contractor', topics: ['site'], codes: [],
        checks: ['Manuals and warranties handed over', 'As-built changes recorded', 'Keys, codes and service contacts'] }),
      i({ id: 'insp-final', name: 'Final building inspection', authority: 'Municipal', codes: ['C1.3.5'], after: ['z-docs'], howTo: MUNI }),
    ],
  },
];

// Flow chart layout: rows of phase ids. "ext" sits in the right lane alongside the interior work.
export const FLOW_ROWS: string[][] = [['pre'], ['site'], ['found'], ['frame'], ['env'], ['mep', 'ext'], ['ins'], ['dry'], ['int'], ['fin']];

// ---------------------------------------------------------------------------
// Plan generation

export interface PlanTask {
  kind: 'task';
  key: string;
  name: string;
  phase: string;
  trade: string;
  topics: Topic[];
  codes: string[];
  /** Base checks have ids "0", "1"… (stable); room checks are "<roomId>:<n>". */
  checks: PlanCheck[];
  /** Room sub-sections of the checklist, in display order. */
  groups: CheckGroup[];
  /** The room this whole task is for (e.g. one bathroom). */
  room?: Room;
  /** 2024 OBC clauses for the task as a whole (see lib/obc.ts). */
  clauses: string[];
  after: string[];
  needs: string[];
}

export interface PlanCheck { id: string; text: string; group?: string; clauses: string[] }
export interface CheckGroup { id: string; label: string; room: Room }

export interface PlanInsp {
  kind: 'insp';
  key: string;
  name: string;
  phase: string;
  authority: Authority;
  codes: string[];
  after: string[];
  howTo: string;
  clauses: string[];
}

export interface PlanPhase {
  id: string;
  name: string;
  short: string;
  requires: string[];
  summary: string;
  items: Array<PlanTask | PlanInsp>;
  tasks: PlanTask[];
  insps: PlanInsp[];
}

export interface Plan {
  phases: PlanPhase[];
  byPhase: Record<string, PlanPhase>;
  tasks: Record<string, PlanTask>;
  insps: Record<string, PlanInsp>;
}

const LEVELS = ['First floor', 'Second floor', 'Third floor', 'Fourth floor'];

export function normalizeFeatures(raw: Partial<Features> | null | undefined): Features {
  const f = { ...DEFAULT_FEATURES, ...(raw || {}) } as Features;
  f.storeys = Math.min(4, Math.max(1, Math.round(Number(f.storeys) || 1)));
  f.bathrooms = Math.min(10, Math.max(0, Math.round(Number(f.bathrooms) || 0)));
  if (!Array.isArray(f.cladding)) f.cladding = [];
  f.rooms = Array.isArray(f.rooms) ? f.rooms.filter((r) => r && r.id && r.name) : [];
  return f;
}

/** Rooms ordered by level (as first seen) then name, for consistent sub-sections. */
export function sortRooms(rooms: Room[]): Room[] {
  const levels = [...new Set(rooms.map((r) => r.level))];
  return [...rooms].sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level) || a.name.localeCompare(b.name));
}

export const roomLabel = (r: Room) => (r.level ? `${r.name} · ${r.level}` : r.name);

export function buildPlan(rawFeatures: Partial<Features> | null | undefined): Plan {
  const f = normalizeFeatures(rawFeatures);
  const phases: PlanPhase[] = [];
  const tasks: Record<string, PlanTask> = {};
  const insps: Record<string, PlanInsp> = {};
  const rooms = sortRooms(f.rooms);
  const baths = rooms.filter((r) => r.kind === 'bathroom');

  for (const ph of PHASES) {
    const items: Array<PlanTask | PlanInsp> = [];
    for (const it of ph.items) {
      if (it.when && !it.when(f)) continue;
      if (it.kind === 'insp') {
        const pi: PlanInsp = { kind: 'insp', key: it.id, name: it.name, phase: ph.id, authority: it.authority, codes: it.codes, after: it.after, howTo: it.howTo, clauses: INSP_CLAUSES[it.id] || [] };
        items.push(pi);
        insps[pi.key] = pi;
        continue;
      }
      // Bathrooms follow the confirmed rooms when there are any, otherwise the count.
      const byRoom = it.repeat === 'bathrooms' && baths.length > 0;
      const count = it.repeat === 'storeys' ? f.storeys : it.repeat === 'bathrooms' ? (byRoom ? baths.length : f.bathrooms) : 1;
      for (let n = 1; n <= count; n++) {
        if (it.repeat && it.whenN && !it.whenN(f, n)) continue;
        const sub = (s: string) => s.replace(/\{n\}/g, String(n)).replace(/\{level\}/g, LEVELS[n - 1] || `Level ${n}`);
        const room = byRoom ? baths[n - 1] : undefined;
        const checks: PlanCheck[] = it.checks.map((text, i) => ({ id: String(i), text, clauses: CHECK_CLAUSES[it.id]?.[i] || [] }));
        const groups: CheckGroup[] = [];
        if (it.perRoom) {
          for (const r of rooms) {
            const extra = it.perRoom(r);
            if (!extra.length) continue;
            groups.push({ id: r.id, label: roomLabel(r), room: r });
            extra.forEach((text, j) => checks.push({ id: `${r.id}:${j}`, text, group: r.id, clauses: [] }));
          }
        }
        const pt: PlanTask = {
          kind: 'task', key: sub(it.id), name: room ? `Bathroom: ${roomLabel(room)}` : sub(it.name), phase: ph.id, trade: it.trade,
          topics: it.topics, codes: it.codes, checks, groups, room, clauses: TASK_CLAUSES[it.id] || [], after: (it.after || []).map(sub), needs: it.needs || [],
        };
        items.push(pt);
        tasks[pt.key] = pt;
      }
    }
    phases.push({ id: ph.id, name: ph.name, short: ph.short, requires: ph.requires, summary: ph.summary, items,
      tasks: items.filter((x): x is PlanTask => x.kind === 'task'), insps: items.filter((x): x is PlanInsp => x.kind === 'insp') });
  }

  // Drop references to tasks / inspections that were filtered out for this house.
  for (const p of phases) {
    for (const x of p.items) {
      x.after = x.after.filter((k) => tasks[k]);
      if (x.kind === 'task') x.needs = x.needs.filter((k) => insps[k]);
    }
  }
  const byPhase = Object.fromEntries(phases.map((p) => [p.id, p]));
  return { phases, byPhase, tasks, insps };
}
