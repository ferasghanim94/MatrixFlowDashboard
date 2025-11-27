# Company Funnel (Company Journey) Flow Diagram

**Created:** 2025-11-25  
**Purpose:** Document the complete Company Funnel flow for automatic assignment of Sales and Customer Success managers

---

## ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRIGGER SOURCES (Pub/Sub Events)                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  CompanyProfile       │   │  TablesUpdateRunner   │   │  CompanyArrRange      │
│  MetaDataRunner       │   │                       │   │  Runner               │
│                       │   │  File: matrix/worker/ │   │                       │
│  File: matrix/worker/ │   │  tables_update/       │   │  File: matrix/worker/ │
│  subscribers/company_ │   │  tables_update_sub.py │   │  subscribers/company_ │
│  profile/company_     │   │                       │   │  arr_range/company_   │
│  metadata_worker.py   │   │  Trigger:             │   │  arr_range_worker.py  │
│                       │   │  - Manual API calls   │   │                       │
│  Triggers:            │   │  - Data sync events   │   │  Trigger:             │
│  - Payment events     │   │                       │   │  - Subscription       │
│  - Company events     │   │  Publishes:           │   │    events (MRR        │
│  - Subscription       │   │  company_state_       │   │    changes)           │
│    events             │   │  update_event         │   │                       │
│  - Signup done        │   │                       │   │  Logic:               │
│  - Zoom events        │   │                       │   │  - Calculate ARR      │
│                       │   │                       │   │    range from MRR     │
│  Publishes:           │   │                       │   │  - Update arr_range   │
│  company_state_       │   │                       │   │    table              │
│  update_event         │   │                       │   │                       │
│                       │   │                       │   │  Publishes:           │
│                       │   │                       │   │  company_arr_range_   │
│                       │   │                       │   │  changed              │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  LeadscoreEmptyDays   │   │  Manual Lock          │   │  Manual Lock          │
│  (Periodic Task)      │   │  Expiration Events    │   │  Expiration Events    │
│                       │   │                       │   │                       │
│  File: matrix/worker/ │   │  cs_manager_lock_     │   │  cs_stage_lock_       │
│  periodic_tasks/      │   │  expiration           │   │  expiration           │
│  leadscore_locker/    │   │                       │   │                       │
│  leadscore_empty_     │   │  Triggered by:        │   │  Triggered by:        │
│  days.py              │   │  - Manual API         │   │  - Manual API         │
│                       │   │    (Matrix UI)        │   │    (Matrix UI)        │
│  Publishes:           │   │  - Lock expiry        │   │  - Lock expiry        │
│  non_active_company_  │   │    scheduled events   │   │    scheduled events   │
│  event                │   │                       │   │                       │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PUB/SUB QUEUE: matrix.company_journey_events            │
│                                                                                 │
│  Subscribed Topics:                                                             │
│  ├── company_state_update_event                                                 │
│  ├── non_active_company_event                                                   │
│  ├── cs_manager_lock_expiration                                                 │
│  ├── cs_stage_lock_expiration                                                   │
│  └── company_arr_range_changed                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COMPANY JOURNEY RUNNER                                  │
│                                                                                 │
│  File: matrix/worker/subscribers/company_journey/company_journey_runner.py      │
│  Queue: matrix.company_journey_events                                           │
│  Pattern: BaseMatrixPubSubRunner (Event-Driven)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │  Redis Lock Acquisition       │
                        │  Key: company_journey_{company│
                        │  Purpose: Prevent concurrent  │
                        │  updates to same company      │
                        └───────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA VALIDATION & FILTERING                        │
│                                                                                 │
│  Check if company should be processed:                                          │
│  ├── Company exists in database                                                 │
│  ├── Status != "LEAD" (must be SIGNUP or beyond)                                │
│  ├── signupTimestamp is not null                                                │
│  ├── numOfEmployeesRange is not null                                            │
│  └── Message has company attribute                                              │
│                                                                                 │
│  If any check fails → Skip processing                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MANAGER ASSIGNMENT LOGIC                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ Step 1:           │ │ Step 2:           │ │ Step 3:           │
        │ Assign Sales      │ │ Assign CS         │ │ Assign Overall    │
        │ Account Manager   │ │ Account Manager   │ │ Account Manager   │
        │ (COMMENTED OUT)   │ │ & CS Stage        │ │                   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
                                        │                   
                                        ▼                   
            ┌────────────────────────────────────────────────┐
            │  CS STAGE DETERMINATION LOGIC                  │
            │  (Priority Order - First match wins)           │
            └────────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ 1. CHURN +      │         │ 2. STAGE LOCKED │         │ 3. SBP PLAN     │
│    CS EXISTS    │         │    (Manual)     │         │                 │
│                 │         │                 │         │ Plan ID:        │
│ Condition:      │         │ Condition:      │         │ "connecteam_    │
│ - planId =      │         │ - cs_stage_lock_│         │  free_small_    │
│   "churn"       │         │   expiration_   │         │  business"      │
│ - CS Manager    │         │   date is set   │         │                 │
│   is set        │         │ - Lock not      │         │ Result:         │
│                 │         │   expired       │         │ CS Stage =      │
│ Result:         │         │                 │         │ "cs_sbp"        │
│ NO CHANGE       │         │ Result:         │         │                 │
│ (Keep existing  │         │ Use locked      │         │ Assign to CS    │
│  CS manager)    │         │ cs_stage,       │         │ SBP team        │
│                 │         │ reassign CS if  │         │                 │
│                 │         │ needed          │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 4. TRIAL/DEMO/FREE (Sales)  │                 │
        │               │                             │                 │
        │               │ Plan ID: trial, demo, free  │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_sales"       │                 │
        │               │ (Leave to sales team)       │                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 5. NO-TOUCH COMPANY         │                 │
        │               │                             │                 │
        │               │ Condition:                  │                 │
        │               │ - ARR Range = "1-2000"      │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_no_touch"    │                 │
        │               │                             │                 │
        │               │ Assign to CS No-Touch team  │                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 6. SUBJECTIVELY ONBOARDED   │                 │
        │               │    (From HubSpot)           │                 │
        │               │                             │                 │
        │               │ Condition:                  │                 │
        │               │ - HubSpot property          │                 │
        │               │   "is_subjectively_         │                 │
        │               │    onboarded_" = Yes/No     │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_success"     │                 │
        │               │                             │                 │
        │               │ Assign to CS Success team   │                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 7. CS SUCCESS (Auto)        │                 │
        │               │                             │                 │
        │               │ Conditions:                 │                 │
        │               │ - ARR Range = "2001-8000"   │                 │
        │               │ - Paying for > 90 days      │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_success"     │                 │
        │               │                             │                 │
        │               │ Assign to CS Success team   │                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 8. CS ONBOARDING            │                 │
        │               │                             │                 │
        │               │ Condition:                  │                 │
        │               │ - Paying (any duration)     │                 │
        │               │ - Not matching other stages │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_onboarding"  │                 │
        │               │                             │                 │
        │               │ Assign to CS Onboarding team│                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        │                               ▼                               │
        │               ┌─────────────────────────────┐                 │
        │               │ 9. ERROR (Fallback)         │                 │
        │               │                             │                 │
        │               │ If no other rule matched    │                 │
        │               │                             │                 │
        │               │ Result:                     │                 │
        │               │ CS Stage = "cs_error"       │                 │
        │               │                             │                 │
        │               │ Requires manual review      │                 │
        │               └─────────────────────────────┘                 │
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      CS MANAGER ASSIGNMENT LOGIC                                │
│                                                                                 │
│  Inputs:                                                                        │
│  ├── Region (derived from company.country)                                      │
│  ├── CS Stage (determined above)                                                │
│  ├── ARR Range (from company_profile_arr_range table)                           │
│  └── Number of Employees Range                                                  │
│                                                                                 │
│  Logic:                                                                         │
│  1. Check if CS Manager is manually locked:                                     │
│     └── If locked → Keep existing CS Manager, DO NOT CHANGE                     │
│                                                                                 │
│  2. Check if current CS Manager is in correct bucket:                           │
│     ├── Bucket = (department=customer_success, cs_stage, region, arr_range)     │
│     └── If in correct bucket → Keep existing CS Manager                         │
│                                                                                 │
│  3. Check history for matching CS Manager:                                      │
│     ├── Query company_change_log for previous CS Managers                       │
│     ├── Filter by: correct bucket + lead_intake > 0                             │
│     └── If found → Reassign to historical CS Manager                            │
│                                                                                 │
│  4. Assign new CS Manager (Round-Robin):                                        │
│     ├── Call ManagerAssigningLogic.get_next_username()                          │
│     ├── Filters: department, cs_stage, region, arr_range                        │
│     ├── Returns CS Manager with lowest current assignments                      │
│     └── Assign to company                                                       │
│                                                                                 │
│  Dependencies:                                                                  │
│  - ManagerAssigningLogic (from manager_assignment_logic.py)                     │
│  - User/team configuration from database                                        │
│  - Lead intake rules per CS Manager                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      OVERALL ACCOUNT MANAGER ASSIGNMENT                         │
│                                                                                 │
│  Logic:                                                                         │
│  - If company should_be_under_cs():                                             │
│    ├── Conditions:                                                              │
│    │   ├── Status = "PAID"                                                      │
│    │   └── OR planId not in ["trial", "demo", "free",                           │
│    │                          "connecteam_free_small_business"]                 │
│    └── Result: account_manager = customerSuccessManager                         │
│                                                                                 │
│  - Otherwise:                                                                   │
│    └── Result: account_manager = salesAccountManager                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE UPDATES (MySQL)                                │
│                                                                                 │
│  Table: bi.company_profile_meta_data                                            │
│  Updates:                                                                       │
│  ├── salesAccountManager (if changed)                                           │
│  ├── customerSuccessManager (if changed)                                        │
│  ├── cs_stage (if changed)                                                      │
│  └── account_manager (if changed)                                               │
│                                                                                 │
│  Table: bi.company_change_log                                                   │
│  Inserts (Audit Trail):                                                         │
│  ├── Change record for salesAccountManager                                      │
│  ├── Change record for customerSuccessManager                                   │
│  ├── Change record for cs_stage                                                 │
│  └── Change record for account_manager                                          │
│                                                                                 │
│  Transaction:                                                                   │
│  - All changes committed together                                               │
│  - Rollback on error                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────┐
                    │  Has anything changed?            │
                    │  (salesAccountManager, CS Manager,│
                    │   cs_stage, account_manager)      │
                    └───────────────────────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                            ▼ YES                   ▼ NO
            ┌───────────────────────────┐   ┌────────────────┐
            │  Publish Event            │   │  End (No event)│
            │                           │   └────────────────┘
            │  Topic:                   │
            │  company_journey_changed  │
            │                           │
            │  Message:                 │
            │  CompanyJourneyChanged    │
            │  Model(company=company)   │
            └───────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PUB/SUB TOPIC: company_journey_changed                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ HubSpot Company   │ │ Intercom Events   │ │ Other Potential   │
        │ Property Updater  │ │ Runner            │ │ Subscribers       │
        │                   │ │                   │ │                   │
        │ File: matrix/     │ │ File: matrix/     │ │                   │
        │ worker/           │ │ worker/           │ │                   │
        │ subscribers/      │ │ subscribers/      │ │                   │
        │ hubspot/company_  │ │ intercom_events/  │ │                   │
        │ updater/property_ │ │ intercom_events_  │ │                   │
        │ groups/company_   │ │ sub.py            │ │                   │
        │ managers_hubspot_ │ │                   │ │                   │
        │ property_manager  │ │ Queue:            │ │                   │
        │ .py               │ │ matrix.updated_   │ │                   │
        │                   │ │ data_events.      │ │                   │
        │ Purpose:          │ │ intercom          │ │                   │
        │ - Update HubSpot  │ │                   │ │                   │
        │   company         │ │ Purpose:          │ │                   │
        │   properties:     │ │ - Sync company    │ │                   │
        │   * salesAccount  │ │   data to Intercom│ │                   │
        │     Manager       │ │ - Update company  │ │                   │
        │   * customerSucces│ │   attributes      │ │                   │
        │     sManager      │ │ - Upsert company  │ │                   │
        │   * account_      │ │   in batches      │ │                   │
        │     manager       │ │   (100 at a time) │ │                   │
        │   * cs_stage      │ │                   │ │                   │
        │   * hubspot_owner │ │                   │ │                   │
        │     _id (mapped   │ │                   │ │                   │
        │     from account_ │ │                   │ │                   │
        │     manager)      │ │                   │ │                   │
        │                   │ │                   │ │                   │
        │ Logic:            │ │                   │ │                   │
        │ - Maps Matrix     │ │                   │ │                   │
        │   usernames to    │ │                   │ │                   │
        │   HubSpot User IDs│ │                   │ │                   │
        │ - Updates HubSpot │ │                   │ │                   │
        │   owner field     │ │                   │ │                   │
        │ - Creates options │ │                   │ │                   │
        │   for dropdowns   │ │                   │ │                   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ HubSpot API       │ │ Intercom API      │ │ Other Systems     │
        │                   │ │                   │ │                   │
        │ Properties        │ │ Company           │ │                   │
        │ Updated:          │ │ Attributes:       │ │                   │
        │ - salesAccount    │ │ - All company     │ │                   │
        │   Manager         │ │   metadata        │ │                   │
        │ - customerSuccess │ │ - Manager info    │ │                   │
        │   Manager         │ │ - CS stage        │ │                   │
        │ - account_manager │ │ - Journey data    │ │                   │
        │ - cs_stage        │ │                   │ │                   │
        │ - hubspot_owner_id│ │                   │ │                   │
        │   (for assignment)│ │                   │ │                   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## Key Data Points

### Timing
- **Event-Driven:** Triggered by Pub/Sub messages (not scheduled)
- **Real-time Processing:** Immediate response to company state changes
- **Lock Duration:** Redis lock held for duration of processing (typically < 1 second)

### CS Stages (Priority Order)
1. **cs_sales** - Trial/Demo/Free plans (handled by Sales team)
2. **cs_sbp** - Small Business Plan (free_small_business)
3. **cs_no_touch** - ARR Range 1-2000 (automated/minimal touch)
4. **cs_onboarding** - Paying < 90 days (onboarding phase)
5. **cs_success** - ARR 2001-8000 AND paying > 90 days, OR subjectively onboarded
6. **cs_error** - Fallback when no rule matches (needs review)

### ARR Ranges
- **1-2000** → cs_no_touch
- **2001-8000** → cs_success (if paying > 90 days)
- **8001+** → cs_onboarding or cs_success

### Region Mapping
- Derived from `company.country` using `get_region_by_country()` logic
- Used for manager assignment (region-specific teams)

### Manager Assignment Logic
Uses **ManagerAssigningLogic** class:
- Round-robin assignment within filtered buckets
- Respects `lead_intake` settings (0 = no new leads)
- Prefers historical CS Manager if still in correct bucket
- Filters by: department, team/stage, region, ARR range

---

## Critical Dependencies

### Input Events (5 Trigger Topics)
1. **company_state_update_event**
   - From: CompanyProfileMetaDataRunner (company metadata changes)
   - From: TablesUpdateRunner (manual data sync)

2. **company_arr_range_changed**
   - From: CompanyArrRangeRunner (subscription MRR changes)

3. **non_active_company_event**
   - From: LeadscoreEmptyDays (periodic check for inactive companies)

4. **cs_manager_lock_expiration**
   - From: Scheduled events when manual CS Manager lock expires

5. **cs_stage_lock_expiration**
   - From: Scheduled events when manual CS Stage lock expires

### Output Event (1 Publish Topic)
- **company_journey_changed**
  - To: CompanyJourneyHubspotPropertyManager (HubSpot sync)
  - To: IntercomEventsRunner (Intercom sync)

### Database Tables
**Read:**
- `bi.company_profile_meta_data` - Company details, current managers
- `bi.company_profile_arr_range` - ARR range for assignment logic
- `bi.hubspot_company_property_value` - HubSpot properties (subjectively_onboarded)
- `bi.company_change_log` - Historical manager assignments

**Write:**
- `bi.company_profile_meta_data` - Update manager fields
- `bi.company_change_log` - Audit trail of changes

---

## Data Quality Considerations

### Current State
- ✅ Redis locks prevent concurrent updates
- ✅ Comprehensive audit trail (company_change_log)
- ✅ Manual lock override capability (UI-driven)
- ✅ Historical CS Manager preference (sticky assignments)
- ✅ Filters out LEAD status companies
- ❌ No validation on manager assignments
- ❌ No Pydantic DTOs for message validation
- ❌ Minimal error handling for edge cases
- ❌ No metrics for assignment failures

### Edge Cases Handled
1. **Churn with CS Manager** - Preserves existing CS Manager
2. **Manual Locks** - Respects both CS Manager and CS Stage locks
3. **Missing Data** - Skips companies with null required fields
4. **Historical Preference** - Attempts to reassign previous CS Manager if still valid
5. **Round-Robin Fairness** - Distributes leads evenly across team members

### Known Limitations
1. **Sales Account Manager logic commented out** - Only CS assignment is active
2. **ARR Range dependency** - Defaults to "1-2000" if missing
3. **Region mapping** - Requires valid country code
4. **Manual override required** - cs_error stage needs manual intervention

---

## Business Logic Flow Summary

```
Trigger Event
    ↓
Filter (LEAD status, null checks)
    ↓
Acquire Redis Lock
    ↓
Determine CS Stage (9 priority rules)
    ↓
Assign CS Manager (bucket + round-robin)
    ↓
Assign Account Manager (CS or Sales)
    ↓
Update Database (metadata + audit log)
    ↓
Publish company_journey_changed (if changed)
    ↓
Sync to HubSpot & Intercom
```

---

## Monitoring & Observability

### Key Metrics to Track
- Assignment success rate by stage
- CS Manager distribution (balance across team)
- Lock contention rate (Redis lock waits)
- cs_error stage count (manual review queue)
- Historical CS Manager match rate
- Processing time per company

### Critical Alerts
- High cs_error stage rate
- Unbalanced CS Manager assignments
- Redis lock timeouts
- Missing ARR range data
- HubSpot/Intercom sync failures


