import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    const s = await db.remoteSupportSession.findUnique({ where: { inviteToken: token }, include: { organization: { select: { name: true } }, machine: { select: { id: true, name: true, model: true, imageUrl: true } }, workOrder: { select: { id: true, woNumber: true, title: true } }, createdBy: { select: { name: true } } } });
    if (!s) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    if (s.inviteExpiresAt && new Date() > s.inviteExpiresAt) return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    if (s.status === 'ENDED') return NextResponse.json({ error: 'This support session has already ended' }, { status: 410 });
    if (s.status === 'CANCELLED') return NextResponse.json({ error: 'This support session was cancelled' }, { status: 410 });
    return NextResponse.json({ id: s.id, title: s.title, description: s.description, status: s.status, roomName: s.roomName, organization: s.organization, machine: s.machine, workOrder: s.workOrder, hostedBy: s.createdBy?.name || 'Myncel Support', inviteExpiresAt: s.inviteExpiresAt });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
