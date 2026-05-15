/**
 * Shared API types — match the Prisma schema in the Next.js backend.
 * Keep this file in sync with prisma/schema.prisma.
 */

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'TECHNICIAN'
  | 'OPERATOR'
  | 'EMPLOYEE'
  | 'MEMBER'
  | 'SUPER_ADMIN'
  | 'MANAGER';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  permissions: string[];
};

export type AuthLoginResponse = {
  token: string;
  refreshToken?: string;
  user: CurrentUser;
};

export type MachineStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DOWN' | 'WARNING' | 'OFFLINE';

export type Machine = {
  id: string;
  name: string;
  type: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  location?: string | null;
  status: MachineStatus;
  installedAt?: string | null;
  lastServiceAt?: string | null;
  nextServiceAt?: string | null;
  notes?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WorkOrder = {
  id: string;
  number: string;
  title: string;
  description?: string | null;
  status: WorkOrderStatus;
  priority: Priority;
  type?: string | null;
  machineId?: string | null;
  machine?: Pick<Machine, 'id' | 'name'> | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdById: string;
  dueAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceTask = {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  intervalDays?: number | null;
  machineId?: string | null;
  machine?: Pick<Machine, 'id' | 'name'> | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  lastDoneAt?: string | null;
  nextDueAt?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source?: string | null;
  machineId?: string | null;
  machine?: Pick<Machine, 'id' | 'name'> | null;
  resolved: boolean;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  organizationId: string;
  createdAt: string;
};

export type Part = {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  minQuantity: number;
  unitCost?: number | null;
  supplier?: string | null;
  location?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  openWorkOrders: number;
  unresolvedAlerts: number;
  criticalMachines: number;
  pendingTasks: number;
  totalMachines: number;
  totalParts: number;
  lowStockParts: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};
