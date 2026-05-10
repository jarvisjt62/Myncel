import { db } from './db';

export interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActivity: Date;
  isCurrent: boolean;
}

// Parse user agent to get device name
export function parseUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';
  
  let browser = 'Unknown Browser';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
  
  let os = 'Unknown OS';
  if (userAgent.includes('Windows NT 10')) os = 'Windows 10';
  else if (userAgent.includes('Windows NT 11')) os = 'Windows 11';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
}

// Get all active sessions for a user
export async function getUserSessions(userId: string, currentSessionToken: string): Promise<SessionInfo[]> {
  const sessions = await db.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { lastActivity: 'desc' },
  });
  
  return sessions.map(session => ({
    id: session.id,
    deviceName: session.deviceName || parseUserAgent(session.userAgent || ''),
    ipAddress: session.ipAddress || 'Unknown',
    lastActivity: session.lastActivity,
    isCurrent: session.sessionToken === currentSessionToken,
  }));
}

// Revoke a specific session
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const result = await db.session.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    return result.count > 0;
  } catch {
    return false;
  }
}

// Revoke all other sessions (keep current)
export async function revokeOtherSessions(userId: string, currentSessionToken: string): Promise<number> {
  const result = await db.session.deleteMany({
    where: {
      userId,
      sessionToken: { not: currentSessionToken },
    },
  });
  
  return result.count;
}

// Update session activity
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await db.session.update({
      where: { sessionToken },
      data: { lastActivity: new Date() },
    });
  } catch {
    // Ignore errors
  }
}

// Detect suspicious session activity
export async function detectSuspiciousActivity(userId: string, currentIp: string): Promise<{ suspicious: boolean; reason?: string }> {
  const recentSessions = await db.session.findMany({
    where: {
      userId,
      lastActivity: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { ipAddress: true },
  });
  
  const uniqueIps = new Set(recentSessions.map(s => s.ipAddress).filter(Boolean));
  
  if (uniqueIps.size > 0 && !uniqueIps.has(currentIp)) {
    return { suspicious: true, reason: 'New IP address detected' };
  }
  
  if (uniqueIps.size > 5) {
    return { suspicious: true, reason: 'Multiple IP addresses detected' };
  }
  
  return { suspicious: false };
}