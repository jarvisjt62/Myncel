import { db } from './db';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'TWO_FACTOR_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'MACHINE_CREATED'
  | 'MACHINE_UPDATED'
  | 'MACHINE_DELETED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_UPDATED'
  | 'WORK_ORDER_DELETED'
  | 'WORK_ORDER_COMPLETED'
  | 'SETTINGS_CHANGED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'SESSION_REVOKED'
  | 'SUSPICIOUS_ACTIVITY';

export interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        organizationId: data.organizationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        changes: data.changes as any,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Helper to extract request info
export function getRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
  const forwarded = req.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Common audit log helpers
export const AuditLog = {
  async login(userId: string, req: Request, organizationId?: string) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'LOGIN',
      entity: 'User',
      entityId: userId,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });
  },

  async loginFailed(email: string, req: Request, reason: string) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: email,
      ipAddress,
      userAgent,
      metadata: { reason },
    });
  },

  async logout(userId: string, req: Request) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
    });
  },

  async passwordChange(userId: string, req: Request) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
    });
  },

  async twoFactorEnabled(userId: string, req: Request) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'TWO_FACTOR_ENABLED',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
    });
  },

  async twoFactorDisabled(userId: string, req: Request) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'TWO_FACTOR_DISABLED',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
    });
  },

  async accountLocked(userId: string, req: Request, reason: string) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'ACCOUNT_LOCKED',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
      metadata: { reason },
    });
  },

  async sessionRevoked(userId: string, sessionId: string, req: Request) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'SESSION_REVOKED',
      entity: 'Session',
      entityId: sessionId,
      userId,
      ipAddress,
      userAgent,
    });
  },

  async suspiciousActivity(userId: string | undefined, req: Request, details: string) {
    const { ipAddress, userAgent } = getRequestInfo(req);
    return logAuditEvent({
      action: 'SUSPICIOUS_ACTIVITY',
      entity: 'Security',
      userId,
      ipAddress,
      userAgent,
      metadata: { details },
    });
  },
};