/**
 * Vehicle / vessel / UAV work-order templates.
 *
 * These are reference checklists that a Myncel admin can copy into a Work
 * Order's checklist when creating preventive-maintenance schedules or
 * diagnostic WOs for vehicles, vessels, and drones. They reflect the real
 * regulatory requirements (FMCSA 49 CFR §396.11 for DVIR, USCG 46 CFR §185
 * for vessel pre-departure, FAA Part 107 for sUAS pre-flight) but are
 * intentionally generic; consult the relevant regulations and your
 * insurer / classification society for your specific operation.
 *
 * Big Bet #3 — Vehicle / vessel / UAV maintenance.
 */

export type VehicleTemplateCategory =
  | 'DVIR_PRE_TRIP'
  | 'DVIR_POST_TRIP'
  | 'LIGHT_VEHICLE_INSPECTION'
  | 'HEAVY_TRUCK_INSPECTION'
  | 'VESSEL_PRE_DEPARTURE'
  | 'VESSEL_RETURN'
  | 'UAV_PRE_FLIGHT'
  | 'UAV_POST_FLIGHT';

export interface VehicleWorkOrderTemplate {
  id: VehicleTemplateCategory;
  title: string;
  domain: 'vehicle' | 'vessel' | 'uav';
  estimatedMinutes: number;
  reference: string;
  description: string;
  checklist: string[];
}

export const VEHICLE_WORK_ORDER_TEMPLATES: VehicleWorkOrderTemplate[] = [
  {
    id: 'DVIR_PRE_TRIP',
    title: 'DVIR — Pre-trip inspection (commercial truck)',
    domain: 'vehicle',
    estimatedMinutes: 15,
    reference: 'FMCSA 49 CFR §396.11 / §392.7',
    description:
      'Federally required pre-trip Driver Vehicle Inspection Report for commercial motor vehicles operating in the United States. Mirrors the line items the driver is required to walk around and confirm before placing the vehicle in service.',
    checklist: [
      'Service brakes including trailer brake connections',
      'Parking (hand) brake',
      'Steering mechanism — check for excessive play',
      'Lighting devices and reflectors — headlamps, tail, brake, turn, hazard, marker, identification',
      'Tires — tread depth, sidewall damage, inflation pressure',
      'Wheels and rims — visible cracks, missing or loose lug nuts',
      'Windshield wipers and washer fluid',
      'Rear-vision mirrors — adjusted and unbroken',
      'Coupling devices — fifth wheel, kingpin, safety chains, breakaway cable',
      'Horn — both city and highway',
      'Fire extinguisher — present, charged, mounted',
      'Spare fuses (or equivalent) and emergency triangles / flares',
      'Engine compartment — oil, coolant, power-steering fluid, belts, hoses',
      'Air system — build-up time, governor cut-out, leak-down rate',
      'Trailer — load secured, doors latched, mud flaps',
    ],
  },
  {
    id: 'DVIR_POST_TRIP',
    title: 'DVIR — Post-trip inspection (commercial truck)',
    domain: 'vehicle',
    estimatedMinutes: 10,
    reference: 'FMCSA 49 CFR §396.11',
    description:
      'Federally required post-trip Driver Vehicle Inspection Report. The driver documents any condition discovered or reported during the trip that would affect safety or result in mechanical breakdown.',
    checklist: [
      'Service brakes — performance during the trip',
      'Trailer brake performance',
      'Parking brake hold',
      'Steering — any pull, wander, or excessive play observed',
      'Tires — any new cuts, bulges, separation, or low pressure',
      'Wheels / rims — any noise or vibration noticed',
      'Lighting devices and reflectors — any failures noted en route',
      'Horn',
      'Windshield wipers',
      'Mirrors',
      'Coupling devices — fifth wheel, kingpin, safety chains',
      'Engine — oil pressure, coolant temperature, oil consumption, smoke',
      'Transmission — shift quality, slipping, noise',
      'Rear axle / driveline — vibration, noise',
      'Body / cargo securement — straps, chains, doors, load shift',
    ],
  },
  {
    id: 'LIGHT_VEHICLE_INSPECTION',
    title: 'Light vehicle / van — daily check',
    domain: 'vehicle',
    estimatedMinutes: 8,
    reference: 'OEM operator manual / fleet policy',
    description:
      'Daily walk-around for cars, SUVs, sprinter vans, and pickup trucks operated as part of a service fleet (e.g. mobile service technicians, courier fleets, dealership shuttle services).',
    checklist: [
      'Walk-around — body damage, broken lights, fluid leaks under vehicle',
      'Tires — visual inflation check, tread, sidewall',
      'Windshield — clean, no chips growing into cracks',
      'Wipers — streak-free, washer fluid topped',
      'Lights — headlights (low/high), brake, turn, reverse',
      'Horn',
      'Seat belts — operational, no fraying',
      'Mirrors — adjusted',
      'Dashboard — any warning indicators on at start-up',
      'Fuel level — adequate for the day',
      'Cleanliness — interior cabin, cargo area',
      'Required equipment — first aid kit, ice scraper (winter), hi-vis vest',
    ],
  },
  {
    id: 'HEAVY_TRUCK_INSPECTION',
    title: 'Heavy truck — quarterly preventive maintenance',
    domain: 'vehicle',
    estimatedMinutes: 90,
    reference: 'TMC RP 320 / OEM manuals',
    description:
      'A representative quarterly PM for a Class 7-8 truck. Use this as the checklist on a BY_HOURS schedule (typical 250-hour or 12-week interval) or BY_DAYS schedule. Adapt to OEM intervals.',
    checklist: [
      'Engine oil and filter change',
      'Fuel filter replacement (primary + secondary)',
      'Air filter inspection / replacement',
      'Coolant — level, condition, freeze point',
      'Transmission and rear-axle oil level check',
      'Power-steering fluid level',
      'Drive belt condition and tension',
      'Air dryer cartridge — replace per interval',
      'Brake adjustment — automatic slack adjusters cycle',
      'Brake lining thickness — front and rear axles',
      'Tire pressure and tread depth — all positions',
      'Wheel-end seals and hub-oil level',
      'Steering linkage — drag link, tie rods, kingpins greased',
      'Fifth-wheel grease and inspection',
      'All lights and reflectors — output, lens condition',
      'Battery — voltage, terminal corrosion, electrolyte level (flooded)',
      'DEF tank cap and dosing module visual',
      'Exhaust system — clamps, hangers, no soot leaks',
      'Cab — HVAC, mirrors, seat belts, defroster, horn',
      'Diagnostic scan — read DTCs from engine, transmission, brakes, body',
    ],
  },
  {
    id: 'VESSEL_PRE_DEPARTURE',
    title: 'Vessel — pre-departure inspection',
    domain: 'vessel',
    estimatedMinutes: 30,
    reference: 'USCG 46 CFR §185.502 / classification society standards',
    description:
      'Pre-departure / underway readiness check for commercial passenger and small workboats. Adapt to vessel type, route, and any classification-society (ABS, BV, DNV, Lloyds) requirements.',
    checklist: [
      'Hull and freeboard — visual inspection from dock and on board',
      'Bilges — dry, no fuel sheen, bilge pumps cycle when tested',
      'Through-hull fittings and seacocks — operate freely, no weeping',
      'Engine room — no fluid leaks, hoses sound, belts intact',
      'Engine fluids — oil, coolant, transmission, hydraulic, gear oil',
      'Fuel — level adequate for round trip plus 25% reserve',
      'Steering system — full lock-to-lock, no binding, hydraulic level',
      'Throttle and shift controls — full range, no slipping',
      'Anchor and ground tackle — securely stowed, ready to deploy',
      'Navigation lights — all required lights operational',
      'Sound signal device — horn / whistle',
      'Compass — corrected, no air bubbles',
      'GPS, chart plotter, depth sounder — powered up, current waypoints loaded',
      'VHF / GMDSS radio check on Channel 16 (or per route)',
      'AIS transmitting (if equipped)',
      'Life jackets — count, condition, sized appropriately for passenger manifest',
      'Throwable PFD ring with line',
      'EPIRB — registered, battery in date, mounted',
      'Fire extinguishers — count, charge, expiration',
      'Flares / day signals — in date',
      'First aid kit — stocked, in date',
      'Bilge alarms — test',
      'Carbon monoxide detector — test (cabin vessels)',
      'Crew briefing — emergency procedures, MOB, fire, abandon ship',
    ],
  },
  {
    id: 'VESSEL_RETURN',
    title: 'Vessel — return / shutdown checklist',
    domain: 'vessel',
    estimatedMinutes: 20,
    reference: 'OEM operator manuals / fleet policy',
    description:
      'Post-trip securing checklist for commercial small vessels. Run after every charter or workday so the next crew finds the boat ready and any new issues are documented.',
    checklist: [
      'Engines — cool-down idle (typically 3-5 minutes), then shut down',
      'Fuel level logged — for refueling triggers',
      'Engine hours logged — for next PM trigger',
      'Engine room walk-around — fluid leaks, loose hoses, smells',
      'Bilges checked and pumped if needed',
      'Seacocks closed (per fleet policy)',
      'Battery switches — set to fleet policy (off / 1 / 2 / both)',
      'Shore power connected if available',
      'Heads / sanitation system — flushed, holding tank within capacity',
      'Galley / wet bar — secured, refrigerator drained or set per policy',
      'Cabin — windows / hatches closed, lockers latched',
      'Lines — doubled, fenders deployed, gangway secured',
      'Trash and recycling removed',
      'Damage / discrepancy report filed (if any)',
      'Lights and electronics off',
    ],
  },
  {
    id: 'UAV_PRE_FLIGHT',
    title: 'UAV / drone — pre-flight checklist',
    domain: 'uav',
    estimatedMinutes: 8,
    reference: 'FAA 14 CFR Part 107 / EASA Open & Specific category',
    description:
      'Pre-flight inspection for small unmanned aircraft systems (sUAS / drones) operated commercially. Adapt to airframe type (multi-rotor, fixed-wing, VTOL), payload, and operational area.',
    checklist: [
      'Airframe — visual inspection, no cracks or stress marks',
      'Propellers — no nicks, splinters, or imbalance; secure fasteners',
      'Motors — spin freely by hand, no grinding, no loose mounts',
      'ESCs — secure mounting, wires not chafing',
      'Battery — charged to flight voltage, no swelling, balanced cells',
      'Battery secured in airframe — strap, latch, or locking mechanism',
      'Flight controller — boots, sensors initialize, no error tones',
      'Compass calibrated for current location (if required)',
      'GPS lock — minimum satellites and HDOP per fleet policy',
      'RC link — verify range and signal strength on the ground',
      'Telemetry / video link — verify before flight',
      'Failsafes — RTH altitude set, geofence loaded, low-battery action set',
      'Camera / payload — secured, gimbal initialized, storage card with capacity',
      'Weather — wind, gusts, precipitation within airframe limits',
      'Airspace — verify class, NOTAMs, TFRs, LAANC authorization if required',
      'Ground crew briefing — roles, abort signals, frequencies',
      'Take-off and landing area — clear of people and obstacles',
    ],
  },
  {
    id: 'UAV_POST_FLIGHT',
    title: 'UAV / drone — post-flight checklist',
    domain: 'uav',
    estimatedMinutes: 5,
    reference: 'OEM service manual / fleet policy',
    description:
      'Post-flight inspection and logging. Captures the data needed for cycle-based battery retirement, motor-hour-based propeller and bearing changes, and immediate documentation of any anomaly.',
    checklist: [
      'Airframe — visual inspection for impact damage, hot spots, debris',
      'Motors — listen and feel for unusual heat or vibration',
      'Propellers — chips, splinters, balance check',
      'Battery — temperature within normal, no swelling, voltage logged',
      'Storage card — flight log and media offloaded',
      'Flight log — total flight time logged for the airframe and battery',
      'Cycle count incremented for the battery pack',
      'Anomaly log — STATUSTEXT errors, autopilot warnings, link drops',
      'Cleaning — wipe down sensors, lenses, props per environment',
      'Storage — battery to storage voltage if not flying again today',
      'Charge / swap — batteries on appropriate charger',
    ],
  },
];

export function getVehicleTemplate(id: VehicleTemplateCategory): VehicleWorkOrderTemplate | undefined {
  return VEHICLE_WORK_ORDER_TEMPLATES.find(t => t.id === id);
}

export function listVehicleTemplatesByDomain(domain: VehicleWorkOrderTemplate['domain']): VehicleWorkOrderTemplate[] {
  return VEHICLE_WORK_ORDER_TEMPLATES.filter(t => t.domain === domain);
}
