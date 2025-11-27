# Offline Conversions Flow Diagram

**Created:** 2025-11-25  
**Purpose:** Document the complete flow of offline conversions from DS model predictions to advertising platform APIs

---

## ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AIRFLOW DAGS (DS Prediction Models)                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
        ┌────────────────────────────────────────────────────────────┐
        │  External DAG: ds_cp_predict                               │
        │  (CP Model - Critical Path Predictions)                    │
        │  Outputs: BigQuery ct-data-science-v2.cp.*                 │
        └────────────────────────────────────────────────────────────┘
                                        │
        ┌────────────────────────────────────────────────────────────┐
        │  External DAG: ds_acv_predict                              │
        │  (ACV Model - Annual Contract Value Predictions)           │
        │  Outputs: BigQuery ct-data-science-v2.acv.*                │
        └────────────────────────────────────────────────────────────┘
                                        │
        ┌────────────────────────────────────────────────────────────┐
        │  External DAG: ds_bad_day_all_predict_specific_build       │
        │  (BOD/BAD Model - Book a Demo Predictions)                 │
        │  Outputs: BigQuery ct-dbt.stg.*                            │
        └────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│            DAG: bigquery_to_mysql_ds_data                                       │
│            Schedule: "5 * * * *" (Every hour at minute 5)                       │
│            File: airflow-dags/bigquery_to_mysql_data_science_data.py            │
│                                                                                 │
│  Tasks:                                                                         │
│  1. wait_for_cp_predict  (External Task Sensor)                                 │
│  2. wait_for_acv_predict (External Task Sensor)                                 │
│  3. wait_for_bad_prod_predict (External Task Sensor)                            │
│  4. Transfer BigQuery → MySQL:                                                  │
│     ├── ct-dbt.stg.stg_ds_to_de_cp → bi.company_conversion_probability          │
│     ├── ct-data-science-v2.cp.ds_cp_contact_table_score → bi.contact_cp_score   │
│     └── ct-data-science-v2.acv.ds_acv_contact_table_score → bi.contact_acv_score│
│  5. trigger_update_contact_predictions (Kubernetes Operator)                    │
│     └── Merges contact_cp_score + contact_acv_score → contact_conversion_probability│
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MYSQL DATABASE (bi)                                │
│                                                                                 │
│  Tables:                                                                        │
│  ├── company_conversion_probability                                             │
│  │   ├── Fields: company, cp1, cp1_arpu, cp3, cp3_arpu, employees_range_*       │
│  │   └── Used by: Company-level conversions (11+, 51+, 101+ employee filters)   │
│  │                                                                              │
│  └── contact_conversion_probability                                             │
│      ├── Fields: contact_id, combined1_conversion_probability_predicted,        │
│      │           combined3_conversion_probability_predicted,                    │
│      │           cp1_signup_first_value, cp3_signup_first_value,                │
│      │           book_a_demo_1_probability_value, book_a_demo_3_probability_value│
│      └── Used by: Contact-level conversions (signup funnel, book-a-demo funnel) │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CONVERSION WORKERS (Timed Runners)                       │
│                        Run on fixed intervals, NOT Pub/Sub triggered            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ GoogleConversion  │ │ FacebookConversion│ │ BingConversion    │
        │ Runner            │ │ Runner            │ │ Runner            │
        │                   │ │                   │ │                   │
        │ Interval: 1800s   │ │ Interval: 3600s   │ │ Interval: 3600s   │
        │ (30 min)          │ │ (1 hour)          │ │ (1 hour)          │
        │                   │ │                   │ │                   │
        │ File: matrix/     │ │ File: matrix/     │ │ File: matrix/     │
        │ worker/google_    │ │ worker/facebook_  │ │ worker/bing_      │
        │ conversion/       │ │ conversion/       │ │ conversion/       │
        │ google_conversion_│ │ facebook_         │ │ bing_conversion_  │
        │ sub.py            │ │ conversion_sub.py │ │ sub.py            │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼

        LOGIC:                  LOGIC:                  LOGIC:
        Reads from:             Reads from:             Reads from:
        ├── company_            ├── company_            ├── company_
        │   conversion_         │   conversion_         │   conversion_
        │   probability         │   probability         │   probability
        ├── contact_            ├── contact_            ├── contact_
        │   conversion_         │   conversion_         │   conversion_
        │   probability         │   probability         │   probability
        ├── company_            ├── company_            ├── company_
        │   profile_            │   profile_            │   profile_
        │   meta_data           │   meta_data           │   meta_data
        ├── company_            ├── contact_            └── company_
        │   interaction         │   interaction             interaction
        └── visits              └── visits              

        FILTERS:                FILTERS:                FILTERS:
        ├── Channels:           ├── Channel:            ├── Channels:
        │   cpc-google*         │   cpc-facebook        │   cpc-bing*
        ├── Click ID:           ├── Click ID:           ├── Click ID:
        │   gclid/wbraid/       │   fbclid              │   msclkid
        │   gbraid               ├── FBP cookie          │
        └── Date range:         └── Date range:         └── Date range:
            Last 8 days             Last 7 days             Last 8 days

        CONVERSION TYPES:       CONVERSION TYPES:       CONVERSION TYPES:
        ├── MQL (11+, 51+,      ├── MQL (11+, 51+,      ├── MQL (11+, 51+,
        │   101+)               │   51-300, Midtier)    │   101+, Midtier)
        ├── Signup (11+)        ├── Signup (11+,        ├── Signup (11+,
        │                       │   500+, Added 5       │   51+, 101+, 500+)
        │                       │   users)              │
        ├── Paid                ├── Paid                ├── Paid
        ├── Lead Score 250+     ├── Lead Score 250+     ├── Lead
        ├── Started Funnel      ├── Started Funnel      ├── Started Funnel
        ├── CP1 Conversions:    ├── CP1 Conversions:    ├── CP1 Conversions:
        │   ├── cp1 11+ no ecl  │   ├── cp1 11+ no ecl  │   ├── CP1 11+ Intent
        │   └── cp1 signup      │   ├── cp1 signup      │   │   Score
        │       funnel v3       │   │   funnel v3       │   └── CP1 ALL Pred
        │                       │   ├── cp1 1%, 2%, 5%  │       Paying Score
        ├── CP3 Conversions:    │   │   (11+)           │
        │   ├── cp3 11+ no ecl  │   └── cp1 ROAS ($1,   ├── CP3 Conversions:
        │   └── cp3 signup      │       $10, $100)      │   ├── CP3 11+ Intent
        │       funnel v3       │                       │   │   Score
        │                       ├── CP3 Conversions:    │   └── CP3 ALL Pred
        └── Signup with         │   ├── cp3 11+ no ecl  │       Paying Score
            consent test        │   ├── cp3 signup      │
                                │   │   funnel v3       ├── Combined CP1:
                                │   └── cp3 1%, 2%, 5%, │   ├── Combined1 ALL
                                │       15% (11+)       │   └── Combined1 11+
                                │                       │       (signup funnel)
                                ├── Combined CP1:       │
                                │   ├── Combined1 with  ├── Combined CP3:
                                │   │   value           │   └── Combined3 ALL
                                │   ├── Combined1       │
                                │   │   without ACV     ├── Book-a-Demo (BAD):
                                │   └── Combined1       │   ├── Filled demo
                                │       (signup funnel) │   │   form 11+
                                │                       │   ├── Booked demo
                                ├── Server Events:      │   │   (v1 & v2)
                                │   ├── Contact Book    │   └── Combined BAD
                                │   │   Demo (11+)      │       conversions
                                │   ├── SU Contact      │       (CP1/CP3 ALL,
                                │   │   Book Demo (11+) │       11+)
                                │   ├── SU (11+,        │
                                │   │   Added 5 users)  │
                                │   ├── SU delayed test │
                                │   ├── SU without FBP  │
                                │   ├── SU hashed       │
                                │   │   external ID     │
                                │   └── Donate (no IP/  │
                                │       UA) - Voyantis  │
                                │       test            │
                                │                       │
                                ├── Demo Events:        │
                                │   ├── First Demo      │
                                │   │   Booked (QA      │
                                │   │   legacy/new)     │
                                │   ├── First Demo      │
                                │   │   Booked          │
                                │   └── First Demo Done │
                                │                       │
                                └── Lead Index          │
                                    Conversions         │

                    │                   │                   │
                    ▼                   ▼                   ▼

        DEDUPLICATION:          FILTERING:              DEDUPLICATION:
        ├── Check bi.           ├── Check bi.           ├── Check bi.
        │   google_conversion   │   facebook_           │   bing_conversion
        ├── Filter by           │   conversion_v2       ├── Check bi.
        │   legitimacy          ├── Filter spam         │   generic_
        │                       │   companies/contacts  │   conversions
        └── Query conversions   ├── Filter corrupted    │
            table for sent      │   phone numbers       └── Filter by
            conversions         └── Filter by consent       legitimacy
                                    (CA residents)      

                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ADVERTISING PLATFORM APIs                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ Google Ads API    │ │ Facebook          │ │ Bing Ads API      │
        │                   │ │ Conversion API    │ │                   │
        │ Endpoint:         │ │                   │ │ Endpoint:         │
        │ create_batch_     │ │ API Version:      │ │ send_offline_     │
        │ offline_          │ │ v18.0             │ │ conversion        │
        │ conversions       │ │                   │ │                   │
        │                   │ │ Pixel ID:         │ │ Logic:            │
        │ Customer IDs:     │ │ 1459709444231724  │ │ BingLogic.        │
        │ - 3625606301      │ │                   │ │ send_offline_     │
        │   (default)       │ │ Event Request:    │ │ conversion()      │
        │ - Multiple        │ │ - User Data       │ │                   │
        │   accounts        │ │   (email, phone,  │ │ Max Batch:        │
        │                   │ │   fbp, fbc, IP,   │ │ No batching       │
        │ Batch Size:       │ │   UA, external_id)│ │ (1 at a time)     │
        │ 2000 conversions  │ │ - Custom Data     │ │                   │
        │                   │ │   (value, currency│ │ Data Sent:        │
        │ Data Sent:        │ │   USD)            │ │ - CLID (msclkid)  │
        │ - GCLID/WBRAID/   │ │ - Event Source:   │ │ - Conversion Name │
        │   GBRAID          │ │   WEBSITE         │ │ - Conversion Time │
        │ - Conversion Name │ │ - Event Time      │ │ - Conversion Value│
        │ - Conversion Time │ │                   │ │ - Visit Time      │
        │ - Conversion Value│ │ Max Batch:        │ │ - User Agent      │
        │ - Visit Time      │ │ 500 events/call   │ │ - IP Address      │
        │ - User Agent      │ │                   │ │                   │
        │ - IP Address      │ │ Data Sent:        │ │ Response:         │
        │ - Customer ID     │ │ - Event ID        │ │ Success/Failure   │
        │                   │ │   (dedup key)     │ │ boolean           │
        │ Response:         │ │ - Event Name      │ │                   │
        │ Good/Bad lists    │ │ - FBC/FBP         │ │                   │
        │                   │ │ - External ID     │ │                   │
        │                   │ │ - PII (hashed)    │ │                   │
        │                   │ │ - Value (if set)  │ │                   │
        │                   │ │                   │ │                   │
        │                   │ │ Response:         │ │                   │
        │                   │ │ events_received   │ │                   │
        │                   │ │ count             │ │                   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SAVE TO DATABASE (Audit Trail)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │ bi.google_        │ │ bi.facebook_      │ │ bi.bing_          │
        │ conversion        │ │ conversion_v2     │ │ conversion        │
        │                   │ │                   │ │                   │
        │ bi.generic_       │ │                   │ │ bi.generic_       │
        │ conversions       │ │                   │ │ conversions       │
        │ (no-company       │ │                   │ │ (no-company       │
        │  conversions)     │ │                   │ │  conversions)     │
        │                   │ │                   │ │                   │
        │ Fields:           │ │ Fields:           │ │ Fields:           │
        │ - clid            │ │ - conversion_id   │ │ - clid            │
        │ - clid_type       │ │ - conversion_type │ │ - company         │
        │ - company         │ │ - company         │ │ - conversion_type │
        │ - conversion_type │ │ - fbclid          │ │ - conversion_time │
        │ - conversion_time │ │ - conversion_time │ │ - visit_time      │
        │ - conversion_     │ │ - visit_time      │ │ - date_created    │
        │   type_id         │ │ - fbp             │ │                   │
        │ - visit_time      │ │ - external_id     │ │                   │
        │ - value           │ │ - email           │ │                   │
        │ - google_ads_     │ │ - phone_number    │ │                   │
        │   account_id      │ │ - first_name      │ │                   │
        │ - error           │ │ - last_name       │ │                   │
        │ - date_created    │ │ - client_id       │ │                   │
        │                   │ │ - ip_address      │ │                   │
        │                   │ │ - user_agent      │ │                   │
        │                   │ │ - date_created    │ │                   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## Key Data Points

### Timing
- **Airflow DAG runs:** Every hour at minute 5
- **Google conversions run:** Every 30 minutes (1800s)
- **Facebook conversions run:** Every 60 minutes (3600s)
- **Bing conversions run:** Every 60 minutes (3600s)

### Data Sources
1. **BigQuery (DS Model Outputs)**
   - `ct-dbt.stg.stg_ds_to_de_cp` → Company predictions
   - `ct-data-science-v2.cp.ds_cp_contact_table_score` → Contact CP scores
   - `ct-data-science-v2.acv.ds_acv_contact_table_score` → Contact ACV scores

2. **MySQL (Conversion Source)**
   - `bi.company_conversion_probability` → Company-level predictions (CP1, CP3, ARPU)
   - `bi.contact_conversion_probability` → Contact-level predictions (Combined1, Combined3, BAD)

### Conversion Worker Models
All three conversion runners use:
- `SimpleIntervalRunner` (timed, not event-driven)
- Direct database queries to MySQL
- Platform-specific APIs for submission
- Audit tables for tracking sent conversions

### Click ID Tracking
- **Google:** gclid, wbraid, gbraid (from `utm_*` parameters)
- **Facebook:** fbclid (from `utm_*` parameters)
- **Bing:** msclkid (from query parameters)

### Deduplication Strategy
- Each platform checks its own audit table before sending
- Uses composite keys: (conversion_type, clid, company)
- Facebook also uses event_id as deduplication key
- Prevents duplicate conversions to platforms

---

## Critical Dependencies

1. **DS Models must complete** before Airflow sync
   - CP Model (Critical Path)
   - ACV Model (Annual Contract Value)
   - BOD/BAD Model (Book a Demo predictions)

2. **BigQuery to MySQL sync** must complete before conversion workers read data
   - Hourly schedule ensures fresh predictions

3. **Conversion workers** poll on independent schedules
   - Not triggered by data arrival
   - Use lookback windows to capture recent data

---

## Data Quality Considerations

### Current State
- ❌ No validation at conversion worker level
- ❌ No Pydantic DTOs for conversion data
- ❌ Minimal error handling in batch processing
- ❌ No metrics for failed conversions
- ✅ Deduplication prevents duplicate sends
- ✅ Spam/legitimacy filtering exists

### Recommendations
1. Add Pydantic models for conversion row validation
2. Implement retry logic for transient failures
3. Add comprehensive metrics for conversion success/failure rates
4. Monitor prediction data freshness
5. Add alerts for abnormal conversion volumes


