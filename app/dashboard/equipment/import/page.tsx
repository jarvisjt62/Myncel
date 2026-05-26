'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  EQUIPMENT_COLUMNS,
  MACHINE_CATEGORIES,
  MACHINE_STATUSES,
  CRITICALITIES,
  MAX_IMPORT_ROWS,
  validateEquipmentRow,
  type RowError,
  type ValidatedEquipmentRow,
} from '@/lib/csv/equipment-template';

/**
 * /dashboard/equipment/import — Bulk Equipment Importer
 *
 * Three-step UX:
 *   1. Upload step  — drag-drop or file picker, CSV only
 *   2. Preview step — table of parsed rows with inline error highlights;
 *                     user can scroll, see issues, fix the CSV, re-upload
 *   3. Result step  — server response: imported count, skipped, error list
 *
 * Parsing is fully client-side via PapaParse; the API does its OWN
 * validation pass so a malicious or stale client can't bypass rules.
 */

type Step = 'upload' | 'preview' | 'result';

interface PreviewState {
  fileName: string;
  totalRows: number;
  validRows: ValidatedEquipmentRow[];
  rowErrors: RowError[];
  /** Raw rows shipped to the server as-is. */
  rawRows: Array<Record<string, string | undefined>>;
}

interface ImportResult {
  imported: number;
  skipped: number;
  duplicatesSkipped: number;
  errors: RowError[];
}

export default function EquipmentImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setServerError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError('CSV is over 5MB — please split into smaller batches.');
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (parsed) => {
        const rows = parsed.data as Array<Record<string, string | undefined>>;
        if (rows.length === 0) {
          setParseError('No data rows found. Make sure your CSV has a header row and at least one machine.');
          return;
        }
        if (rows.length > MAX_IMPORT_ROWS) {
          setParseError(
            `This CSV has ${rows.length} rows. The maximum is ${MAX_IMPORT_ROWS} per import — please split it into smaller files.`
          );
          return;
        }

        // Run the same validator the server uses, so the preview matches
        // exactly what would happen on submit.
        const validRows: ValidatedEquipmentRow[] = [];
        const rowErrors: RowError[] = [];
        rows.forEach((raw, idx) => {
          const r: any = validateEquipmentRow(raw, idx + 2);
          if (r.ok) validRows.push(r.row as ValidatedEquipmentRow);
          else rowErrors.push(...(r.errors as RowError[]));
        });

        setPreview({
          fileName: file.name,
          totalRows: rows.length,
          validRows,
          rowErrors,
          rawRows: rows,
        });
        setStep('preview');
      },
      error: (err) => {
        setParseError(`Could not parse CSV: ${err.message}`);
      },
    });
  }, []);

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so re-selecting the same filename re-fires onChange.
      e.target.value = '';
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = useCallback(async () => {
    if (!preview) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: preview.rawRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Import failed.');
        // Even on error, surface per-row errors if the server returned them.
        if (Array.isArray(data.errors)) {
          setResult({
            imported: data.imported || 0,
            skipped: data.skipped || preview.rawRows.length,
            duplicatesSkipped: data.duplicatesSkipped || 0,
            errors: data.errors as RowError[],
          });
          setStep('result');
        }
        return;
      }
      setResult({
        imported: data.imported,
        skipped: data.skipped,
        duplicatesSkipped: data.duplicatesSkipped || 0,
        errors: (data.errors as RowError[]) || [],
      });
      setStep('result');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Network error during import.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [preview]);

  const reset = () => {
    setStep('upload');
    setPreview(null);
    setResult(null);
    setParseError(null);
    setServerError(null);
  };

  // ── Derived UI helpers ───────────────────────────────────────────────────
  const errorsByRow = useMemo(() => {
    const map = new Map<number, RowError[]>();
    if (!preview) return map;
    preview.rowErrors.forEach((e) => {
      const list = map.get(e.rowIndex) || [];
      list.push(e);
      map.set(e.rowIndex, list);
    });
    return map;
  }, [preview]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#f8fafc] px-4 pb-8"
      style={{
        // Capacitor WebView draws under the device status bar — without
        // this padding the page heading is hidden behind the system clock
        // / signal icons. `max(...)` keeps the original 32px breathing
        // room as a floor for desktop browsers where the inset is 0.
        paddingTop: 'max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header — stacks vertically on phones so the download button
            doesn't squeeze the title and we never lose the back link. */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/dashboard#equipment"
              className="text-sm text-[#635bff] hover:underline inline-block"
            >
              ← Back to Equipment
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-words">
              Bulk Equipment Import
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Upload a CSV to add many machines at once. Maximum{' '}
              {MAX_IMPORT_ROWS} rows per file.
            </p>
          </div>
          <a
            href="/api/equipment/template"
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap self-start sm:self-auto"
          >
            ⬇ Download CSV template
          </a>
        </div>

        {/* Step indicator — wraps to a 2-line layout on phones so the
            third step doesn't get clipped behind the status bar icons. */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-6 text-xs font-medium text-slate-500">
          {(['upload', 'preview', 'result'] as Step[]).map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                  step === s
                    ? 'bg-[#635bff] text-white'
                    : i < ['upload', 'preview', 'result'].indexOf(step)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <span className={step === s ? 'text-slate-900' : ''}>
                {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview' : 'Result'}
              </span>
              {i < 2 && <span className="text-slate-300">›</span>}
            </li>
          ))}
        </ol>

        {/* ── STEP 1: UPLOAD ─────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white rounded-2xl border-2 border-dashed p-6 sm:p-12 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#635bff] bg-[#635bff]/5'
                  : 'border-slate-300 hover:border-[#635bff]'
              }`}
            >
              <div className="text-5xl mb-3">📥</div>
              <p className="text-base font-semibold text-slate-900">
                Drop your CSV here, or click to browse
              </p>
              <p className="text-sm text-slate-500 mt-1">
                .csv files up to 5MB · max {MAX_IMPORT_ROWS} rows
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileInput}
                className="hidden"
              />
            </div>

            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
                {parseError}
              </div>
            )}

            {/* Column reference */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Required columns
              </h2>
              <div className="overflow-x-auto -mx-5 sm:mx-0">
                <table className="w-full text-sm min-w-[480px] px-5 sm:px-0">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-3 sm:pr-4 font-semibold">Column</th>
                      <th className="py-2 px-3 sm:pr-4 font-semibold">Required?</th>
                      <th className="py-2 px-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EQUIPMENT_COLUMNS.map((c) => (
                      <tr key={c.key} className="border-b border-slate-100">
                        <td className="py-2 px-3 sm:pr-4 font-mono text-slate-700 whitespace-nowrap align-top">
                          {c.header}
                        </td>
                        <td className="py-2 px-3 sm:pr-4 whitespace-nowrap align-top">
                          {c.required ? (
                            <span className="text-red-600 font-semibold">
                              required
                            </span>
                          ) : (
                            <span className="text-slate-400">optional</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 align-top">{c.hint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="mt-4 text-xs text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  Show allowed enum values
                </summary>
                <div className="mt-2 space-y-1">
                  <p>
                    <strong>category:</strong> {MACHINE_CATEGORIES.join(', ')}
                  </p>
                  <p>
                    <strong>status:</strong> {MACHINE_STATUSES.join(', ')}
                  </p>
                  <p>
                    <strong>criticality:</strong> {CRITICALITIES.join(', ')}
                  </p>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ───────────────────────────────────────── */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {preview.fileName}
                    </span>{' '}
                    — {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {preview.validRows.length} valid ·{' '}
                    <span
                      className={
                        preview.rowErrors.length > 0
                          ? 'text-red-600 font-semibold'
                          : ''
                      }
                    >
                      {errorsByRow.size} with errors
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Choose another file
                  </button>
                  <button
                    type="button"
                    disabled={
                      submitting ||
                      preview.validRows.length === 0 ||
                      preview.rowErrors.length > 0
                    }
                    onClick={onSubmit}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                      submitting ||
                      preview.validRows.length === 0 ||
                      preview.rowErrors.length > 0
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-[#635bff] hover:bg-[#4f46e5]'
                    }`}
                  >
                    {submitting
                      ? 'Importing…'
                      : `Import ${preview.validRows.length} machine${
                          preview.validRows.length === 1 ? '' : 's'
                        }`}
                  </button>
                </div>
              </div>

              {preview.rowErrors.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                  Fix the {preview.rowErrors.length} highlighted issue
                  {preview.rowErrors.length === 1 ? '' : 's'} below, then re-upload your CSV. Import is disabled until all rows are valid.
                </div>
              )}

              {serverError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                  {serverError}
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">
                        Row
                      </th>
                      {EQUIPMENT_COLUMNS.map((c) => (
                        <th
                          key={c.key}
                          className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap"
                        >
                          {c.header}
                          {c.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rawRows.map((raw, idx) => {
                      const rowIdx = idx + 2;
                      const errors = errorsByRow.get(rowIdx) || [];
                      const fieldErrs = new Set(errors.map((e) => e.field));
                      return (
                        <tr
                          key={idx}
                          className={
                            errors.length > 0
                              ? 'bg-red-50 border-b border-red-100'
                              : 'border-b border-slate-100'
                          }
                        >
                          <td className="px-3 py-2 font-mono text-slate-500 align-top">
                            {rowIdx}
                          </td>
                          {EQUIPMENT_COLUMNS.map((c) => {
                            const value = raw[c.header] ?? '';
                            const bad = fieldErrs.has(c.key);
                            return (
                              <td
                                key={c.key}
                                className={`px-3 py-2 align-top ${
                                  bad
                                    ? 'text-red-700 font-semibold'
                                    : 'text-slate-700'
                                }`}
                              >
                                {value || (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {preview.rowErrors.length > 0 && (
                <div className="border-t border-slate-200 bg-red-50/50 p-4 text-xs text-red-800 max-h-40 overflow-y-auto">
                  <p className="font-semibold mb-2">Issues found:</p>
                  <ul className="space-y-1">
                    {preview.rowErrors.map((e, i) => (
                      <li key={i}>
                        Row {e.rowIndex}, <span className="font-mono">{e.field}</span> — {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULT ────────────────────────────────────────── */}
        {step === 'result' && result && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="text-5xl">
              {result.imported > 0 ? '✅' : '⚠️'}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {result.imported > 0
                ? `Imported ${result.imported} machine${
                    result.imported === 1 ? '' : 's'
                  }`
                : 'No machines imported'}
            </h2>
            <p className="text-sm text-slate-600">
              {result.skipped > 0 && (
                <>
                  Skipped {result.skipped} row{result.skipped === 1 ? '' : 's'}
                  {result.duplicatesSkipped > 0 && (
                    <> ({result.duplicatesSkipped} duplicate
                    {result.duplicatesSkipped === 1 ? '' : 's'})</>
                  )}
                  .
                </>
              )}
            </p>

            {result.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-900 max-h-60 overflow-y-auto">
                <p className="font-semibold mb-2">
                  {result.errors.length} row issue
                  {result.errors.length === 1 ? '' : 's'}:
                </p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.rowIndex},{' '}
                      <span className="font-mono">{e.field}</span> — {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Import another file
              </button>
              <Link
                href="/dashboard#equipment"
                className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5]"
              >
                Back to Equipment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
