import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import RemoteSupportJoinClient from './RemoteSupportJoinClient';
export const dynamic = 'force-dynamic';
export default async function JoinPage({ params }: { params: { token: string } }) {
  const s = await db.remoteSupportSession.findUnique({ where: { inviteToken: params.token }, include: { organization: { select: { name: true } }, machine: { select: { id: true, name: true, model: true, imageUrl: true, status: true } }, workOrder: { select: { id: true, woNumber: true, title: true } }, createdBy: { select: { name: true } } } }).catch(() => null);
  if (!s) notFound();
  const expired = s.inviteExpiresAt ? new Date() > s.inviteExpiresAt : false;
  const ended = s.status === 'ENDED' || s.status === 'CANCELLED';
  return <RemoteSupportJoinClient session={{ id: s.id, title: s.title, description: s.description, status: s.status as any, roomName: s.roomName, inviteToken: params.token, inviteExpiresAt: s.inviteExpiresAt?.toISOString() || null, organization: s.organization, machine: s.machine as any, workOrder: s.workOrder, hostedBy: s.createdBy?.name || 'Myncel Support', notes: s.notes }} expired={expired} ended={ended} />;
}
