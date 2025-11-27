# Critical Path Mapping

> **Document Purpose**: This document provides a comprehensive overview of the critical data flows in the Matrix system, identifying key workers, their business impact, current validation status, and priority for remediation.

---

## Table of Contents

1. [Attribution Flow](#1-attribution-flow)
2. [Company Funnel Flow](#2-company-funnel-flow)
3. [Offline Conversions Flow](#3-offline-conversions-flow)
4. [Payments Processing Flow](#4-payments-processing-flow)
5. [HubSpot Integration Flows](#5-hubspot-integration-flows)
6. [Cross-Flow Dependencies](#6-cross-flow-dependencies)
7. [Summary & Recommendations](#7-summary--recommendations)

---

## 1. Attribution Flow

**Category**: Marketing  
**Description**: Complete marketing attribution flow from ad click through company and contact attribution. Tracks user journeys from ad platforms (Google, Facebook, Bing, LinkedIn) through website visits, session creation, and ultimately maps interactions to companies and contacts.

### Flow Overview

1. **User Journey Start**: Ad click from Google/Facebook/Bing/LinkedIn captures click IDs (gclid, fbclid, msclkid, etc.)
2. **Website Visit**: JavaScript tracking creates sessions with client_id and session_id
3. **Stage 1 - Session to Visit**: VisitsRunner converts sessions to visits, enriches with channel data
4. **Stage 2 - Interaction Touchpoint**: Creates normalized attribution records in `interaction_touchpoints`
5. **Stage 3 - Company Attribution**: ClientAttributionRunner maps client IDs to companies with recursive discovery (max 5 hops)
6. **Stage 4 - Contact Attribution**: ContactAttributionRunner connects emails to client IDs
7. **Stage 5 - Delayed Re-calc**: DelayedAttributionRunner re-runs attribution after 6 and 30 minute delays

### Attribution Models

- **First-Touch**: Oldest interaction (`company_profile_attribution`)
- **Last-Touch**: Newest interaction (`company_profile_attribution_last`)
- **First-Touch Limited**: 28-day window (`company_profile_attribution_first_limited`)

### Critical Worker Priority Matrix

| Worker                   | Business Impact                                                                                                    | Current Validation                                                            | Priority   |
|--------------------------|--------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|------------|
| ClientAttributionRunner  | Company-level attribution with recursive discovery; incorrect attribution leads to wrong marketing spend decisions | No validation of found touchpoints; no cycle detection in recursive discovery | P0         |
| ContactAttributionRunner | Contact-level attribution; connects email to client IDs for lead scoring                                           | No email format validation; no validation of touchpoint integrity             | P0         |
| VisitsRunner             | Converts sessions to visits; foundation for all downstream attribution                                             | No UUID validation for client_id/session_id; no channel enum validation       | P1         |
| LeadsRunner              | Processes form submissions; creates interaction touchpoints                                                        | No email hash collision detection                                             | P1         |
| MobileSignupsWorker      | Handles mobile app signups; publishes delayed_attribution_trigger                                                  | Limited validation of mobile event data                                       | P1         |
| DelayedAttributionRunner | Re-runs attribution after delays; ensures late-arriving data is processed                                          | No validation of stale data; no monitoring of success/failure rates           | P2         |

### Key Tables

- **Read**: sessions, user_profile, contact_profile_metadata, company_profile_meta_data, interaction_touchpoints, company_to_client_id, company_to_email, email_to_client_id
- **Write**: visits, interaction_touchpoints, company_interactions, contact_interactions, company_profile_attribution, contact_profile_attribution_first

---

## 2. Company Funnel Flow

**Category**: CRM  
**Description**: Automatic assignment of Sales and Customer Success managers based on company attributes. Determines CS stage based on plan type, ARR range, and company lifecycle, then assigns appropriate managers via round-robin logic.

### Flow Overview

1. **Trigger Sources**: Payment events, manual data sync, MRR changes, periodic tasks, lock expirations
2. **Queue Processing**: Events published to `matrix.company_journey_events`
3. **Runner Execution**: CompanyJourneyRunner processes with Redis lock (`company_journey_company`)
4. **Validation**: Company must have status != LEAD, signupTimestamp NOT NULL, numOfEmployeesRange NOT NULL
5. **CS Stage Determination**: Priority-based rules determine stage
6. **Manager Assignment**: Round-robin assignment from appropriate bucket
7. **Downstream Sync**: Changes published to HubSpot and Intercom

### CS Stages (Priority Order)

| Stage         | Description                              | ARR Range / Condition   |
|---------------|------------------------------------------|-------------------------|
| cs_sales      | Trial/Demo/Free plans (handled by Sales) | N/A                     |
| cs_sbp        | Small Business Plan                      | SBP plan                |
| cs_no_touch   | Automated/minimal touch                  | $1-2,000                |
| cs_onboarding | New paying customers                     | Paying < 90 days        |
| cs_success    | Established customers                    | $2,001-8,000 + >90 days |
| cs_error      | Requires manual review                   | Fallback                |

### Manager Assignment Logic

1. Check if CS Manager is manually locked → Keep existing
2. Check if current CS Manager is in correct bucket → Keep existing
3. Check history for matching CS Manager in correct bucket → Reassign
4. Round-robin assign new CS Manager from correct bucket

### Critical Worker Priority Matrix

| Worker                        | Business Impact                                                                                         | Current Validation                                                                                                     | Priority   |
|-------------------------------|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|------------|
| CompanyJourneyRunner          | Main worker for CS stage and manager assignment; incorrect assignment impacts customer success outcomes | No validation that cs_stage is valid enum; no validation that manager IDs exist; race condition risks beyond RedisLock | P0         |
| CompanyProfileMetaDataRunner  | Updates company metadata; triggers journey events; incorrect data cascades to all downstream processes  | No validation that ARR range matches actual ARR value                                                                  | P0         |
| CompanyArrRangeWorker         | Calculates ARR range from MRR for segmentation; wrong ARR range leads to wrong CS assignment            | No validation that ARR changes are reasonable (tier jumps)                                                             | P1         |
| HubspotCompanyWebhookRunner   | Syncs company data bidirectionally with HubSpot                                                         | No validation of manager bucket configuration                                                                          | P1         |

### Key Tables

- **Read**: company_profile_meta_data, company_profile_arr_range, hubspot_company_property_value, company_change_log, business_cases, user_profile
- **Write**: company_profile_meta_data, company_change_log

---

## 3. Offline Conversions Flow

**Category**: Marketing  
**Description**: Complete flow from Data Science model predictions to advertising platform APIs for offline conversion tracking. Syncs conversion probability scores from BigQuery to MySQL, then sends conversions to Google, Facebook, and Bing ad platforms.

### Flow Overview

1. **External DS Models**: ds_cp_predict, ds_acv_predict, ds_bad_day_all_predict run predictions
2. **Airflow DAG**: `bigquery_to_mysql_ds_data` (file: `bigquery_to_mysql_data_science_data.py`) syncs predictions hourly (minute 5)
3. **Sync Tasks**: ExternalTaskSensors wait for DS models, BigQueryToMySQL tasks sync data
4. **Contact Merge**: KubernetesOperator merges CP + ACV scores into contact_conversion_probability
5. **Conversion Workers**: Timed runners query MySQL and send conversions to ad platforms
6. **Deduplication**: Each platform checks audit tables before sending to prevent duplicates

### Processing Schedule

| Component            | Schedule               |
|----------------------|------------------------|
| Airflow Sync         | Every hour at minute 5 |
| Google Conversions   | Every 30 minutes       |
| Facebook Conversions | Every 60 minutes       |
| Bing Conversions     | Every 60 minutes       |

### Click Tracking Configuration

| Platform   | Channels     | Click IDs             | Date Range   |
|------------|--------------|-----------------------|--------------|
| Google     | cpc-google*  | gclid, wbraid, gbraid | Last 8 days  |
| Facebook   | cpc-facebook | fbclid, fbp           | Last 7 days  |
| Bing       | cpc-bing*    | msclkid               | Last 8 days  |

### Critical Worker Priority Matrix

| Worker                             | Business Impact                                                                        | Current Validation                                                      | Priority  |
|------------------------------------|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------|-----------|
| bigquery_to_mysql_ds_data (DAG)    | Syncs all DS predictions; failed sync means stale conversion data sent to ad platforms | No validation that wait tasks succeeded; no row count checks after sync | P0        |
| trigger_update_contact_predictions | Merges CP + ACV scores; incorrect merge corrupts contact-level predictions             | No validation that contact scores are merged correctly                  | P0        |
| GoogleConversionRunner             | Sends conversions to Google Ads API                                                    | No click ID format validation; no retry logic for transient failures    | P1        |
| FacebookConversionRunner           | Sends conversions to Facebook Conversion API; batch size 500                           | No Pydantic DTOs; minimal error handling in batch processing            | P1        |
| BingConversionRunner               | Sends conversions to Bing Ads API; no batching                                         | No metrics for failed conversions; no monitoring of data freshness      | P1        |

### Key Tables

- **MySQL Read**: company_conversion_probability, contact_conversion_probability, contact_cp_score, contact_acv_score, visits, company_interactions
- **MySQL Write**: google_conversion, facebook_conversion_v2, bing_conversion, generic_conversions
- **BigQuery Sources**: ct-dbt.stg.stg_ds_to_de_cp, ct-data-science-v2.cp.ds_cp_contact_table_score, ct-data-science-v2.acv.ds_acv_contact_table_score

---

## 4. Payments Processing Flow

**Category**: Payments  
**Description**: Complete payment processing architecture from Chargebee webhooks through MRR calculations to CRM sync. Processes subscription lifecycle events, calculates MRR with coupons and addons, and syncs payment status to downstream systems.

### Flow Overview

1. **Event Sources**: Chargebee webhooks (primary), Matrix Admin APIs, Product/Website actions
2. **Webhook Processing**: POST /bi/api/PaymentEvents/ creates PaymentEventModel
3. **Topic Publishing**: Events published to payments_webhook, generic_db_data, invoice_tracking
4. **Payment Workers**: Process subscriptions, transactions, discounts
5. **MRR Calculation**: Base plan + Addons - Discounts = Effective MRR
6. **Downstream Updates**: company_profile_meta_data, HubSpot sync, Canny sync

### Event Sources

| Source                       | Description                                                 | Flow Path                                          |
|------------------------------|-------------------------------------------------------------|----------------------------------------------------|
| Chargebee Webhooks           | Primary source - subscription lifecycle events              | Chargebee → Webhook → Matrix                       |
| Admin APIs (Plan/Payment)    | CS/Sales tools via PaymentRequestHandler, ChangePlanHandler | Admin → Product API → Chargebee → Webhook → Matrix |
| Admin APIs (Invoice/Billing) | OneTimeChargeHandler - DIRECT Chargebee call                | Admin → Chargebee DIRECTLY → Webhook → Matrix      |
| Product/Website              | User-initiated subscription changes                         | Product → Chargebee → Webhook → Matrix             |

### MRR Calculation Components

1. Base Plan MRR (adjusted for billing period)
2. Addon MRR (seats, ops, hr, comms bundles)
3. Discount MRR (coupons - fixed and percentage)
4. Sales Effective MRR (after free months)

**Coupon Application Order**:
1. Fixed amount to specific items
2. Percentage to specific items
3. Fixed amount to invoice total
4. Percentage to invoice total

### Critical Worker Priority Matrix

| Worker                       | Business Impact                                                                         | Current Validation                                              | Priority  |
|------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------|-----------|
| PaymentRunner                | Processes subscriptions, calculates MRR; incorrect MRR leads to wrong revenue reporting | No pre-validation of MRR calculations; no coupon validation     | P0        |
| TransactionPaymentRunner     | Processes payment_succeeded/refunded; calculates USD amounts for collections            | No amount validation (must be > 0); no exchange rate validation | P0        |
| CompanyProfileMetaDataRunner | Updates company currentMrr, effective_mrr                                               | No MRR field validation before DB write; no >= 0 constraint     | P0        |
| Webhook Endpoint             | Receives Chargebee webhooks at POST /bi/api/PaymentEvents/                              | **CRITICAL: No webhook signature verification**                 | P0        |
| CompanyPaymentsStatusWorker  | Tracks payment status for HubSpot sync                                                  | No enum validation for status/context                           | P1        |
| InvoiceTrackingWorker        | Tracks invoice lifecycle events                                                         | No validation of invoice data integrity                         | P1        |
| CompanyDiscountStatusWorker  | Tracks discount status from payments                                                    | No validation of discount term logic                            | P1        |

### Business Impact Summary

| Priority  | Impact                                                                                                                                                                                                         |
|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P0        | Security: Fake payment events can corrupt revenue data; Negative MRR leads to underreported revenue; Missing subscription events means lost revenue tracking; Incorrect exchange rates cause wrong USD revenue |
| P1        | Invalid MRR synced to HubSpot affects sales targets; Invalid ARR ranges cause wrong CS assignment; Invalid payment status leads to incorrect CS follow-ups                                                     |

### Key Tables

- **Read**: payment_events, company_profile_meta_data
- **Write**: payment_events, subscription_events, transaction_payments, chargebee_invoices, company_payments_status, company_profile_meta_data, company_current_discount

---

## 5. HubSpot Integration Flows

**Category**: CRM  
**Description**: Bidirectional data sync between Matrix and HubSpot CRM. Consists of three sub-flows: Push (Matrix → HubSpot), Pull (HubSpot → Matrix), and Scheduled Jobs (periodic sync, monitoring, and backfill operations).

### 5.1 HubSpot Push Flow (Matrix → HubSpot)

Syncs company, contact, and user data from Matrix to HubSpot via event-driven workers and aggregators. Processes internal Matrix events and pushes property updates to HubSpot API in batches.

#### Flow Overview

1. **Trigger Events**: company_metadata_changed, payment_events, attribution_updated, company_usage_changed
2. **Aggregation Layer**: HubspotCompanyAggregatorWorker and HubspotUserUsageAggregatorWorker batch events (5 min)
3. **Property Managers**: 19 specialized managers transform data for specific HubSpot properties
4. **Push Workers**: HubspotCompanyUpdater, HubspotContactProfileUpdater, HubspotUserUsageRunner, HubspotEventsRunner
5. **BI Data Workers**: HubspotUserBiDataSub, HubspotContactBiDataSub for analyst data
6. **Jira Integration**: JiraHubspotIntegrationWorker syncs Jira bugs to HubSpot custom objects

#### Property Managers (19 Total)

| Manager                                      | Data Synced                              |
|----------------------------------------------|------------------------------------------|
| CompanyMetaDataHubspotPropertyManager        | Company metadata fields                  |
| CompanyJourneyHubspotPropertyManager         | CS manager, sales manager assignments    |
| CompanyAttributionHubspotPropertyManager     | First-touch attribution                  |
| CompanyAttributionLastHubspotPropertyManager | Last-touch attribution                   |
| CompanyArrRangeHubspotPropertyManager        | ARR range segmentation                   |
| CompanyUsageHubspotPropertyManager           | Usage metrics                            |
| CompanyPaymentsStatusHubspotPropertyManager  | Payment status                           |
| CompanyDiscountStatusHubspotPropertyManager  | Discount status                          |
| + 11 more...                                 | BI data, churn flow, product links, etc. |

#### Critical Worker Priority Matrix (Push)

| Worker                         | Business Impact                                                                            | Current Validation                           | Priority   |
|--------------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------|------------|
| HubspotCompanyUpdater          | Bulk updates companies via 19 property managers; incorrect data affects Sales/CS workflows | No property value validation before API call | P0         |
| HubspotCompanyAggregatorWorker | Aggregates company changes; missed events mean stale HubSpot data                          | No retry on partial batch failures           | P0         |
| HubspotContactProfileUpdater   | Contact attribution, ratings, heartbeats, feature feedback                                 | No HubSpot ID validation for contacts        | P1         |
| HubspotUserUsageRunner         | User usage data sync                                                                       | No aggregation deduplication                 | P1         |
| HubspotEventsRunner            | Company/user events, workflows, emails                                                     | No rate limit handling validation            | P1         |
| PaymentFormCreatorWorker       | Creates payment request forms in HubSpot                                                   | No sync confirmation tracking                | P2         |

### 5.2 HubSpot Pull Flow (HubSpot → Matrix)

Receives webhooks from HubSpot and syncs property changes, deals, and engagements back to Matrix. Processes company/contact property changes, deal associations, and object deletions.

#### Flow Overview

1. **Webhook Sources**: HubSpot sends webhooks for property changes, associations, deletions
2. **Webhook Endpoints**: /Hubspot/Webhooks/ (Legacy), /Hubspot/Webhooks/General, /Hubspot/ContactWebhooks/
3. **Topic Routing**: Events routed via hubspot_general_webhook.{object_type}.{event_type}
4. **Pull Workers**: Process specific object types and update Matrix tables

#### Webhook Endpoints

| Endpoint                  | Type    | Description                                   |
|---------------------------|---------|-----------------------------------------------|
| /Hubspot/Webhooks/        | Legacy  | Legacy webhook endpoint                       |
| /Hubspot/Webhooks/General | General | General webhook endpoint for all object types |
| /Hubspot/ContactWebhooks/ | Contact | Contact-specific webhook endpoint             |

#### Critical Worker Priority Matrix (Pull)

| Worker                      | Business Impact                                                                | Current Validation                     | Priority  |
|-----------------------------|--------------------------------------------------------------------------------|----------------------------------------|-----------|
| HubspotCompanyWebhookRunner | Company property changes from HubSpot; stale data affects downstream workflows | No validation of property value types  | P0        |
| HubspotContactWebhookRunner | Contact property changes from HubSpot                                          | No contact ID validation               | P0        |
| HubspotDealsRunner          | Deal events and associations                                                   | No association validation              | P1        |
| HubspotCallWebhookRunner    | Call deletion events                                                           | No rate limiting on webhook processing | P2        |

### 5.3 HubSpot Scheduled Jobs Flow

Timed/periodic jobs that sync data between Matrix and HubSpot on a schedule. Includes periodic company sync, engagement sync, contact list membership sync, DQA monitoring, and on-demand backfill operations.

#### Scheduled Jobs Overview

| Job                                 | Schedule        | Direction  | Description                                |
|-------------------------------------|-----------------|------------|--------------------------------------------|
| sync_hubspot_calls                  | Hourly          | PULL       | Sync call engagements from HubSpot         |
| hubspot_meetings                    | Hourly          | PULL       | Sync meeting engagements from HubSpot      |
| hubspot_email_engagements           | Hourly          | PULL       | Sync email engagements from HubSpot        |
| hubspot_email_events                | Hourly          | PULL       | Sync email events (opens, clicks, bounces) |
| sync_hubspot_deals                  | Every 2 hours   | PULL       | Sync deals and pipelines                   |
| sync_hubspot_tickets                | Every 2 hours   | PULL       | Sync tickets and pipelines                 |
| sync_hubspot_company_bugs           | Every 2 hours   | PUSH       | Sync Monday.com bugs to HubSpot            |
| hubspot_user_usage_dispatcher       | Every 15 min    | INTERNAL   | Dispatch user usage aggregation            |
| check_qualification_list_membership | Hourly          | INTERNAL   | Check qualification list membership        |
| hubspot_dqa_timeliness              | Every 5 min     | INTERNAL   | **CRITICAL** - Timeliness monitoring       |
| hubspot_dqa_full                    | Hourly          | INTERNAL   | Full data quality assessment               |
| HubspotAlertsRunner                 | On event        | INTERNAL   | Rate limit monitoring and alerting         |
| long_runs_cron                      | Daily 21:00     | PUSH       | User-company associations sync             |
| daily_data_integrity_tasks          | Daily 6:00      | INTERNAL   | Data integrity validation                  |
| HubspotPeriodicRunner               | 60 min cooldown | INTERNAL   | Periodic company sync                      |
| HubspotBackfillWorker               | On-demand       | PUSH       | Bulk data backfill to HubSpot              |
| hubspot_contact_list_membership_dag | Hourly          | PULL       | Sync contact list memberships              |

#### Critical Worker Priority Matrix (Scheduled)

| Worker                 | Business Impact                                                 | Current Validation                        | Priority  |
|------------------------|-----------------------------------------------------------------|-------------------------------------------|-----------|
| hubspot_dqa_timeliness | Detects sync delays; missed alerts cause stale HubSpot data     | No alert escalation for repeated failures | P0        |
| HubspotAlertsRunner    | Monitors API rate limits; undetected limits cause sync failures | No threshold configuration validation     | P0        |
| hubspot_dqa_full       | Full data quality checks; missed issues cause data corruption   | No comprehensive data integrity checks    | P1        |
| sync_hubspot_deals     | Deal sync with associations; incorrect deals affect Sales       | No deal stage validation                  | P1        |
| sync_hubspot_tickets   | Ticket sync with pipelines; incorrect tickets affect Support    | No ticket status validation               | P1        |
| HubspotBackfillWorker  | Bulk sync recovery; failed backfill leaves inconsistent data    | No progress tracking validation           | P1        |
| HubspotPeriodicRunner  | Periodic company sync; missed syncs cause stale data            | No sync completeness validation           | P2        |

### Key Tables (HubSpot Integration)

- **Read**: company_profile_meta_data, contact_profile_metadata, user_profile, user_usage, hubspot_company_property_value, hubspot_contact_property_value_v2
- **Write**: hubspot_company_property_value, hubspot_contact_property_value_v2, hubspot_deal_v2, hubspot_deal_association, hubspot_ticket, hubspot_engagement_association_v3, hubspot_email_events, hubspot_sync, hubspot_dqa_results, hubspot_alerts, hubspot_backfill, hubspot_backfill_task, jira_company_issue, call, meeting, email

---

## 6. Cross-Flow Dependencies

### Flow Interconnections

```
Attribution Flow ──────────────────────────────────────────────┐
    │                                                          │
    ├─► company_interactions ──► Offline Conversions Flow      │
    │                              (conversion eligibility)    │
    ├─► contact_interactions ──► Offline Conversions Flow      │
    │                              (contact-level conversions) │
    │                                                          │
    └─► company_profile_attribution ──► Company Funnel Flow    │
                                          (lead scoring)       │
                                                               │
Payments Flow ─────────────────────────────────────────────────┤
    │                                                          │
    ├─► company_profile_meta_data ──► Company Funnel Flow      │
    │     (currentMrr, ARR range)       (CS stage assignment)  │
    │                                                          │
    ├─► company_profile_meta_data ──► Offline Conversions Flow │
    │     (payment status)              (paid conversion types)│
    │                                                          │
    └─► subscription_events ──► Company Funnel Flow            │
          (plan changes)          (stage transitions)          │
                                                               │
Company Funnel Flow ───────────────────────────────────────────┤
    │                                                          │
    └─► company_profile_meta_data ──► HubSpot Push Flow        │
          (cs_stage, cs_manager)                               │
                                                               │
HubSpot Integration ───────────────────────────────────────────┤
    │                                                          │
    ├─► HubSpot Push Flow ─────────────────────────────────────┤
    │     │                                                    │
    │     ├─► company_profile_meta_data ──► HubSpot API        │
    │     │     (all company properties)                       │
    │     ├─► contact_profile_metadata ──► HubSpot API         │
    │     │     (contact properties)                           │
    │     └─► user_usage ──► HubSpot API                       │
    │           (usage metrics)                                │
    │                                                          │
    ├─► HubSpot Pull Flow ─────────────────────────────────────┤
    │     │                                                    │
    │     ├─► HubSpot Webhooks ──► hubspot_company_property    │
    │     │                          (company changes)         │
    │     ├─► HubSpot Webhooks ──► hubspot_contact_property    │
    │     │                          (contact changes)         │
    │     └─► HubSpot Webhooks ──► hubspot_deal_v2             │
    │                                (deal events)             │
    │                                                          │
    └─► HubSpot Scheduled Flow ────────────────────────────────┤
          │                                                    │
          ├─► Engagement Sync ──► call, meeting, email tables  │
          ├─► DQA Monitoring ──► hubspot_dqa_results, Slack    │
          └─► Backfill Worker ──► HubSpot API (bulk sync)      │
```

### Shared Tables

| Table                             | Used By Flows                              | Purpose                            |
|-----------------------------------|--------------------------------------------|------------------------------------|
| company_profile_meta_data         | All flows                                  | Central company data store         |
| company_interactions              | Attribution, Offline Conversions           | Company-level touchpoints          |
| contact_interactions              | Attribution, Offline Conversions           | Contact-level touchpoints          |
| visits                            | Attribution, Offline Conversions           | Session/visit data for attribution |
| hubspot_company_property_value    | HubSpot Push, HubSpot Pull, Company Funnel | HubSpot company properties         |
| hubspot_contact_property_value_v2 | HubSpot Push, HubSpot Pull                 | HubSpot contact properties         |
| user_usage                        | HubSpot Push, Attribution                  | User usage metrics                 |

---

## 7. Summary & Recommendations

### Validation Gap Summary

| Flow                     | P0 Issues   | P1 Issues  | P2 Issues  | Total  |
|--------------------------|-------------|------------|------------|--------|
| Attribution              | 6           | 5          | 3          | 14     |
| Company Funnel           | 4           | 3          | 3          | 10     |
| Offline Conversions      | 5           | 7          | 7          | 19     |
| Payments                 | 7           | 5          | 4          | 16     |
| HubSpot Push             | 2           | 3          | 1          | 6      |
| HubSpot Pull             | 2           | 1          | 2          | 5      |
| HubSpot Scheduled        | 2           | 4          | 1          | 7      |
| **Total**                | **28**      | **28**     | **21**     | **77** |

### Top 12 Critical Data Quality Issues (P0)

| #   | Worker/Component                        | Business Impact                                               | Current Validation                                    | Priority |
|-----|-----------------------------------------|---------------------------------------------------------------|-------------------------------------------------------|----------|
| 1   | Payments Webhook Endpoint               | Security vulnerability - fake events can corrupt revenue data | No webhook signature verification                     | P0       |
| 2   | PaymentRunner                           | Incorrect MRR leads to wrong revenue reporting                | No pre-validation of MRR calculations                 | P0       |
| 3   | TransactionPaymentRunner                | Wrong USD revenue calculations                                | No amount/exchange rate validation                    | P0       |
| 4   | ClientAttributionRunner                 | Wrong marketing spend decisions                               | No touchpoint validation; no cycle detection          | P0       |
| 5   | ContactAttributionRunner                | Corrupted lead scoring                                        | No email format validation                            | P0       |
| 6   | CompanyJourneyRunner                    | Wrong CS assignments                                          | No cs_stage enum validation; no manager ID validation | P0       |
| 7   | CompanyProfileMetaDataRunner (Payments) | Corrupted company revenue data                                | No MRR field validation (>= 0)                        | P0       |
| 8   | bigquery_to_mysql_ds_data DAG           | Stale conversion data sent to ad platforms                    | No wait task validation; no row count checks          | P0       |
| 9   | trigger_update_contact_predictions      | Corrupted contact predictions                                 | No merge validation                                   | P0       |
| 10  | CompanyProfileMetaDataRunner (CF)       | Wrong ARR segmentation                                        | No ARR range validation                               | P0       |
| 11  | HubspotCompanyUpdater                   | Stale/incorrect HubSpot company data affects Sales/CS         | No property value validation before API call          | P0       |
| 12  | hubspot_dqa_timeliness                  | Undetected sync delays cause stale CRM data                   | No alert escalation for repeated failures             | P0       |

### Recommended Remediation Timeline

| Priority   | Timeline   | Focus Areas                                                                                     |
|------------|------------|-------------------------------------------------------------------------------------------------|
| P0         | 1 week     | Webhook signature verification; MRR validation; Attribution touchpoint validation; HubSpot DQA  |
| P1         | 2 weeks    | Enum validations; Pydantic DTOs; Click ID format validation; HubSpot sync validation            |
| P2         | 2 weeks    | Monitoring dashboards; Alert systems; Success rate tracking; HubSpot backfill tracking          |

---

*Document generated from flow-dashboard analysis on 2025-11-27*


