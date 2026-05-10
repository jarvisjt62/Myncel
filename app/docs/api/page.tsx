import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — Myncel CMMS',
  description: 'Interactive API documentation for Myncel CMMS IoT and integration endpoints.',
};

export default function ApiDocsPage() {
  return (
    <>
      <style>{`
        /* ── Docs layout ── */
        .docs-root {
          min-height: 100vh;
          background: var(--bg-page);
          font-family: system-ui, -apple-system, sans-serif;
        }

        * { box-sizing: border-box; }

        /* Header */
        .docs-header {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          flex-wrap: wrap;
          gap: 10px;
        }
        .docs-back {
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .docs-back:hover { opacity: 0.8; }
        .docs-title { color: var(--text-primary); font-weight: 700; font-size: 16px; }
        .docs-badge {
          background: var(--accent-bg);
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid var(--accent-border);
        }
        .docs-divider { color: var(--border); }

        /* Quick-ref cards row */
        .docs-cards {
          background: var(--bg-page);
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }
        .docs-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
        }
        .docs-card-title {
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .docs-pre {
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          font-size: 11px;
          color: #0a7c59;
          overflow: auto;
          white-space: pre-wrap;
          font-family: monospace;
          margin: 0;
        }
        .docs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .docs-table th {
          color: var(--text-secondary);
          text-align: left;
          padding: 4px 8px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .docs-table td { padding: 4px 8px; border-bottom: 1px solid var(--border); }

        /* Swagger UI wrapper */
        .swagger-wrapper {
          background: var(--bg-page);
          min-height: 60vh;
          padding: 0 0 48px;
        }
        #swagger-ui { background: var(--bg-page) !important; }

        /* ── Swagger UI theme overrides — respects data-theme ── */
        .swagger-ui { font-family: system-ui, -apple-system, sans-serif !important; background: var(--bg-page) !important; }
        .swagger-ui .wrapper { background: var(--bg-page) !important; max-width: 100% !important; }
        .swagger-ui .information-container { background: var(--bg-page) !important; }
        .swagger-ui .scheme-container {
          background: var(--bg-surface) !important;
          box-shadow: none !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .swagger-ui .topbar { display: none !important; }

        /* Info block */
        .swagger-ui .info .title { color: var(--text-primary) !important; font-family: system-ui !important; }
        .swagger-ui .info p,
        .swagger-ui .info li,
        .swagger-ui .info table { color: var(--text-secondary) !important; }
        .swagger-ui .info a { color: var(--accent) !important; }

        /* Tags / operation blocks */
        .swagger-ui .opblock-tag { color: var(--accent) !important; border-bottom: 1px solid var(--border) !important; font-family: system-ui !important; }
        .swagger-ui .opblock-tag-section h3 { color: var(--text-primary) !important; }
        .swagger-ui .opblock {
          border-radius: 10px !important;
          margin-bottom: 8px !important;
          border: 1px solid var(--border) !important;
          background: var(--bg-surface) !important;
        }
        .swagger-ui .opblock .opblock-summary { border-radius: 10px !important; }
        .swagger-ui .opblock.opblock-get    .opblock-summary { background: rgba(99,91,255,0.06) !important; border-color: rgba(99,91,255,0.25) !important; }
        .swagger-ui .opblock.opblock-post   .opblock-summary { background: rgba(16,185,129,0.06) !important; border-color: rgba(16,185,129,0.25) !important; }
        .swagger-ui .opblock.opblock-patch  .opblock-summary { background: rgba(245,158,11,0.06) !important; border-color: rgba(245,158,11,0.25) !important; }
        .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.06) !important; border-color: rgba(239,68,68,0.25) !important; }
        .swagger-ui .opblock-body,
        .swagger-ui .opblock-description-wrapper { background: var(--bg-surface) !important; }
        .swagger-ui .opblock-section-header { background: var(--bg-surface-2) !important; border-bottom: 1px solid var(--border) !important; }
        .swagger-ui .opblock-section-header h4 { color: var(--text-primary) !important; }
        .swagger-ui .opblock .opblock-summary-description { color: var(--text-secondary) !important; }
        .swagger-ui .opblock .opblock-summary-operation-id { color: var(--text-secondary) !important; }
        .swagger-ui .opblock-summary-path { color: var(--text-primary) !important; }
        .swagger-ui .opblock-summary-method { border-radius: 4px !important; }

        /* Parameters / tables */
        .swagger-ui table { background: var(--bg-surface) !important; }
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: var(--text-secondary) !important;
          border-color: var(--border) !important;
          font-family: system-ui !important;
          background: var(--bg-surface-2) !important;
        }
        .swagger-ui tbody tr td { color: var(--text-primary) !important; border-color: var(--border) !important; background: var(--bg-surface) !important; }
        .swagger-ui .parameter__name { color: var(--text-primary) !important; font-family: monospace !important; }
        .swagger-ui .parameter__type { color: var(--text-secondary) !important; font-family: monospace !important; }
        .swagger-ui .parameters-col_description p { color: var(--text-secondary) !important; }
        .swagger-ui .parameter__in { color: #10b981 !important; font-family: monospace !important; }

        /* Responses */
        .swagger-ui .responses-wrapper { background: var(--bg-surface) !important; }
        .swagger-ui .response-col_status { color: var(--accent) !important; font-family: monospace !important; }
        .swagger-ui .response-col_description { color: var(--text-primary) !important; }
        .swagger-ui .response { background: var(--bg-surface) !important; }

        /* Models */
        .swagger-ui .model-box { background: var(--bg-surface-2) !important; border-radius: 8px !important; }
        .swagger-ui .model { color: var(--text-secondary) !important; }
        .swagger-ui .model-title { color: var(--text-primary) !important; }
        .swagger-ui section.models { background: var(--bg-surface-2) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; }
        .swagger-ui section.models h4 { color: var(--text-primary) !important; }
        .swagger-ui .model-box-control { color: var(--text-primary) !important; }

        /* Buttons */
        .swagger-ui .btn { border-radius: 6px !important; font-family: system-ui !important; }
        .swagger-ui .btn.execute  { background: var(--accent) !important; border-color: var(--accent) !important; color: #fff !important; }
        .swagger-ui .btn.cancel   { border-color: var(--border) !important; color: var(--text-secondary) !important; background: var(--bg-surface) !important; }
        .swagger-ui .btn.authorize { background: var(--accent) !important; border-color: var(--accent) !important; color: #fff !important; }
        .swagger-ui .authorization__btn svg { fill: var(--accent) !important; }

        /* Inputs */
        .swagger-ui select,
        .swagger-ui input[type=text],
        .swagger-ui input[type=password],
        .swagger-ui textarea {
          background: var(--bg-surface-2) !important;
          color: var(--text-primary) !important;
          border-color: var(--border) !important;
          border-radius: 6px !important;
        }

        /* Code / pre */
        .swagger-ui code { background: var(--accent-bg) !important; color: var(--accent) !important; border-radius: 4px !important; padding: 1px 5px !important; }
        .swagger-ui pre { background: var(--bg-surface-2) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; color: var(--text-primary) !important; }
        .swagger-ui .highlight-code { background: var(--bg-surface-2) !important; }
        .swagger-ui .microlight { color: #0a7c59 !important; }
        .swagger-ui .renderedMarkdown p { color: var(--text-secondary) !important; }

        /* Auth modal */
        .swagger-ui .auth-wrapper .authorize { background: var(--accent) !important; border-color: var(--accent) !important; color: #fff !important; }
        .swagger-ui .dialog-ux .modal-ux { background: var(--bg-surface) !important; border: 1px solid var(--border) !important; }
        .swagger-ui .dialog-ux .modal-ux-header { background: var(--bg-surface-2) !important; border-bottom: 1px solid var(--border) !important; }
        .swagger-ui .dialog-ux .modal-ux-header h3 { color: var(--text-primary) !important; }
        .swagger-ui .dialog-ux .modal-ux-content p,
        .swagger-ui .dialog-ux .modal-ux-content label { color: var(--text-secondary) !important; }

        /* Expand icons */
        .swagger-ui .expand-methods svg,
        .swagger-ui .expand-operation svg { fill: var(--text-secondary) !important; }
        .swagger-ui .arrow { fill: var(--text-secondary) !important; }

        /* Prop types */
        .swagger-ui .prop-type   { color: var(--accent) !important; }
        .swagger-ui .prop-format { color: #10b981 !important; }

        /* Dark mode specific Swagger overrides */
        [data-theme="dark"] .swagger-ui .opblock-summary-path__deprecated { color: var(--text-muted) !important; }
        [data-theme="dark"] .swagger-ui select option { background: var(--bg-surface) !important; color: var(--text-primary) !important; }
      `}</style>

      <div className="docs-root">
        {/* Header */}
        <div className="docs-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a href="/dashboard" className="docs-back" id="docs-back-link">← Dashboard</a>
            <span className="docs-divider">|</span>
            <span className="docs-title">Myncel API Docs</span>
            <span className="docs-badge">v1.0.0</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="/settings/api-keys"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                background: 'var(--accent-bg)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--accent-border)',
              }}
            >
              🔑 Manage API Keys
            </a>
            <a
              href="/setup"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                background: 'var(--accent)',
                padding: '6px 14px',
                borderRadius: '8px',
              }}
            >
              ⚡ Setup Wizard
            </a>
          </div>
        </div>

        {/* Quick reference cards */}
        <div className="docs-cards">
          <div className="docs-card">
            <div className="docs-card-title" style={{ color: 'var(--accent)' }}>🔌 IoT Quick Start</div>
            <pre className="docs-pre">{`curl -X POST /api/iot \\
     -H "X-API-Key: YOUR_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "machineId": "clx123...",
       "sensorType": "temperature",
       "value": 72.5,
       "unit": "°C"
     }'`}</pre>
          </div>

          <div className="docs-card">
            <div className="docs-card-title" style={{ color: '#10b981' }}>📦 Batch Readings</div>
            <pre className="docs-pre">{`# Send up to 100 readings at once
curl -X POST /api/iot \\
  -H "X-API-Key: YOUR_KEY" \\
  -d '[
    {"machineId":"m1","sensorType":"temperature","value":71,"unit":"°C"},
    {"machineId":"m1","sensorType":"vibration","value":2.3,"unit":"mm/s"},
    {"machineId":"m2","sensorType":"pressure","value":95,"unit":"PSI"}
  ]'`}</pre>
          </div>

          <div className="docs-card">
            <div className="docs-card-title" style={{ color: '#f59e0b' }}>⚠️ Alert Thresholds</div>
            <table className="docs-table">
              <thead>
                <tr>
                  {['Sensor', 'Warning', 'Critical'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['temperature', '>75°C',    '>90°C'],
                  ['vibration',   '>7mm/s',   '>10mm/s'],
                  ['pressure',    '>120 PSI', '>150 PSI'],
                  ['current',     '>40A',     '>50A'],
                  ['oil_level',   '<20%',     '<10%'],
                ].map(([sensor, warn, crit]) => (
                  <tr key={sensor}>
                    <td style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '11px' }}>{sensor}</td>
                    <td style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '11px' }}>{warn}</td>
                    <td style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '11px' }}>{crit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Swagger UI */}
        <div className="swagger-wrapper">
          <div id="swagger-ui" />
        </div>
      </div>

      {/* Swagger CSS */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />

      {/* Smart back-link */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var link = document.getElementById('docs-back-link');
              if (link) {
                var ref = document.referrer || '';
                if (ref.includes('/admin')) {
                  link.href = '/admin';
                  link.textContent = '← Admin';
                } else {
                  link.href = '/dashboard';
                  link.textContent = '← Dashboard';
                }
              }
            })();
          `,
        }}
      />

      {/* Swagger bundle loader */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              var script = document.createElement('script');
              script.src = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js';
              script.onload = function() {
                SwaggerUIBundle({
                  url: '/api/docs',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                  layout: 'BaseLayout',
                  defaultModelsExpandDepth: 1,
                  defaultModelExpandDepth: 2,
                  docExpansion: 'list',
                  filter: true,
                  persistAuthorization: true,
                  syntaxHighlight: { activate: true, theme: 'tomorrow' },
                  tryItOutEnabled: true,
                });
              };
              document.head.appendChild(script);
            });
          `,
        }}
      />
    </>
  );
}