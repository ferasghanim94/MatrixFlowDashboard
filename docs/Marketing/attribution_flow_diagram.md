# Attribution Flow Diagram

**Created:** 2025-11-27  
**Purpose:** Document the complete attribution flow from ad click to attribution models, tracking user journey through website visits, form submissions, and mobile signups

---

## ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY STARTS: AD CLICK                                │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────────┤
│ Google Ads      │ Facebook Ads    │ Bing Ads        │ LinkedIn Ads              │
│ gclid, wbraid,  │ fbclid, fbp     │ msclkid         │ custom params             │
│ gbraid          │                 │                 │                           │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────────┘
         │                 │                 │                    │
         └─────────────────┴─────────────────┴────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              WEBSITE VISIT                                       │
│                                                                                  │
│  JavaScript Tracking                                                             │
│  ├── Session Created                                                             │
│  │   └── client_id, session_id                                                   │
│  └── UTM parameters captured                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 1: SESSION → VISIT                                   │
│                                                                                  │
│  VisitsRunner                                                                    │
│  File: matrix/worker/subscribers/visits/sessions_to_visits_sub.py               │
│                                                                                  │
│  Subscribes: Topic.session_webhook                                              │
│              Topic.event_hit.value + '#'                                        │
│                                                                                  │
│  Output: bi.visits table (Enriched data)                                        │
│  ├── Session data → Visit record                                                │
│  ├── UTM parameters preserved                                                   │
│  ├── Click IDs extracted (gclid, fbclid, msclkid, etc.)                         │
│  └── Geolocation, device info enriched                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   STAGE 2: INTERACTION TOUCHPOINT                               │
│                                                                                  │
│  create_interaction_from_visit                                                   │
│                                                                                  │
│  Output: bi.interaction_touchpoints table                                        │
│  └── Normalized attribution data                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PARALLEL FLOWS                                         │
├───────────────────────────────────┬─────────────────────────────────────────────┤
│                                   │                                             │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────────────┐    │
│  │ Form Submissions            │  │  │ Mobile Signups                      │    │
│  │                             │  │  │                                     │    │
│  │ LeadsRunner                 │  │  │ MobileSignupsWorker                 │    │
│  │ MarketingSiteFormsRunner    │  │  │                                     │    │
│  │                             │  │  │ File: matrix/worker/subscribers/    │    │
│  │ File: matrix/worker/        │  │  │ mobile_signups/mobile_signups_      │    │
│  │ subscribers/leads/          │  │  │ worker.py                           │    │
│  │ leads_worker.py             │  │  │                                     │    │
│  │                             │  │  │ Publishes:                          │    │
│  │ Publishes:                  │  │  │ - mobile_event_hit                  │    │
│  │ new_interaction_touchpoint  │  │  │ - delayed_attribution_trigger       │    │
│  └─────────────────────────────┘  │  └─────────────────────────────────────┘    │
│               │                   │                    │                        │
│               │                   │                    │                        │
│               ▼                   │                    ▼                        │
│     new_interaction_touchpoint    │       mobile_event_hit                      │
│                                   │       delayed_attribution_trigger           │
└───────────────────────────────────┴─────────────────────────────────────────────┘
                    │                                    │
                    └──────────────┬─────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐
│ STAGE 4:          │   │ STAGE 5:              │   │ STAGE 3:                  │
│ CONTACT           │   │ DELAYED RE-CALC       │   │ COMPANY ATTRIBUTION       │
│ ATTRIBUTION       │   │                       │   │                           │
└───────────────────┘   └───────────────────────┘   └───────────────────────────┘
         │                         │                           │
         ▼                         ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌─────────────────────────┐     ┌─────────────────────────────────────────┐  │
│  │ ContactAttributionRunner│     │ DelayedAttributionRunner                │  │
│  │                         │     │                                         │  │
│  │ File: matrix/worker/    │     │ File: matrix/worker/subscribers/        │  │
│  │ subscribers/attribution/│     │ attribution/delayed_attribution_        │  │
│  │ contact_attribution_    │     │ worker.py                               │  │
│  │ sub.py                  │     │                                         │  │
│  │                         │     │ Subscribes: new_interaction_touchpoint  │  │
│  │ Topics:                 │     │             mobile_event_hit            │  │
│  │ - new_contact_created   │     │                                         │  │
│  │ - new_interaction_      │     │ Timing:                                 │  │
│  │   touchpoint            │     │ - DELAY_IN_MINUTES = 30                 │  │
│  │ - companyCreated        │     │ - SHORT_DELAY_IN_MINUTES = 6            │  │
│  │ - mobileAppSignup       │     │                                         │  │
│  │ - delayed_attribution   │     │ Purpose:                                │  │
│  │ - Invoca                │     │ Re-triggers attribution after delay     │  │
│  │                         │     │ to capture late-arriving data           │  │
│  │ Logic:                  │     │                                         │  │
│  │ Connect Email to        │     │         ┌───────────────┐               │  │
│  │ Client IDs              │◄────┼─────────│ re-trigger    │               │  │
│  │                         │     │         └───────────────┘               │  │
│  └─────────────────────────┘     └─────────────────────────────────────────┘  │
│               │                                    │                          │
│               ▼                                    │                          │
│  ┌─────────────────────────┐                       │                          │
│  │ bi.contact_interactions │                       │                          │
│  └─────────────────────────┘                       │                          │
│               │                                    │                          │
│               ▼                                    │                          │
│  ┌─────────────────────────────────────────────────┘                          │
│  │                                                                            │
│  ▼                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │ contact_profile_attribution_first                                     │    │
│  │ (First-Touch Attribution for Contacts)                                │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ ClientAttributionRunner                                                 │  │
│  │                                                                         │  │
│  │ File: matrix/worker/subscribers/attribution/attribution_sub.py          │  │
│  │                                                                         │  │
│  │ Trigger Topics:                                                         │  │
│  │ - Company Signup Trigger                                                │  │
│  │ - CompanyEventModel                                                     │  │
│  │                                                                         │  │
│  │ Topics Subscribed:                                                      │  │
│  │ - companyCreated                                                        │  │
│  │ - signup                                                                │  │
│  │ - delayed_attribution_trigger                                           │  │
│  │                                                                         │  │
│  │ Logic:                                                                  │  │
│  │ ├── Map Identifiers: client_id → company                                │  │
│  │ └── Recursive Discovery: Max 5 hops                                     │  │
│  │     (Follow referral chain to find original source)                     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                    │                                                          │
│                    ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ bi.company_interactions                                                 │  │
│  │ (All company touchpoints with attribution data)                         │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ATTRIBUTION MODELS                                      │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ First-Touch         │ Last-Touch          │ First-Touch Limited                 │
│                     │                     │                                     │
│ company_profile_    │ company_profile_    │ 28 days window                      │
│ attribution         │ attribution_last    │                                     │
│                     │                     │ Attribution only counted if         │
│ First interaction   │ Most recent         │ touchpoint within 28 days           │
│ that led to         │ interaction before  │ of conversion                       │
│ conversion          │ conversion          │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DOWNSTREAM CONSUMERS                                     │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ HubSpot Sync        │ Reporting/Analytics │ Conversion Workers                  │
│                     │                     │                                     │
│ Syncs attribution   │ BI dashboards,      │ GoogleConversionRunner              │
│ data to HubSpot     │ Looker reports      │ FacebookConversionRunner            │
│ company properties  │                     │ BingConversionRunner                │
│                     │                     │ etc.                                │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
```

---

## Key Data Points

### Timing
- **Session to Visit:** Real-time (event-driven)
- **Attribution Processing:** Real-time (Pub/Sub triggered)
- **Delayed Attribution:** 30 minutes (standard) or 6 minutes (short delay)
- **Recursive Discovery:** Max 5 hops to find original source

### Attribution Models
| Model | Table | Description |
|-------|-------|-------------|
| First-Touch | `company_profile_attribution` | Credits first touchpoint that led to conversion |
| Last-Touch | `company_profile_attribution_last` | Credits most recent touchpoint before conversion |
| First-Touch Limited | N/A | First-touch within 28-day window only |

### Click ID Tracking
| Platform | Click IDs | UTM Source |
|----------|-----------|------------|
| Google Ads | gclid, wbraid, gbraid | cpc-google* |
| Facebook Ads | fbclid, fbp | cpc-facebook |
| Bing Ads | msclkid | cpc-bing* |
| LinkedIn Ads | li_fat_id, custom params | cpc-linkedin |

### Recursive Discovery
- **Purpose:** Follow referral chain to find original marketing source
- **Max Depth:** 5 hops
- **Logic:** Maps client_id → company through multiple touchpoints

---

## Critical Dependencies

### Input Events (Trigger Topics)
| Topic | Publisher | Description |
|-------|-----------|-------------|
| session_webhook | JavaScript SDK | New session created |
| event_hit.# | JavaScript SDK | User event on website |
| new_contact_created | ContactCreationWorker | New contact registered |
| new_interaction_touchpoint | LeadsRunner | Form submission |
| companyCreated | SignupWorker | New company signup |
| mobileAppSignup | MobileSignupsWorker | Mobile app signup |
| signup | SignupWorker | Signup event |
| delayed_attribution_trigger | MobileSignupsWorker | Trigger delayed re-calc |

### Output Events (Published Topics)
| Topic | Publisher | Consumers |
|-------|-----------|-----------|
| company_attribution_updated | ClientAttributionRunner | HubspotCompanyAggregatorWorker, ConversionWorkers |
| contact_attribution_updated | ContactAttributionRunner | HubspotContactProfileUpdater |

### Database Tables
**Read:**
- `bi.visits` - Website visit data
- `bi.sessions` - Session data
- `bi.interaction_touchpoints` - Normalized touchpoints
- `bi.contact_profile_metadata` - Contact information
- `bi.company_profile_meta_data` - Company information

**Write:**
- `bi.visits` - Enriched visit records
- `bi.interaction_touchpoints` - Normalized attribution data
- `bi.contact_interactions` - Contact-level interactions
- `bi.company_interactions` - Company-level interactions
- `bi.company_profile_attribution` - First-touch attribution
- `bi.company_profile_attribution_last` - Last-touch attribution
- `bi.contact_profile_attribution_first` - Contact first-touch

---

## Workers Summary

| Worker | File | Queue | Trigger |
|--------|------|-------|---------|
| VisitsRunner | `sessions_to_visits_sub.py` | matrix.visits | session_webhook, event_hit.# |
| LeadsRunner | `leads_worker.py` | matrix.leads | Lead form submissions |
| MarketingSiteFormsRunner | N/A | N/A | Marketing site forms |
| MobileSignupsWorker | `mobile_signups_worker.py` | matrix.mobile_signups | Mobile app events |
| ContactAttributionRunner | `contact_attribution_sub.py` | matrix.contact_attribution | Multiple topics (see above) |
| ClientAttributionRunner | `attribution_sub.py` | matrix.client_attribution | companyCreated, signup, delayed_attribution_trigger |
| DelayedAttributionRunner | `delayed_attribution_worker.py` | matrix.delayed_attribution | new_interaction_touchpoint, mobile_event_hit |

---

## Data Quality Considerations

### Current State
- ✅ Multi-model attribution (First-Touch, Last-Touch)
- ✅ Delayed re-calculation captures late data
- ✅ Recursive discovery follows referral chains
- ✅ Click ID tracking for major platforms
- ❌ No validation on touchpoint data quality
- ❌ No metrics for attribution coverage
- ❌ Missing attribution for some edge cases (direct visits)

### Edge Cases Handled
1. **Late-arriving data** - DelayedAttributionRunner re-processes after 30 min
2. **Multi-device journeys** - Email-to-client_id mapping
3. **Referral chains** - Recursive discovery (max 5 hops)
4. **Mobile signups** - Dedicated MobileSignupsWorker with delayed trigger

### Known Limitations
1. **28-day window** - First-Touch Limited only considers recent touchpoints
2. **No cross-device tracking** - Cannot link anonymous sessions across devices
3. **Organic traffic** - Limited attribution for non-paid sources
4. **Cookie consent** - May miss data from users who decline tracking

---

## Business Logic Flow Summary

```
Ad Click (gclid/fbclid/msclkid)
    ↓
Website Visit (JavaScript tracking)
    ↓
Session Created (client_id, session_id)
    ↓
VisitsRunner → bi.visits
    ↓
create_interaction_from_visit → bi.interaction_touchpoints
    ↓
┌─────────────┬─────────────────────┐
│             │                     │
▼             ▼                     ▼
Form Submit   Mobile Signup    Delayed Trigger
(LeadsRunner) (MobileSignups)  (30/6 min)
│             │                     │
└──────┬──────┴─────────────────────┘
       │
       ▼
Contact Attribution (ContactAttributionRunner)
       ↓
Company Attribution (ClientAttributionRunner)
       ↓
Attribution Models (First-Touch, Last-Touch, Limited)
       ↓
Downstream: HubSpot Sync, Reporting, Conversion Workers
```


