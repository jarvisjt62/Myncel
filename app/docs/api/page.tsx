import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — Myncel CMMS',
  description: 'Interactive API documentation for Myncel CMMS IoT and integration endpoints.',
};

export default function ApiDocsPage() {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #070d1a; }
        .swagger-ui { background: #0d1426 !important; }
        .swagger-ui .info { background: transparent !important; }
        .swagger-ui .scheme-container { background: #0d1426 !important; box-shadow: none !important; border-bottom: 1px solid #1e2d4a !important; }
        .swagger-ui .topbar { display: none !important; }
        .swagger-ui .info .title { color: #fff !important; font-family: system-ui !important; }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #8892a4 !important; }
        .swagger-ui .opblock-tag { color: #635bff !important; border-bottom: 1px solid #1e2d4a !important; font-family: system-ui !important; }
        .swagger-ui .opblock { border-radius: 8px !important; margin-bottom: 8px !important; border: 1px solid #1e2d4a !important; }
        .swagger-ui .opblock .opblock-summary { border-radius: 8px !important; }
        .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(99, 91, 255, 0.08) !important; border-color: rgba(99, 91, 255, 0.3) !important; }
        .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(16, 185, 129, 0.08) !important; border-color: rgba(16, 185, 129, 0.3) !important; }
        .swagger-ui .opblock.opblock-patch .opblock-summary { background: rgba(245, 158, 11, 0.08) !important; border-color: rgba(245, 158, 11, 0.3) !important; }
        .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239, 68, 68, 0.08) !important; border-color: rgba(239, 68, 68, 0.3) !important; }
        .swagger-ui .opblock-body { background: #070d1a !important; }
        .swagger-ui .model-box { background: #0d1426 !important; border-radius: 8px !important; }
        .swagger-ui .btn { border-radius: 6px !important; font-family: system-ui !important; }
        .swagger-ui .btn.execute { background: #635bff !important; border-color: #635bff !important; }
        .swagger-ui select, .swagger-ui input[type=text], .swagger-ui textarea { background: #070d1a !important; color: #fff !important; border-color: #1e2d4a !important; border-radius: 6px !important; }
        .swagger-ui .parameter__name, .swagger-ui .parameter__type { color: #8892a4 !important; font-family: monospace !important; }
        .swagger-ui .response-col_status { color: #635bff !important; font-family: monospace !important; }
        .swagger-ui .responses-wrapper { background: #070d1a !important; }
        .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #8892a4 !important; border-color: #1e2d4a !important; font-family: system-ui !important; }
        .swagger-ui .model-title { color: #fff !important; }
        .swagger-ui .model { color: #8892a4 !important; }
        .swagger-ui .prop-type { color: #635bff !important; }
        .swagger-ui .prop-format { color: #10b981 !important; }
        .swagger-ui code { background: #1e2d4a !important; color: #10b981 !important; border-radius: 4px !important; }
        .swagger-ui pre { background: #070d1a !important; border: 1px solid #1e2d4a !important; border-radius: 8px !important; }
        .swagger-ui .highlight-code { background: #070d1a !important; }
        .swagger-ui .markdown p { color: #8892a4 !important; }
        .swagger-ui .markdown code { background: #1e2d4a !important; color: #635bff !important; }
        .swagger-ui .markdown table { border-color: #1e2d4a !important; }
        .swagger-ui .markdown table td, .swagger-ui .markdown table th { border-color: #1e2d4a !important; color: #8892a4 !important; padding: 6px 12px !important; }
        .swagger-ui .authorization__btn { color: #635bff !important; }
        .swagger-ui .auth-wrapper .authorize { background: #635bff !important; border-color: #635bff !important; }
        #swagger-wrapper { padding: 0; }
      `}</style>

      {/* Custom header */}
      <div style={{
        background: '#0d1426',
        borderBottom: '1px solid #1e2d4a',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/dashboard" style={{ color: '#8892a4', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
          <span style={{ color: '#1e2d4a' }}>|</span>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Myncel API Docs</span>
          <span style={{
            background: 'rgba(99,91,255,0.15)',
            color: '#635bff',
            fontSize: '11px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(99,91,255,0.3)',
          }}>v1.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/settings/api-keys" style={{
            color: '#635bff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            background: 'rgba(99,91,255,0.1)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(99,91,255,0.3)',
          }}>🔑 Manage API Keys</a>
          <a href="/setup" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            background: '#635bff',
            padding: '6px 14px',
            borderRadius: '8px',
          }}>⚡ Setup Wizard</a>
        </div>
      </div>

      {/* Quick reference cards */}
      <div style={{
        background: '#070d1a',
        padding: '24px',
        borderBottom: '1px solid #1e2d4a',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        <div style={{ background: '#0d1426', border: '1px solid #1e2d4a', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#635bff', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>🔌 IoT Quick Start</div>
          <pre style={{ background: '#070d1a', border: '1px solid #1e2d4a', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#10b981', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{`curl -X POST /api/iot \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "machineId": "clx123...",
    "sensorType": "temperature",
    "value": 72.5,
    "unit": "°C"
  }'`}</pre>
        </div>

        <div style={{ background: '#0d1426', border: '1px solid #1e2d4a', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#10b981', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>📦 Batch Readings</div>
          <pre style={{ background: '#070d1a', border: '1px solid #1e2d4a', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#10b981', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{`# Send up to 100 readings at once
curl -X POST /api/iot \\
  -H "X-API-Key: YOUR_KEY" \\
  -d '[
    {"machineId":"m1","sensorType":"temperature","value":71,"unit":"°C"},
    {"machineId":"m1","sensorType":"vibration","value":2.3,"unit":"mm/s"},
    {"machineId":"m2","sensorType":"pressure","value":95,"unit":"PSI"}
  ]'`}</pre>
        </div>

        <div style={{ background: '#0d1426', border: '1px solid #1e2d4a', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#f59e0b', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>⚠️ Alert Thresholds</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                {['Sensor', 'Warning', 'Critical'].map(h => (
                  <th key={h} style={{ color: '#8892a4', textAlign: 'left', padding: '4px 8px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['temperature', '>75°C', '>90°C'],
                ['vibration',   '>7mm/s', '>10mm/s'],
                ['pressure',    '>120 PSI', '>150 PSI'],
                ['current',     '>40A', '>50A'],
                ['oil_level',   '<20%', '<10%'],
              ].map(([sensor, warn, crit]) => (
                <tr key={sensor} style={{ borderBottom: '1px solid #1e2d4a' }}>
                  <td style={{ color: '#635bff', padding: '4px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{sensor}</td>
                  <td style={{ color: '#f59e0b', padding: '4px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{warn}</td>
                  <td style={{ color: '#ef4444', padding: '4px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{crit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swagger UI */}
      <div id="swagger-wrapper" style={{ background: '#070d1a', minHeight: '100vh', padding: '0 24px 48px' }}>
        <div id="swagger-ui" />
      </div>

      {/* Load Swagger UI from CDN */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              // Load swagger-ui-bundle
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
                  syntaxHighlight: { activate: true, theme: 'nord' },
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