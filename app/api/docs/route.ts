import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Myncel CMMS API',
    version: '1.0.0',
    description: `
## Myncel CMMS REST API

Connect your IoT sensors, machines, and external systems to the Myncel Computerized Maintenance Management System.

### Authentication
All IoT endpoints use **API Key** authentication via the \`X-API-Key\` header.
Dashboard endpoints use **Session** authentication (cookie-based).

### Base URL
\`https://your-domain.com/api\`

### Rate Limits
- IoT ingestion: 1,000 requests/minute per API key
- Dashboard APIs: 60 requests/minute per session
    `.trim(),
    contact: {
      name: 'Myncel Support',
      url: 'https://myncel.com/support',
    },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: '/api', description: 'Current server' },
  ],
  tags: [
    { name: 'IoT',          description: 'IoT sensor data ingestion and retrieval' },
    { name: 'Machines',     description: 'Equipment registration and management' },
    { name: 'Dashboard',    description: 'Dashboard KPIs, trends, and activity' },
    { name: 'Work Orders',  description: 'Work order management' },
    { name: 'Alerts',       description: 'Alert management' },
    { name: 'Reports',      description: 'Maintenance reports and exports' },
    { name: 'Settings',     description: 'API keys and integration settings' },
  ],
  components: {
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key generated from Settings → API Keys. Used for IoT sensor endpoints.',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Session-based auth (cookie). Used for dashboard endpoints.',
      },
    },
    schemas: {
      SensorReading: {
        type: 'object',
        required: ['machineId', 'sensorType', 'value', 'unit'],
        properties: {
          machineId:  { type: 'string', description: 'Myncel machine ID (cuid)', example: 'clx1abc23def' },
          sensorId:   { type: 'string', description: 'Optional external sensor identifier' },
          sensorType: {
            type: 'string',
            enum: ['temperature', 'vibration', 'runtime_hours', 'cycle_count', 'pressure', 'current', 'oil_level', 'humidity', 'custom'],
            example: 'temperature',
          },
          value:     { type: 'number', example: 72.5 },
          unit:      { type: 'string', example: '°C' },
          timestamp: { type: 'string', format: 'date-time', description: 'ISO 8601 timestamp. Defaults to now if omitted.' },
          metadata:  { type: 'object', description: 'Optional custom metadata' },
        },
      },
      Machine: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          name:         { type: 'string' },
          model:        { type: 'string', nullable: true },
          manufacturer: { type: 'string', nullable: true },
          serialNumber: { type: 'string', nullable: true },
          location:     { type: 'string', nullable: true },
          category: {
            type: 'string',
            enum: ['CNC_MILL','CNC_LATHE','PRESS','HYDRAULIC','COMPRESSOR','CONVEYOR','WELDER','INJECTION_MOLD','ASSEMBLY','LASER_CUTTER','PLASMA_CUTTER','GRINDER','DRILL_PRESS','PUMP','BOILER','GENERATOR','CRANE','ROBOT','HEAT_TREATMENT','OTHER'],
          },
          status: {
            type: 'string',
            enum: ['OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'RETIRED'],
          },
          criticality: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW'],
          },
          totalHours:    { type: 'number' },
          lastServiceAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt:     { type: 'string', format: 'date-time' },
          updatedAt:     { type: 'string', format: 'date-time' },
        },
      },
      WorkOrder: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          woNumber:    { type: 'string', example: 'WO-000123' },
          title:       { type: 'string' },
          description: { type: 'string', nullable: true },
          type: {
            type: 'string',
            enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'PREDICTIVE'],
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          dueAt:       { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          machineId:   { type: 'string' },
          createdAt:   { type: 'string', format: 'date-time' },
        },
      },
      Alert: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          type: {
            type: 'string',
            enum: ['SENSOR_THRESHOLD', 'MAINTENANCE_OVERDUE', 'MACHINE_BREAKDOWN', 'LOW_PARTS', 'WORK_ORDER_OVERDUE'],
          },
          title:      { type: 'string' },
          message:    { type: 'string' },
          severity: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
          },
          isRead:     { type: 'boolean' },
          isResolved: { type: 'boolean' },
          machineId:  { type: 'string', nullable: true },
          createdAt:  { type: 'string', format: 'date-time' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          name:         { type: 'string' },
          status:       { type: 'string', enum: ['CONNECTED', 'DISCONNECTED'] },
          apiKeyMasked: { type: 'string', example: 'mnc_iot_a1b2c3d4e5f6...ef12' },
          createdAt:    { type: 'string', format: 'date-time' },
          lastUsed:     { type: 'string', format: 'date-time', nullable: true },
          usageCount:   { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
      TrendData: {
        type: 'object',
        properties: {
          current:   { type: 'number' },
          previous:  { type: 'number' },
          change:    { type: 'number', description: 'Percentage change' },
          direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
        },
      },
    },
  },
  paths: {
    // ─── IoT ──────────────────────────────────────────────────────────────────
    '/iot': {
      post: {
        tags: ['IoT'],
        summary: 'Ingest sensor readings',
        description: `Submit one or multiple sensor readings from IoT devices.

**Supported sensor types and their auto-alert thresholds:**

| Type | Unit | Warning | Critical |
|------|------|---------|----------|
| temperature | °C | >75 | >90 |
| vibration | mm/s | >7 | >10 |
| pressure | PSI | >120 | >150 |
| current | A | >40 | >50 |
| oil_level | % | <20 | <10 |
| runtime_hours | hrs | — | — (updates machine totalHours) |
| humidity | % | — | — |
| cycle_count | count | — | — |
| custom | any | — | — |`,
        security: [{ ApiKeyHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/SensorReading' },
                  { type: 'array', items: { $ref: '#/components/schemas/SensorReading' }, maxItems: 100 },
                ],
              },
              examples: {
                single: {
                  summary: 'Single reading',
                  value: { machineId: 'clx1abc23', sensorType: 'temperature', value: 72.5, unit: '°C' },
                },
                batch: {
                  summary: 'Batch readings',
                  value: [
                    { machineId: 'clx1abc23', sensorType: 'temperature', value: 72.5, unit: '°C' },
                    { machineId: 'clx1abc23', sensorType: 'vibration', value: 3.2, unit: 'mm/s' },
                    { machineId: 'clx9xyz99', sensorType: 'pressure', value: 95, unit: 'PSI' },
                  ],
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Readings processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:    { type: 'boolean' },
                    processed:  { type: 'integer' },
                    successful: { type: 'integer' },
                    failed:     { type: 'integer' },
                    results:    { type: 'array', items: { type: 'object', properties: { machineId: { type: 'string' }, status: { type: 'string' }, error: { type: 'string' } } } },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid or missing API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '400': { description: 'Invalid request body', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['IoT'],
        summary: 'Get recent sensor readings for a machine',
        security: [{ ApiKeyHeader: [] }],
        parameters: [
          { name: 'machineId', in: 'query', required: true, schema: { type: 'string' }, description: 'Machine ID to fetch readings for' },
        ],
        responses: {
          '200': {
            description: 'Sensor readings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    machineId:      { type: 'string' },
                    machineName:    { type: 'string' },
                    totalHours:     { type: 'number' },
                    lastServiceAt:  { type: 'string', format: 'date-time', nullable: true },
                    status:         { type: 'string' },
                    recentReadings: { type: 'array', items: { $ref: '#/components/schemas/SensorReading' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Machine not found' },
        },
      },
    },

    // ─── Machines ─────────────────────────────────────────────────────────────
    '/machines': {
      get: {
        tags: ['Machines'],
        summary: 'List all machines',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of machines',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    machines: { type: 'array', items: { $ref: '#/components/schemas/Machine' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Machines'],
        summary: 'Create a new machine',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name:         { type: 'string', example: 'Haas VF-2' },
                  model:        { type: 'string', example: 'VF-2' },
                  manufacturer: { type: 'string', example: 'Haas Automation' },
                  serialNumber: { type: 'string', example: 'SN-2024-001' },
                  location:     { type: 'string', example: 'Building A, Bay 3' },
                  category:     { type: 'string', example: 'CNC_MILL' },
                  criticality:  { type: 'string', example: 'HIGH' },
                  yearInstalled:{ type: 'integer', example: 2019 },
                  notes:        { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Machine created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, machine: { $ref: '#/components/schemas/Machine' } } } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/machines/upload': {
      post: {
        tags: ['Machines'],
        summary: 'Upload machine image',
        description: 'Upload an image for a machine. Max 5MB. JPEG/PNG/WebP/GIF supported.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'machineId'],
                properties: {
                  file:      { type: 'string', format: 'binary' },
                  machineId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Image uploaded', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, imageUrl: { type: 'string' } } } } } },
        },
      },
    },

    // ─── Dashboard ────────────────────────────────────────────────────────────
    '/dashboard/trends': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get KPI month-over-month trends',
        description: 'Returns current and previous month counts for work orders, alerts, maintenance tasks, and cost.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Trend data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    trends: {
                      type: 'object',
                      properties: {
                        workOrders:       { $ref: '#/components/schemas/TrendData' },
                        alerts:           { $ref: '#/components/schemas/TrendData' },
                        maintenanceTasks: { $ref: '#/components/schemas/TrendData' },
                        cost:             { $ref: '#/components/schemas/TrendData' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/dashboard/activity': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get recent activity feed',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Activity items with user attribution',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    activities: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id:          { type: 'string' },
                          type:        { type: 'string' },
                          title:       { type: 'string' },
                          description: { type: 'string' },
                          timestamp:   { type: 'string' },
                          user:        { type: 'string', nullable: true, description: 'Name of user who performed action' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/dashboard/sensors': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get IoT sensor readings for dashboard charts',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'machineId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          '200': {
            description: 'Sensor readings grouped by type',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    machineId:   { type: 'string' },
                    machineName: { type: 'string' },
                    sensorTypes: { type: 'array', items: { type: 'string' } },
                    readings: {
                      type: 'object',
                      description: 'Keys are sensor types, values are arrays of {value, recordedAt, unit}',
                      additionalProperties: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            value:      { type: 'number' },
                            unit:       { type: 'string' },
                            recordedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/dashboard/breakdown': {
      post: {
        tags: ['Dashboard'],
        summary: 'Log a machine breakdown',
        description: 'Creates an emergency work order and alert, and updates machine status to BREAKDOWN.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['machineId', 'description'],
                properties: {
                  machineId:         { type: 'string' },
                  description:       { type: 'string' },
                  severity:          { type: 'string', enum: ['MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
                  estimatedDowntime: { type: 'string', description: 'Human-readable e.g. "2-4 hours"' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Breakdown logged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workOrder: { $ref: '#/components/schemas/WorkOrder' },
                    message:   { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/dashboard/calendar/reschedule': {
      patch: {
        tags: ['Dashboard'],
        summary: 'Reschedule a work order or maintenance task',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'type', 'newDate'],
                properties: {
                  id:      { type: 'string' },
                  type:    { type: 'string', enum: ['workOrder', 'maintenance'] },
                  newDate: { type: 'string', format: 'date', example: '2024-03-15' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Rescheduled successfully' },
          '404': { description: 'Item not found' },
        },
      },
    },

    // ─── Reports ──────────────────────────────────────────────────────────────
    '/dashboard/report': {
      get: {
        tags: ['Reports'],
        summary: 'Generate maintenance report',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
          { name: 'period', in: 'query', schema: { type: 'integer', enum: [7, 30, 90], default: 30 }, description: 'Days to include' },
        ],
        responses: {
          '200': {
            description: 'Maintenance report (JSON or CSV)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    generatedAt: { type: 'string', format: 'date-time' },
                    period:      { type: 'integer' },
                    organization:{ type: 'string' },
                    summary: {
                      type: 'object',
                      properties: {
                        totalMachines:         { type: 'integer' },
                        operationalMachines:   { type: 'integer' },
                        criticalMachines:      { type: 'integer' },
                        totalWorkOrders:       { type: 'integer' },
                        completedWorkOrders:   { type: 'integer' },
                        openWorkOrders:        { type: 'integer' },
                        overdueWorkOrders:     { type: 'integer' },
                        totalMaintenanceCost:  { type: 'number' },
                        avgCompletionTimeMinutes: { type: 'number' },
                      },
                    },
                    machines:           { type: 'array', items: { $ref: '#/components/schemas/Machine' } },
                    workOrders:         { type: 'array', items: { $ref: '#/components/schemas/WorkOrder' } },
                    upcomingMaintenance:{ type: 'array' },
                    recentAlerts:       { type: 'array', items: { $ref: '#/components/schemas/Alert' } },
                  },
                },
              },
              'text/csv': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    // ─── Settings ─────────────────────────────────────────────────────────────
    '/settings/api-keys': {
      get: {
        tags: ['Settings'],
        summary: 'List API keys',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'API keys list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Settings'],
        summary: 'Create a new API key',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Production Sensors' },
                  type: { type: 'string', enum: ['IOT', 'GENERAL', 'READONLY'], default: 'IOT' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Key created — full key shown only once',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id:        { type: 'string' },
                    name:      { type: 'string' },
                    apiKey:    { type: 'string', description: 'Full key — save this, shown only once' },
                    status:    { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Settings'],
        summary: 'Rotate, rename, or enable/disable an API key',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'action'],
                properties: {
                  id:     { type: 'string' },
                  action: { type: 'string', enum: ['rotate', 'rename', 'disable'] },
                  name:   { type: 'string', description: 'Required when action=rename' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { description: 'Key not found' },
        },
      },
      delete: {
        tags: ['Settings'],
        summary: 'Revoke and delete an API key',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Key revoked' },
          '404': { description: 'Key not found' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}