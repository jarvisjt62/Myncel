import { Metadata } from 'next';
import JoinClient from './JoinClient';

export const metadata: Metadata = {
  title: 'Accept Invitation — Myncel',
  description: 'Accept your team invitation and join your organization on Myncel.',
  robots: { index: false, follow: false },
};

export default function JoinPage({ params }: { params: { token: string } }) {
  return <JoinClient token={params.token} />;
}