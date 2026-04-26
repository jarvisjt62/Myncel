import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'

// Documentation data structure
const docCategories = {
  'getting-started': {
    title: 'Getting Started',
    icon: '🚀',
    color: 'violet',
    articles: {
      'quick-start': {
        title: 'Quick Start Guide (15 minutes)',
        time: '5 min read',
        popular: true,
        content: `
## Welcome to Myncel

Get your maintenance program running in just 15 minutes. This guide walks you through the essential setup steps to start managing your equipment and work orders right away.

### Step 1: Create Your Account

1. Go to [myncel.com/signup](https://myncel.com/signup)
2. Enter your email address and create a password
3. Verify your email address through the confirmation link
4. Complete your profile with your name and company information

### Step 2: Set Up Your Facility

1. After logging in, you'll see the onboarding wizard
2. Enter your facility name and location
3. Select your industry type (Manufacturing, Food Processing, etc.)
4. Choose your timezone for accurate scheduling

### Step 3: Add Your First Machine

1. Navigate to **Equipment** in the sidebar
2. Click **Add Equipment**
3. Fill in basic information:
   - Equipment name (e.g., "CNC Mill #1")
   - Manufacturer and model
   - Installation date (if known)
   - Location within your facility
4. Upload a photo (optional but recommended)
5. Click **Save**

### Step 4: Create Your First Schedule

1. Go to **Schedules** in the sidebar
2. Click **Create Schedule**
3. Select the equipment you just added
4. Choose your schedule type:
   - **Calendar-based**: Every X days/weeks/months
   - **Hour-based**: Every X operating hours
5. Add maintenance tasks to the schedule
6. Set who should be assigned
7. Click **Create Schedule**

### Step 5: Invite Your Team

1. Go to **Settings** → **Team Members**
2. Click **Invite Team Member**
3. Enter their email address
4. Select their role (Admin, Technician, or Viewer)
5. They'll receive an email invitation to join

### What's Next?

- Explore the **Dashboard** to see your maintenance overview
- Check out the **Work Orders** section to manage tasks
- Set up **Alerts** to get notified about upcoming maintenance
- Browse our [full documentation](/docs) for advanced features

### Need Help?

- **Live Chat**: Click the chat icon in the bottom right corner
- **Email**: Contact us at support@myncel.com
- **Phone**: Available for Pro and Enterprise plans
`
      },
      'first-machine': {
        title: 'Adding your first machine',
        time: '3 min read',
        popular: true,
        content: `
## Adding Equipment to Myncel

Adding equipment is the foundation of your maintenance program. Each piece of equipment you add can have its own schedules, work orders, and service history.

### Accessing Equipment Management

1. Click **Equipment** in the left sidebar
2. You'll see the equipment list view (empty if you're new)
3. Click the **Add Equipment** button in the top right

### Required Information

The only required fields are:
- **Equipment Name**: A descriptive name for identification
- **Category**: The type of equipment (CNC, Compressor, Conveyor, etc.)

### Recommended Information

For better tracking and reporting, we recommend adding:
- **Manufacturer**: The equipment manufacturer
- **Model Number**: Specific model for parts ordering
- **Serial Number**: For warranty and service tracking
- **Installation Date**: Helps calculate age and warranty status
- **Location**: Where in your facility the equipment is located
- **Operating Hours**: Current meter reading (for hour-based maintenance)

### Adding Equipment Photos

Photos help technicians quickly identify equipment and document condition over time.

1. In the equipment form, find the **Photos** section
2. Click **Upload Photo** or drag and drop images
3. Supported formats: JPG, PNG, WebP
4. Maximum file size: 10MB per image

### Uploading Manuals & Documents

Attach user manuals, schematics, and other reference documents:

1. Find the **Documents** section in the equipment form
2. Click **Upload Document**
3. Supported formats: PDF, DOC, DOCX, XLS, XLSX
4. Maximum file size: 25MB per document

### Setting Warranty Information

Track warranty expiration to ensure timely claims:

1. Expand the **Warranty Information** section
2. Enter the warranty start date
3. Enter the warranty end date or duration
4. Add warranty provider contact information
5. You'll automatically receive alerts before expiration

### Equipment Categories

Myncel includes pre-built categories with suggested maintenance schedules:

- **CNC Machines**: Mills, lathes, routers
- **Hydraulic Equipment**: Presses, lifts, cylinders
- **Pneumatic Equipment**: Compressors, actuators, tools
- **Conveyors & Material Handling**: Belts, rollers, sorters
- **Pumps & Fluid Systems**: Centrifugal, positive displacement
- **Electrical Systems**: Motors, panels, transformers
- **HVAC**: Air handlers, chillers, cooling towers

### Best Practices

1. **Use consistent naming**: "CNC Mill #1" or "Haas VF-2 - Bay A"
2. **Add photos**: Helps technicians locate equipment quickly
3. **Include serial numbers**: Critical for parts ordering
4. **Group by location**: Makes it easier to assign work orders
`
      },
      'first-schedule': {
        title: 'Setting up your first schedule',
        time: '4 min read',
        content: `
## Creating Maintenance Schedules

Schedules in Myncel automatically generate work orders at the intervals you define, ensuring maintenance happens on time, every time.

### Creating a Schedule

1. Navigate to **Schedules** from the sidebar
2. Click **Create Schedule**
3. You'll see the schedule creation wizard

### Schedule Types

Myncel supports two types of maintenance triggers:

#### Calendar-Based Schedules
Best for:
- Daily inspections
- Monthly lubrication
- Quarterly calibrations
- Annual overhauls

Set intervals in days, weeks, or months. Example: "Every 30 days" or "Every 3 months".

#### Hour-Based Schedules
Best for:
- Oil changes after X running hours
- Filter replacements
- Equipment-specific service intervals

Example: "Every 500 operating hours"

### Selecting Equipment

1. Click **Select Equipment** in the schedule form
2. Choose one or more pieces of equipment
3. For multiple equipment, the schedule applies to each independently

### Adding Tasks

Each schedule can contain multiple maintenance tasks:

1. Click **Add Task**
2. Enter a task name (e.g., "Change oil", "Inspect belts")
3. Add detailed instructions
4. Estimate time required
5. Add required parts (optional)
6. Set task priority (Low, Medium, High, Critical)

### Assignment Options

Choose who receives the work order:

- **Specific Person**: Always assign to a named technician
- **Role-Based**: Assign to anyone with a specific role
- **Unassigned**: Manually assign when the work order is created

### Setting Due Dates

Control when work orders appear and when they're due:

- **Lead Time**: Days before due date to create work order
- **Buffer Time**: Days before schedule date for due date
- Example: Create work order 7 days before it's due

### Schedule Templates

For common equipment types, use our pre-built templates:

1. Click **Use Template** when creating a schedule
2. Select your equipment type
3. Review and customize the suggested tasks
4. Adjust intervals as needed

### Best Practices

1. **Start simple**: Create one schedule per equipment initially
2. **Be realistic**: Set achievable intervals based on your team's capacity
3. **Include details**: Add instructions so any technician can complete the task
4. **Link parts**: Connect inventory items to schedules for automatic deduction
`
      },
      'inviting-team': {
        title: 'Inviting your team',
        time: '2 min read',
        content: `
## Team Management in Myncel

Add team members to collaborate on maintenance activities, assign work orders, and share information.

### User Roles

Myncel offers three user roles with different permission levels:

#### Admin
Full access to all features including:
- User management
- Billing and subscription
- All equipment and work orders
- Reports and analytics
- Settings and configuration

#### Technician
Day-to-day maintenance operations:
- View and complete assigned work orders
- View equipment information
- Log parts usage
- Add notes and photos
- Update equipment readings

#### Viewer
Read-only access:
- View equipment and schedules
- View work order history
- Access reports (limited)
- No editing capabilities

### Inviting Team Members

1. Go to **Settings** → **Team Members**
2. Click **Invite Team Member**
3. Enter the email address
4. Select their role (Admin, Technician, or Viewer)
5. Click **Send Invitation**

The invitee will receive an email with a link to join your organization.

### Managing Invitations

View pending invitations:
1. Go to **Settings** → **Team Members**
2. Click the **Pending** tab
3. Resend or cancel invitations as needed

### Changing Roles

Change a team member's role at any time:
1. Find the team member in the list
2. Click the **⋯** menu
3. Select **Change Role**
4. Choose the new role

### Removing Team Members

1. Find the team member
2. Click the **⋯** menu
3. Select **Remove from Team**
4. Confirm the removal

Their work order history is preserved, but they'll no longer have access.

### Team Size Limits

- **Starter Plan**: Up to 3 users
- **Professional Plan**: Up to 10 users
- **Enterprise Plan**: Unlimited users

Need more users? [Upgrade your plan](/pricing) or contact sales@myncel.com.
`
      },
      'dashboard-overview': {
        title: 'Understanding the dashboard',
        time: '5 min read',
        content: `
## Dashboard Overview

The dashboard is your command center for monitoring maintenance operations at a glance.

### Key Metrics

At the top of the dashboard, you'll see four key metrics:

#### Open Work Orders
Shows the total number of incomplete work orders. Click to view the full list filtered to open items.

#### Overdue Tasks
Work orders past their due date. This metric helps you identify bottlenecks and prioritize urgent work.

#### Equipment Uptime
The percentage of time your equipment has been operational. Calculated from downtime logs.

#### PM Completion Rate
The percentage of scheduled maintenance completed on time. Target: 90%+ for optimal equipment health.

### Work Order Status Chart

The donut chart shows work orders broken down by status:
- **Pending**: Created but not started
- **In Progress**: Currently being worked on
- **Completed**: Finished and closed
- **Overdue**: Past due date, not completed

### Upcoming Maintenance

See the next 7 days of scheduled maintenance:
- Equipment name
- Task description
- Due date
- Assigned technician
- Quick actions (Start, Complete)

### Recent Activity

A chronological feed of recent actions:
- Work orders created/completed
- Equipment added
- Parts used
- Notes added

### Equipment Health

View the health status of your critical equipment:
- **Healthy**: All maintenance current
- **Needs Attention**: Overdue maintenance
- **At Risk**: Multiple overdue items or recent failures

### Quick Actions

From the dashboard, you can quickly:
- Create a new work order
- Add equipment
- View reports
- Schedule maintenance

### Customizing Your Dashboard

Enterprise users can customize dashboard widgets:
1. Click **Customize** in the top right
2. Drag and drop widgets to rearrange
3. Add or remove widgets
4. Click **Save Layout**

### Dashboard Filters

Filter the dashboard by:
- **Time Period**: Today, This Week, This Month, Custom
- **Equipment**: Specific equipment or groups
- **Location**: Filter by facility area
`
      }
    }
  },
  'equipment': {
    title: 'Equipment Management',
    icon: '⚙️',
    color: 'blue',
    articles: {
      'adding-editing': {
        title: 'Adding and editing equipment',
        time: '4 min read',
        content: `
## Equipment Management

Managing your equipment inventory effectively is the foundation of a successful maintenance program.

### Adding New Equipment

1. Navigate to **Equipment** → **Add Equipment**
2. Fill in the required fields:
   - Name (required)
   - Category (required)
3. Add optional details for better tracking
4. Upload photos and documents
5. Click **Save Equipment**

### Editing Equipment

1. Find the equipment in your list
2. Click on the equipment name to open details
3. Click **Edit** in the top right
4. Make your changes
5. Click **Save Changes**

### Equipment Fields Reference

| Field | Description | Required |
|-------|-------------|----------|
| Name | Display name for the equipment | Yes |
| Category | Equipment type classification | Yes |
| Manufacturer | Brand/make of equipment | No |
| Model Number | Specific model identifier | No |
| Serial Number | Unique unit identifier | No |
| Location | Physical location in facility | No |
| Installation Date | When equipment was installed | No |
| Operating Hours | Current meter reading | No |
| Criticality | How critical to operations | No |

### Bulk Import Equipment

Import multiple equipment at once:

1. Go to **Equipment** → **Import**
2. Download the CSV template
3. Fill in your equipment data
4. Upload the completed CSV
5. Review the preview
6. Confirm import

### Equipment Groups

Organize equipment into logical groups:

1. Go to **Settings** → **Equipment Groups**
2. Click **Create Group**
3. Name your group (e.g., "Production Line A")
4. Add equipment to the group
5. Save

Groups help with:
- Filtering work orders
- Assigning to teams
- Reporting by area
`
      },
      'photos-manuals': {
        title: 'Uploading equipment photos & manuals',
        time: '3 min read',
        content: `
## Equipment Documentation

Photos and documents help your team identify equipment and reference important information.

### Uploading Photos

Photos are useful for:
- Quick identification
- Documenting condition over time
- Training new technicians
- Before/after comparisons

#### To upload photos:

1. Open the equipment detail page
2. Click the **Photos** tab
3. Drag and drop images or click **Upload**
4. Supported formats: JPG, PNG, WebP, GIF
5. Maximum size: 10MB per image

#### Best practices:
- Take photos from multiple angles
- Include nameplates and serial numbers
- Capture the surrounding area for location context
- Date photos when documenting conditions

### Uploading Documents

Attach important documents to equipment records:

1. Open the equipment detail page
2. Click the **Documents** tab
3. Click **Upload Document**
4. Supported formats: PDF, DOC, DOCX, XLS, XLSX
5. Maximum size: 25MB per document

### Common Document Types

- **Owner's Manuals**: Operating instructions
- **Parts Lists**: For ordering replacements
- **Schematics**: Electrical and mechanical diagrams
- **Warranty Documents**: Coverage information
- **Service Records**: Previous maintenance history
- **Certifications**: Inspection and compliance records

### Managing Documents

- **Preview**: Click to view documents inline
- **Download**: Save to your device
- **Delete**: Remove outdated documents
- **Replace**: Upload a new version

### Document Versioning

Myncel keeps track of document versions:
- Previous versions are archived
- View history to see changes
- Restore older versions if needed
`
      },
      'service-history': {
        title: 'Tracking service history',
        time: '5 min read',
        content: `
## Equipment Service History

A complete service history helps you make informed decisions about maintenance, repairs, and replacements.

### Automatic History Logging

Myncel automatically logs:
- Completed work orders
- Parts replaced
- Operating hours at service time
- Technician who performed the work
- Time and date of service
- Notes and observations

### Viewing Service History

1. Open an equipment detail page
2. Click the **Service History** tab
3. See a chronological list of all maintenance activities

### History Details

Each history entry shows:
- Date of service
- Type of maintenance (PM, Repair, Inspection)
- Work order reference
- Tasks completed
- Parts used
- Technician notes
- Before/after photos (if added)
- Operating hours at time of service

### Adding Manual History Entries

For maintenance performed before using Myncel:

1. Open equipment → **Service History**
2. Click **Add Historical Entry**
3. Enter the date and details
4. Add notes and documentation
5. Save the entry

### Service History Reports

Generate reports from service history:

1. Go to **Reports** → **Equipment Reports**
2. Select **Service History Report**
3. Choose equipment or group
4. Set date range
5. Export to PDF or CSV

### Using History for Decisions

Service history helps with:
- **Warranty Claims**: Document issues for claims
- **Parts Planning**: Identify frequently replaced items
- **Replacement Planning**: Track total cost of ownership
- **Compliance**: Prove maintenance was performed
- **Troubleshooting**: See what work was done previously
`
      },
      'facility-mapping': {
        title: 'Equipment location & facility mapping',
        time: '6 min read',
        content: `
## Facility Mapping

Organize equipment by location to improve efficiency and reporting.

### Setting Up Locations

Create a location hierarchy:
1. Go to **Settings** → **Locations**
2. Add top-level locations (Buildings)
3. Add sub-locations (Floors, Areas, Rooms)

### Location Structure Example

\`\`\`
Building A
├── Production Floor
│   ├── Assembly Line 1
│   ├── Assembly Line 2
│   └── Quality Station
├── Warehouse
│   ├── Receiving
│   └── Shipping
└── Maintenance Shop

Building B
├── Offices
└── Break Room
\`\`\`

### Assigning Equipment to Locations

1. When adding equipment, select the location
2. Or edit existing equipment to update location
3. Locations help technicians find equipment quickly

### Location-Based Features

- **Filter equipment** by location
- **Assign work orders** to location-specific teams
- **View location dashboards** with equipment in that area
- **Generate location reports** for area managers

### Equipment Mapping View

Visualize equipment on a floor plan:

1. Go to **Equipment** → **Map View**
2. Upload a floor plan image
3. Drag equipment markers to their positions
4. Save the map

The map view shows:
- Equipment locations
- Status indicators (healthy, needs attention, at risk)
- Open work orders per equipment

### Location Reports

Generate reports by location:
- Equipment count by area
- Work orders by location
- Maintenance costs by building/area
- Downtime by location
`
      },
      'warranty-alerts': {
        title: 'Setting warranty expiry alerts',
        time: '3 min read',
        content: `
## Warranty Tracking

Never miss a warranty expiration with automatic alerts.

### Adding Warranty Information

1. Open equipment → **Edit**
2. Find the **Warranty** section
3. Enter:
   - Warranty provider
   - Start date
   - End date (or duration in months)
   - Coverage type (Parts, Labor, Both)
   - Provider contact information
4. Save the equipment

### Automatic Alerts

Myncel sends warranty alerts:
- **90 days before** expiration
- **60 days before** expiration
- **30 days before** expiration
- **On the expiration date**

### Configuring Alert Recipients

Choose who receives warranty alerts:

1. Go to **Settings** → **Notifications**
2. Find **Warranty Alerts**
3. Select recipients:
   - Equipment owner
   - Maintenance manager
   - Custom email addresses
4. Save settings

### Warranty Claims

Document warranty claims:

1. Open equipment → **Warranty** tab
2. Click **File Claim**
3. Enter:
   - Issue description
   - Date issue discovered
   - Reference to related work order
   - Supporting documentation
4. Submit claim

Track claim status:
- Submitted
- Under Review
- Approved
- Rejected
- Completed

### Warranty History

View all warranty activity:
- Previous claims
- Approved repairs
- Replacements under warranty
- Total warranty value recovered
`
      }
    }
  },
  'schedules': {
    title: 'Schedules & Tasks',
    icon: '📅',
    color: 'emerald',
    articles: {
      'creating-schedule': {
        title: 'Creating a maintenance schedule',
        time: '5 min read',
        popular: true,
        content: `
## Maintenance Schedules

Schedules are the core of preventive maintenance, automatically generating work orders at defined intervals.

### Creating a New Schedule

1. Navigate to **Schedules** → **Create Schedule**
2. Enter a name for the schedule
3. Select equipment (one or multiple)
4. Choose schedule type and interval
5. Add maintenance tasks
6. Set assignments and due dates
7. Activate the schedule

### Schedule Types

#### Calendar-Based
Best for time-based maintenance:
- Daily inspections
- Weekly checks
- Monthly services
- Annual overhauls

Set the interval: Every X days/weeks/months

#### Hour-Based
Best for usage-based maintenance:
- Oil changes every 500 hours
- Filter replacements every 1000 hours
- Calibrations every 2000 hours

Requires equipment to have operating hours logged.

### Adding Tasks

Each schedule contains one or more tasks:

1. Click **Add Task**
2. Enter task name
3. Add detailed instructions
4. Estimate completion time
5. Add required parts
6. Set priority level

### Task Priorities

- **Critical**: Must be done immediately
- **High**: Important, do within shift
- **Medium**: Standard priority
- **Low**: Do when time permits

### Schedule Preview

Before activating, preview the schedule:
- Next 5 scheduled dates
- Work order generation timeline
- Estimated time per work order

### Pausing & Resuming

Temporarily stop a schedule:
1. Find the schedule in your list
2. Click **⋯** → **Pause**
3. Work orders stop generating
4. Resume anytime from the same menu

### Schedule History

View past work orders from a schedule:
- Completion rate
- Average completion time
- Overdue percentage
`
      },
      'calendar-vs-hour': {
        title: 'Calendar vs. hour-based schedules',
        time: '4 min read',
        content: `
## Choosing the Right Schedule Type

Understanding when to use calendar-based vs. hour-based scheduling ensures optimal maintenance timing.

### Calendar-Based Scheduling

Use when:
- Equipment runs consistently (same hours daily)
- Maintenance must happen at specific times
- Seasonal or regulatory requirements exist
- Operating hours aren't tracked

**Examples:**
- Fire extinguisher inspections (annual)
- Safety equipment checks (monthly)
- Building maintenance (weekly)
- Regulatory compliance (quarterly)

**How it works:**
Work orders generate at fixed calendar intervals regardless of equipment usage.

### Hour-Based Scheduling

Use when:
- Equipment runs variable hours
- Maintenance depends on wear/usage
- Manufacturer specifies hour intervals
- Operating hours are tracked

**Examples:**
- Oil changes (every 500 hours)
- Filter replacements (every 1000 hours)
- Belt inspections (every 2000 hours)
- Major overhauls (every 10,000 hours)

**How it works:**
Work orders generate when operating hours reach the threshold. Requires:
- Equipment has an operating hours meter
- Hours are logged regularly (manually or via IoT)

### Combining Both Types

Many equipment benefit from both:

**Example: CNC Machine**
- Calendar: Monthly way cleaning, Annual calibration
- Hour-based: Oil change every 500 hours, Spindle inspection every 2000 hours

### Converting Between Types

Convert a schedule type:
1. Open the schedule
2. Click **Edit**
3. Change the schedule type
4. Note: This creates a new schedule cycle

### Hour Tracking Methods

For hour-based schedules, track hours via:
- **Manual entry**: Technician logs reading
- **Meter reading**: Regular check-ins
- **IoT integration**: Automatic hour tracking
- **Estimation**: Based on production schedule

### Best Practices

- Use hour-based for wear-related maintenance
- Use calendar-based for time-sensitive compliance
- Consider hybrid approaches for critical equipment
`
      },
      'multiple-machines': {
        title: 'Scheduling for multiple machines',
        time: '6 min read',
        content: `
## Multi-Equipment Schedules

Efficiently manage maintenance for groups of similar equipment.

### Applying Schedules to Multiple Equipment

When creating a schedule:
1. In the equipment selection step
2. Select multiple pieces of equipment
3. The schedule creates independent work orders for each

### Group Scheduling Benefits

- **Consistency**: Same maintenance across similar equipment
- **Efficiency**: Manage one schedule instead of many
- **Reporting**: Compare performance across equipment

### Scheduling Strategies

#### Staggered Scheduling
Spread work across different dates:
- Equipment A: Due on the 1st
- Equipment B: Due on the 8th
- Equipment C: Due on the 15th

Prevents overwhelming your team with simultaneous work.

#### Grouped Scheduling
Schedule similar equipment together:
- All conveyors: Monday maintenance
- All CNCs: Tuesday maintenance
- All compressors: Wednesday maintenance

Efficient for technicians specializing in certain equipment.

### Setting Staggering

When adding multiple equipment:
1. Click **Advanced Options**
2. Enable **Stagger Due Dates**
3. Set the stagger interval (e.g., 7 days apart)
4. Myncel automatically distributes due dates

### Bulk Editing

Update multiple schedules at once:
1. Go to **Schedules** list
2. Select multiple schedules
3. Click **Bulk Edit**
4. Update common fields
5. Apply changes

### Equipment Groups

Create equipment groups for easier scheduling:
1. **Settings** → **Equipment Groups**
2. Create a group (e.g., "Line 1 Conveyors")
3. Add equipment to the group
4. When scheduling, select the group

### Reporting on Groups

View combined metrics:
- Group completion rate
- Average downtime
- Total maintenance cost
- Parts usage across group
`
      },
      'seasonal-scheduling': {
        title: 'Seasonal and shutdown scheduling',
        time: '5 min read',
        content: `
## Seasonal Maintenance

Plan maintenance around production cycles and planned shutdowns.

### Setting Up Seasonal Schedules

For maintenance that only applies during certain periods:
1. Create the schedule normally
2. Set **Active Periods** in schedule settings
3. Define start and end months
4. Work orders only generate during active periods

**Example:** HVAC maintenance scheduled April-October only

### Planned Shutdowns

Schedule major maintenance during planned downtime:

1. Go to **Calendar** → **Shutdowns**
2. Click **Plan Shutdown**
3. Enter:
   - Shutdown name
   - Start and end dates
   - Affected equipment
   - Planned work
4. Myncel consolidates work orders during the shutdown period

### Shutdown Benefits

- Bundle multiple maintenance tasks
- Minimize total downtime
- Coordinate resources efficiently
- Document all work in one place

### Blackout Periods

Prevent maintenance during peak production:

1. Go to **Settings** → **Blackout Periods**
2. Add periods when PM should be deferred:
   - Peak season dates
   - Critical production runs
   - Audit periods
3. Work orders due during blackouts are flagged
4. Reschedule or defer as needed

### Annual Maintenance Plans

Create an annual maintenance calendar:

1. **Calendar** → **Annual Plan**
2. View all scheduled maintenance for the year
3. Identify conflicts and bottlenecks
4. Adjust schedules as needed
5. Export the plan for stakeholders

### Coordinating with Production

Best practices:
- Share the maintenance calendar with production planning
- Schedule major work during known slow periods
- Build flexibility for urgent production needs
- Communicate changes proactively
`
      },
      'schedule-templates': {
        title: 'Using schedule templates',
        time: '4 min read',
        content: `
## Schedule Templates

Save time with pre-built maintenance schedules for common equipment types.

### Available Templates

Myncel includes templates for:

- **CNC Machines**: Mills, lathes, routers
- **Hydraulic Presses**: Stamping, forming
- **Air Compressors**: Rotary screw, reciprocating
- **Conveyors**: Belt, roller, chain
- **Injection Molding**: Hybrids, all-electric
- **Pumps**: Centrifugal, positive displacement
- **Motors**: AC, DC, servo

### Using a Template

1. Go to **Schedules** → **Create from Template**
2. Browse templates by category
3. Select a template
4. Customize:
   - Adjust intervals for your environment
   - Add or remove tasks
   - Update task details
5. Select equipment
6. Activate the schedule

### Template Contents

Each template includes:
- Recommended maintenance tasks
- Suggested intervals (calendar or hour-based)
- Estimated task durations
- Required parts list
- Safety checklist items

### Customizing Templates

Make templates your own:
- Adjust intervals based on your environment
- Add site-specific tasks
- Remove irrelevant tasks
- Update part numbers for your suppliers

### Creating Custom Templates

Save your schedules as templates:

1. Open an existing schedule
2. Click **⋯** → **Save as Template**
3. Name the template
4. Add a description
5. Choose visibility (Personal or Organization)

### Sharing Templates

Organization templates are available to all team members:
- Standardize maintenance across facilities
- Ensure consistent practices
- Onboard new equipment faster
`
      }
    }
  },
  'work-orders': {
    title: 'Work Orders',
    icon: '📝',
    color: 'amber',
    articles: {
      'creating-assigning': {
        title: 'Creating and assigning work orders',
        time: '4 min read',
        popular: true,
        content: `
## Work Order Management

Work orders are the heart of maintenance operations, tracking all maintenance activities from request to completion.

### Creating Work Orders

#### Manual Creation

1. Go to **Work Orders** → **Create Work Order**
2. Fill in required fields:
   - Title/Description
   - Equipment (if applicable)
   - Priority
   - Due date
3. Add optional details
4. Assign to a technician
5. Save

#### From Schedule

Scheduled maintenance automatically creates work orders:
- Based on your schedule intervals
- Pre-populated with tasks
- Assigned per schedule settings

#### From Request

Users can submit maintenance requests:
1. Request comes in via portal or email
2. Review the request
3. Convert to work order
4. Add details and assign

### Work Order Fields

| Field | Description |
|-------|-------------|
| Title | Brief description of work needed |
| Type | PM, Repair, Inspection, Project |
| Equipment | Associated equipment (if applicable) |
| Priority | Critical, High, Medium, Low |
| Status | Pending, In Progress, On Hold, Completed |
| Due Date | When work should be completed |
| Assigned To | Technician responsible |
| Estimated Hours | Time expected for completion |

### Assigning Work Orders

#### Direct Assignment
Assign to a specific technician:
1. Open the work order
2. Click **Assign**
3. Select the technician
4. They receive a notification

#### Role-Based Assignment
Assign to a role (any technician):
1. Select **Unassigned** or a role
2. Work appears in the team queue
3. Technicians can self-assign

### Bulk Assignment

Assign multiple work orders at once:
1. Go to **Work Orders** list
2. Select multiple work orders
3. Click **Bulk Assign**
4. Choose assignee
5. Confirm

### Work Order Notifications

Team members are notified when:
- Assigned a new work order
- Work order priority changes
- Due date is approaching
- Work order is overdue
- Notes are added

Configure notifications in **Settings** → **Notifications**.
`
      },
      'completing-mobile': {
        title: 'Completing a work order (mobile)',
        time: '3 min read',
        popular: true,
        content: `
## Mobile Work Order Completion

Complete work orders from anywhere using the Myncel mobile app.

### Getting the Mobile App

- **iOS**: Download from the App Store
- **Android**: Download from Google Play
- **Web**: Access from any browser at app.myncel.com

### Viewing Assigned Work

1. Open the mobile app
2. Log in with your credentials
3. See your assigned work orders on the home screen
4. Filter by status, priority, or due date

### Completing a Work Order

1. Tap on a work order to open it
2. Review the task list and instructions
3. Tap **Start Work** to change status
4. Complete each task:
   - Tap the checkbox when done
   - Add notes if needed
   - Attach photos
5. Log any parts used
6. Update operating hours if required
7. Tap **Complete Work Order**

### Adding Photos

Document your work with photos:
1. While viewing a work order
2. Tap **Add Photo**
3. Take a photo or choose from gallery
4. Add a caption
5. Photos are attached to the work order

### Logging Parts

Record parts used:
1. Tap **Add Parts**
2. Search or scan a barcode
3. Enter quantity used
4. Parts are deducted from inventory

### Adding Notes

Leave information for the record:
1. Tap **Add Note**
2. Enter your observations
3. Notes become part of the permanent history

### Working Offline

The mobile app works offline:
- View assigned work orders
- Complete tasks
- Add notes and photos
- Changes sync when connection is restored

### Common Mobile Actions

- **Clock In/Out**: Track time on work orders
- **Request Parts**: Flag needed parts
- **Flag Issues**: Report problems found
- **Request Help**: Escalate to supervisor
`
      },
      'adding-photos': {
        title: 'Adding photos to work orders',
        time: '2 min read',
        content: `
## Photo Documentation

Photos provide visual documentation of equipment condition and work performed.

### Why Add Photos?

- Document before/after condition
- Show damage or wear
- Prove work was completed
- Help with troubleshooting
- Support warranty claims

### Adding Photos to Work Orders

#### During Completion
1. Open the work order
2. Tap **Add Photo**
3. Take a photo or select from gallery
4. Add a caption
5. Save

#### After Completion
1. Find the work order in history
2. Click **Edit** or **Add Documentation**
3. Upload photos
4. Photos are added to the work order record

### Photo Best Practices

#### Before Starting Work
- Overall equipment condition
- Specific area to be worked on
- Any existing damage or wear
- Nameplate/serial number

#### During Work
- Disassembly steps
- Parts being replaced
- Hidden issues discovered

#### After Completion
- Repairs made
- New parts installed
- Final equipment condition
- Cleanup completed

### Photo Management

- **Caption**: Add descriptions to photos
- **Categories**: Tag as Before, During, After
- **Timestamp**: Automatically recorded
- **Location**: GPS data (optional)

### Photo Storage

- Photos are stored securely in the cloud
- Unlimited storage on all paid plans
- Original quality preserved
- Access from any device

### Sharing Photos

Share photos from work orders:
- Export to PDF reports
- Include in email notifications
- Download for external use
- Share via link
`
      },
      'priority-levels': {
        title: 'Work order priority levels',
        time: '3 min read',
        content: `
## Work Order Priorities

Priorities help your team focus on the most important work.

### Priority Levels

Myncel uses four priority levels:

#### 🔴 Critical
- Immediate action required
- Safety or production impact
- Equipment down
- Response time: Immediately

**Examples:**
- Equipment failure affecting production
- Safety hazard
- Major leak or breakdown

#### 🟠 High
- Urgent but not immediate
- Significant impact if delayed
- Response time: Within shift

**Examples:**
- Equipment running but impaired
- Potential failure detected
- Production quality issue

#### 🟡 Medium
- Standard maintenance work
- No immediate impact
- Response time: Within scheduled window

**Examples:**
- Scheduled preventive maintenance
- Minor repairs
- Inspections

#### 🟢 Low
- Nice to do, not time-sensitive
- Improvement projects
- Response time: When time permits

**Examples:**
- Cosmetic repairs
- Improvements
- Non-critical inspections

### Setting Priority

When creating a work order:
1. Select the appropriate priority
2. The priority determines:
   - Notification urgency
   - Dashboard highlighting
   - Default due date suggestion

### Priority-Based Workflows

Configure different behaviors by priority:
- **Notifications**: Who gets alerted
- **Due Dates**: Default timeframes
- **Approvals**: Required sign-offs
- **Escalations**: Auto-escalate if delayed

### Changing Priority

Update priority at any time:
1. Open the work order
2. Click the priority badge
3. Select new priority
4. Add a reason for the change

### Priority Reports

Track your work by priority:
- Count by priority level
- Average completion time by priority
- Overdue percentage by priority
`
      },
      'work-order-history': {
        title: 'Viewing work order history',
        time: '4 min read',
        content: `
## Work Order History

Access historical work orders to review past maintenance, find patterns, and support decisions.

### Accessing History

1. Go to **Work Orders**
2. Click the **History** or **Completed** tab
3. Filter and search as needed

### History Filters

Filter historical work orders by:
- **Date Range**: Custom or preset periods
- **Equipment**: Specific machines
- **Type**: PM, Repair, Inspection
- **Technician**: Who completed the work
- **Status**: Completed, Cancelled, Failed

### Search History

Search across all historical work orders:
- Search by equipment name
- Search by problem description
- Search by notes
- Search by part numbers

### Work Order Details

Click any historical work order to see:
- Full task list and completion status
- Parts used
- Time logged
- Photos attached
- Notes from technicians
- Associated schedule (if PM)

### Exporting History

Export work order history:
1. Apply desired filters
2. Click **Export**
3. Choose format (PDF, CSV, Excel)
4. Include selected fields
5. Download the file

### History Analytics

View trends in your work order history:
- Most frequent issues
- Equipment with most work orders
- Average completion times
- Parts usage trends
- Cost analysis

### Using History

Work order history helps with:
- **Troubleshooting**: See what worked before
- **Warranty Claims**: Document issues
- **Parts Planning**: Predict future needs
- **Budgeting**: Estimate future costs
- **Compliance**: Prove maintenance was done
`
      }
    }
  },
  'alerts': {
    title: 'Alerts & Notifications',
    icon: '🔔',
    color: 'rose',
    articles: {
      'email-alerts': {
        title: 'Setting up email alerts',
        time: '3 min read',
        content: `
## Email Notifications

Stay informed about maintenance activities with email alerts.

### Available Email Alerts

Configure notifications for:

#### Work Order Alerts
- New work order assigned
- Work order due soon
- Work order overdue
- Work order completed
- High priority work order created

#### Schedule Alerts
- Work order generated from schedule
- Schedule skipped or missed
- Schedule paused/activated

#### Equipment Alerts
- Warranty expiring
- Operating hours threshold reached
- Equipment marked as down
- Equipment returned to service

#### Team Alerts
- Team member joined
- Team member role changed
- New invitation sent

### Configuring Email Alerts

1. Go to **Settings** → **Notifications**
2. Click **Email Notifications**
3. Toggle alerts on/off
4. Select recipients for each alert type
5. Save changes

### Personal Notification Settings

Each user can customize their own alerts:
1. Click your profile → **Notification Preferences**
2. Enable/disable specific alert types
3. Set delivery frequency:
   - Immediate
   - Daily digest
   - Weekly digest

### Email Templates

Customize email notification content:
1. **Settings** → **Notifications** → **Templates**
2. Edit subject lines and body text
3. Use variables for dynamic content
4. Preview before saving

### Deliverability Tips

Ensure emails reach your inbox:
- Add notifications@myncel.com to contacts
- Check spam folder for missed emails
- Whitelist myncel.com domain
- Report delivery issues to support
`
      },
      'sms-notifications': {
        title: 'Setting up SMS notifications',
        time: '4 min read',
        content: `
## SMS Notifications

Get critical alerts via text message for urgent matters.

### SMS Requirements

SMS notifications require:
- A paid Myncel plan (Professional or higher)
- Valid phone number in your profile
- Phone number verification

### Enabling SMS

1. Go to **Profile Settings** → **Phone Number**
2. Enter your mobile number
3. Click **Verify**
4. Enter the code sent via SMS
5. Go to **Notifications** → **SMS**
6. Enable desired alert types

### SMS Alert Types

Recommended for SMS:
- 🔴 Critical priority work orders
- ⚠️ Equipment failures
- ⏰ Overdue work orders
- 🔥 Safety alerts
- 📞 Escalations

### SMS Limits

- Professional Plan: 50 SMS/month per user
- Enterprise Plan: Unlimited SMS

### Opting Out

Reply STOP to any SMS to unsubscribe:
- You'll stop receiving SMS notifications
- Email notifications continue
- Re-enable in settings if needed

### Best Practices

Use SMS for truly urgent matters:
- Reserve for critical alerts
- Don't enable for routine notifications
- Set up escalation rules carefully
- Review SMS history regularly

### Cost Considerations

SMS overages may apply:
- Monitor usage in **Settings** → **Billing**
- Set usage limits per user
- Upgrade plan if consistently exceeding
`
      },
      'escalations': {
        title: 'Configuring overdue escalations',
        time: '5 min read',
        content: `
## Escalation Rules

Automatically escalate issues when work orders become overdue.

### How Escalations Work

When a work order passes its due date:
1. Initial notification to assigned technician
2. After X hours, notify supervisor
3. After Y hours, notify manager
4. Continue up the chain as configured

### Setting Up Escalations

1. Go to **Settings** → **Escalations**
2. Click **Create Escalation Rule**
3. Configure:
   - Trigger conditions
   - Time delays
   - Notification recipients
   - Actions to take

### Escalation Levels

Create multiple escalation levels:

**Level 1** (2 hours overdue)
- Notify: Assigned technician
- Action: SMS + Email

**Level 2** (4 hours overdue)
- Notify: Team lead
- Action: Email

**Level 3** (8 hours overdue)
- Notify: Maintenance manager
- Action: SMS + Email + Dashboard alert

**Level 4** (24 hours overdue)
- Notify: Plant manager
- Action: Email

### Priority-Based Escalations

Different priorities can have different escalation paths:
- Critical: Faster escalation
- High: Standard escalation
- Medium/Low: Longer delays

### Escalation Actions

Beyond notifications, escalations can:
- Reassign to another technician
- Increase work order priority
- Add notes to the work order
- Create a follow-up work order
- Trigger a Slack/Teams notification

### Testing Escalations

Before going live:
1. Use the **Test** button in settings
2. Send a test escalation
3. Verify all recipients receive it
4. Adjust timing as needed

### Monitoring Escalations

View escalation history:
- Which work orders escalated
- How quickly they were addressed
- Who was notified
- Actions taken
`
      },
      'team-routing': {
        title: 'Team notification routing',
        time: '4 min read',
        content: `
## Notification Routing

Route notifications to the right people based on rules you define.

### Routing Rules

Create rules based on:

#### By Equipment Type
- CNC issues → CNC specialist team
- Electrical → Electricians
- HVAC → Facilities team

#### By Location
- Building A → Building A team
- Production floor → Production maintenance
- Warehouse → Facilities team

#### By Work Type
- PM → Assigned technician
- Repairs → Repair team
- Projects → Project manager

### Setting Up Routing

1. Go to **Settings** → **Notification Routing**
2. Click **Create Rule**
3. Define the trigger:
   - Equipment category
   - Location
   - Work order type
   - Priority
4. Set the recipient(s)
5. Choose notification method
6. Save the rule

### Multiple Recipients

Send to multiple people:
- All team members
- Specific roles
- Individual users
- External email addresses

### Time-Based Routing

Route based on time of day:
- Business hours: Primary technician
- After hours: On-call technician
- Weekends: Weekend team

### On-Call Schedules

Set up on-call rotations:
1. Go to **Settings** → **On-Call**
2. Create a schedule
3. Add team members in rotation
4. Set time blocks
5. Link to routing rules

### Routing Conflicts

When multiple rules match:
- All matching rules apply
- No duplicates (same person once)
- Priority rules can override

### Testing Routing

Verify rules work correctly:
1. Use the **Test Routing** feature
2. Simulate a work order
3. See who would be notified
4. Adjust as needed
`
      },
      'digest-emails': {
        title: 'Daily and weekly digest emails',
        time: '3 min read',
        content: `
## Email Digests

Get summarized updates instead of individual notifications.

### Digest Types

#### Daily Digest
Sent each morning (configurable time):
- Work orders due today
- Overdue work orders
- New work orders yesterday
- Completions yesterday
- Upcoming schedules

#### Weekly Digest
Sent Monday morning:
- Work orders completed last week
- Work orders due this week
- Overdue summary
- Team performance metrics
- Upcoming maintenance

### Enabling Digests

1. Go to **Profile** → **Notification Preferences**
2. Find **Email Digests**
3. Enable daily, weekly, or both
4. Set preferred delivery time
5. Save changes

### Digest Contents

Customize what's included:
1. **Settings** → **Notifications** → **Digest Settings**
2. Toggle sections on/off:
   - Overdue items
   - Due soon
   - Recently completed
   - Team activity
   - Metrics

### Digest vs. Immediate

Best practices for choosing:
- **Immediate**: Urgent, critical items
- **Digest**: Informational, non-urgent

Suggested setup:
- Critical work orders: Immediate email + SMS
- High priority: Immediate email
- Medium/Low: Daily digest
- Reports: Weekly digest

### Team Digests

Managers can receive team digests:
- Summary of all team activity
- Performance metrics
- Overdue items requiring attention
- Resource utilization

### Mobile Digest

View digest in the mobile app:
- Daily summary on home screen
- Tap to expand sections
- Quick actions from digest view
`
      }
    }
  },
  'analytics': {
    title: 'Analytics & Reports',
    icon: '📊',
    color: 'indigo',
    articles: {
      'dashboard-metrics': {
        title: 'Understanding your dashboard metrics',
        time: '6 min read',
        content: `
## Dashboard Metrics

Understand what each metric means and how to use it to improve your maintenance program.

### Key Performance Indicators

#### Work Order Completion Rate
**Definition**: Percentage of work orders completed on time
**Target**: 85% or higher
**How to improve**:
- Ensure realistic due dates
- Address resource constraints
- Review and adjust schedules

#### Mean Time to Repair (MTTR)
**Definition**: Average time from failure to repair completion
**Target**: Varies by equipment type
**How to improve**:
- Stock critical spare parts
- Train technicians
- Improve troubleshooting guides

#### Mean Time Between Failures (MTBF)
**Definition**: Average operating time between equipment failures
**Target**: Higher is better
**How to improve**:
- Improve preventive maintenance
- Address root causes
- Upgrade aging equipment

#### Overall Equipment Effectiveness (OEE)
**Definition**: Availability × Performance × Quality
**Target**: 85%+ world class
**Components**:
- Availability: Uptime vs. planned production time
- Performance: Actual vs. ideal speed
- Quality: Good units vs. total units

#### PM Compliance
**Definition**: Percentage of scheduled PM completed within grace period
**Target**: 90% or higher
**How to improve**:
- Prioritize PM over reactive work
- Schedule PM during planned downtime
- Assign dedicated PM technicians

### Understanding Trends

#### Improving Trends ✓
- Completion rate increasing
- MTBF increasing
- MTTR decreasing
- OEE increasing

#### Declining Trends ⚠️
- More overdue work orders
- Increasing reactive work
- Rising maintenance costs
- More equipment failures

### Using Metrics for Decisions

**If completion rate is low:**
- Review schedule frequency
- Check staffing levels
- Simplify PM procedures

**If MTTR is high:**
- Analyze common failure modes
- Stock critical parts
- Improve troubleshooting guides

**If MTBF is decreasing:**
- Review PM effectiveness
- Consider condition monitoring
- Evaluate equipment replacement

### Sharing Metrics

Share dashboards with stakeholders:
1. **Settings** → **Dashboard Sharing**
2. Create a shareable link
3. Set auto-refresh interval
4. Share with leadership
`
      },
      'exporting-reports': {
        title: 'Exporting reports to PDF & CSV',
        time: '3 min read',
        content: `
## Report Export

Export reports for offline access, sharing, and record-keeping.

### Export Formats

#### PDF
Best for:
- Sharing with stakeholders
- Printing and archiving
- Presentations

#### CSV
Best for:
- Data analysis in Excel
- Importing to other systems
- Custom reporting

#### Excel
Best for:
- Advanced analysis
- Pivot tables
- Charts and graphs

### Exporting Reports

1. Navigate to any report
2. Click **Export** in the top right
3. Select format (PDF, CSV, Excel)
4. Choose export options
5. Click **Download**

### Available Reports

#### Maintenance Reports
- Work order summary
- Completion report
- Overdue analysis
- Technician productivity

#### Equipment Reports
- Service history
- Downtime analysis
- Cost by equipment
- Warranty status

#### Inventory Reports
- Parts usage
- Stock levels
- Reorder suggestions
- Supplier analysis

#### Compliance Reports
- PM compliance
- Inspection records
- Audit trail
- Certification status

### Scheduled Exports

Automate report delivery:
1. Open a report
2. Click **Schedule Export**
3. Set frequency (daily, weekly, monthly)
4. Add recipients
5. Choose format
6. Save schedule

### Custom Reports

Create custom reports:
1. **Reports** → **Custom Reports**
2. Select data sources
3. Choose columns and filters
4. Set grouping and sorting
5. Save for reuse
`
      },
      'tracking-uptime': {
        title: 'Tracking equipment uptime',
        time: '5 min read',
        content: `
## Uptime Tracking

Monitor equipment availability and identify reliability issues.

### What is Uptime?

**Uptime** = Time equipment is available for production
**Downtime** = Time equipment is unavailable
**Availability** = Uptime ÷ (Uptime + Downtime)

### Enabling Uptime Tracking

1. Go to **Equipment** → Select equipment
2. Click **Settings** → **Uptime Tracking**
3. Enable tracking
4. Set expected operating hours
5. Define downtime categories

### Logging Downtime

When equipment goes down:
1. Create a work order with type "Repair"
2. Mark equipment as **Down**
3. Select downtime reason:
   - Planned maintenance
   - Unplanned failure
   - Setup/changeover
   - No operator
   - Other
4. When repaired, mark as **Returned to Service**

### Automatic Downtime Logging

Connect IoT sensors for automatic tracking:
- Equipment running status
- Operating hours
- Cycle counts
- Fault codes

### Uptime Dashboard

View uptime metrics:
- **Equipment Availability**: % time available
- **Downtime by Reason**: Breakdown by category
- **Downtime Trend**: Over time
- **Top Downtime Causes**: Pareto analysis

### Uptime Reports

Generate uptime reports:
1. Go to **Reports** → **Uptime Report**
2. Select equipment or group
3. Set date range
4. View availability metrics
5. Export or share

### Benchmarking

Compare uptime across:
- Equipment in same category
- Different production lines
- Shifts or teams
- Time periods

### Improving Uptime

Use uptime data to:
- Identify problem equipment
- Target improvement efforts
- Justify capital investments
- Measure improvement over time
`
      },
      'calculating-costs': {
        title: 'Calculating maintenance costs',
        time: '7 min read',
        content: `
## Maintenance Cost Tracking

Understand and optimize your maintenance spending.

### Cost Categories

#### Labor Costs
- Technician wages
- Overtime
- Contractor costs
- Training

#### Parts Costs
- Spare parts
- Consumables
- Tools and equipment

#### External Services
- Service contracts
- OEM support
- Specialty contractors

#### Downtime Costs
- Lost production
- Rush shipping
- Quality issues

### Setting Up Cost Tracking

1. Go to **Settings** → **Cost Configuration**
2. Enter labor rates:
   - Hourly rate by role
   - Overtime multiplier
   - Burden rate (benefits, etc.)
3. Add parts costs to inventory
4. Set default cost categories

### Cost Entry

Costs are captured automatically and manually:

#### Automatic
- Parts used on work orders (from inventory cost)
- Labor hours × hourly rate

#### Manual
- External service costs
- Special purchases
- Contractor invoices

### Cost Reports

#### Total Cost of Ownership (TCO)
All costs associated with a piece of equipment:
- Purchase price (amortized)
- Maintenance costs
- Operating costs
- Downtime costs

#### Cost per Equipment
Rank equipment by maintenance cost:
- Highest cost equipment
- Cost trend over time
- Cost vs. replacement value

#### Cost per Category
Compare spending across categories:
- Labor vs. parts vs. contractors
- PM vs. reactive maintenance
- By equipment type

### Cost Analysis

#### Cost Drivers
Identify what's driving costs:
- Repeat failures
- Aging equipment
- Parts prices
- Labor inefficiency

#### Cost Reduction
Find savings opportunities:
- Standardize parts
- Improve PM to reduce repairs
- Train technicians
- Consider replacement

### Budget Management

Set and track maintenance budgets:
1. **Settings** → **Budgets**
2. Create annual budget
3. Allocate by category/department
4. Track actual vs. budget
5. Get alerts when approaching limits
`
      },
      'sharing-reports': {
        title: 'Sharing reports with management',
        time: '3 min read',
        content: `
## Report Sharing

Share maintenance insights with stakeholders outside Myncel.

### Sharing Options

#### Scheduled Email Delivery
Automatically send reports:
1. Open any report
2. Click **Schedule**
3. Set frequency (daily, weekly, monthly)
4. Add recipient emails
5. Choose format (PDF or link)

#### Shareable Links
Create a link for on-demand access:
1. Open the report
2. Click **Share**
3. Enable **Public Link**
4. Set expiration date
5. Copy and share the link

Note: Links are accessible without login but expire after the set date.

#### Export to File
Download and share manually:
1. Export as PDF, CSV, or Excel
2. Email as attachment
3. Upload to shared drive
4. Include in presentations

### Report Permissions

Control who can share reports:
- **Admin**: Can share any report
- **Manager**: Can share team reports
- **Technician**: Cannot share reports

Configure in **Settings** → **Roles & Permissions**.

### Executive Dashboards

Create dashboards for leadership:
1. **Dashboards** → **Create Dashboard**
2. Add key metrics:
   - OEE summary
   - Cost trends
   - Compliance score
   - Top issues
3. Simplify views for non-technical audience
4. Share via scheduled email

### Report Customization for Audience

#### For Plant Managers
- Equipment availability
- Maintenance costs
- Resource utilization
- Open issues

#### For Finance
- Budget vs. actual
- Cost breakdown
- Capital recommendations
- Parts spending

#### For Operations
- Upcoming maintenance
- Production impact
- Work order status
- Schedule compliance

### Best Practices

- Send regular reports on a schedule
- Include trend data, not just snapshots
- Highlight exceptions and action items
- Keep reports concise and visual
- Provide context for metrics
`
      }
    }
  },
  'inventory': {
    title: 'Parts Inventory',
    icon: '🔧',
    color: 'teal',
    articles: {
      'adding-parts': {
        title: 'Adding parts to your inventory',
        time: '4 min read',
        content: `
## Inventory Management

Track spare parts and consumables to ensure you have what you need when you need it.

### Adding Parts

1. Go to **Inventory** → **Add Part**
2. Enter part details:
   - Part name
   - Part number
   - Description
   - Category
3. Set inventory levels:
   - Quantity on hand
   - Minimum stock level
   - Maximum stock level
4. Add supplier information
5. Set unit cost
6. Save the part

### Part Fields

| Field | Description |
|-------|-------------|
| Part Number | Unique identifier |
| Name | Descriptive name |
| Category | Classification (Bearing, Belt, Filter, etc.) |
| Quantity | Current stock level |
| Min Stock | Reorder trigger point |
| Max Stock | Maximum to keep on hand |
| Location | Where stored in your facility |
| Unit Cost | Cost per unit |
| Supplier | Vendor information |

### Part Categories

Organize parts by category:
- Bearings
- Belts
- Filters
- Seals & Gaskets
- Electrical
- Hydraulic
- Pneumatic
- Fasteners
- Lubricants
- Safety Items

### Bulk Import Parts

Import multiple parts at once:
1. **Inventory** → **Import**
2. Download CSV template
3. Fill in part data
4. Upload the file
5. Review and confirm

### Barcode Scanning

Add parts by scanning barcodes:
1. Click **Scan Barcode** in inventory
2. Scan manufacturer barcode
3. Enter part details
4. Save

Use barcodes for:
- Adding new parts
- Finding parts
- Checking out parts
- Physical inventory

### Parts and Equipment

Link parts to equipment:
1. Open a part
2. Click **Used On**
3. Select equipment that uses this part
4. When the part is used on a work order, you'll see the association
`
      },
      'min-stock-levels': {
        title: 'Setting minimum stock levels',
        time: '3 min read',
        content: `
## Stock Level Management

Never run out of critical parts with minimum stock alerts.

### Setting Minimum Stock

1. Open a part in inventory
2. Find **Stock Levels** section
3. Set **Minimum Stock**
4. Optionally set **Reorder Point** (often higher than minimum)
5. Set **Maximum Stock**
6. Save changes

### How Minimum Stock Works

When quantity falls below minimum:
- Alert is triggered
- Part appears in **Low Stock** view
- Reorder suggestion is generated
- Dashboard indicator updates

### Calculating Minimum Stock

Consider these factors:

**Lead Time**
How long from order to delivery?
If lead time is 2 weeks and you use 10/week, minimum = 20

**Usage Rate**
How often is the part used?
Check usage history in part details

**Criticality**
How critical is this part?
Critical parts may need higher minimums

**Cost**
Higher cost parts may justify lower minimums

### Reorder Point vs. Minimum

- **Minimum Stock**: Safety stock, don't go below
- **Reorder Point**: When to place order (includes lead time buffer)

**Example:**
- Usage: 5 per week
- Lead time: 2 weeks
- Minimum Stock: 10 (2 weeks × 5)
- Reorder Point: 20 (includes lead time + buffer)

### Automatic Reorder

Enable automatic reorder suggestions:
1. Open part → **Reorder Settings**
2. Enable **Auto-Reorder**
3. Set reorder quantity
4. Select supplier
5. When stock hits reorder point, a purchase suggestion is created

### Low Stock Alerts

Configure who gets notified:
1. **Settings** → **Notifications** → **Inventory**
2. Enable **Low Stock Alerts**
3. Select recipients
4. Set alert threshold (at minimum, or percentage)
`
      },
      'linking-parts': {
        title: 'Linking parts to equipment',
        time: '4 min read',
        content: `
## Parts-Equipment Associations

Link parts to equipment for better planning and faster work orders.

### Why Link Parts?

- See which parts fit which equipment
- Auto-suggest parts on work orders
- Track parts usage by equipment
- Plan spare parts inventory

### Linking Parts to Equipment

#### From Part Record
1. Open the part in inventory
2. Click **Used On** tab
3. Click **Add Equipment**
4. Search and select equipment
5. Optionally set quantity used per maintenance
6. Save

#### From Equipment Record
1. Open equipment details
2. Click **Spare Parts** tab
3. Click **Add Part**
4. Search or scan part barcode
5. Set quantity typically needed
6. Save

### Bill of Materials (BOM)

Create a complete BOM for equipment:
- All parts used on the equipment
- Quantities of each
- Where to find them
- Part alternatives

### Parts Suggestions

When creating work orders:
1. Myncel suggests linked parts
2. One-click to add to work order
3. Parts auto-deduct on completion
4. Usage is tracked

### Parts Usage Reports

See parts usage by equipment:
1. Go to **Reports** → **Parts Usage**
2. Filter by equipment
3. View:
   - Most used parts
   - Usage trend
   - Cost per equipment

### Critical Spares

Mark parts as critical for specific equipment:
1. Open the part-equipment link
2. Check **Critical Spare**
3. These parts are highlighted in inventory
4. Subject to higher minimum stock recommendations

### Import Parts Associations

Bulk link parts to equipment:
1. **Settings** → **Import** → **Parts Associations**
2. Download template
3. Fill in equipment-part relationships
4. Upload and confirm
`
      },
      'auto-deduction': {
        title: 'Parts auto-deduction on work orders',
        time: '5 min read',
        content: `
## Automatic Parts Deduction

Track inventory automatically as parts are used on work orders.

### How Auto-Deduction Works

1. Technician adds parts to work order
2. On work order completion:
   - Parts quantities are deducted from inventory
   - Cost is calculated and recorded
   - Equipment service history updated

### Enabling Auto-Deduction

1. Go to **Settings** → **Inventory**
2. Enable **Auto-deduct parts on completion**
3. Choose behavior:
   - Deduct immediately when added
   - Deduct on work order completion
   - Require confirmation before deduction

### Adding Parts to Work Orders

Technicians add parts during work:
1. Open work order
2. Click **Add Parts**
3. Search by name, number, or scan barcode
4. Enter quantity used
5. Parts are listed on work order

### Parts Validation

The system validates:
- Part exists in inventory
- Sufficient quantity available
- Part is linked to equipment (warning if not)

### Low Stock Handling

When parts fall below minimum:
- Alert is sent
- Work order shows low stock warning
- Technician can note for reorder

### Manual Deduction Override

For special situations:
1. Open work order
2. Click **Parts Used**
3. Edit the deduction amount
4. Add a note explaining the change

### Parts Return

If parts aren't actually used:
1. Open completed work order
2. Click **Return Parts**
3. Select parts to return
4. Inventory is updated

### Reporting on Parts Usage

Track parts usage:
- By equipment
- By work order type
- By technician
- By time period
- Cost analysis

### Negative Stock Prevention

Configure behavior when stock is low:
- **Allow negative**: Useful for emergencies
- **Block**: Require positive stock
- **Warn**: Alert but allow

Set in **Settings** → **Inventory** → **Stock Rules**.
`
      },
      'suppliers': {
        title: 'Managing suppliers',
        time: '4 min read',
        content: `
## Supplier Management

Maintain supplier information for efficient ordering and cost tracking.

### Adding Suppliers

1. Go to **Inventory** → **Suppliers**
2. Click **Add Supplier**
3. Enter details:
   - Company name
   - Contact person
   - Phone and email
   - Address
   - Website
   - Account number
   - Payment terms
4. Save

### Supplier Information

Track for each supplier:
- **Lead Times**: Average delivery time
- **Minimum Order**: Minimum order amount
- **Shipping Costs**: Standard shipping rates
- **Payment Terms**: Net 30, etc.
- **Discounts**: Volume or early payment discounts

### Linking Parts to Suppliers

1. Open a part
2. Click **Suppliers** tab
3. Add one or more suppliers:
   - Supplier name
   - Their part number
   - Their price
   - Lead time
   - Set as preferred supplier

### Multiple Suppliers per Part

For critical parts, add multiple suppliers:
- Primary supplier
- Backup suppliers
- Compare pricing
- Ensure availability

### Supplier Performance

Track supplier metrics:
- On-time delivery rate
- Order accuracy
- Quality issues
- Average lead time
- Price competitiveness

View in **Reports** → **Supplier Performance**

### Creating Purchase Orders

1. **Inventory** → **Purchase Orders**
2. Click **Create PO**
3. Select supplier
4. Add parts to order
5. Set quantities
6. Submit for approval
7. Send to supplier

### Receiving Orders

When parts arrive:
1. Open the purchase order
2. Click **Receive**
3. Verify quantities
4. Add to inventory
5. Update costs if changed

### Supplier Reports

Generate supplier reports:
- Spending by supplier
- Order history
- Performance metrics
- Price comparison
`
      }
    }
  },
  'api': {
    title: 'API & Integrations',
    icon: '⚡',
    color: 'slate',
    articles: {
      'api-overview': {
        title: 'API overview & authentication',
        time: '8 min read',
        content: `
## Myncel API

Integrate Myncel with your existing systems using our REST API.

### API Access

API access is available on Professional and Enterprise plans.

#### Getting Your API Key

1. Go to **Settings** → **API**
2. Click **Generate API Key**
3. Name your key (e.g., "Integration")
4. Copy the key immediately (shown only once)
5. Store securely

### Authentication

All API requests require authentication via Bearer token:

\`\`\`bash
curl -X GET "https://api.myncel.com/v1/equipment" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
\`\`\`

### API Base URL

\`\`\`
https://api.myncel.com/v1
\`\`\`

### Available Endpoints

#### Equipment
- \`GET /equipment\` - List all equipment
- \`GET /equipment/:id\` - Get equipment details
- \`POST /equipment\` - Create equipment
- \`PUT /equipment/:id\` - Update equipment
- \`DELETE /equipment/:id\` - Delete equipment

#### Work Orders
- \`GET /work-orders\` - List work orders
- \`GET /work-orders/:id\` - Get work order details
- \`POST /work-orders\` - Create work order
- \`PUT /work-orders/:id\` - Update work order
- \`POST /work-orders/:id/complete\` - Complete work order

#### Schedules
- \`GET /schedules\` - List schedules
- \`GET /schedules/:id\` - Get schedule details
- \`POST /schedules\` - Create schedule

#### Inventory
- \`GET /parts\` - List parts
- \`GET /parts/:id\` - Get part details
- \`POST /parts\` - Create part
- \`PUT /parts/:id\` - Update part

### Rate Limits

- Professional: 1,000 requests/hour
- Enterprise: 10,000 requests/hour

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1625097600
\`\`\`

### Error Handling

Standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limited
- 500: Server Error

Error response format:
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Equipment name is required",
    "details": {...}
  }
}
\`\`\`

### API Versioning

The API is versioned in the URL path. Current version: v1

When breaking changes are made, a new version is released.
`
      },
      'slack-integration': {
        title: 'Connecting Slack notifications',
        time: '5 min read',
        content: `
## Slack Integration

Send Myncel notifications to your Slack channels.

### Setup Instructions

1. Go to **Settings** → **Integrations**
2. Find **Slack** and click **Connect**
3. You'll be redirected to Slack
4. Select your workspace
5. Authorize Myncel
6. Select channels for notifications
7. Configure which events to send
8. Save settings

### Notification Types

Send to Slack when:
- Work order created
- Work order assigned
- Work order completed
- Work order overdue
- Equipment marked as down
- High priority alert
- Schedule generated

### Channel Configuration

Configure per notification type:
1. Select notification type
2. Choose Slack channel
3. Set message format
4. Enable/disable

### Custom Message Formats

Customize Slack messages:
\`\`\`
🔔 New Work Order
**Equipment**: {{equipment_name}}
**Priority**: {{priority}}
**Assigned**: {{assignee}}
**Due**: {{due_date}}
\`\`\`

### Slack Commands

Use slash commands in Slack:
- \`/myncel wo [id]\` - View work order
- \`/myncel equipment [name]\` - Find equipment
- \`/myncel help\` - Show available commands

### Troubleshooting

**Not receiving notifications?**
- Check channel permissions
- Verify integration is active
- Test from Settings → Integrations

**Need to reconnect?**
1. Disconnect in Settings → Integrations
2. Reconnect with new credentials
3. Reconfigure channels

### Disconnecting

To disconnect Slack:
1. **Settings** → **Integrations**
2. Find Slack
3. Click **Disconnect**
4. Confirm

All Slack notifications stop immediately.
`
      },
      'zapier-integration': {
        title: 'Zapier integration guide',
        time: '6 min read',
        content: `
## Zapier Integration

Connect Myncel to 5,000+ apps via Zapier.

### Getting Started

1. Create a Zapier account at zapier.com
2. Go to **Settings** → **Integrations** → **Zapier**
3. Click **Generate Zapier Key**
4. Copy the key

### Creating a Zap

#### Trigger: When something happens in Myncel

Available triggers:
- New work order created
- Work order completed
- Work order overdue
- Equipment added
- Part low stock
- Schedule generated

Example: New work order → Create Trello card

#### Action: Do something in Myncel

Available actions:
- Create work order
- Update work order
- Create equipment
- Add part to inventory

Example: Google Form submission → Create work order

### Example Workflows

#### 1. Google Forms → Myncel Work Order
When someone submits a maintenance request form:
- Trigger: Google Forms new response
- Action: Myncel create work order

#### 2. Myncel → Gmail
When a work order is created:
- Trigger: Myncel new work order
- Action: Gmail send email

#### 3. QuickBooks → Myncel
When a vendor bill is approved:
- Trigger: QuickBooks new bill
- Action: Myncel add part cost

#### 4. Myncel → Google Sheets
For backup and reporting:
- Trigger: Work order completed
- Action: Add row to Google Sheet

### Zapier Setup Steps

1. In Zapier, click **Create Zap**
2. Select Myncel as the app
3. Choose trigger or action
4. Connect your Myncel account using the Zapier key
5. Configure the specific event/data
6. Test the connection
7. Turn on the Zap

### Best Practices

- Name your Zaps descriptively
- Test thoroughly before going live
- Set up error notifications in Zapier
- Document your integrations
- Review Zap history regularly

### Zapier Limits

Zapier plan limits apply:
- Free: 100 tasks/month
- Paid: 750+ tasks/month

Each action in a Zap counts as a task.
`
      },
      'quickbooks-export': {
        title: 'Exporting to QuickBooks',
        time: '5 min read',
        content: `
## QuickBooks Integration

Sync maintenance costs and parts purchases with QuickBooks.

### Setup Instructions

1. Go to **Settings** → **Integrations**
2. Find **QuickBooks** and click **Connect**
3. Log in to QuickBooks
4. Select your company
5. Authorize the connection
6. Map your accounts:
   - Labor expense account
   - Parts expense account
   - Contractor expense account
7. Save settings

### What Syncs

#### From Myncel to QuickBooks

- **Parts purchases**: Bills from parts orders
- **Labor costs**: Journal entries for work order labor
- **Contractor costs**: Bills from external services

#### Sync Frequency

- Automatic: Daily sync at 2 AM
- Manual: Click **Sync Now** anytime

### Expense Categories

Map Myncel categories to QuickBooks accounts:

| Myncel Category | QuickBooks Account |
|-----------------|-------------------|
| Labor | Maintenance Labor Expense |
| Parts | Spare Parts Expense |
| Contractors | Contract Services |
| Consumables | Maintenance Supplies |

### Purchase Orders

Sync parts purchase orders:
1. Create PO in Myncel
2. Receive the order
3. Bill is created in QuickBooks
4. Match to PO for tracking

### Cost Reports

In QuickBooks, see maintenance costs:
- By vendor
- By expense account
- By customer:job (if tracking by department)

### Sync Errors

Common issues:
- **Account not found**: Remap accounts
- **Duplicate entry**: Check for existing records
- **Missing data**: Ensure all fields are complete

View sync errors in **Settings** → **Integrations** → **QuickBooks** → **Sync Log**

### Disconnecting

To disconnect QuickBooks:
1. **Settings** → **Integrations**
2. Find QuickBooks
3. Click **Disconnect**
4. Confirm

Existing synced data remains in QuickBooks.
`
      },
      'webhooks': {
        title: 'Webhook setup & events',
        time: '8 min read',
        content: `
## Webhooks

Receive real-time notifications when events occur in Myncel.

### What are Webhooks?

Webhooks send HTTP POST requests to your server when specific events happen. Use them to integrate with custom systems or trigger automated workflows.

### Setup

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter:
   - Endpoint URL (your server)
   - Secret key (for verification)
   - Events to subscribe to
4. Save

### Available Events

#### Work Order Events
- \`work_order.created\`
- \`work_order.updated\`
- \`work_order.completed\`
- \`work_order.deleted\`
- \`work_order.overdue\`

#### Equipment Events
- \`equipment.created\`
- \`equipment.updated\`
- \`equipment.deleted\`
- \`equipment.downtime_started\`
- \`equipment.downtime_ended\`

#### Schedule Events
- \`schedule.created\`
- \`schedule.activated\`
- \`schedule.paused\`
- \`work_order_generated\`

#### Inventory Events
- \`part.low_stock\`
- \`part.updated\`
- \`part.created\`

### Webhook Payload

Example payload:

\`\`\`json
{
  "id": "evt_abc123",
  "type": "work_order.created",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "work_order": {
      "id": "wo_xyz789",
      "title": "Oil change - CNC Mill #1",
      "equipment_id": "eq_456",
      "priority": "medium",
      "due_date": "2024-01-20",
      "assigned_to": "John Smith"
    }
  }
}
\`\`\`

### Verifying Webhooks

Verify requests come from Myncel:

\`\`\`javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
\`\`\`

### Retry Policy

If your endpoint fails:
- Retry after 1, 5, 15, 60 minutes
- 24 hour maximum retry window
- After 5 failures, webhook is disabled

### Testing Webhooks

Test your endpoint:
1. **Settings** → **Webhooks**
2. Click **Test** next to your webhook
3. Send a test event
4. View response

### Webhook Logs

View all webhook deliveries:
- Request sent
- Response received
- Status code
- Retry history

Access in **Settings** → **Webhooks** → **Logs**.
`
      }
    }
  }
}

// Define types
type Article = {
  title: string
  time: string
  popular?: boolean
  content: string
}

type Category = {
  title: string
  icon: string
  color: string
  articles: Record<string, Article>
}

// Helper function to get article data
function getArticle(category: string, slug: string): { category: Category; article: Article } | null {
  const cat = docCategories[category as keyof typeof docCategories]
  if (!cat) return null
  const article = cat.articles[slug as keyof typeof cat.articles]
  if (!article) return null
  return { category: cat, article }
}

// Generate static paths
export async function generateStaticParams() {
  const params: { category: string; slug: string }[] = []
  
  Object.entries(docCategories).forEach(([catKey, category]) => {
    Object.keys(category.articles).forEach((slug) => {
      params.push({ category: catKey, slug })
    })
  })
  
  return params
}

// Article Page Component
export default function DocArticlePage({ 
  params 
}: { 
  params: { category: string; slug: string } 
}) {
  const data = getArticle(params.category, params.slug)
  
  if (!data) {
    notFound()
  }
  
  const { category, article } = data
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/docs" className="text-[#635bff] hover:underline">
                Documentation
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/docs" className="text-[#635bff] hover:underline">
                {category.title}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-600">{article.title}</li>
          </ol>
        </nav>
        
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{category.icon}</span>
            <span className="text-sm text-gray-500">{article.time}</span>
            {article.popular && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded">
                Popular
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-[#0a2540] mb-4">
            {article.title}
          </h1>
        </header>
        
        {/* Article Content */}
        <article className="prose prose-slate max-w-none prose-headings:text-[#0a2540] prose-a:text-[#635bff] prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#1e293b] prose-pre:text-gray-100">
          <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
        </article>
        
        {/* Navigation */}
        <div className="mt-12 pt-8 border-t flex justify-between">
          <Link 
            href="/docs" 
            className="text-[#635bff] hover:underline flex items-center gap-1"
          >
            ← Back to Documentation
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}