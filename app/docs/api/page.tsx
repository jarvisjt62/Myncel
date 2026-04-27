import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — Myncel CMMS',
  description: 'Interactive API documentation for Myncel CMMS IoT and integration endpoints.',
};

export default function ApiDocsPage() {
  return (
    <>
      <style>{`
        :root { --docs-bg: #f6f9fc; --docs-surface: #ffffff; --docs-border: #e6ebf1; --docs-text: #0a2540; --docs-muted: #546884; }
        @media (prefers-color-scheme: dark) {
          :root { --docs-bg: #060e1f; --docs-surface: #101e35; --docs-border: #1e2d4a; --docs-text: #e8edf4; --docs-muted: #8892a4; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--docs-bg) !important; }

        /* Swagger UI theme overrides */
        .swagger-ui { font-family: system-ui, -apple-system, sans-serif !important; }
        .swagger-ui .wrapper { background: var(--docs-bg) !important; }
        .swagger-ui .information-container { background: var(--docs-bg) !important; }
        .swagger-ui .scheme-container { background: var(--docs-surface) !important; box-shadow: none !important; border-bottom: 1px solid var(--docs-border) !important; }
        .swagger-ui .topbar { display: none !important; }
        .swagger-ui .info .title { color: var(--docs-text) !important; font-family: system-ui !important; }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: var(--docs-muted) !important; }
        .swagger-ui .info a { color: #635bff !important; }
        .swagger-ui .opblock-tag { color: #635bff !important; border-bottom: 1px solid var(--docs-border) !important; font-family: system-ui !important; }
        .swagger-ui .opblock-tag-section h3 { color: var(--docs-text) !important; }
        .swagger-ui .opblock { border-radius: 10px !important; margin-bottom: 8px !important; border: 1px solid var(--docs-border) !important; }
        .swagger-ui .opblock .opblock-summary { border-radius: 10px !important; }
        .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(99,91,255,0.06) !important; border-color: rgba(99,91,255,0.25) !important; }
        .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(16,185,129,0.06) !important; border-color: rgba(16,185,129,0.25) !important; }
        .swagger-ui .opblock.opblock-patch .opblock-summary { background: rgba(245,158,11,0.06) !important; border-color: rgba(245,158,11,0.25) !important; }
        .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.06) !important; border-color: rgba(239,68,68,0.25) !important; }
        .swagger-ui .opblock-body, .swagger-ui .opblock-description-wrapper { background: var(--docs-surface) !important; }
        .swagger-ui .opblock .opblock-summary-description { color: var(--docs-muted) !important; }
        .swagger-ui .opblock .opblock-summary-operation-id { color: var(--docs-muted) !important; }
        .swagger-ui .model-box { background: var(--docs-surface) !important; border-radius: 8px !important; }
        .swagger-ui .btn { border-radius: 6px !important; font-family: system-ui !important; }
        .swagger-ui .btn.execute { background: #635bff !important; border-color: #635bff !important; color: #fff !important; }
        .swagger-ui .btn.cancel { border-color: var(--docs-border) !important; color: var(--docs-muted) !important; }
        .swagger-ui select, .swagger-ui input[type=text], .swagger-ui textarea {
          background: var(--docs-bg) !important; color: var(--docs-text) !important;
          border-color: var(--docs-border) !important; border-radius: 6px !important;
        }
        .swagger-ui .parameter__name { color: var(--docs-text) !important; font-family: monospace !important; }
        .swagger-ui .parameter__type { color: var(--docs-muted) !important; font-family: monospace !important; }
        .swagger-ui .parameters-col_description p { color: var(--docs-muted) !important; }
        .swagger-ui .response-col_status { color: #635bff !important; font-family: monospace !important; }
        .swagger-ui .responses-wrapper { background: var(--docs-surface) !important; }
        .swagger-ui table thead tr td, .swagger-ui table thead tr th {
          color: var(--docs-muted) !important; border-color: var(--docs-border) !important;
          font-family: system-ui !important; background: var(--docs-surface) !important;
        }
        .swagger-ui tbody tr td { color: var(--docs-text) !important; border-color: var(--docs-border) !important; }
        .swagger-ui .model-title { color: var(--docs-text) !important; }
        .swagger-ui .model { color: var(--docs-muted) !important; }
        .swagger-ui .prop-type { color: #635bff !important; }
        .swagger-ui .prop-format { color: #10b981 !important; }
        .swagger-ui code { background: rgba(99,91,255,0.1) !important; color: #635bff !important; border-radius: 4px !important; padding: 1px 5px !important; }
        .swagger-ui pre { background: var(--docs-bg) !important; border: 1px solid var(--docs-border) !important; border-radius: 8px !important; }
        .swagger-ui .highlight-code { background: var(--docs-bg) !important; }
        .swagger-ui .microlight { color: #10b981 !important; }
        .swagger-ui .markdown p { color: var(--docs-muted) !important; }
        .swagger-ui .markdown code { background: rgba(99,91,255,0.1) !important; color: #635bff !important; }
        .swagger-ui .markdown table { border-color: var(--docs-border) !important; }
        .swagger-ui .markdown table td, .swagger-ui .markdown table th {
          border-color: var(--docs-border) !important; color: var(--docs-muted) !important; padding: 6px 12px !important;
        }
        .swagger-ui .authorization__btn svg { fill: #635bff !important; }
        .swagger-ui .auth-wrapper .authorize { background: #635bff !important; border-color: #635bff !important; color: #fff !important; }
        .swagger-ui .dialog-ux .modal-ux { background: var(--docs-surface) !important; border: 1px solid var(--docs-border) !important; }
        .swagger-ui .dialog-ux .modal-ux-header { background: var(--docs-surface) !important; border-bottom: 1px solid var(--docs-border) !important; }
        .swagger-ui .dialog-ux .modal-ux-header h3 { color: var(--docs-text) !important; }
        .swagger-ui .expand-methods svg, .swagger-ui .expand-operation svg { fill: var(--docs-muted) !important; }
        #swagger-wrapper { padding: 0; }

        /* Quick-ref card styles */
        .docs-header {
          background: var(--docs-surface);
          border-bottom: 1px solid var(--docs-border);
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
        .docs-header a, .docs-header span { text-decoration: none; font-family: system-ui, sans-serif; }
        .docs-back { color: #635bff; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
        .docs-back:hover { opacity: 0.8; }
        .docs-title { color: var(--docs-text); font-weight: 700; font-size: 16px; }
        .docs-badge {
          background: rgba(99,91,255,0.12); color: #635bff; font-size: 11px; font-weight: 600;
          padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(99,91,255,0.3);
        }
        .docs-cards {
          background: var(--docs-bg);
          padding: 20px 24px;
          border-bottom: 1px solid var(--docs-border);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }
        .docs-card {
          background: var(--docs-surface); border: 1px solid var(--docs-border);
          border-radius: 12px; padding: 16px;
        }
        .docs-card-title { font-weight: 700; margin-bottom: 10px; font-size: 13px; font-family: system-ui, sans-serif; }
        .docs-pre {
          background: var(--docs-bg); border: 1px solid var(--docs-border);
          border-radius: 8px; padding: 12px; font-size: 11px; color: #10b981;
          overflow: auto; white-space: pre-wrap; font-family: monospace;
        }
        .docs-table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: system-ui, sans-serif; }
        .docs-table th { color: var(--docs-muted); text-align: left; padding: 4px 8px; font-weight: 600; border-bottom: 1px solid var(--docs-border); }
        .docs-table td { padding: 4px 8px; border-bottom: 1px solid var(--docs-border); }
        .swagger-wrapper { background: var(--docs-bg); min-height: 100vh; padding: 0 0 48px; }
      `}</style>

      {/* Custom header */}
      <div className="docs-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <a href="/dashboard" className="docs-back">← Dashboard</a>
          <span style={{ color: 'var(--docs-border)' }}>|</span>
          <span className="docs-title">Myncel API Docs</span>
          <span className="docs-badge">v1.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/settings/api-keys" style={{
            color: '#635bff', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
            background: 'rgba(99,91,255,0.1)', padding: '6px 14px', borderRadius: '8px',
            border: '1px solid rgba(99,91,255,0.3)',
          }}>🔑 Manage API Keys</a>
          <a href="/setup" style={{
            color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
            background: '#635bff', padding: '6px 14px', borderRadius: '8px',
          }}>⚡ Setup Wizard</a>
        </div>
      </div>

      {/* Quick reference cards */}
      <div className="docs-cards">
        <div className="docs-card">
          <div className="docs-card-title" style={{ color: '#635bff' }}>🔌 IoT Quick Start</div>
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
                  <th key={h} style={{ color: 'var(--docs-muted)' }}>{h}</th>
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
                  <td style={{ color: '#635bff', fontFamily: 'monospace', fontSize: '11px' }}>{sensor}</td>
                  <td style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '11px' }}>{warn}</td>
                  <td style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '11px' }}>{crit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swagger UI */}
      <div id="swagger-wrapper" className="swagger-wrapper">
        <div id="swagger-ui" />
      </div>

      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
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
                  syntaxHighlight: { activate: true, theme: 'agate' },
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