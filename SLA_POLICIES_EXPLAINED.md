# SLA Policies - Functionality Explained

## Issue Fixed
**Problem**: Policy Name was not visible in the SLA Policies table
**Root Cause**: The `SlaPolicyDto` record was missing the `Name`, `Description`, `EscalationTime`, and `IsActive` properties
**Solution**: Updated the DTO to include all required fields and updated all mapping code in `SimpleSlaService.cs`

---

## What is SLA (Service Level Agreement)?

SLA Policies define the **expected response and resolution times** for support tickets based on their **priority level**. Think of it as a customer service promise - "We will respond to your ticket within X hours and resolve it within Y hours."

---

## SLA Components

### 1. **SLA Policy**
A policy that sets time expectations for tickets. Each policy includes:

- **Policy Name**: Descriptive name (e.g., "Critical Issues - 24/7", "Standard Support")
- **Description**: Details about when this policy applies
- **Priority**: Which ticket priority this applies to (Critical, High, Medium, Low)
- **Response Time**: How quickly must we send the first response? (e.g., 30 mins)
- **Resolution Time**: How quickly must we fully resolve the issue? (e.g., 4 hours)
- **Escalation Time**: When to escalate if not progressing (optional)
- **Status**: Active/Inactive

### 2. **Time Measurements**

```
Response Time (First Response SLA)
└─ Time from ticket creation until first agent response
└─ Example: Customer creates ticket at 9:00 AM
   └─ Agent responds at 9:25 AM
   └─ Response SLA: 25 minutes ✅ (if target was 30 mins)

Resolution Time (Resolution SLA)
└─ Time from ticket creation until ticket is marked as resolved
└─ Example: Ticket created 9:00 AM, resolved 11:00 AM
   └─ Resolution SLA: 2 hours ✅ (if target was 4 hours)
```

### 3. **Escalation Contacts**
People who get notified when SLA is about to breach or has breached:

- **Level 1**: First escalation (e.g., Team Lead) - notified at 50% of SLA time
- **Level 2**: Second escalation (e.g., Manager) - notified at 75% of SLA time  
- **Level 3**: Final escalation (e.g., Director) - notified at 90% of SLA time or breach

---

## How It Works - Real Example

### Scenario: Customer Reports Critical Server Outage

1. **Ticket Created**: 
   - Time: Monday 9:00 AM
   - Priority: Critical
   - SLA Policy: "Critical Issues - 24/7"
     - Response Time: 30 minutes
     - Resolution Time: 4 hours

2. **SLA Timers Start**:
   ```
   Response SLA Due: 9:30 AM (30 mins)
   Resolution SLA Due: 1:00 PM (4 hours)
   ```

3. **Timeline**:
   ```
   9:00 AM - Ticket created, SLA clock starts
   9:15 AM - System notifies Level 1 (50% of response time)
   9:20 AM - Agent responds "Investigating issue"
            ✅ Response SLA MET (10 mins before deadline)
   
   11:00 AM - Level 1 notified (50% of resolution time)
   12:00 PM - Level 2 notified (75% of resolution time)
   12:30 PM - Level 3 notified (87.5% of resolution time)
   12:45 PM - Issue resolved, ticket closed
             ✅ Resolution SLA MET (15 mins before deadline)
   ```

4. **If Agent Didn't Respond**:
   ```
   9:00 AM - Ticket created
   9:15 AM - Level 1 escalation email
   9:30 AM - Response SLA BREACHED ❌
            - Automatic notification to all escalation contacts
            - Ticket flagged as "SLA Breached"
            - Manager dashboard shows red alert
   ```

---

## Database Structure

### SlaPolicy Table
```
Id (GUID)                  - Unique identifier
Name                       - "Critical Issues - 24/7"
Description                - "For production outages and critical bugs"
Category                   - Category ID
Priority                   - Priority level (0=Critical, 1=High, 2=Medium, 3=Low)
FirstResponseMins          - 30 (minutes)
ResolutionMins             - 240 (4 hours in minutes)
EscalationTime             - 120 (optional, 2 hours)
IsActive                   - true/false
CreatedAt                  - Timestamp
UpdatedAt                  - Timestamp
```

### SlaEscalationContact Table
```
Id                         - Unique ID
SlaPolicyId (GUID)         - Links to SLA Policy
Level                      - 1, 2, or 3
Name                       - "John Manager"
Email                      - "john@company.com"
NotifyByEmail              - true/false
NotifyBySystem             - true/false (in-app notification)
IsActive                   - true/false
CreatedAt                  - Timestamp
UpdatedAt                  - Timestamp
```

---

## Features Implemented

### ✅ Policy Management
- Create SLA policies with response/resolution times
- Update existing policies
- Soft delete (deactivate) policies
- View all policies with includeInactive toggle
- Automatic duplicate validation

### ✅ Escalation Contacts
- Add multiple contacts per policy
- Set notification preferences (email/system)
- Define escalation levels (L1, L2, L3)
- Manage contact active status

### ✅ Time Tracking
- Automatic calculation of SLA deadlines
- Real-time tracking of elapsed time
- Color-coded status indicators:
  - 🟢 Green: < 50% time elapsed
  - 🟡 Yellow: 50-75% time elapsed
  - 🟠 Orange: 75-90% time elapsed
  - 🔴 Red: > 90% time elapsed or breached

### ✅ Notifications
- Email notifications to escalation contacts
- In-app system notifications
- Automatic alerts at escalation thresholds
- Breach notifications

---

## Frontend UI Components

### SLA Policies Table
Displays all configured SLA policies with:
- **Policy Name** (NOW VISIBLE - Fixed!)
- **Priority** (with color badge)
- **Response Time** (formatted: "30 mins", "2 hrs")
- **Resolution Time** (formatted: "4 hrs", "1 day")
- **Escalation Levels** (badges showing L1, L2, L3 times)
- **Status** (Active/Inactive badge)
- **Actions** (Edit/Delete buttons)

### Create/Edit SLA Policy Modal
Form fields:
- Policy Name (required)
- Description (optional)
- Priority Selection (dropdown)
- Response Time (minutes)
- Resolution Time (minutes)
- Escalation Time (optional)
- Active Status (checkbox)

### Escalation Contacts Section
Manage escalation contacts for each policy:
- Add contact with name, email, level
- Set notification preferences
- Remove or deactivate contacts
- View all contacts per policy

---

## API Endpoints

```http
GET    /api/tickets/settings/sla?includeInactive=false
       └─ Get all SLA policies

GET    /api/tickets/settings/sla/{id}
       └─ Get specific policy by ID

POST   /api/tickets/settings/sla
       └─ Create new SLA policy
       Body: { name, description, category, priority, firstResponseMins, resolutionMins }

PUT    /api/tickets/settings/sla/{id}
       └─ Update existing policy
       Body: { name, description, isActive, category, priority, firstResponseMins, resolutionMins }

DELETE /api/tickets/settings/sla/{id}
       └─ Delete (hard delete) policy

GET    /api/tickets/settings/sla/{slaPolicyId}/escalation-contacts
       └─ Get escalation contacts for a policy

POST   /api/tickets/settings/sla/{slaPolicyId}/escalation-contacts
       └─ Add escalation contact
       Body: { level, name, email, notifyByEmail, notifyBySystem }

PUT    /api/tickets/settings/sla/escalation-contacts/{id}
       └─ Update escalation contact

DELETE /api/tickets/settings/sla/escalation-contacts/{id}
       └─ Delete escalation contact
```

---

## Business Value

### For Customers
- **Transparency**: Know when to expect responses
- **Consistency**: Same service level for similar issues
- **Trust**: Company commits to specific timeframes

### For Support Team
- **Prioritization**: Clear guidance on which tickets need immediate attention
- **Accountability**: Measurable performance metrics
- **Workload Management**: Automatic escalation prevents tickets from falling through cracks

### For Management
- **Performance Tracking**: See team SLA compliance rates
- **Resource Planning**: Identify bottlenecks and staffing needs
- **Customer Satisfaction**: Meeting SLAs = happy customers

---

## Best Practices

### 1. Set Realistic Targets
```
❌ Bad:  Critical tickets - 5 min response, 30 min resolution
         (Impossible to maintain, team will burn out)

✅ Good: Critical tickets - 30 min response, 4 hour resolution
         (Achievable, leaves buffer for complex issues)
```

### 2. Use Escalation Wisely
```
✅ Level 1 at 50%: Team Lead (can provide guidance)
✅ Level 2 at 75%: Manager (can reallocate resources)
✅ Level 3 at 90%: Director (final authority for major decisions)
```

### 3. Match Priority to Reality
```
Priority    | Response | Resolution | Use Case
------------|----------|------------|---------------------------
Critical    | 30 min   | 4 hours    | Production down, data loss
High        | 2 hours  | 24 hours   | Major feature broken
Medium      | 8 hours  | 3 days     | Minor bugs, feature requests
Low         | 24 hours | 1 week     | Questions, enhancements
```

### 4. Monitor and Adjust
- Review SLA breach patterns monthly
- Adjust targets if consistently missing or exceeding
- Update escalation contacts when team structure changes

---

## Recent Changes

### Fixed (November 8, 2025)
1. ✅ Added missing `Name` property to `SlaPolicyDto`
2. ✅ Added missing `Description` property to `SlaPolicyDto`
3. ✅ Added missing `EscalationTime` property to `SlaPolicyDto`
4. ✅ Added missing `IsActive` property to `SlaPolicyDto`
5. ✅ Updated all DTO mapping in `SimpleSlaService.cs`
6. ✅ Added `includeInactive` filter support in `GetAllPoliciesAsync`

### Result
- Policy names now display correctly in the table
- All SLA information is complete
- Active/inactive filtering works properly
- Data structure matches frontend expectations

---

## Testing the Fix

1. **Navigate to**: Settings → SLA Policies tab
2. **Expected**: Policy names should be visible in the "Policy" column
3. **Verify**: All policies show complete information (name, priority, times, status)
4. **Test Create**: Add new SLA policy and verify name appears immediately
5. **Test Update**: Edit policy name and verify change reflects in table
6. **Test Filter**: Toggle "Show Inactive" if available

---

## Summary

**SLA Policies = Customer Service Promises**

They ensure customers get timely support by:
- Setting clear response/resolution time expectations
- Automatically tracking time elapsed
- Escalating to supervisors when deadlines approach
- Measuring team performance objectively

**The fix ensures policy names are now visible**, making the SLA management interface complete and functional!
