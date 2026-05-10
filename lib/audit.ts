import { Prisma } from '@prisma/client';
import { db } from './db';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'ASSIGN' 
  | 'COMPLETE' 
  | 'CANCEL';

export interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        organizationId: data.organizationId,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : Prisma.JsonNull,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(params: {
  organizationId: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {
    organizationId: params.organizationId,
  };

  if (params.entity) where.entity = params.entity;
  if (params.entityId) where.entityId = params.entityId;
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) (where.createdAt as Record<string, unknown>).gte = params.startDate;
    if (params.endDate) (where.createdAt as Record<string, unknown>).lte = params.endDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get action label for display
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    VIEW: 'Viewed',
    EXPORT: 'Exported',
    ASSIGN: 'Assigned',
    COMPLETE: 'Completed',
    CANCEL: 'Cancelled',
  };
  return labels[action] || action;
}

/**
 * Get action color for display
 */
export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'text-green-600 bg-green-50',
    UPDATE: 'text-blue-600 bg-blue-50',
    DELETE: 'text-red-600 bg-red-50',
    LOGIN: 'text-purple-600 bg-purple-50',
    LOGOUT: 'text-gray-600 bg-gray-50',
    VIEW: 'text-gray-600 bg-gray-50',
    EXPORT: 'text-yellow-600 bg-yellow-50',
    ASSIGN: 'text-indigo-600 bg-indigo-50',
    COMPLETE: 'text-emerald-600 bg-emerald-50',
    CANCEL: 'text-orange-600 bg-orange-50',
  };
  return colors[action] || 'text-gray-600 bg-gray-50';
}