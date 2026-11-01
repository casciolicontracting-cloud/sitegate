// 2024 Ontario Building Code (O. Reg. 163/24) clause references, generated from the
// 2024 Building Code Compendium (Vol. 1: the Code; Vol. 2: Supplementary Standards).
//
// Each entry is a pointer: clause number, its heading, where it is in the Compendium,
// and our own plain-language note on what it covers. No code text is reproduced here;
// people open their copy of the Compendium at the page to read the requirement.
// Regenerate rather than hand-editing the tables below.

export interface Clause {
  ref: string; // e.g. "Div. B 9.8.4.1."
  title: string; // the clause heading
  covers: string; // our own summary of what the clause deals with
  vol: 1 | 2; // Compendium volume
  page: number; // PDF page in that volume
}

export const OBC_COMPENDIUM = '2024 Building Code Compendium (January 16, 2025)';

export const CLAUSES: Record<string, Clause> = {
  "C1.3.1.6": {
    "ref": "Div. C 1.3.1.6.",
    "title": "Information to be Given to Tarion Warranty Corporation",
    "covers": "Builder must give the permit and enrolment details to Tarion for new homes.",
    "vol": 1,
    "page": 1129
  },
  "C1.3.2.1": {
    "ref": "Div. C 1.3.2.1.",
    "title": "Permit Posting",
    "covers": "Permit holder must post the permit (or a copy) on site where it can be seen.",
    "vol": 1,
    "page": 1130
  },
  "C1.3.2.2": {
    "ref": "Div. C 1.3.2.2.",
    "title": "Documentation on Site",
    "covers": "Approved drawings and documents must be kept available on site during construction.",
    "vol": 1,
    "page": 1130
  },
  "C1.3.3.2": {
    "ref": "Div. C 1.3.3.2.",
    "title": "Conditions for Residential Occupancy",
    "covers": "Conditions a new house must meet before it can be occupied before full completion.",
    "vol": 1,
    "page": 1132
  },
  "C1.3.3.4": {
    "ref": "Div. C 1.3.3.4.",
    "title": "Occupancy Permit — Certain Buildings of Residential Occupancy",
    "covers": "Occupancy permit rules for certain residential buildings.",
    "vol": 1,
    "page": 1132
  },
  "C1.3.5.1": {
    "ref": "Div. C 1.3.5.1.",
    "title": "Prescribed Notices",
    "covers": "The construction stages at which the permit holder must notify the building official.",
    "vol": 1,
    "page": 1137
  },
  "C1.3.5.3": {
    "ref": "Div. C 1.3.5.3.",
    "title": "Prescribed Inspections",
    "covers": "How soon the inspector must inspect after a notice, and what happens if not.",
    "vol": 1,
    "page": 1138
  },
  "C1.3.5.4": {
    "ref": "Div. C 1.3.5.4.",
    "title": "Construction of Sewage Systems",
    "covers": "Notices and inspections specific to building an on-site sewage system.",
    "vol": 1,
    "page": 1139
  },
  "B7.3.6.1": {
    "ref": "Div. B 7.3.6.1.",
    "title": "Tests and Inspection of Drainage or Venting Systems",
    "covers": "Which drainage and venting work must be tested and inspected before it is covered.",
    "vol": 1,
    "page": 633
  },
  "B7.3.6.4": {
    "ref": "Div. B 7.3.6.4.",
    "title": "Water Pressure Tests",
    "covers": "How a water test on drainage or venting piping is carried out.",
    "vol": 1,
    "page": 633
  },
  "B7.3.7.2": {
    "ref": "Div. B 7.3.7.2.",
    "title": "Pressure Tests of Potable Water Systems",
    "covers": "Pressure testing required for potable water piping before cover.",
    "vol": 1,
    "page": 634
  },
  "B7.4.7": {
    "ref": "Div. B 7.4.7.",
    "title": "Cleanouts",
    "covers": "Where cleanouts are required in drainage piping and how they must be sized and accessed.",
    "vol": 1,
    "page": 641
  },
  "B7.4.8": {
    "ref": "Div. B 7.4.8.",
    "title": "Minimum Slope and Length of Drainage Pipes",
    "covers": "Minimum slope and length limits for drainage pipes.",
    "vol": 1,
    "page": 643
  },
  "B7.4.9": {
    "ref": "Div. B 7.4.9.",
    "title": "Size of Drainage Pipes",
    "covers": "How drainage pipes are sized for the fixtures they serve.",
    "vol": 1,
    "page": 644
  },
  "B7.5.8": {
    "ref": "Div. B 7.5.8.",
    "title": "Sizing of Vent Pipes",
    "covers": "How vent pipes are sized.",
    "vol": 1,
    "page": 660
  },
  "B7.6.1": {
    "ref": "Div. B 7.6.1.",
    "title": "Arrangement of Piping",
    "covers": "Arrangement of water distribution piping, including shut-off valves.",
    "vol": 1,
    "page": 664
  },
  "B7.6.2": {
    "ref": "Div. B 7.6.2.",
    "title": "Protection from Contamination",
    "covers": "Protection of the potable water system from contamination, including backflow prevention.",
    "vol": 1,
    "page": 667
  },
  "B8.2.1": {
    "ref": "Div. B 8.2.1.",
    "title": "General Requirements",
    "covers": "General rules for sewage systems, including clearances to wells, lakes and buildings.",
    "vol": 1,
    "page": 682
  },
  "B8.7.2": {
    "ref": "Div. B 8.7.2.",
    "title": "Design and Construction Requirements",
    "covers": "Design and construction requirements for leaching beds.",
    "vol": 1,
    "page": 696
  },
  "B9.3.1.6": {
    "ref": "Div. B 9.3.1.6.",
    "title": "Compressive Strength",
    "covers": "Minimum concrete compressive strength for different uses (footings, walls, slabs, garages).",
    "vol": 1,
    "page": 717
  },
  "B9.3.1.9": {
    "ref": "Div. B 9.3.1.9.",
    "title": "Cold Weather Requirements",
    "covers": "Protecting fresh concrete during cold weather.",
    "vol": 1,
    "page": 718
  },
  "B9.4.1.1": {
    "ref": "Div. B 9.4.1.1.",
    "title": "General",
    "covers": "When structural members must be designed by an engineer instead of using Part 9 tables.",
    "vol": 1,
    "page": 722
  },
  "B9.4.4.1": {
    "ref": "Div. B 9.4.4.1.",
    "title": "Allowable Bearing Pressures",
    "covers": "Allowable bearing pressures for different soil and rock types under footings.",
    "vol": 1,
    "page": 724
  },
  "B9.4.4.3": {
    "ref": "Div. B 9.4.4.3.",
    "title": "High Water Table",
    "covers": "Extra measures needed where the water table is high.",
    "vol": 1,
    "page": 725
  },
  "B9.5.2.4": {
    "ref": "Div. B 9.5.2.4.",
    "title": "Stud Wall Reinforcement",
    "covers": "Reinforcement in the main bathroom walls so grab bars can be added later.",
    "vol": 1,
    "page": 726
  },
  "B9.5.5.1": {
    "ref": "Div. B 9.5.5.1.",
    "title": "Doorway Opening Sizes",
    "covers": "Minimum doorway opening sizes inside dwellings.",
    "vol": 1,
    "page": 729
  },
  "B9.7.2.3": {
    "ref": "Div. B 9.7.2.3.",
    "title": "Minimum Window Areas",
    "covers": "Minimum window (glazing) areas for rooms.",
    "vol": 1,
    "page": 736
  },
  "B9.7.3.3": {
    "ref": "Div. B 9.7.3.3.",
    "title": "Thermal Characteristics of Windows, Doors and Skylights",
    "covers": "Thermal performance of windows, doors and skylights.",
    "vol": 1,
    "page": 737
  },
  "B9.7.5.2": {
    "ref": "Div. B 9.7.5.2.",
    "title": "Resistance to Forced Entry for Doors",
    "covers": "Forced-entry resistance for exterior doors of dwellings.",
    "vol": 1,
    "page": 739
  },
  "B9.7.6.1": {
    "ref": "Div. B 9.7.6.1.",
    "title": "Installation of Windows, Doors and Skylights",
    "covers": "Installing windows, doors and skylights.",
    "vol": 1,
    "page": 740
  },
  "B9.7.6.2": {
    "ref": "Div. B 9.7.6.2.",
    "title": "Sealants, Trim and Flashing",
    "covers": "Sealants, trim and flashing around windows and doors.",
    "vol": 1,
    "page": 740
  },
  "B9.8.2.1": {
    "ref": "Div. B 9.8.2.1.",
    "title": "Stair Width",
    "covers": "Minimum stair widths.",
    "vol": 1,
    "page": 741
  },
  "B9.8.2.2": {
    "ref": "Div. B 9.8.2.2.",
    "title": "Height Over Stairs",
    "covers": "Minimum headroom over stairs.",
    "vol": 1,
    "page": 742
  },
  "B9.8.4.1": {
    "ref": "Div. B 9.8.4.1.",
    "title": "Dimensions for Risers",
    "covers": "Riser height limits for stairs.",
    "vol": 1,
    "page": 742
  },
  "B9.8.4.2": {
    "ref": "Div. B 9.8.4.2.",
    "title": "Dimensions for Rectangular Treads",
    "covers": "Run and tread depth limits for straight stairs.",
    "vol": 1,
    "page": 743
  },
  "B9.8.7.1": {
    "ref": "Div. B 9.8.7.1.",
    "title": "Required Handrails",
    "covers": "Where handrails are required on stairs and ramps.",
    "vol": 1,
    "page": 747
  },
  "B9.8.7.2": {
    "ref": "Div. B 9.8.7.2.",
    "title": "Continuity of Handrails",
    "covers": "Handrail continuity along a flight.",
    "vol": 1,
    "page": 748
  },
  "B9.8.7.4": {
    "ref": "Div. B 9.8.7.4.",
    "title": "Height of Handrails",
    "covers": "Handrail height range.",
    "vol": 1,
    "page": 748
  },
  "B9.8.7.7": {
    "ref": "Div. B 9.8.7.7.",
    "title": "Design and Attachment of Handrails",
    "covers": "How handrails are built and attached so they can take the required loads.",
    "vol": 1,
    "page": 748
  },
  "B9.8.8.1": {
    "ref": "Div. B 9.8.8.1.",
    "title": "Required Guards",
    "covers": "Where guards are required (stairs, landings, decks, floors above a drop).",
    "vol": 1,
    "page": 749
  },
  "B9.8.8.2": {
    "ref": "Div. B 9.8.8.2.",
    "title": "Loads on Guards",
    "covers": "Loads guards must be able to resist.",
    "vol": 1,
    "page": 750
  },
  "B9.8.8.3": {
    "ref": "Div. B 9.8.8.3.",
    "title": "Height of Guards",
    "covers": "Minimum guard heights.",
    "vol": 1,
    "page": 751
  },
  "B9.8.8.5": {
    "ref": "Div. B 9.8.8.5.",
    "title": "Openings in Guards",
    "covers": "Maximum openings through guards.",
    "vol": 1,
    "page": 751
  },
  "B9.9.10.1": {
    "ref": "Div. B 9.9.10.1.",
    "title": "Egress Windows or Doors for Bedrooms",
    "covers": "Egress window or door requirements for bedrooms.",
    "vol": 1,
    "page": 765
  },
  "B9.10.3.1": {
    "ref": "Div. B 9.10.3.1.",
    "title": "Fire-Resistance and Fire-Protection Ratings",
    "covers": "Fire-resistance ratings of assemblies, including gypsum board assemblies.",
    "vol": 1,
    "page": 770
  },
  "B9.10.9.6": {
    "ref": "Div. B 9.10.9.6.",
    "title": "General Requirements for Penetrations of Fire Separations",
    "covers": "Sealing penetrations through fire separations.",
    "vol": 1,
    "page": 775
  },
  "B9.10.9.18": {
    "ref": "Div. B 9.10.9.18.",
    "title": "Separation of Storage Garages",
    "covers": "Separating garages from other spaces; for a house's attached garage this includes a gas-tight air barrier.",
    "vol": 1,
    "page": 779
  },
  "B9.10.13.15": {
    "ref": "Div. B 9.10.13.15.",
    "title": "Doors Between Garages and Dwelling Units",
    "covers": "Requirements for the door between an attached garage and the house.",
    "vol": 1,
    "page": 786
  },
  "B9.10.19.1": {
    "ref": "Div. B 9.10.19.1.",
    "title": "Required Smoke Alarms",
    "covers": "Where smoke alarms are required in dwellings.",
    "vol": 1,
    "page": 800
  },
  "B9.10.19.3": {
    "ref": "Div. B 9.10.19.3.",
    "title": "Location of Smoke Alarms",
    "covers": "Location of smoke alarms (each storey, near bedrooms).",
    "vol": 1,
    "page": 800
  },
  "B9.10.19.4": {
    "ref": "Div. B 9.10.19.4.",
    "title": "Power Supply",
    "covers": "Power supply for smoke alarms.",
    "vol": 1,
    "page": 801
  },
  "B9.10.19.5": {
    "ref": "Div. B 9.10.19.5.",
    "title": "Interconnection of Smoke Alarms",
    "covers": "Interconnection of smoke alarms within a dwelling.",
    "vol": 1,
    "page": 801
  },
  "B9.10.22.2": {
    "ref": "Div. B 9.10.22.2.",
    "title": "Vertical Clearances Above Cooktops",
    "covers": "Vertical clearance above cooktops.",
    "vol": 1,
    "page": 804
  },
  "B9.12.1.1": {
    "ref": "Div. B 9.12.1.1.",
    "title": "Removal of Topsoil and Organic Matter",
    "covers": "Removing topsoil and organic material under the building.",
    "vol": 1,
    "page": 807
  },
  "B9.12.1.2": {
    "ref": "Div. B 9.12.1.2.",
    "title": "Standing Water",
    "covers": "Keeping excavations free of standing water.",
    "vol": 1,
    "page": 807
  },
  "B9.12.1.3": {
    "ref": "Div. B 9.12.1.3.",
    "title": "Protection from Freezing",
    "covers": "Keeping the bottom of excavations from freezing during construction.",
    "vol": 1,
    "page": 807
  },
  "B9.12.1.4": {
    "ref": "Div. B 9.12.1.4.",
    "title": "Precautions During Excavation",
    "covers": "Precautions to keep excavations safe and stable.",
    "vol": 1,
    "page": 807
  },
  "B9.12.2.1": {
    "ref": "Div. B 9.12.2.1.",
    "title": "Excavation to Undisturbed Soil",
    "covers": "Footings must bear on undisturbed soil, rock or compacted fill.",
    "vol": 1,
    "page": 808
  },
  "B9.12.2.2": {
    "ref": "Div. B 9.12.2.2.",
    "title": "Minimum Depth of Foundations",
    "covers": "Minimum depth of foundations, related to soil type and frost.",
    "vol": 1,
    "page": 808
  },
  "B9.12.3.1": {
    "ref": "Div. B 9.12.3.1.",
    "title": "Placement of Backfill",
    "covers": "Placing backfill so it does not damage the foundation.",
    "vol": 1,
    "page": 809
  },
  "B9.12.3.3": {
    "ref": "Div. B 9.12.3.3.",
    "title": "Deleterious Debris and Boulders",
    "covers": "Keeping debris and boulders out of backfill.",
    "vol": 1,
    "page": 809
  },
  "B9.12.3.4": {
    "ref": "Div. B 9.12.3.4.",
    "title": "Lateral Support of Foundation Wall",
    "covers": "Lateral support of foundation walls before backfilling.",
    "vol": 1,
    "page": 809
  },
  "B9.13.2.2": {
    "ref": "Div. B 9.13.2.2.",
    "title": "Dampproofing Materials",
    "covers": "Acceptable dampproofing materials.",
    "vol": 1,
    "page": 810
  },
  "B9.13.2.4": {
    "ref": "Div. B 9.13.2.4.",
    "title": "Application of Dampproofing Material",
    "covers": "Applying dampproofing to foundation walls.",
    "vol": 1,
    "page": 811
  },
  "B9.13.2.6": {
    "ref": "Div. B 9.13.2.6.",
    "title": "Dampproofing of Floors-on-Ground",
    "covers": "Dampproofing under floors-on-ground.",
    "vol": 1,
    "page": 812
  },
  "B9.13.3.2": {
    "ref": "Div. B 9.13.3.2.",
    "title": "Waterproofing Materials",
    "covers": "Acceptable waterproofing materials where waterproofing is required.",
    "vol": 1,
    "page": 812
  },
  "B9.13.4.2": {
    "ref": "Div. B 9.13.4.2.",
    "title": "Protection from Soil Gas Ingress",
    "covers": "Protection of floors-on-ground and walls against soil gas (radon) entry.",
    "vol": 1,
    "page": 814
  },
  "B9.13.4.3": {
    "ref": "Div. B 9.13.4.3.",
    "title": "Providing for the Rough-in for a Subfloor Depressurization System",
    "covers": "Rough-in for a future subfloor depressurization (radon) system.",
    "vol": 1,
    "page": 814
  },
  "B9.14.2.1": {
    "ref": "Div. B 9.14.2.1.",
    "title": "Foundation Wall Drainage",
    "covers": "Drainage at the outside of foundation walls.",
    "vol": 1,
    "page": 815
  },
  "B9.14.3.3": {
    "ref": "Div. B 9.14.3.3.",
    "title": "Installation",
    "covers": "Installing drainage tile or pipe at the footings.",
    "vol": 1,
    "page": 816
  },
  "B9.14.5.1": {
    "ref": "Div. B 9.14.5.1.",
    "title": "Drainage Disposal",
    "covers": "Where foundation drainage is allowed to discharge.",
    "vol": 1,
    "page": 817
  },
  "B9.14.5.2": {
    "ref": "Div. B 9.14.5.2.",
    "title": "Sump Pits",
    "covers": "Sump pit construction and covers.",
    "vol": 1,
    "page": 817
  },
  "B9.14.6.1": {
    "ref": "Div. B 9.14.6.1.",
    "title": "Surface Drainage",
    "covers": "Grading the site to drain surface water away from the building.",
    "vol": 1,
    "page": 818
  },
  "B9.14.6.3": {
    "ref": "Div. B 9.14.6.3.",
    "title": "Window Wells",
    "covers": "Draining window wells.",
    "vol": 1,
    "page": 818
  },
  "B9.14.6.5": {
    "ref": "Div. B 9.14.6.5.",
    "title": "Downspouts",
    "covers": "Downspout discharge away from the building.",
    "vol": 1,
    "page": 818
  },
  "B9.15.3.4": {
    "ref": "Div. B 9.15.3.4.",
    "title": "Basic Footing Widths and Areas",
    "covers": "Basic minimum footing widths and areas.",
    "vol": 1,
    "page": 820
  },
  "B9.15.3.7": {
    "ref": "Div. B 9.15.3.7.",
    "title": "Adjustments to Footing Area for Columns",
    "covers": "Footing area adjustments for columns and point loads.",
    "vol": 1,
    "page": 822
  },
  "B9.15.3.8": {
    "ref": "Div. B 9.15.3.8.",
    "title": "Footing Thickness",
    "covers": "Minimum footing thickness.",
    "vol": 1,
    "page": 822
  },
  "B9.15.3.9": {
    "ref": "Div. B 9.15.3.9.",
    "title": "Step Footings",
    "covers": "Stepped footings.",
    "vol": 1,
    "page": 822
  },
  "B9.15.4.2": {
    "ref": "Div. B 9.15.4.2.",
    "title": "Foundation Wall Thickness and Required Lateral Support",
    "covers": "Foundation wall thickness and when walls need lateral support.",
    "vol": 1,
    "page": 822
  },
  "B9.15.4.6": {
    "ref": "Div. B 9.15.4.6.",
    "title": "Extension Above Ground Level",
    "covers": "How far foundation walls must extend above finished ground.",
    "vol": 1,
    "page": 826
  },
  "B9.15.6.3": {
    "ref": "Div. B 9.15.6.3.",
    "title": "Form Ties",
    "covers": "Removing form ties flush with the concrete surface.",
    "vol": 1,
    "page": 828
  },
  "B9.16.2.1": {
    "ref": "Div. B 9.16.2.1.",
    "title": "Required Installation of Granular Fill",
    "covers": "Granular fill required under floors-on-ground.",
    "vol": 1,
    "page": 829
  },
  "B9.16.4.1": {
    "ref": "Div. B 9.16.4.1.",
    "title": "Surface Finish",
    "covers": "Finish of concrete floor surfaces.",
    "vol": 1,
    "page": 829
  },
  "B9.16.4.3": {
    "ref": "Div. B 9.16.4.3.",
    "title": "Thickness",
    "covers": "Minimum slab thickness.",
    "vol": 1,
    "page": 830
  },
  "B9.17.3.1": {
    "ref": "Div. B 9.17.3.1.",
    "title": "Size and Thickness",
    "covers": "Size and thickness of steel columns.",
    "vol": 1,
    "page": 831
  },
  "B9.19.1.1": {
    "ref": "Div. B 9.19.1.1.",
    "title": "Required Venting",
    "covers": "Where attic and roof-space venting is required.",
    "vol": 1,
    "page": 835
  },
  "B9.19.1.2": {
    "ref": "Div. B 9.19.1.2.",
    "title": "Vent Requirements",
    "covers": "Amount and distribution of attic vent area.",
    "vol": 1,
    "page": 835
  },
  "B9.20.5.2": {
    "ref": "Div. B 9.20.5.2.",
    "title": "Lintels or Arches",
    "covers": "Lintels or arches over openings in masonry and veneer.",
    "vol": 1,
    "page": 840
  },
  "B9.20.9.5": {
    "ref": "Div. B 9.20.9.5.",
    "title": "Ties for Masonry Veneer",
    "covers": "Ties connecting masonry veneer to the backing wall.",
    "vol": 1,
    "page": 847
  },
  "B9.20.13.3": {
    "ref": "Div. B 9.20.13.3.",
    "title": "Location of Flashing",
    "covers": "Where flashing is required in masonry walls and veneer.",
    "vol": 1,
    "page": 850
  },
  "B9.20.13.8": {
    "ref": "Div. B 9.20.13.8.",
    "title": "Required Weep Holes",
    "covers": "Where weep holes are required.",
    "vol": 1,
    "page": 851
  },
  "B9.20.13.10": {
    "ref": "Div. B 9.20.13.10.",
    "title": "Mortar Droppings",
    "covers": "Keeping mortar droppings out of the air space behind veneer.",
    "vol": 1,
    "page": 852
  },
  "B9.20.13.12": {
    "ref": "Div. B 9.20.13.12.",
    "title": "Drips Beneath Window Sills",
    "covers": "Drips beneath window sills in masonry.",
    "vol": 1,
    "page": 852
  },
  "B9.21.1.3": {
    "ref": "Div. B 9.21.1.3.",
    "title": "Factory-Built Chimneys",
    "covers": "Factory-built chimneys.",
    "vol": 1,
    "page": 856
  },
  "B9.21.5.1": {
    "ref": "Div. B 9.21.5.1.",
    "title": "Clearance from Combustible Materials",
    "covers": "Clearance between chimneys and combustible materials.",
    "vol": 1,
    "page": 860
  },
  "B9.22.8.1": {
    "ref": "Div. B 9.22.8.1.",
    "title": "Conformance to Standard",
    "covers": "Standard that factory-built fireplaces must meet.",
    "vol": 1,
    "page": 863
  },
  "B9.22.9.3": {
    "ref": "Div. B 9.22.9.3.",
    "title": "Clearance to Combustible Framing",
    "covers": "Clearance from fireplaces to combustible framing.",
    "vol": 1,
    "page": 864
  },
  "B9.22.10.1": {
    "ref": "Div. B 9.22.10.1.",
    "title": "Appliance Standard",
    "covers": "Standard for fireplace inserts and hearth-mounted stoves.",
    "vol": 1,
    "page": 864
  },
  "B9.23.3.5": {
    "ref": "Div. B 9.23.3.5.",
    "title": "Fastening for Sheathing or Subflooring",
    "covers": "Fastening of sheathing and subflooring.",
    "vol": 1,
    "page": 868
  },
  "B9.23.4.2": {
    "ref": "Div. B 9.23.4.2.",
    "title": "Spans for Joists, Rafters and Beams",
    "covers": "Span tables for joists, rafters and beams.",
    "vol": 1,
    "page": 870
  },
  "B9.23.6.1": {
    "ref": "Div. B 9.23.6.1.",
    "title": "Anchorage of Building Frames",
    "covers": "Anchoring the building frame to the foundation.",
    "vol": 1,
    "page": 872
  },
  "B9.23.7.1": {
    "ref": "Div. B 9.23.7.1.",
    "title": "Size of Sill Plates",
    "covers": "Size of sill plates.",
    "vol": 1,
    "page": 874
  },
  "B9.23.7.2": {
    "ref": "Div. B 9.23.7.2.",
    "title": "Levelling and Sealing of Sill Plates",
    "covers": "Levelling and sealing sill plates on the foundation.",
    "vol": 1,
    "page": 874
  },
  "B9.23.8.1": {
    "ref": "Div. B 9.23.8.1.",
    "title": "Bearing for Beams",
    "covers": "Bearing length for beams.",
    "vol": 1,
    "page": 874
  },
  "B9.23.9.1": {
    "ref": "Div. B 9.23.9.1.",
    "title": "End Bearing for Joists",
    "covers": "End bearing length for floor joists.",
    "vol": 1,
    "page": 875
  },
  "B9.23.9.5": {
    "ref": "Div. B 9.23.9.5.",
    "title": "Header Joists",
    "covers": "Header joists around floor openings.",
    "vol": 1,
    "page": 876
  },
  "B9.23.9.6": {
    "ref": "Div. B 9.23.9.6.",
    "title": "Trimmer Joists",
    "covers": "Trimmer joists around floor openings.",
    "vol": 1,
    "page": 877
  },
  "B9.23.9.7": {
    "ref": "Div. B 9.23.9.7.",
    "title": "Support of Tail and Header Joists",
    "covers": "Supporting tail and header joists (hangers and nailing).",
    "vol": 1,
    "page": 877
  },
  "B9.23.9.8": {
    "ref": "Div. B 9.23.9.8.",
    "title": "Support of Walls",
    "covers": "Supporting loadbearing walls on floor framing.",
    "vol": 1,
    "page": 877
  },
  "B9.23.10.1": {
    "ref": "Div. B 9.23.10.1.",
    "title": "Stud Size and Spacing",
    "covers": "Stud size and spacing.",
    "vol": 1,
    "page": 878
  },
  "B9.23.12.3": {
    "ref": "Div. B 9.23.12.3.",
    "title": "Lintel Spans and Sizes",
    "covers": "Lintel (header) spans and sizes over openings.",
    "vol": 1,
    "page": 883
  },
  "B9.23.13.1": {
    "ref": "Div. B 9.23.13.1.",
    "title": "Requirements for Low to Moderate Wind and Seismic Forces",
    "covers": "Bracing for wind and earthquake in low to moderate hazard areas.",
    "vol": 1,
    "page": 883
  },
  "B9.23.14.11": {
    "ref": "Div. B 9.23.14.11.",
    "title": "Roof Trusses",
    "covers": "Roof truss design, installation and bracing.",
    "vol": 1,
    "page": 891
  },
  "B9.23.15.5": {
    "ref": "Div. B 9.23.15.5.",
    "title": "Subfloor Thickness or Rating",
    "covers": "Subfloor thickness or rating.",
    "vol": 1,
    "page": 892
  },
  "B9.23.16.6": {
    "ref": "Div. B 9.23.16.6.",
    "title": "Edge Support",
    "covers": "Edge support for roof sheathing (clips or blocking).",
    "vol": 1,
    "page": 894
  },
  "B9.23.17.2": {
    "ref": "Div. B 9.23.17.2.",
    "title": "Thickness, Rating and Material Standards",
    "covers": "Wall sheathing thickness, rating and material standards.",
    "vol": 1,
    "page": 895
  },
  "B9.25.2.1": {
    "ref": "Div. B 9.25.2.1.",
    "title": "Required Insulation",
    "covers": "Where thermal insulation is required.",
    "vol": 1,
    "page": 900
  },
  "B9.25.2.3": {
    "ref": "Div. B 9.25.2.3.",
    "title": "Installation of Thermal Insulation",
    "covers": "Installing thermal insulation without gaps or compression.",
    "vol": 1,
    "page": 901
  },
  "B9.25.3.3": {
    "ref": "Div. B 9.25.3.3.",
    "title": "Continuity of the Air Barrier System",
    "covers": "Continuity of the air barrier, including at joints and penetrations.",
    "vol": 1,
    "page": 902
  },
  "B9.25.4.3": {
    "ref": "Div. B 9.25.4.3.",
    "title": "Installation of Vapour Barriers",
    "covers": "Installing vapour barriers.",
    "vol": 1,
    "page": 904
  },
  "B9.26.4.3": {
    "ref": "Div. B 9.26.4.3.",
    "title": "Valley Flashing",
    "covers": "Valley flashing.",
    "vol": 1,
    "page": 910
  },
  "B9.26.4.5": {
    "ref": "Div. B 9.26.4.5.",
    "title": "Intersection of Shingle Roofs and Walls Other Than Masonry",
    "covers": "Flashing where shingle roofs meet walls.",
    "vol": 1,
    "page": 910
  },
  "B9.26.4.8": {
    "ref": "Div. B 9.26.4.8.",
    "title": "Chimney Saddles",
    "covers": "Chimney saddles (crickets).",
    "vol": 1,
    "page": 911
  },
  "B9.26.5.1": {
    "ref": "Div. B 9.26.5.1.",
    "title": "Required Eave Protection",
    "covers": "Where eave protection is required under shingles.",
    "vol": 1,
    "page": 911
  },
  "B9.26.6.1": {
    "ref": "Div. B 9.26.6.1.",
    "title": "Materials",
    "covers": "Underlay materials beneath shingles.",
    "vol": 1,
    "page": 912
  },
  "B9.26.7.1": {
    "ref": "Div. B 9.26.7.1.",
    "title": "Coverage",
    "covers": "Asphalt shingle coverage on slopes of 1 in 3 or steeper.",
    "vol": 1,
    "page": 912
  },
  "B9.26.18.2": {
    "ref": "Div. B 9.26.18.2.",
    "title": "Downspouts",
    "covers": "Downspouts and where they discharge.",
    "vol": 1,
    "page": 919
  },
  "B9.27.2.4": {
    "ref": "Div. B 9.27.2.4.",
    "title": "Protection of Cladding from Moisture",
    "covers": "Protecting cladding from moisture, including clearance to grade and roofs.",
    "vol": 1,
    "page": 921
  },
  "B9.27.3.1": {
    "ref": "Div. B 9.27.3.1.",
    "title": "Elements of the Second Plane of Protection",
    "covers": "What makes up the second plane of protection behind cladding.",
    "vol": 1,
    "page": 921
  },
  "B9.27.3.3": {
    "ref": "Div. B 9.27.3.3.",
    "title": "Required Sheathing Membrane and Installation",
    "covers": "Where sheathing membrane is required and how it is lapped.",
    "vol": 1,
    "page": 921
  },
  "B9.27.3.8": {
    "ref": "Div. B 9.27.3.8.",
    "title": "Flashing Installation",
    "covers": "Flashing installation at openings and cladding transitions.",
    "vol": 1,
    "page": 923
  },
  "B9.27.5.1": {
    "ref": "Div. B 9.27.5.1.",
    "title": "Attachment",
    "covers": "Attaching cladding.",
    "vol": 1,
    "page": 924
  },
  "B9.27.12.2": {
    "ref": "Div. B 9.27.12.2.",
    "title": "Attachment",
    "covers": "Attaching vinyl siding.",
    "vol": 1,
    "page": 932
  },
  "B9.28.1.4": {
    "ref": "Div. B 9.28.1.4.",
    "title": "Clearance Over Ground Level",
    "covers": "Stucco clearance above ground level.",
    "vol": 1,
    "page": 933
  },
  "B9.28.1.5": {
    "ref": "Div. B 9.28.1.5.",
    "title": "Flashing and Caulking",
    "covers": "Flashing and caulking for stucco.",
    "vol": 1,
    "page": 933
  },
  "B9.28.4.5": {
    "ref": "Div. B 9.28.4.5.",
    "title": "Application of Stucco Lath",
    "covers": "Applying stucco lath.",
    "vol": 1,
    "page": 935
  },
  "B9.29.2.1": {
    "ref": "Div. B 9.29.2.1.",
    "title": "Where Required",
    "covers": "Where a waterproof wall finish is required (showers, tubs).",
    "vol": 1,
    "page": 937
  },
  "B9.29.5.8": {
    "ref": "Div. B 9.29.5.8.",
    "title": "Spacing of Nails",
    "covers": "Nail spacing for gypsum board.",
    "vol": 1,
    "page": 940
  },
  "B9.29.5.9": {
    "ref": "Div. B 9.29.5.9.",
    "title": "Spacing of Screws",
    "covers": "Screw spacing for gypsum board.",
    "vol": 1,
    "page": 941
  },
  "B9.29.10.4": {
    "ref": "Div. B 9.29.10.4.",
    "title": "Moisture Resistant Backing",
    "covers": "Moisture-resistant backing behind wall tile.",
    "vol": 1,
    "page": 944
  },
  "B9.30.1.1": {
    "ref": "Div. B 9.30.1.1.",
    "title": "Required Finished Flooring",
    "covers": "Where finished flooring is required.",
    "vol": 1,
    "page": 945
  },
  "B9.30.1.4": {
    "ref": "Div. B 9.30.1.4.",
    "title": "Finish Quality",
    "covers": "Finish quality of floors.",
    "vol": 1,
    "page": 945
  },
  "B9.30.2.1": {
    "ref": "Div. B 9.30.2.1.",
    "title": "Required Underlay",
    "covers": "Where panel-type underlay is required.",
    "vol": 1,
    "page": 945
  },
  "B9.31.4.1": {
    "ref": "Div. B 9.31.4.1.",
    "title": "Required Fixtures",
    "covers": "Plumbing fixtures required in a dwelling.",
    "vol": 1,
    "page": 949
  },
  "B9.31.6.1": {
    "ref": "Div. B 9.31.6.1.",
    "title": "Hot Water Supply",
    "covers": "Hot water supply equipment (hot water temperature follows in 9.31.6.1A).",
    "vol": 1,
    "page": 949
  },
  "B9.32.3.7": {
    "ref": "Div. B 9.32.3.7.",
    "title": "Supplemental Exhaust",
    "covers": "Supplemental exhaust (bathroom and kitchen fans).",
    "vol": 1,
    "page": 958
  },
  "B9.32.3.9": {
    "ref": "Div. B 9.32.3.9.",
    "title": "Application of Carbon Monoxide Alarms",
    "covers": "Where carbon monoxide alarms are required.",
    "vol": 1,
    "page": 959
  },
  "B9.32.3.11": {
    "ref": "Div. B 9.32.3.11.",
    "title": "Ducts",
    "covers": "Ducts for ventilation systems.",
    "vol": 1,
    "page": 962
  },
  "B9.32.3.12": {
    "ref": "Div. B 9.32.3.12.",
    "title": "Heat Recovery Ventilators",
    "covers": "Heat recovery ventilators.",
    "vol": 1,
    "page": 964
  },
  "B9.32.3.13": {
    "ref": "Div. B 9.32.3.13.",
    "title": "Outdoor Intake and Exhaust Openings",
    "covers": "Locating outdoor intake and exhaust openings.",
    "vol": 1,
    "page": 964
  },
  "B9.33.4.1": {
    "ref": "Div. B 9.33.4.1.",
    "title": "Design of Heating and Air-Conditioning Systems",
    "covers": "Designing heating and air-conditioning systems (calculations and standards).",
    "vol": 1,
    "page": 967
  },
  "B9.33.5.1": {
    "ref": "Div. B 9.33.5.1.",
    "title": "Capacity of Heating Appliances",
    "covers": "Sizing heating appliance capacity to the calculated heat loss.",
    "vol": 1,
    "page": 968
  },
  "B9.33.6.3": {
    "ref": "Div. B 9.33.6.3.",
    "title": "Tape",
    "covers": "Tape used on air ducts.",
    "vol": 1,
    "page": 970
  },
  "B9.33.6.7": {
    "ref": "Div. B 9.33.6.7.",
    "title": "Installation of Ducts and Plenums",
    "covers": "Installing ducts and plenums.",
    "vol": 1,
    "page": 971
  },
  "B9.33.6.11": {
    "ref": "Div. B 9.33.6.11.",
    "title": "Warm-Air Supply Outlets",
    "covers": "Warm-air supply outlets.",
    "vol": 1,
    "page": 973
  },
  "B9.33.6.12": {
    "ref": "Div. B 9.33.6.12.",
    "title": "Return-Air Inlets",
    "covers": "Return-air inlets.",
    "vol": 1,
    "page": 974
  },
  "B9.33.10.1": {
    "ref": "Div. B 9.33.10.1.",
    "title": "Requirement for Venting",
    "covers": "Venting requirements for fuel-fired appliances.",
    "vol": 1,
    "page": 977
  },
  "B9.34.2.2": {
    "ref": "Div. B 9.34.2.2.",
    "title": "Outlets in Dwelling Units",
    "covers": "Required electrical outlets in dwelling units.",
    "vol": 1,
    "page": 978
  },
  "B12.3.1.2": {
    "ref": "Div. B 12.3.1.2.",
    "title": "Windows and Sliding Glass Doors",
    "covers": "Energy performance of windows and sliding glass doors.",
    "vol": 1,
    "page": 1117
  },
  "B12.3.1.3": {
    "ref": "Div. B 12.3.1.3.",
    "title": "Temperature Control in Houses and Dwelling Units",
    "covers": "Temperature controls in houses.",
    "vol": 1,
    "page": 1117
  },
  "B12.3.1.6": {
    "ref": "Div. B 12.3.1.6.",
    "title": "Energy Supply for Kitchen and Laundry Facilities",
    "covers": "Energy supply (outlet or gas line) for cooking appliances and clothes dryers.",
    "vol": 1,
    "page": 1118
  },
  "SB7": {
    "ref": "SB-7",
    "title": "Guards for Housing and Small Buildings",
    "covers": "Construction specifications for guards that can be used instead of engineering them.",
    "vol": 2,
    "page": 778
  },
  "SB12-3.1.1": {
    "ref": "SB-12 3.1.1.",
    "title": "Prescriptive Compliance Packages",
    "covers": "Prescriptive energy compliance packages (insulation, windows, equipment) by climate zone.",
    "vol": 2,
    "page": 941
  },
  "SB12-3.1.2": {
    "ref": "SB-12 3.1.2.",
    "title": "Performance Compliance",
    "covers": "Performance path for energy compliance, modelled against a reference house.",
    "vol": 2,
    "page": 965
  }
};

/** Clauses for a whole task, by template task id. */
export const TASK_CLAUSES: Record<string, string[]> = {
  "pre-permit": ["C1.3.2.1", "C1.3.2.2", "C1.3.5.1"],
  "pre-hcra": ["C1.3.1.6"],
  "pre-soils": ["B9.4.4.1", "B9.4.4.3"],
  "site-septic": ["C1.3.5.4", "B8.2.1", "B8.7.2"],
  "site-excavate": ["B9.12.1.1", "B9.12.2.1", "B9.12.2.2"],
  "f-forms": ["B9.15.3.4", "B9.15.3.8"],
  "f-pour": ["B9.3.1.6"],
  "f-walls": ["B9.15.4.2"],
  "f-underslab": ["B7.3.6.1"],
  "f-damp": ["B9.13.2.4"],
  "f-drain": ["B9.14.2.1", "B9.14.3.3"],
  "f-backfill": ["B9.12.3.4"],
  "f-slab": ["B9.16.2.1", "B9.13.4.2"],
  "fr-sill": ["B9.23.7.1", "B9.23.6.1"],
  "fr-floor-{n}": ["B9.23.4.2"],
  "fr-ext-{n}": ["B9.23.10.1"],
  "fr-roof": ["B9.23.14.11"],
  "fr-stairs": ["B9.8.2.2"],
  "fr-garage": ["B9.10.9.18"],
  "e-roof": ["B9.26.5.1"],
  "e-wrap": ["B9.27.3.3"],
  "e-windows": ["B9.7.6.1", "B9.9.10.1"],
  "e-doors": ["B9.7.6.2"],
  "m-hvac": ["B9.33.4.1"],
  "m-hrv": ["B9.32.3.12"],
  "m-plumb": ["B7.3.6.1"],
  "m-elec": ["B9.10.19.3", "B9.32.3.9"],
  "m-fireplace": ["B9.22.9.3"],
  "i-ins": ["B9.25.2.1", "SB12-3.1.1"],
  "i-vb": ["B9.25.4.3"],
  "i-firesep": ["B9.10.9.18"],
  "d-hang": ["B9.29.5.8"],
  "x-masonry": ["B9.20.9.5", "B9.20.13.3"],
  "x-stucco": ["B9.28.4.5"],
  "x-siding": ["B9.27.5.1"],
  "x-grade": ["B9.14.6.1"],
  "n-stairs": ["B9.8.4.1", "B9.8.8.3", "SB7"],
  "n-bath-{n}": ["B9.29.2.1"],
  "n-kitchen": ["B9.32.3.7"],
  "n-floor": ["B9.30.1.1"],
  "z-alarms": ["B9.10.19.1", "B9.32.3.9"],
  "z-hvac": ["B9.32.3.12"],
  "z-plumb": ["B9.31.6.1"],
  "z-energy": ["SB12-3.1.1", "SB12-3.1.2"]
};

/** Clauses for inspection hold points, by template inspection id. */
export const INSP_CLAUSES: Record<string, string[]> = {
  "insp-footing": ["C1.3.5.1"],
  "insp-plumb-ug": ["C1.3.5.1", "B7.3.6.1"],
  "insp-found": ["C1.3.5.1"],
  "insp-eng-frame": ["B9.4.1.1"],
  "insp-framing": ["C1.3.5.1"],
  "insp-plumb-rough": ["C1.3.5.1", "B7.3.6.1"],
  "insp-insul": ["C1.3.5.1"],
  "insp-blower-mid": ["SB12-3.1.1"],
  "insp-firesep": ["C1.3.5.1"],
  "insp-plumb-final": ["C1.3.5.1"],
  "insp-occupancy": ["C1.3.5.1", "C1.3.3.2"],
  "insp-final": ["C1.3.5.1"]
};

/** Clauses on individual checklist lines: template task id -> check index -> clause ids. */
export const CHECK_CLAUSES: Record<string, Record<number, string[]>> = {
  "pre-permit": {
    "0": ["C1.3.2.1"],
    "1": ["C1.3.2.2"],
    "3": ["C1.3.5.1", "C1.3.5.3"]
  },
  "pre-hcra": {
    "1": ["C1.3.1.6"]
  },
  "pre-soils": {
    "0": ["B9.4.4.1"],
    "1": ["B9.4.4.3"]
  },
  "site-septic": {
    "0": ["C1.3.5.4"],
    "1": ["B8.2.1", "B8.7.2"],
    "2": ["B8.2.1"]
  },
  "site-excavate": {
    "1": ["B9.12.2.1"],
    "2": ["B9.12.2.2"],
    "3": ["B9.12.1.4"],
    "4": ["B9.12.1.2"]
  },
  "f-forms": {
    "1": ["B9.15.3.4", "B9.15.3.8"],
    "2": ["B9.15.3.9"],
    "3": ["B9.15.3.7"]
  },
  "f-pour": {
    "0": ["B9.3.1.6"],
    "2": ["B9.3.1.9", "B9.12.1.3"]
  },
  "f-walls": {
    "0": ["B9.15.4.2", "B9.15.4.6"],
    "3": ["B9.23.6.1"]
  },
  "f-underslab": {
    "1": ["B7.4.8", "B7.4.7"],
    "3": ["B7.3.6.1", "B7.3.6.4"]
  },
  "f-damp": {
    "0": ["B9.13.2.2", "B9.13.3.2"],
    "1": ["B9.13.2.4"],
    "2": ["B9.14.2.1"],
    "3": ["B9.15.6.3"]
  },
  "f-drain": {
    "0": ["B9.14.3.3"],
    "2": ["B9.14.5.1", "B9.14.5.2"]
  },
  "f-backfill": {
    "0": ["B9.12.3.4"],
    "1": ["B9.12.3.3"],
    "2": ["B9.12.3.1"],
    "3": ["B9.14.6.1"]
  },
  "f-slab": {
    "0": ["B9.16.2.1"],
    "1": ["B9.13.4.2", "B9.13.2.6"],
    "2": ["SB12-3.1.1"],
    "3": ["B9.13.4.3"],
    "4": ["B9.16.4.3", "B9.16.4.1"]
  },
  "fr-sill": {
    "0": ["B9.23.7.2"],
    "1": ["B9.23.6.1"]
  },
  "fr-floor-{n}": {
    "0": ["B9.23.4.2"],
    "1": ["B9.23.8.1", "B9.17.3.1"],
    "2": ["B9.23.9.1", "B9.23.9.7"],
    "3": ["B9.23.9.5", "B9.23.9.6"],
    "4": ["B9.23.15.5", "B9.23.3.5"]
  },
  "fr-ext-{n}": {
    "0": ["B9.23.10.1"],
    "1": ["B9.23.12.3"],
    "2": ["B9.23.17.2", "B9.23.3.5"],
    "3": ["B9.23.13.1"]
  },
  "fr-int-{n}": {
    "1": ["B9.23.9.8"]
  },
  "fr-roof": {
    "0": ["B9.23.14.11"],
    "1": ["B9.23.14.11"],
    "4": ["B9.23.16.6", "B9.19.1.1"]
  },
  "fr-stairs": {
    "0": ["B9.8.2.1", "B9.8.2.2"],
    "1": ["B9.8.4.1", "B9.8.4.2"]
  },
  "fr-garage": {
    "0": ["B9.10.9.18"],
    "1": ["B9.10.13.15"]
  },
  "e-roof": {
    "0": ["B9.26.5.1", "B9.26.6.1"],
    "1": ["B9.26.4.3", "B9.26.4.5", "B9.26.4.8"],
    "2": ["B9.26.7.1"],
    "3": ["B9.19.1.2"]
  },
  "e-wrap": {
    "0": ["B9.27.3.3"],
    "1": ["B9.25.3.3"],
    "2": ["B9.25.3.3"]
  },
  "e-windows": {
    "1": ["B9.7.3.3", "B12.3.1.2"],
    "3": ["B9.7.6.2", "B9.27.3.8"],
    "4": ["B9.9.10.1"],
    "5": ["B9.7.6.1"]
  },
  "e-doors": {
    "1": ["B9.7.6.2"],
    "2": ["B9.7.5.2"]
  },
  "m-hvac": {
    "0": ["B9.33.4.1", "B9.33.5.1"],
    "2": ["B9.33.6.11", "B9.33.6.12"],
    "3": ["B9.33.6.3", "B9.33.6.7"],
    "5": ["B9.33.10.1"]
  },
  "m-hrv": {
    "0": ["B9.32.3.12"],
    "2": ["B9.32.3.13"],
    "3": ["B9.32.3.7", "B9.32.3.11"]
  },
  "m-plumb": {
    "0": ["B7.4.9", "B7.5.8"],
    "1": ["B7.6.1"],
    "2": ["B9.31.4.1"],
    "4": ["B7.3.6.1", "B7.3.7.2"]
  },
  "m-elec": {
    "2": ["B9.34.2.2"],
    "3": ["B9.10.19.3", "B9.10.19.4", "B9.10.19.5", "B9.32.3.9"]
  },
  "m-fireplace": {
    "0": ["B9.22.8.1", "B9.22.10.1"],
    "1": ["B9.22.9.3", "B9.21.5.1"],
    "2": ["B9.21.1.3", "B9.33.10.1"]
  },
  "i-ins": {
    "0": ["B9.25.2.1", "SB12-3.1.1"],
    "1": ["B9.25.3.3"],
    "2": ["B9.25.2.3"]
  },
  "i-vb": {
    "0": ["B9.25.4.3"],
    "1": ["B9.25.3.3"],
    "2": ["B9.25.3.3"]
  },
  "i-firesep": {
    "0": ["B9.10.9.18"],
    "1": ["B9.10.9.6"],
    "2": ["B9.10.13.15"]
  },
  "d-hang": {
    "0": ["B9.29.2.1", "B9.29.10.4"],
    "1": ["B9.10.3.1"],
    "2": ["B9.29.5.8", "B9.29.5.9"]
  },
  "x-masonry": {
    "0": ["B9.20.5.2"],
    "1": ["B9.20.9.5"],
    "2": ["B9.20.13.3", "B9.20.13.8"],
    "3": ["B9.20.13.12"],
    "4": ["B9.20.13.10"]
  },
  "x-stucco": {
    "1": ["B9.27.3.1", "B9.28.4.5"],
    "2": ["B9.28.1.4"],
    "3": ["B9.28.1.5"]
  },
  "x-siding": {
    "1": ["B9.27.5.1", "B9.27.12.2"],
    "2": ["B9.27.3.8"],
    "3": ["B9.27.2.4"]
  },
  "x-trim": {
    "1": ["B9.19.1.2"],
    "2": ["B9.14.6.5", "B9.26.18.2"]
  },
  "x-grade": {
    "1": ["B9.14.6.1"],
    "2": ["B9.14.6.3"]
  },
  "n-stairs": {
    "0": ["B9.8.4.1", "B9.8.4.2", "B9.8.2.1", "B9.8.2.2"],
    "1": ["B9.8.7.1", "B9.8.7.2", "B9.8.7.4"],
    "2": ["B9.8.8.1", "B9.8.8.3", "B9.8.8.5"],
    "3": ["B9.8.7.7", "B9.8.8.2", "SB7"]
  },
  "n-bath-{n}": {
    "0": ["B9.29.2.1"],
    "1": ["B9.5.2.4"],
    "2": ["B9.32.3.7", "B9.32.3.11"]
  },
  "n-kitchen": {
    "2": ["B12.3.1.6"],
    "3": ["B9.32.3.7", "B9.10.22.2"]
  },
  "n-floor": {
    "0": ["B9.30.1.4", "B9.30.2.1"]
  },
  "n-trim": {
    "0": ["B9.5.5.1"]
  },
  "z-alarms": {
    "0": ["B9.10.19.1", "B9.32.3.9"],
    "1": ["B9.10.19.5"]
  },
  "z-hvac": {
    "1": ["B9.32.3.12"],
    "2": ["B12.3.1.3"]
  },
  "z-plumb": {
    "1": ["B9.31.6.1", "B7.6.2"]
  },
  "z-energy": {
    "1": ["SB12-3.1.1", "SB12-3.1.2"]
  }
};
