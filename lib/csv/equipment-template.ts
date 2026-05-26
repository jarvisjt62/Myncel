/**
 * CSV template + reference data for the bulk equipment importer.
 *
 * Centralized so the API route, client preview, and downloadable
 * template stay in lockstep. If you ever change the column list, this
 * is the only file that needs updating.
 */

export type EquipmentImportColumn =
  | 'name'
  | 'category'
  | 'manufacturer'
  | 'model'
  | 'serialNumber'
  | 'location'
  | 'criticality'
  | 'status'
  | 'yearInstalled'
  | 'notes';

/** Column definitions in display order. */
export const EQUIPMENT_COLUMNS: ReadonlyArray<{
  key: EquipmentImportColumn;
  header: string;
  required: boolean;
  hint: string;
}> = [
  { key: 'name',          header: 'name',          required: true,  hint: 'Machine name (must be unique within your org for clarity)' },
  { key: 'category',      header: 'category',      required: false, hint: 'One of the supported categories — defaults to OTHER' },
  { key: 'manufacturer',  header: 'manufacturer',  required: false, hint: 'e.g. Haas, FANUC, Mazak' },
  { key: 'model',         header: 'model',         required: false, hint: 'Manufacturer model number' },
  { key: 'serialNumber',  header: 'serialNumber',  required: false, hint: 'Used to detect duplicates' },
  { key: 'location',      header: 'location',      required: false, hint: 'Plant / floor / cell — free text' },
  { key: 'criticality',   header: 'criticality',   required: false, hint: 'HIGH | MEDIUM | LOW — defaults to MEDIUM' },
  { key: 'status',        header: 'status',        required: false, hint: 'OPERATIONAL | MAINTENANCE | BREAKDOWN | RETIRED' },
  { key: 'yearInstalled', header: 'yearInstalled', required: false, hint: 'Four-digit year, e.g. 2018' },
  { key: 'notes',         header: 'notes',         required: false, hint: 'Free text, kept verbatim' },
];

/** Mirrors prisma enum MachineCategory. */
export const MACHINE_CATEGORIES = [
  'CNC_MILL', 'CNC_LATHE', 'PRESS', 'HYDRAULIC', 'COMPRESSOR', 'CONVEYOR',
  'WELDER', 'INJECTION_MOLD', 'ASSEMBLY', 'LASER_CUTTER', 'PLASMA_CUTTER',
  'GRINDER', 'DRILL_PRESS', 'PUNCH_PRESS', 'PUMP', 'BOILER', 'GENERATOR',
  'CRANE', 'ROBOT', 'HEAT_TREATMENT', 'MEASURING', 'PACKAGING', 'FORKLIFT',
  'VEHICLE_LIGHT', 'VEHICLE_HEAVY', 'VESSEL', 'DRONE_UAV',
  'OTHER',
] as const;
export type MachineCategoryValue = typeof MACHINE_CATEGORIES[number];

/** Mirrors prisma enum MachineStatus. */
export const MACHINE_STATUSES = [
  'OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'RETIRED',
] as const;
export type MachineStatusValue = typeof MACHINE_STATUSES[number];

export const CRITICALITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type CriticalityValue = typeof CRITICALITIES[number];

/** Hard cap per upload — anything bigger should be split into batches. */
export const MAX_IMPORT_ROWS = 1000;

/** A single parsed-and-validated row, ready to insert. */
export interface ValidatedEquipmentRow {
  rowIndex: number; // 1-based, including header
  name: string;
  category: MachineCategoryValue;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  criticality: CriticalityValue;
  status: MachineStatusValue;
  yearInstalled: number | null;
  notes: string | null;
}

export interface RowError {
  rowIndex: number;
  field: EquipmentImportColumn | '_row';
  message: string;
}

/**
 * Generate a CSV string the user can download as a starting template.
 * Includes one fully-populated example row so users can see the format.
 */
export function buildCsvTemplate(): string {
  const headers = EQUIPMENT_COLUMNS.map((c) => c.header);
  const example: Record<EquipmentImportColumn, string> = {
    name: 'CNC Mill #1',
    category: 'CNC_MILL',
    manufacturer: 'Haas',
    model: 'VF-2',
    serialNumber: 'HAAS-VF2-001',
    location: 'Bay 3',
    criticality: 'HIGH',
    status: 'OPERATIONAL',
    yearInstalled: '2019',
    notes: 'Primary aluminum mill',
  };
  const exampleRow = EQUIPMENT_COLUMNS.map((c) => csvEscape(example[c.key]));
  return [headers.join(','), exampleRow.join(',')].join('\r\n') + '\r\n';
}

/** RFC-4180 minimal escape — quote any cell containing , " or newline. */
function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Validate a single raw row (string→string map) into a typed row, OR
 * return a list of errors for that row. Pure function — used by both
 * the client-side preview and the server-side hardening pass, so the
 * two never disagree about what's valid.
 */
export function validateEquipmentRow(
  raw: Record<string, string | undefined>,
  rowIndex: number
): { ok: true; row: ValidatedEquipmentRow } | { ok: false; errors: RowError[] } {
  const errors: RowError[] = [];

  const name = (raw.name ?? '').trim();
  if (!name) {
    errors.push({ rowIndex, field: 'name', message: 'name is required' });
  } else if (name.length > 200) {
    errors.push({ rowIndex, field: 'name', message: 'name must be 200 characters or fewer' });
  }

  const categoryRaw = (raw.category ?? '').trim().toUpperCase();
  let category: MachineCategoryValue = 'OTHER';
  if (categoryRaw) {
    if ((MACHINE_CATEGORIES as readonly string[]).includes(categoryRaw)) {
      category = categoryRaw as MachineCategoryValue;
    } else {
      errors.push({
        rowIndex,
        field: 'category',
        message: `unknown category "${categoryRaw}" — see template hint`,
      });
    }
  }

  const statusRaw = (raw.status ?? '').trim().toUpperCase();
  let status: MachineStatusValue = 'OPERATIONAL';
  if (statusRaw) {
    if ((MACHINE_STATUSES as readonly string[]).includes(statusRaw)) {
      status = statusRaw as MachineStatusValue;
    } else {
      errors.push({
        rowIndex,
        field: 'status',
        message: `status must be one of ${MACHINE_STATUSES.join(', ')}`,
      });
    }
  }

  const critRaw = (raw.criticality ?? '').trim().toUpperCase();
  let criticality: CriticalityValue = 'MEDIUM';
  if (critRaw) {
    if ((CRITICALITIES as readonly string[]).includes(critRaw)) {
      criticality = critRaw as CriticalityValue;
    } else {
      errors.push({
        rowIndex,
        field: 'criticality',
        message: `criticality must be HIGH, MEDIUM, or LOW`,
      });
    }
  }

  let yearInstalled: number | null = null;
  const yearRaw = (raw.yearInstalled ?? '').trim();
  if (yearRaw) {
    const n = Number(yearRaw);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(n) || n < 1900 || n > thisYear + 1) {
      errors.push({
        rowIndex,
        field: 'yearInstalled',
        message: `yearInstalled must be a 4-digit year between 1900 and ${thisYear + 1}`,
      });
    } else {
      yearInstalled = n;
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    row: {
      rowIndex,
      name,
      category,
      manufacturer: nullableTrim(raw.manufacturer),
      model: nullableTrim(raw.model),
      serialNumber: nullableTrim(raw.serialNumber),
      location: nullableTrim(raw.location),
      criticality,
      status,
      yearInstalled,
      notes: nullableTrim(raw.notes),
    },
  };
}

function nullableTrim(value: string | undefined): string | null {
  if (value === undefined) return null;
  const t = value.trim();
  return t.length === 0 ? null : t;
}
