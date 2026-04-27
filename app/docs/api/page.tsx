import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — Myncel CMMS',
  description: 'Interactive API documentation for Myncel CMMS IoT and integration endpoints.',
};

export default function ApiDocsPage() {
  return (
    <>
      <style>{`
        /* ── Force light mode always — this is a standalone docs page ── */
        html, body { background: #f6f9fc !important; margin: 0; padding: 0; }

        /* Docs-specific color tokens — always light */
        .docs-root {
          --docs-bg:      #f6f9fc;
          --docs-surface: #ffffff;
          --docs-border:  #e6ebf1;
          --docs-text:    #0a2540;
          --docs-muted:   #546884;
          --docs-accent:  #635bff;
          min-height: 100vh;
          background: #f6f9fc;
          font-family: system-ui, -apple-system, sans-serif;
        }

        * { box-sizing: border-box; }

        /* Header */
        .docs-header {
          background: #ffffff;
          border-bottom: 1px solid #e6ebf1;
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
          color: #635bff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .docs-back:hover { opacity: 0.8; }
        .docs-title { color: #0a2540; font-weight: 700; font-size: 16px; }
        .docs-badge {
          background: rgba(99,91,255,0.12);
          color: #635bff;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(99,91,255,0.3);
        }
        .docs-divider { color: #e6ebf1; }

        /* Quick-ref cards row */
        .docs-cards {
          background: #f6f9fc;
          padding: 20px 24px;
          border-bottom: 1px solid #e6ebf1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }
        .docs-card {
          background: #ffffff;
          border: 1px solid #e6ebf1;
          border-radius: 12px;
          padding: 16px;
        }
        .docs-card-title {
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 13px;
          font-family: system-ui, sans-serif;
        }
        .docs-pre {
          background: #f6f9fc;
          border: 1px solid #e6ebf1;
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
          font-family: system-ui, sans-serif;
        }
        .docs-table th {
          color: #546884;
          text-align: left;
          padding: 4px 8px;
          font-weight: 600;
          border-bottom: 1px solid #e6ebf1;
        }
        .docs-table td { padding: 4px 8px; border-bottom: 1px solid #e6ebf1; }

        /* Swagger UI wrapper */
        .swagger-wrapper {
          background: #f6f9fc;
          min-height: 60vh;
          padding: 0 0 48px;
        }
        #swagger-ui { background: #f6f9fc; }

        /* ── Swagger UI light-mode overrides ── */
        .swagger-ui { font-family: system-ui, -apple-system, sans-serif !important; background: #f6f9fc !important; }
        .swagger-ui .wrapper { background: #f6f9fc !important; max-width: 100% !important; }
        .swagger-ui .information-container { background: #f6f9fc !important; }
        .swagger-ui .scheme-container {
          background: #ffffff !important;
          box-shadow: none !important;
          border-bottom: 1px solid #e6ebf1 !important;
        }
        .swagger-ui .topbar { display: none !important; }

        /* Info block */
        .swagger-ui .info .title { color: #0a2540 !important; font-family: system-ui !important; }
        .swagger-ui .info p,
        .swagger-ui .info li,
        .swagger-ui .info table { color: #546884 !important; }
        .swagger-ui .info a { color: #635bff !important; }

        /* Tags / operation blocks */
        .swagger-ui .opblock-tag { color: #635bff !important; border-bottom: 1px solid #e6ebf1 !important; font-family: system-ui !important; }
        .swagger-ui .opblock-tag-section h3 { color: #0a2540 !important; }
        .swagger-ui .opblock {
          border-radius: 10px !important;
          margin-bottom: 8px !important;
          border: 1px solid #e6ebf1 !important;
          background: #ffffff !important;
        }
        .swagger-ui .opblock .opblock-summary { border-radius: 10px !important; }
        .swagger-ui .opblock.opblock-get  .opblock-summary { background: rgba(99,91,255,0.06) !important; border-color: rgba(99,91,255,0.25) !important; }
        .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(16,185,129,0.06) !important; border-color: rgba(16,185,129,0.25) !important; }
        .swagger-ui .opblock.opblock-patch .opblock-summary { background: rgba(245,158,11,0.06) !important; border-color: rgba(245,158,11,0.25) !important; }
        .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.06) !important; border-color: rgba(239,68,68,0.25) !important; }
        .swagger-ui .opblock-body,
        .swagger-ui .opblock-description-wrapper { background: #ffffff !important; }
        .swagger-ui .opblock-section-header { background: #f6f9fc !important; border-bottom: 1px solid #e6ebf1 !important; }
        .swagger-ui .opblock-section-header h4 { color: #0a2540 !important; }
        .swagger-ui .opblock .opblock-summary-description { color: #546884 !important; }
        .swagger-ui .opblock .opblock-summary-operation-id { color: #546884 !important; }
        .swagger-ui .opblock-summary-path { color: #0a2540 !important; }
        .swagger-ui .opblock-summary-method { border-radius: 4px !important; }

        /* Parameters / tables */
        .swagger-ui table { background: #ffffff !important; }
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: #546884 !important;
          border-color: #e6ebf1 !important;
          font-family: system-ui !important;
          background: #f6f9fc !important;
        }
        .swagger-ui tbody tr td { color: #0a2540 !important; border-color: #e6ebf1 !important; background: #ffffff !important; }
        .swagger-ui .parameter__name { color: #0a2540 !important; font-family: monospace !important; }
        .swagger-ui .parameter__type { color: #546884 !important; font-family: monospace !important; }
        .swagger-ui .parameters-col_description p { color: #546884 !important; }
        .swagger-ui .parameter__in { color: #10b981 !important; font-family: monospace !important; }

        /* Responses */
        .swagger-ui .responses-wrapper { background: #ffffff !important; }
        .swagger-ui .response-col_status { color: #635bff !important; font-family: monospace !important; }
        .swagger-ui .response-col_description { color: #0a2540 !important; }
        .swagger-ui .response { background: #ffffff !important; }

        /* Models */
        .swagger-ui .model-box { background: #f6f9fc !important; border-radius: 8px !important; }
        .swagger-ui .model { color: #546884 !important; }
        .swagger-ui .model-title { color: #0a2540 !important; }
        .swagger-ui section.models { background: #f6f9fc !important; border: 1px solid #e6ebf1 !important; border-radius: 8px !important; }
        .swagger-ui section.models h4 { color: #0a2540 !important; }
        .swagger-ui .model-box-control { color: #0a2540 !important; }

        /* Buttons */
        .swagger-ui .btn { border-radius: 6px !important; font-family: system-ui !important; }
        .swagger-ui .btn.execute { background: #635bff !important; border-color: #635bff !important; color: #fff !important; }
        .swagger-ui .btn.cancel { border-color: #e6ebf1 !important; color: #546884 !important; background: #ffffff !important; }
        .swagger-ui .btn.authorize { background: #635bff !important; border-color: #635bff !important; color: #fff !important; }
        .swagger-ui .authorization__btn svg { fill: #635bff !important; }

        /* Inputs */
        .swagger-ui select,
        .swagger-ui input[type=text],
        .swagger-ui input[type=password],
        .swagger-ui textarea {
          background: #f6f9fc !important;
          color: #0a2540 !important;
          border-color: #e6ebf1 !important;
          border-radius: 6px !important;
        }

        /* Code / pre */
        .swagger-ui code { background: rgba(99,91,255,0.08) !important; color: #635bff !important; border-radius: 4px !important; padding: 1px 5px !important; }
        .swagger-ui pre { background: #f6f9fc !important; border: 1px solid #e6ebf1 !important; border-radius: 8px !important; color: #0a2540 !important; }
        .swagger-ui .highlight-code { background: #f6f9fc !important; }
        .swagger-ui .microlight { color: #0a7c59 !important; }
        .swagger-ui .renderedMarkdown p { color: #546884 !important; }

        /* Auth modal */
        .swagger-ui .auth-wrapper .authorize { background: #635bff !important; border-color: #635bff !important; color: #fff !important; }
        .swagger-ui .dialog-ux .modal-ux { background: #ffffff !important; border: 1px solid #e6ebf1 !important; }
        .swagger-ui .dialog-ux .modal-ux-header { background: #f6f9fc !important; border-bottom: 1px solid #e6ebf1 !important; }
        .swagger-ui .dialog-ux .modal-ux-header h3 { color: #0a2540 !important; }
        .swagger-ui .dialog-ux .modal-ux-content p,
        .swagger-ui .dialog-ux .modal-ux-content label { color: #546884 !important; }

        /* Expand icons */
        .swagger-ui .expand-methods svg,
        .swagger-ui .expand-operation svg { fill: #546884 !important; }
        .swagger-ui .arrow { fill: #546884 !important; }

        /* Prop types */
        .swagger-ui .prop-type { color: #635bff !important; }
        .swagger-ui .prop-format { color: #10b981 !important; }
      `}</style>

      <div className="docs-root">
        {/* Header */}
        <div className="docs-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Smart back navigation — JS detects referrer */}
            <a href="/dashboard" className="docs-back" id="docs-back-link">← Dashboard</a>
            <span className="docs-divider">|</span>
            <span className="docs-title">Myncel API Docs</span>
            <span className="docs-badge">v1.0.0</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="/settings/api-keys"
              style={{
                color: '#635bff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                background: 'rgba(99,91,255,0.1)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(99,91,255,0.3)',
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
                background: '#635bff',
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
        <div className="swagger-wrapper">
          <div id="swagger-ui" />
        </div>
      </div>

      {/* Swagger CSS */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />

      {/* Smart back-link: if came from /admin, show "← Admin"; else show "← Dashboard" */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var link = document.getElementById('docs-back-link');
              if (link) {
                var ref = document.referrer || '';
                if (ref.includes('/dashboard') || (!ref.includes('/admin') && !ref.includes('/admin'))) {
                  var isDash = ref.includes('/dashboard') || window.location.search.includes('from=dashboard');
                  if (isDash) {
                    link.href = '/dashboard';
                    link.textContent = '← Dashboard';
                  }
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