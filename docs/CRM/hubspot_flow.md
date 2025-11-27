# HubSpot Integration Flow Diagram

**Created:** 2025-11-27  
**Purpose:** Document the complete HubSpot integration including Push Flow (Matrix → HubSpot), Pull Flow (HubSpot → Matrix), and Scheduled Jobs (Sync, DQA, Monitoring)

---

## Table of Contents

1. [Push Flow (Matrix → HubSpot)](#1-push-flow-matrix--hubspot)
2. [Pull Flow (HubSpot → Matrix)](#2-pull-flow-hubspot--matrix)
3. [Scheduled Jobs Flow](#3-scheduled-jobs-flow)
4. [Database Tables Summary](#4-database-tables-summary)
5. [Data Quality & Monitoring](#5-data-quality--monitoring)

---

## 1. Push Flow (Matrix → HubSpot)

**Purpose:** Sync company, contact, and user data from Matrix to HubSpot via event-driven workers and aggregators.

### ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRIGGER EVENTS (Pub/Sub)                              │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ company_metadata_   │ payment_events      │ attribution_updated                 │
│ changed             │                     │                                     │
├─────────────────────┼─────────────────────┼─────────────────────────────────────┤
│ company_usage_      │ contact_state_      │ user_bi_data_updated                │
│ changed             │ updated             │                                     │
├─────────────────────┼─────────────────────┼─────────────────────────────────────┤
│ hubspot_create_     │ jira_events_        │ feature_feedback_                   │
│ payment_request_form│ webhook             │ to_hubspot                          │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AGGREGATION LAYER                                       │
├─────────────────────────────────────────┬───────────────────────────────────────┤
│ HubspotCompanyAggregatorWorker          │ HubspotUserUsageAggregatorWorker      │
│                                         │                                       │
│ Queue: matrix.hubspot_company_aggregator│ Queue: matrix.hubspot_user_usage_     │
│ Schedule: Every 5 minutes               │        aggregator                     │
│ Risk: P1                                │ Schedule: Every 5 minutes             │
│                                         │ Risk: P1                              │
│ Purpose:                                │                                       │
│ - Aggregates company changes            │ Purpose:                              │
│ - Deduplicates rapid updates            │ - Aggregates user usage data          │
│ - Schedules batch sync                  │ - Optimizes API calls                 │
└─────────────────────────────────────────┴───────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PUSH WORKERS (10)                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ HubspotCompany      │ HubspotContact      │ HubspotUserUsageRunner              │
│ Updater             │ ProfileUpdater      │                                     │
│                     │                     │                                     │
│ Queue: matrix.      │ Queue: matrix.      │ Queue: matrix.updated_user_         │
│ hubspot_company_    │ hubspot_contact_    │ usage_events.hubspot                │
│ updater_new         │ profile_updater     │                                     │
│                     │                     │                                     │
│ Risk: P0 - CRITICAL │ Risk: P1            │ Risk: P1                            │
│                     │                     │                                     │
│ 20 Property Managers│ Real-time contact   │ User usage data sync                │
│ Batch API calls     │ attribution, ratings│                                     │
│                     │ heartbeats          │                                     │
├─────────────────────┼─────────────────────┼─────────────────────────────────────┤
│ HubspotEventsRunner │ HubspotUserBiData   │ HubspotContactBiDataSub             │
│                     │ Sub                 │                                     │
│ Queue: matrix.      │                     │                                     │
│ updated_data_       │ Queue: matrix.      │ Queue: matrix.hubspot.              │
│ events.hubspot      │ hubspot.user_bi_data│ contact_bi_data                     │
│                     │                     │                                     │
│ Risk: P1            │ Risk: P2            │ Risk: P2                            │
│                     │                     │                                     │
│ Company/user events │ User BI data from   │ Contact BI data from analysts       │
│ workflows, emails   │ analysts            │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SPECIAL PURPOSE WORKERS                                 │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ PaymentFormCreatorWorker              │ JiraHubspotIntegrationWorker            │
│                                       │                                         │
│ Queue: matrix.hubspot_create_payment_ │ Queue: matrix.jira_hubspot_events       │
│        request_form                   │                                         │
│                                       │                                         │
│ Risk: P1                              │ Risk: P1                                │
│ Trigger: On event                     │ Trigger: On Jira webhook event          │
│                                       │                                         │
│ Purpose:                              │ Purpose:                                │
│ - Creates payment request forms       │ - Syncs Jira bugs to HubSpot            │
│ - Generates HubSpot payment links     │ - Creates/updates custom objects        │
│                                       │ - Updates jira_company_issue table      │
│                                       │                                         │
│ API: HubSpot Forms API                │ API: HubSpot Custom Objects API         │
└───────────────────────────────────────┴─────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      20 PROPERTY MANAGERS                                       │
│                                                                                 │
│  Used by HubspotCompanyUpdater to organize property updates by domain           │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ Company Data        │ Attribution         │ Financial                           │
│ ─────────────────── │ ─────────────────── │ ───────────────────                 │
│ CompanyMetaData     │ CompanyAttribution  │ CompanyPaymentsStatus               │
│ CompanyJourney      │ CompanyAttribution  │ CompanyDiscountStatus               │
│ CompanyUsage        │   Last              │ CompanyArrRange                     │
│ CompanyOpenHubs     │ CompanyData         │                                     │
│ CompanyProduct      │   FromAnalysts      │                                     │
│   Links             │                     │                                     │
├─────────────────────┼─────────────────────┼─────────────────────────────────────┤
│ Analytics           │ Lifecycle           │ Technical                           │
│ ─────────────────── │ ─────────────────── │ ───────────────────                 │
│ CompanyBiData       │ CompanyChurnFlow    │ ProductIntegrations                 │
│   Hourly            │   Data              │ SoftwareStack                       │
│ CompanyUserRating   │ CompanyTrial        │ CompanyProperty                     │
│   Summary           │   Extension         │   Value                             │
│ DsCompanyData       │ CompanyLatestDelete │                                     │
│                     │   FlowData          │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HUBSPOT API                                        │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ Companies API       │ Contacts API        │ Custom Objects API                  │
│                     │                     │                                     │
│ PATCH /crm/v3/      │ PATCH /crm/v3/      │ POST /crm/v3/objects/               │
│ objects/companies/  │ objects/contacts/   │ {customObjectType}                  │
│ batch/update        │ batch/update        │                                     │
│                     │                     │ For: Bug objects from Jira          │
├─────────────────────┴─────────────────────┴─────────────────────────────────────┤
│ Payment Forms API                                                               │
│                                                                                 │
│ POST /marketing/v3/forms/                                                       │
│ For: Payment request form creation                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Event Sources (12)

| Topic                                 | Publisher                    | Description                     |
|---------------------------------------|------------------------------|---------------------------------|
| `company_metadata_changed`            | CompanyProfileMetaDataRunner | Company metadata updates        |
| `new_subscription_event`              | PaymentRunner                | Payment/subscription events     |
| `company_attribution_updated`         | ClientAttributionRunner      | Attribution changes             |
| `company_usage_changed`               | Various                      | Usage metrics changes           |
| `contact_state_updated`               | ContactStateRunner           | Contact state changes           |
| `engagement_event`                    | EngagementLogic              | Engagement events               |
| `feature_feedback_to_hubspot`         | FeatureFeedbackRunner        | Feature feedback                |
| `user_bi_data_updated`                | BI Analytics                 | User BI data updates            |
| `contact_bi_data_updated`             | BI Analytics                 | Contact BI data updates         |
| `updated_user_usage_event`            | UserUsageRunner              | User usage updates              |
| `hubspot_create_payment_request_form` | PaymentRequestHandler        | Payment form creation request   |
| `jira_events_webhook`                 | Jira Webhooks                | Jira bug creation/update events |

### Database Tables

**Read:**
- `company_profile_meta_data` - Company details, status, managers
- `company_profile_attribution` - First-touch attribution
- `company_profile_attribution_last` - Last-touch attribution
- `company_profile_arr_range` - ARR segmentation
- `company_profile_usage` - Usage metrics
- `contact_profile_metadata` - Contact information
- `contact_profile_attribution_first` - Contact attribution
- `user_profile` - User profiles
- `user_usage` - User usage data
- `user_bi_data` - User BI metrics
- `contact_bi_data` - Contact BI metrics
- `company_payments_status` - Payment status
- `company_current_discount` - Discount information

**Write:**
- `(HubSpot API) Company properties` - All 19 property managers
- `(HubSpot API) Contact properties` - Contact sync
- `(HubSpot API) Payment forms` - Payment request forms
- `(HubSpot API) Bug custom objects` - Jira bug sync
- `jira_company_issue` - Jira-HubSpot mapping

---

## 2. Pull Flow (HubSpot → Matrix)

**Purpose:** Receive webhooks from HubSpot and sync property changes, deals, and engagements back to Matrix.

### ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HUBSPOT WEBHOOKS                                      │
│                                                                                 │
│  Property Changes │ Association Changes │ Object Deletions │ Creation Events   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WEBHOOK ENDPOINTS (3)                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ /Hubspot/Webhooks/  │ /Hubspot/Webhooks/  │ /Hubspot/ContactWebhooks/           │
│ (Legacy)            │ General             │                                     │
│                     │                     │                                     │
│ Legacy endpoint for │ General endpoint    │ Contact-specific                    │
│ backward            │ for all object      │ webhook endpoint                    │
│ compatibility       │ types               │                                     │
│                     │                     │                                     │
│ ⚠️ P0 SECURITY GAP: │ ⚠️ P0 SECURITY GAP: │ ⚠️ P0 SECURITY GAP:                 │
│ No signature        │ No signature        │ No signature                        │
│ verification        │ verification        │ verification                        │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TOPIC ROUTING                                         │
│                                                                                 │
│  Pattern: hubspot_general_webhook.{object_type}.{event_type}                    │
│                                                                                 │
│  Examples:                                                                      │
│  - hubspot_general_webhook.company.propertyChange                               │
│  - hubspot_general_webhook.contact.creation                                     │
│  - hubspot_general_webhook.deal.associationChange                               │
│  - hubspot_general_webhook.object.deletion                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PULL WORKERS (4)                                     │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ HubspotCompany      │ HubspotContact      │ HubspotDealsRunner                  │
│ WebhookRunner       │ WebhookRunner       │                                     │
│                     │                     │                                     │
│ Queue: matrix.      │ Queue: matrix.      │ Queue: matrix.hubspot_deals_events  │
│ hubspot_company_    │ hubspot_contact_    │                                     │
│ webhook_events      │ webhook_events      │ Topics:                             │
│                     │                     │ - hubspot_general_webhook.deal.*    │
│ Topics:             │ Topics:             │ - hubspot_association_changed_      │
│ - hubspot_general_  │ - hubspot_general_  │   webhook.deal.*                    │
│   webhook.company.* │   webhook.contact.* │                                     │
│                     │                     │                                     │
│ Risk: P0 - CRITICAL │ Risk: P0 - CRITICAL │ Risk: P1                            │
├─────────────────────┴─────────────────────┴─────────────────────────────────────┤
│ HubspotCallWebhookRunner                                                        │
│                                                                                 │
│ Queue: matrix.hubspot_call_webhook_events                                       │
│ Topics: hubspot_general_webhook.object.deletion                                 │
│ Risk: P2                                                                        │
│                                                                                 │
│ Purpose: Handle call deletion events from HubSpot                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE WRITES                                       │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ hubspot_company_    │ hubspot_contact_    │ hubspot_deal_v2                     │
│ property_value      │ property_value_v2   │                                     │
│                     │                     │ hubspot_deal_association            │
│ hubspot_company_    │ company_profile_    │                                     │
│ property_with_      │ meta_data           │ call                                │
│ history_value       │                     │ (deletions)                         │
│                     │ company_change_log  │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
```

### Properties Synced from HubSpot

| Category             | Properties                                                                                               |
|----------------------|----------------------------------------------------------------------------------------------------------|
| **Sales Management** | salesAccountManager, customerSuccessManager, chanceToClose, salesQualified, salesStatus, salesNextAction |
| **CS Notes**         | csNotes, csWhatWasDone, churnNotes, churnReason                                                          |
| **Scoring**          | chanceToImplement, chanceToUpgrade, chanceToChurn                                                        |
| **Status**           | hasSubmittedAReview, targetPlanId, shouldDelete, stage, whiteLabel, healthStatus                         |
| **Timestamps**       | launchTimestamp, testRunTimestamp, trainingDone                                                          |
| **Integrations**     | isUsingSFTP, isUsingAPI                                                                                  |
| **Software Stack**   | payroll_method_type, payroll_provider_external, payroll_provider_peo, payroll_software                   |

### Event Types Processed

| Source          | Event                    | Description                          |
|-----------------|--------------------------|--------------------------------------|
| HubSpot Webhook | `company.propertyChange` | Company property modified in HubSpot |
| HubSpot Webhook | `company.creation`       | New company created in HubSpot       |
| HubSpot Webhook | `contact.propertyChange` | Contact property modified in HubSpot |
| HubSpot Webhook | `deal.propertyChange`    | Deal property modified               |
| HubSpot Webhook | `deal.associationChange` | Deal association added/removed       |
| HubSpot Webhook | `object.deletion`        | Object deleted in HubSpot            |

---

## 3. Scheduled Jobs Flow

**Purpose:** Timed/periodic jobs that sync data between Matrix and HubSpot, run DQA checks, and monitor system health.

### ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       SCHEDULED DATA SOURCES                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼

┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ 📥 PULL FROM HUBSPOT     │ │ 📤 PUSH TO HUBSPOT       │ │ ⚙️ INTERNAL PROCESSING   │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼

┌──────────────────────────────────────────────────────────────────────────────────┐
│                        ENGAGEMENT SYNC (Hourly)                                  │
├──────────────────────┬──────────────────────┬────────────────────────────────────┤
│ sync_hubspot_calls   │ hubspot_meetings     │ hubspot_email_engagements          │
│                      │                      │                                    │
│ Schedule: Every hour │ Schedule: Every hour │ Schedule: Every hour               │
│ Risk: P1             │ Risk: P1             │ Risk: P1                           │
│                      │                      │                                    │
│ Syncs call           │ Fetches meeting      │ Syncs email engagements            │
│ engagements          │ engagements from     │ from HubSpot                       │
│ from HubSpot         │ HubSpot API          │                                    │
│                      │                      │                                    │
│ Writes to:           │ Writes to:           │ Writes to:                         │
│ - call               │ - meeting            │ - email                            │
│ - hubspot_engagement │ - hubspot_engagement │ - hubspot_engagement               │
│   _association_v3    │   _association_v3    │   _association_v3                  │
│                      │                      │                                    │
│ Publishes:           │ Publishes:           │ Publishes:                         │
│ engagement_event     │ engagement_event     │ engagement_event                   │
└──────────────────────┴──────────────────────┴────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          EVENT SYNC (Hourly)                                     │
├──────────────────────────────────────────┬───────────────────────────────────────┤
│ hubspot_email_events                     │ hubspot_contact_list_membership_dag   │
│                                          │                                       │
│ Schedule: Every hour                     │ Schedule: Every hour (min 15)         │
│ Type: Cron                               │ Type: Airflow DAG                     │
│ Risk: P1                                 │ Risk: P2                              │
│                                          │                                       │
│ Syncs email events (opens, clicks)       │ Syncs marketing contact list          │
│ from HubSpot                             │ memberships                           │
│                                          │                                       │
│ Writes to: hubspot_email_events          │ Writes to: hubspot_contact_list_      │
│                                          │            membership                 │
└──────────────────────────────────────────┴───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY SYNC (Every 2 Hours)                              │
├──────────────────────┬──────────────────────┬────────────────────────────────────┤
│ sync_hubspot_deals   │ sync_hubspot_tickets │ sync_hubspot_company_bugs          │
│                      │                      │                                    │
│ Schedule: Every 2h   │ Schedule: Every 2h   │ Schedule: Every 2h                 │
│ Risk: P1             │ Risk: P1             │ Risk: P1                           │
│                      │                      │                                    │
│ Syncs deals from     │ Syncs tickets from   │ Syncs company bugs from            │
│ HubSpot              │ HubSpot              │ Monday.com → HubSpot               │
│                      │                      │                                    │
│ Writes to:           │ Writes to:           │ Direction: Push to HubSpot         │
│ - hubspot_deal_v2    │ - hubspot_ticket     │                                    │
│ - hubspot_deal_      │ - hubspot_ticket_    │ Updates HubSpot custom objects     │
│   association        │   association        │                                    │
│ - hubspot_deal_      │ - hubspot_ticket_    │                                    │
│   pipeline           │   pipeline           │                                    │
└──────────────────────┴──────────────────────┴────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         PERIODIC SYNC WORKERS                                    │
├──────────────────────────────────────────┬───────────────────────────────────────┤
│ HubspotPeriodicRunner                    │ hubspot_user_usage_dispatcher         │
│                                          │                                       │
│ Schedule: Every 60 min (12h cooldown)    │ Schedule: Every 15 min                │
│ Type: Worker                             │ Type: Cron                            │
│ Risk: P1                                 │ Risk: P1                              │
│                                          │                                       │
│ Syncs companies modified in last 12h     │ Dispatches user usage sync jobs       │
│ Catches missed real-time events          │                                       │
│                                          │ Publishes: user_usage_aggregated      │
│ Writes to: hubspot_sync                  │ topic                                 │
│ Publishes: company_usage_changed         │                                       │
├──────────────────────────────────────────┼───────────────────────────────────────┤
│ check_qualification_list_membership      │ daily_data_integrity_tasks            │
│                                          │                                       │
│ Schedule: Every hour                     │ Schedule: Daily 6:00                  │
│ Type: Cron                               │ Type: Cron                            │
│ Risk: P1                                 │ Risk: P1                              │
│                                          │                                       │
│ Checks contact qualification list        │ HubSpot contacts data integrity       │
│ membership for ChiliPiper routing        │ checks                                │
│                                          │                                       │
│ Publishes: chilipiper_qualification      │                                       │
└──────────────────────────────────────────┴───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            BACKFILL WORKER                                       │
│                                                                                  │
│  HubspotBackfillWorker                                                           │
│                                                                                  │
│  Trigger: On-demand via API: POST /hubspot/sync/                                 │
│  Type: Worker                                                                    │
│  Risk: P1                                                                        │
│                                                                                  │
│  Purpose: Bulk backfill triggered manually for data recovery                     │
│                                                                                  │
│  Operations:                                                                     │
│  - Company Backfill: Sync all company properties to HubSpot                      │
│  - Contact Backfill: Sync all contact properties to HubSpot                      │
│  - Field-Specific Backfill: Sync specific fields only                            │
│                                                                                  │
│  Writes to:                                                                      │
│  - hubspot_backfill                                                              │
│  - hubspot_backfill_task                                                         │
│                                                                                  │
│  Calls: HubSpot API (batch updates)                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         DAILY OPERATIONS                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ long_runs_cron                                                                   │
│                                                                                  │
│ Schedule: Daily 21:00                                                            │
│ Type: Cron                                                                       │
│ Risk: P1                                                                         │
│                                                                                  │
│ Purpose: Long-running sync operations including user associations                │
│                                                                                  │
│ Writes to: hubspot_sync                                                          │
│ Calls: HubSpot API                                                               │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    🚨 MONITORING & ALERTS (CRITICAL)                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ hubspot_dqa_timeliness                                                     │  │
│  │                                                                            │  │
│  │ Schedule: Every 5 minutes                                                  │  │
│  │ Risk: P0 - CRITICAL                                                        │  │
│  │                                                                            │  │
│  │ Purpose: Critical timeliness monitoring for HubSpot data quality           │  │
│  │                                                                            │  │
│  │ Checks:                                                                    │  │
│  │ - Data freshness thresholds                                                │  │
│  │ - Sync lag detection                                                       │  │
│  │ - Queue backlogs                                                           │  │
│  │                                                                            │  │
│  │ Writes to: hubspot_dqa_results                                             │  │
│  │ Alerts: Slack (#hubspot-alerts) if thresholds breached                     │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ hubspot_dqa_full                                                           │  │
│  │                                                                            │  │
│  │ Schedule: Every hour                                                       │  │
│  │ Risk: P1                                                                   │  │
│  │                                                                            │  │
│  │ Purpose: Full DQA test suite for HubSpot data quality                      │  │
│  │                                                                            │  │
│  │ Tests:                                                                     │  │
│  │ - Property value consistency                                               │  │
│  │ - Missing required fields                                                  │  │
│  │ - Data type validation                                                     │  │
│  │ - Cross-system reconciliation                                              │  │
│  │                                                                            │  │
│  │ Writes to: hubspot_dqa_results                                             │  │
│  │ Alerts: Slack if tests fail                                                │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ HubspotAlertsRunner                                                        │  │
│  │                                                                            │  │
│  │ Schedule: On event (rate limit detection)                                  │  │
│  │ Risk: P0 - CRITICAL                                                        │  │
│  │                                                                            │  │
│  │ Purpose: Monitor HubSpot API rate limits and errors                        │  │
│  │                                                                            │  │
│  │ Monitors:                                                                  │  │
│  │ - API rate limit headers                                                   │  │
│  │ - 429 responses                                                            │  │
│  │ - API error rates                                                          │  │
│  │                                                                            │  │
│  │ Writes to: hubspot_alerts                                                  │  │
│  │ Alerts: Slack if rate limits approaching or exceeded                       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Scheduled Jobs Summary Table

| Job Name                              | Schedule        | Type    | Risk  | Purpose                        |
|---------------------------------------|-----------------|---------|-------|--------------------------------|
| `hubspot_dqa_timeliness`              | Every 5 min     | Cron    | P0    | Critical timeliness monitoring |
| `HubspotAlertsRunner`                 | On event        | Worker  | P0    | Rate limit monitoring          |
| `sync_hubspot_calls`                  | Every hour      | Cron    | P1    | Sync call engagements          |
| `hubspot_meetings`                    | Every hour      | Cron    | P1    | Sync meeting engagements       |
| `hubspot_email_engagements`           | Every hour      | Cron    | P1    | Sync email engagements         |
| `hubspot_email_events`                | Every hour      | Cron    | P1    | Sync email opens/clicks        |
| `hubspot_dqa_full`                    | Every hour      | Cron    | P1    | Full DQA test suite            |
| `check_qualification_list_membership` | Every hour      | Cron    | P1    | ChiliPiper qualification check |
| `sync_hubspot_company_bugs`           | Every 2 hours   | Cron    | P1    | Monday.com → HubSpot bug sync  |
| `sync_hubspot_deals`                  | Every 2 hours   | Cron    | P1    | Sync deals from HubSpot        |
| `sync_hubspot_tickets`                | Every 2 hours   | Cron    | P1    | Sync tickets from HubSpot      |
| `HubspotPeriodicRunner`               | Every 60 min    | Worker  | P1    | Periodic company sync          |
| `hubspot_user_usage_dispatcher`       | Every 15 min    | Cron    | P1    | Dispatch user usage sync       |
| `long_runs_cron`                      | Daily 21:00     | Cron    | P1    | Long-running sync operations   |
| `daily_data_integrity_tasks`          | Daily 6:00      | Cron    | P1    | Contacts data integrity        |
| `HubspotBackfillWorker`               | On-demand       | Worker  | P1    | Bulk backfill via API          |
| `hubspot_contact_list_membership_dag` | Hourly (min 15) | Airflow | P2    | Contact list membership sync   |

---

## 4. Database Tables Summary

### Engagement Tables
| Table                               | Purpose                           | Writers                                      |
|-------------------------------------|-----------------------------------|----------------------------------------------|
| `call`                              | Call engagement records           | sync_hubspot_calls, HubspotCallWebhookRunner |
| `meeting`                           | Meeting engagement records        | hubspot_meetings                             |
| `email`                             | Email engagement records          | hubspot_email_engagements                    |
| `hubspot_engagement_association_v3` | Engagement-to-object associations | All engagement sync jobs                     |

### Entity Tables
| Table                             | Purpose                     | Writers                                |
|-----------------------------------|-----------------------------|----------------------------------------|
| `hubspot_deal_v2`                 | Deal records                | sync_hubspot_deals, HubspotDealsRunner |
| `hubspot_deal_association`        | Deal associations           | sync_hubspot_deals, HubspotDealsRunner |
| `hubspot_deal_pipeline`           | Deal pipeline definitions   | sync_hubspot_deals                     |
| `hubspot_ticket`                  | Ticket records              | sync_hubspot_tickets                   |
| `hubspot_ticket_association`      | Ticket associations         | sync_hubspot_tickets                   |
| `hubspot_ticket_pipeline`         | Ticket pipeline definitions | sync_hubspot_tickets                   |
| `hubspot_email_events`            | Email open/click events     | hubspot_email_events                   |
| `hubspot_contact_list_membership` | Contact list memberships    | hubspot_contact_list_membership_dag    |

### Property Tables
| Table                                         | Purpose                  | Writers                     |
|-----------------------------------------------|--------------------------|-----------------------------|
| `hubspot_company_property_value`              | Company property values  | HubspotCompanyWebhookRunner |
| `hubspot_company_property_with_history_value` | Company property history | HubspotCompanyWebhookRunner |
| `hubspot_contact_property_value_v2`           | Contact property values  | HubspotContactWebhookRunner |

### System Tables
| Table                   | Purpose                  | Writers                                  |
|-------------------------|--------------------------|------------------------------------------|
| `hubspot_sync`          | Sync status tracking     | HubspotPeriodicRunner, long_runs_cron    |
| `hubspot_backfill`      | Backfill job tracking    | HubspotBackfillWorker                    |
| `hubspot_backfill_task` | Backfill task tracking   | HubspotBackfillWorker                    |
| `hubspot_dqa_results`   | DQA test results         | hubspot_dqa_timeliness, hubspot_dqa_full |
| `hubspot_alerts`        | Alert history            | HubspotAlertsRunner                      |
| `jira_company_issue`    | Jira-HubSpot bug mapping | JiraHubspotIntegrationWorker             |

---

## 5. Data Quality & Monitoring

### Validation Gaps

#### P0 - Critical
| Gap                                          | Impact                         | Location                          |
|----------------------------------------------|--------------------------------|-----------------------------------|
| No webhook signature verification            | Fake webhooks can corrupt data | Pull Flow webhooks                |
| No property value validation before API call | Invalid data sent to HubSpot   | Push Flow - HubspotCompanyUpdater |
| No retry on partial batch failures           | Data loss on transient errors  | Push Flow - batch updates         |
| No automatic recovery when DQA tests fail    | Manual intervention required   | hubspot_dqa_* jobs                |

#### P1 - High
| Gap                                   | Impact                            | Location              |
|---------------------------------------|-----------------------------------|-----------------------|
| No HubSpot ID validation for contacts | Orphaned contact updates          | Push Flow             |
| No aggregation deduplication          | Duplicate API calls               | Aggregation Layer     |
| No rate limit handling validation     | API quota exhaustion              | All API calls         |
| No property value type validation     | Type mismatches                   | Pull Flow             |
| No company existence validation       | Updates to non-existent companies | Pull Flow             |
| No duplicate webhook detection        | Duplicate processing              | Pull Flow             |
| No sync completeness validation       | Missing data                      | Scheduled Jobs        |
| No meeting/email deduplication        | Duplicate records                 | Engagement sync       |
| No backfill batch size limits         | Memory issues                     | HubspotBackfillWorker |
| No retry logic for failed batches     | Data loss                         | All batch operations  |

#### P2 - Medium
| Gap                                    | Impact                    | Location       |
|----------------------------------------|---------------------------|----------------|
| No sync confirmation tracking          | Can't verify sync success | Push Flow      |
| No rate limiting on webhook processing | Queue overload            | Pull Flow      |
| No stale sync detection                | Stale data not caught     | Scheduled Jobs |

### DQA Test Categories

| Category         | Schedule    | Tests                                        |
|------------------|-------------|----------------------------------------------|
| **Timeliness**   | Every 5 min | Data freshness, sync lag, queue depth        |
| **Completeness** | Hourly      | Required fields present, cross-system counts |
| **Consistency**  | Hourly      | Property values match between systems        |
| **Accuracy**     | Hourly      | Data type validation, enum value checks      |

### Slack Alert Channels

| Channel           | Alert Type     | Triggers                    |
|-------------------|----------------|-----------------------------|
| `#hubspot-alerts` | Timeliness DQA | Sync lag > threshold        |
| `#hubspot-alerts` | Full DQA       | Test failures               |
| `#hubspot-alerts` | Rate Limits    | API quota > 80%             |
| `#hubspot-alerts` | Errors         | API errors, worker failures |

---

## Business Impact Summary

| Area                      | Impact                                                        | Risk Level  |
|---------------------------|---------------------------------------------------------------|-------------|
| **CRM Data Accuracy**     | Stale or incorrect data in HubSpot affects Sales/CS workflows | P0          |
| **Manager Assignment**    | Wrong manager data impacts customer handoffs                  | P0          |
| **Attribution Reporting** | Incorrect attribution affects marketing ROI analysis          | P1          |
| **Usage Insights**        | Missing usage data impacts CS prioritization                  | P1          |
| **Lead Scoring**          | Incorrect contact data affects lead qualification             | P1          |
| **Deal Pipeline**         | Deal sync ensures accurate revenue forecasting                | P1          |
| **Support Context**       | Ticket sync provides support history for CS/Sales             | P1          |
| **Email Insights**        | Email engagement data informs marketing effectiveness         | P1          |
| **Data Recovery**         | Backfill enables bulk data repair after issues                | P1          |
| **Rate Limit Management** | Alerts prevent API quota exhaustion                           | P0          |

---

## Monitoring & Observability

### Key Metrics to Track

**Push Flow:**
- Property update success rate
- API call latency (p50, p95, p99)
- Aggregator queue depth
- Batch size distribution

**Pull Flow:**
- Webhook processing latency
- Webhook volume per endpoint
- Property change rate
- Duplicate webhook rate

**Scheduled Jobs:**
- Job success/failure rate
- Sync completeness percentage
- Records synced per job
- Job duration trends

**DQA:**
- Test pass rate over time
- Time to alert (when issues detected)
- False positive rate
- Issue resolution time

### Critical Alerts

| Alert                  | Condition                 | Action                                  |
|------------------------|---------------------------|-----------------------------------------|
| DQA Timeliness Failed  | Any timeliness test fails | Investigate sync lag immediately        |
| Rate Limit Warning     | API quota > 80%           | Reduce batch sizes, stagger calls       |
| Rate Limit Critical    | API quota > 95%           | Pause non-critical syncs                |
| Push Worker Backlog    | Queue depth > 10,000      | Scale workers, check HubSpot API        |
| Webhook Processing Lag | Processing time > 5 min   | Scale workers, check for errors         |
| Batch Failure Rate     | > 5% failures             | Investigate API errors, validate data   |

