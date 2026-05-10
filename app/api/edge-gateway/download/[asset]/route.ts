import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ASSETS: Record<string, { path: string; filename: string; contentType: string }> = {
  package: {
    path: '/downloads/edge-gateway/myncel-edge-gateway-package.zip',
    filename: 'myncel-edge-gateway-package.zip',
    contentType: 'application/zip',
  },
  esp32: {
    path: '/downloads/edge-gateway/esp32_myncel_sensor.ino',
    filename: 'esp32_myncel_sensor.ino',
    contentType: 'text/plain',
  },
  'raspberry-pi': {
    path: '/downloads/edge-gateway/raspberry_pi_agent.py',
    filename: 'raspberry_pi_agent.py',
    contentType: 'text/plain',
  },
  'node-red': {
    path: '/downloads/edge-gateway/myncel_mqtt_bridge_flow.json',
    filename: 'myncel_mqtt_bridge_flow.json',
    contentType: 'application/json',
  },
  'example-yaml': {
    path: '/downloads/edge-gateway/myncel_edge_gateway.example.yaml',
    filename: 'myncel_edge_gateway.example.yaml',
    contentType: 'text/plain',
  },
};

export async function GET(req: NextRequest, { params }: { params: { asset: string } }) {
  const asset = ASSETS[params.asset];
  if (!asset) return NextResponse.json({ error: 'Unknown edge gateway asset' }, { status: 404 });

  // Redirect to static file but with download headers via a passthrough response
  const staticUrl = new URL(asset.path, req.url);
  const fileRes = await fetch(staticUrl);
  if (!fileRes.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const blob = await fileRes.arrayBuffer();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': asset.contentType,
      'Content-Disposition': `attachment; filename="${asset.filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
