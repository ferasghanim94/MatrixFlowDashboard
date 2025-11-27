// =============================================================================
// HubSpot Push Flow (Matrix → HubSpot)
// =============================================================================

export const hubspotPushFlowDiagram = `
flowchart TD
    subgraph Triggers["📡 TRIGGER EVENTS"]
        T1[company_metadata_changed]
        T2[payment_events]
        T3[attribution_updated]
        T4[company_usage_changed]
    end

    subgraph Aggregation["⏱️ AGGREGATION LAYER"]
        A1["HubspotCompanyAggregatorWorker
        Schedule: 5 min"]
        A2["HubspotUserUsageAggregatorWorker
        Schedule: 5 min"]
    end

    subgraph PushWorkers["⚙️ PUSH WORKERS"]
        PW1["HubspotCompanyUpdater
        19 Property Managers"]
        PW2["HubspotContactProfileUpdater
        Real-time"]
        PW3["HubspotUserUsageRunner
        Real-time"]
        PW4["HubspotEventsRunner
        Real-time"]
        PW5["PaymentFormCreatorWorker
        On event"]
    end

    subgraph PropertyManagers["📋 PROPERTY MANAGERS 19"]
        PM1[CompanyMetaData]
        PM2[CompanyJourney]
        PM3[CompanyAttribution]
        PM4[CompanyAttributionLast]
        PM5[CompanyArrRange]
        PM6[CompanyUsage]
        PM7[CompanyPaymentsStatus]
        PM8[CompanyDiscountStatus]
        PM9[+ 11 more...]
    end

    subgraph BiData["📊 BI DATA WORKERS"]
        BD1["HubspotUserBiDataSub
        Real-time"]
        BD2["HubspotContactBiDataSub
        Real-time"]
    end

    subgraph HubSpotAPI["☁️ HUBSPOT API"]
        HS["update_companies
        update_contacts
        Batch API"]
        HSF["create_payment_forms"]
    end

    Triggers --> Aggregation
    T1 & T2 & T3 & T4 --> A1
    T4 --> A2
    
    A1 --> PW1
    A2 --> PW3
    
    PW1 --> PropertyManagers
    PropertyManagers --> HS
    
    PW2 --> HS
    PW3 --> HS
    PW4 --> HS
    PW5 --> HSF
    
    BD1 --> HS
    BD2 --> HS

    style Triggers fill:#e0f2fe,stroke:#0284c7
    style Aggregation fill:#fef3c7,stroke:#d97706
    style PushWorkers fill:#dbeafe,stroke:#2563eb
    style PropertyManagers fill:#f3e8ff,stroke:#9333ea
    style BiData fill:#dcfce7,stroke:#16a34a
    style HubSpotAPI fill:#fed7aa,stroke:#ea580c
`;

export const hubspotPushFlowData = {
  title: "HubSpot Push Flow",
  category: "CRM",
  createdDate: "2025-11-27",
  description: "Syncs company, contact, and user data from Matrix to HubSpot via event-driven workers and aggregators. Processes internal Matrix events and pushes property updates to HubSpot API in batches.",
  
  workers: [
    { 
      name: "HubspotCompanyAggregatorWorker", 
      queue: "matrix.hubspot_company_aggregator",
      interval: "5 min",
      risk: "P1",
      description: "Aggregates company changes, schedules sync"
    },
    { 
      name: "HubspotCompanyUpdater", 
      queue: "matrix.hubspot_company_updater_new",
      interval: "On event",
      risk: "P0",
      description: "Bulk updates companies via 19 property managers"
    },
    { 
      name: "HubspotContactProfileUpdater", 
      queue: "matrix.hubspot_contact_profile_updater",
      interval: "Real-time",
      risk: "P1",
      description: "Contact attribution, ratings, heartbeats, feature feedback"
    },
    { 
      name: "HubspotUserUsageRunner", 
      queue: "matrix.updated_user_usage_events.hubspot",
      interval: "Real-time",
      risk: "P1",
      description: "User usage data sync"
    },
    { 
      name: "HubspotUserUsageAggregatorWorker", 
      queue: "matrix.hubspot_user_usage_aggregator",
      interval: "5 min",
      risk: "P1",
      description: "Aggregated user usage sync"
    },
    { 
      name: "HubspotUserBiDataSub", 
      queue: "matrix.hubspot.user_bi_data",
      interval: "Real-time",
      risk: "P2",
      description: "User BI data from analysts"
    },
    { 
      name: "HubspotContactBiDataSub", 
      queue: "matrix.hubspot.contact_bi_data",
      interval: "Real-time",
      risk: "P2",
      description: "Contact BI data from analysts"
    },
    { 
      name: "HubspotEventsRunner", 
      queue: "matrix.updated_data_events.hubspot",
      interval: "Real-time",
      risk: "P1",
      description: "Company/user events, workflows, emails"
    },
    { 
      name: "PaymentFormCreatorWorker", 
      queue: "matrix.hubspot_create_payment_request_form",
      interval: "On event",
      risk: "P1",
      description: "Creates payment request forms in HubSpot"
    }
  ],

  propertyManagers: [
    { name: "CompanyMetaDataHubspotPropertyManager", data: "Company metadata fields" },
    { name: "CompanyJourneyHubspotPropertyManager", data: "CS manager, sales manager assignments" },
    { name: "CompanyAttributionHubspotPropertyManager", data: "First-touch attribution" },
    { name: "CompanyAttributionLastHubspotPropertyManager", data: "Last-touch attribution" },
    { name: "CompanyArrRangeHubspotPropertyManager", data: "ARR range segmentation" },
    { name: "CompanyUsageHubspotPropertyManager", data: "Usage metrics" },
    { name: "CompanyPaymentsStatusHubspotPropertyManager", data: "Payment status" },
    { name: "CompanyDiscountStatusHubspotPropertyManager", data: "Discount status" },
    { name: "CompanyBiDataHourlyHubspotPropertyManager", data: "Hourly BI data" },
    { name: "CompanyChurnFlowDataHubspotPropertyManager", data: "Churn flow data" },
    { name: "CompanyProductLinksHubspotPropertyManager", data: "Product links" },
    { name: "CompanyOpenHubsHubspotPropertyManager", data: "Open hubs data" },
    { name: "CompanyTrialExtensionHubspotPropertyManager", data: "Trial extension data" },
    { name: "CompanyUserRatingSummaryHubspotPropertyManager", data: "User rating summaries" },
    { name: "DsCompanyDataHubspotPropertyManager", data: "Data science predictions" },
    { name: "ProductIntegrationsHubspotPropertyManager", data: "Product integrations" },
    { name: "SoftwareStackHubspotPropertyManager", data: "Software stack data" },
    { name: "CompanyDataFromAnalystsHubspotPropertyManager", data: "Analyst data" },
    { name: "CompanyLatestDeleteFlowDataHubspotPropertyManager", data: "Delete flow data" }
  ],

  eventSources: [
    { topic: "company_metadata_changed", publisher: "CompanyProfileMetaDataRunner", description: "Company metadata updates" },
    { topic: "new_subscription_event", publisher: "PaymentRunner", description: "Payment/subscription events" },
    { topic: "company_attribution_updated", publisher: "ClientAttributionRunner", description: "Attribution changes" },
    { topic: "company_usage_changed", publisher: "Various", description: "Usage metrics changes" },
    { topic: "contact_state_updated", publisher: "ContactStateRunner", description: "Contact state changes" },
    { topic: "engagement_event", publisher: "EngagementLogic", description: "Engagement events" },
    { topic: "feature_feedback_to_hubspot", publisher: "FeatureFeedbackRunner", description: "Feature feedback" },
    { topic: "user_bi_data_updated", publisher: "BI Analytics", description: "User BI data updates" },
    { topic: "contact_bi_data_updated", publisher: "BI Analytics", description: "Contact BI data updates" },
    { topic: "updated_user_usage_event", publisher: "UserUsageRunner", description: "User usage updates" },
    { topic: "hubspot_create_payment_request_form", publisher: "PaymentRequestHandler", description: "Payment form creation request" }
  ],
  
  tables: {
    read: [
      "company_profile_meta_data",
      "company_profile_attribution",
      "company_profile_attribution_last",
      "company_profile_arr_range",
      "company_profile_usage",
      "contact_profile_metadata",
      "contact_profile_attribution_first",
      "user_profile",
      "user_usage",
      "user_bi_data",
      "contact_bi_data",
      "company_payments_status",
      "company_current_discount"
    ],
    write: [
      "(HubSpot API) Company properties",
      "(HubSpot API) Contact properties",
      "(HubSpot API) Payment forms"
    ]
  },

  businessImpact: [
    { area: "CRM Data Accuracy", description: "Stale or incorrect data in HubSpot affects Sales/CS workflows" },
    { area: "Manager Assignment", description: "Wrong manager data impacts customer handoffs" },
    { area: "Attribution Reporting", description: "Incorrect attribution affects marketing ROI analysis" },
    { area: "Usage Insights", description: "Missing usage data impacts CS prioritization" },
    { area: "Lead Scoring", description: "Incorrect contact data affects lead qualification" }
  ],

  validationGaps: {
    p0: [
      "No property value validation before API call",
      "No retry on partial batch failures"
    ],
    p1: [
      "No HubSpot ID validation for contacts",
      "No aggregation deduplication",
      "No rate limit handling validation"
    ],
    p2: [
      "No sync confirmation tracking"
    ]
  }
};

// =============================================================================
// HubSpot Pull Flow (HubSpot → Matrix)
// =============================================================================

export const hubspotPullFlowDiagram = `
flowchart TD
    subgraph HubSpotWebhooks["📥 HUBSPOT WEBHOOKS"]
        HW["Property Changes,
        Associations, Deletions"]
    end

    subgraph WebhookEndpoints["🌐 WEBHOOK ENDPOINTS"]
        WE1["Hubspot Webhooks
        Legacy"]
        WE2["Hubspot Webhooks
        General"]
        WE3["Hubspot
        ContactWebhooks"]
    end

    subgraph TopicRouting["📨 TOPIC ROUTING"]
        TR["hubspot_general_webhook
        .object_type.event_type"]
    end

    subgraph PullWorkers["⚙️ PULL WORKERS"]
        PW1["HubspotCompanyWebhookRunner
        Company property changes"]
        PW2["HubspotContactWebhookRunner
        Contact property changes"]
        PW3["HubspotDealsRunner
        Deal events & associations"]
        PW4["HubspotCallWebhookRunner
        Call deletion events"]
        PW5["JiraHubspotIntegrationWorker
        Jira to HubSpot sync"]
    end

    subgraph MatrixDB["🗄️ MATRIX DATABASE"]
        DB1[hubspot_company_property_value]
        DB2[hubspot_contact_property_value_v2]
        DB3[company_profile_meta_data]
        DB4[hubspot_deal_v2]
        DB5[hubspot_deal_association]
        DB6[call]
    end

    HubSpotWebhooks --> WebhookEndpoints
    WE1 & WE2 & WE3 --> TopicRouting
    
    TopicRouting --> PW1
    TopicRouting --> PW2
    TopicRouting --> PW3
    TopicRouting --> PW4
    
    PW1 --> DB1
    PW1 --> DB3
    PW2 --> DB2
    PW3 --> DB4
    PW3 --> DB5
    PW4 --> DB6

    style HubSpotWebhooks fill:#fed7aa,stroke:#ea580c
    style WebhookEndpoints fill:#fecaca,stroke:#dc2626
    style TopicRouting fill:#e0f2fe,stroke:#0284c7
    style PullWorkers fill:#dbeafe,stroke:#2563eb
    style MatrixDB fill:#dcfce7,stroke:#16a34a
`;

export const hubspotPullFlowData = {
  title: "HubSpot Pull Flow",
  category: "CRM",
  createdDate: "2025-11-27",
  description: "Receives webhooks from HubSpot and syncs property changes, deals, and engagements back to Matrix. Processes company/contact property changes, deal associations, and object deletions.",
  
  workers: [
    { 
      name: "HubspotCompanyWebhookRunner", 
      queue: "matrix.hubspot_company_webhook_events",
      topics: "hubspot_general_webhook.company.*",
      risk: "P0",
      description: "Company property changes from HubSpot"
    },
    { 
      name: "HubspotContactWebhookRunner", 
      queue: "matrix.hubspot_contact_webhook_events",
      topics: "hubspot_general_webhook.contact.*",
      risk: "P0",
      description: "Contact property changes from HubSpot"
    },
    { 
      name: "HubspotDealsRunner", 
      queue: "matrix.hubspot_deals_events",
      topics: "hubspot_general_webhook.deal.*, hubspot_association_changed_webhook.deal.*",
      risk: "P1",
      description: "Deal events and associations"
    },
    { 
      name: "HubspotCallWebhookRunner", 
      queue: "matrix.hubspot_call_webhook_events",
      topics: "hubspot_general_webhook.object.deletion",
      risk: "P2",
      description: "Call deletion events"
    },
    { 
      name: "JiraHubspotIntegrationWorker", 
      queue: "matrix.jira_hubspot_integration",
      topics: "jira_ticket_events",
      risk: "P1",
      description: "Syncs Jira tickets to HubSpot"
    }
  ],

  webhookEndpoints: [
    { endpoint: "/Hubspot/Webhooks/", type: "Legacy", description: "Legacy webhook endpoint" },
    { endpoint: "/Hubspot/Webhooks/General", type: "General", description: "General webhook endpoint for all object types" },
    { endpoint: "/Hubspot/ContactWebhooks/", type: "Contact", description: "Contact-specific webhook endpoint" }
  ],

  eventTypes: [
    { source: "HubSpot Webhook", event: "company.propertyChange", description: "Company property modified in HubSpot" },
    { source: "HubSpot Webhook", event: "company.creation", description: "New company created in HubSpot" },
    { source: "HubSpot Webhook", event: "contact.propertyChange", description: "Contact property modified in HubSpot" },
    { source: "HubSpot Webhook", event: "deal.propertyChange", description: "Deal property modified" },
    { source: "HubSpot Webhook", event: "deal.associationChange", description: "Deal association added/removed" },
    { source: "HubSpot Webhook", event: "object.deletion", description: "Object deleted in HubSpot" },
    { source: "Jira Webhook", event: "ticket.created", description: "New Jira ticket created" },
    { source: "Jira Webhook", event: "ticket.updated", description: "Jira ticket updated" }
  ],

  propertiesSynced: {
    salesManagement: [
      "salesAccountManager",
      "customerSuccessManager",
      "chanceToClose",
      "salesQualified",
      "salesStatus",
      "salesNextAction"
    ],
    csNotes: [
      "csNotes",
      "csWhatWasDone",
      "churnNotes",
      "churnReason"
    ],
    scoring: [
      "chanceToImplement",
      "chanceToUpgrade",
      "chanceToChurn"
    ],
    status: [
      "hasSubmittedAReview",
      "targetPlanId",
      "shouldDelete",
      "stage",
      "whiteLabel",
      "healthStatus"
    ],
    timestamps: [
      "launchTimestamp",
      "testRunTimestamp",
      "trainingDone"
    ],
    integrations: [
      "isUsingSFTP",
      "isUsingAPI"
    ],
    softwareStack: [
      "payroll_method_type",
      "payroll_provider_external",
      "payroll_provider_peo",
      "payroll_software"
    ]
  },
  
  tables: {
    read: [
      "company_profile_meta_data",
      "hubspot_company_property_value",
      "hubspot_contact_property_value_v2",
      "call",
      "hubspot_deal_v2"
    ],
    write: [
      "hubspot_company_property_value",
      "hubspot_company_property_with_history_value",
      "hubspot_contact_property_value_v2",
      "company_profile_meta_data",
      "company_change_log",
      "hubspot_deal_v2",
      "hubspot_deal_association",
      "call"
    ]
  },

  businessImpact: [
    { area: "Manager Sync", description: "CS/Sales manager changes in HubSpot must reflect in Matrix for workflows" },
    { area: "Sales Status", description: "Sales stage changes affect reporting and automated workflows" },
    { area: "Deal Tracking", description: "Deal associations impact revenue attribution and forecasting" },
    { area: "Data Consistency", description: "Bidirectional sync ensures single source of truth" },
    { area: "Software Stack", description: "Payroll software data drives product recommendations" }
  ],

  validationGaps: {
    p0: [
      "No webhook signature verification - fake webhooks can corrupt data"
    ],
    p1: [
      "No property value type validation",
      "No company existence validation",
      "No duplicate webhook detection"
    ],
    p2: [
      "No rate limiting on webhook processing"
    ]
  }
};

// =============================================================================
// HubSpot Scheduled Jobs Flow
// =============================================================================

export const hubspotScheduledFlowDiagram = `
flowchart TD
    subgraph CriticalMonitoring["🚨 CRITICAL MONITORING"]
        CM1["hubspot_dqa_timeliness
        Every 5 min"]
        CM2["HubspotAlertsRunner
        Rate limits"]
    end

    subgraph SlackAlerts["🔔 SLACK ALERTS"]
        SL["Slack Notifications"]
    end

    subgraph HourlyCrons["⏰ HOURLY CRONS"]
        HC6["check_qualification_list_membership"]
        HC1["sync_hubspot_calls"]
        HC2["hubspot_meetings"]
        HC3["hubspot_email_engagements"]
        HC4["hubspot_email_events"]
        HC5["hubspot_dqa_full"]
    end

    subgraph TwoHourlyCrons["⏱️ 2-HOURLY CRONS"]
        TH1["sync_hubspot_deals"]
        TH2["sync_hubspot_tickets"]
        TH3["sync_hubspot_company_bugs"]
    end

    subgraph PeriodicWorkers["📊 PERIODIC WORKERS"]
        PW1["HubspotPeriodicRunner
        60 min"]
        PW2["hubspot_user_usage_dispatcher
        15 min"]
        PW3["hubspot_contact_list_membership
        hourly"]
    end

    subgraph DailyCrons["📅 DAILY CRONS"]
        DC1["long_runs_cron
        21:00"]
        DC2["daily_data_integrity_tasks
        6:00"]
    end

    subgraph Backfill["📦 BACKFILL"]
        BF["HubspotBackfillWorker"]
    end

    subgraph OutputTables["🗄️ OUTPUT TABLES"]
        OT1[hubspot_sync]
        OT2[meeting]
        OT3[call]
        OT4[email]
        OT5[hubspot_email_events]
        OT6[hubspot_deal_v2]
        OT7[hubspot_ticket]
        OT8[hubspot_dqa_results]
        OT9[hubspot_alerts]
        OT10[hubspot_backfill]
        OT11[hubspot_backfill_task]
        OT12[hubspot_engagement_association_v3]
        OT13[hubspot_contact_list_membership]
    end

    CM1 --> OT8
    CM1 --> SL
    CM2 --> OT9
    CM2 --> SL
    HC5 --> SL
    
    HC1 --> OT3
    HC2 --> OT2
    HC3 --> OT4
    HC4 --> OT5
    HC5 --> OT8
    
    TH1 --> OT6
    TH2 --> OT7
    TH3 --> OT1
    
    PW1 & PW2 --> OT1
    
    DC1 & DC2 --> OT1
    
    BF --> OT1
    BF --> OT10
    BF --> OT11
    
    HC2 --> OT12
    HC1 --> OT12
    HC6 --> OT13
    PW3 --> OT13

    style CriticalMonitoring fill:#fecaca,stroke:#dc2626
    style SlackAlerts fill:#fef9c3,stroke:#ca8a04
    style HourlyCrons fill:#fef3c7,stroke:#d97706
    style TwoHourlyCrons fill:#fed7aa,stroke:#ea580c
    style PeriodicWorkers fill:#dbeafe,stroke:#2563eb
    style DailyCrons fill:#e0e7ff,stroke:#6366f1
    style Backfill fill:#f3e8ff,stroke:#9333ea
    style OutputTables fill:#dcfce7,stroke:#16a34a
`;

export const hubspotScheduledFlowData = {
  title: "HubSpot Scheduled Jobs Flow",
  category: "CRM",
  createdDate: "2025-11-27",
  description: "Timed/periodic jobs that sync data between Matrix and HubSpot on a schedule. Includes periodic company sync, meeting sync, contact list membership sync, and on-demand backfill operations.",
  
  workers: [
    // Critical Monitoring
    { 
      name: "hubspot_dqa_timeliness", 
      schedule: "Every 5 min",
      type: "Cron",
      risk: "P0",
      description: "Critical timeliness monitoring for HubSpot data quality. Fires Slack alert if thresholds breached"
    },
    { 
      name: "HubspotAlertsRunner", 
      schedule: "On event",
      type: "Worker",
      risk: "P0",
      description: "Monitors rate limits, saves to hubspot_alerts table, fires Slack alert if needed"
    },
    // Hourly Crons
    { 
      name: "sync_hubspot_calls", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Syncs call engagements from HubSpot"
    },
    { 
      name: "hubspot_meetings", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Fetches meeting engagements from HubSpot API"
    },
    { 
      name: "hubspot_email_engagements", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Syncs email engagements from HubSpot"
    },
    { 
      name: "hubspot_email_events", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Syncs email events (opens, clicks) from HubSpot"
    },
    { 
      name: "hubspot_dqa_full", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Full DQA test suite for HubSpot data quality. Fires Slack alert if tests fail"
    },
    { 
      name: "check_qualification_list_membership", 
      schedule: "Every hour",
      type: "Cron",
      risk: "P1",
      description: "Checks contact qualification list membership"
    },
    // 2-Hourly Crons
    { 
      name: "sync_hubspot_company_bugs", 
      schedule: "Every 2 hours",
      type: "Cron",
      risk: "P1",
      description: "Syncs company bugs from HubSpot"
    },
    { 
      name: "sync_hubspot_deals", 
      schedule: "Every 2 hours",
      type: "Cron",
      risk: "P1",
      description: "Syncs deals from HubSpot"
    },
    { 
      name: "sync_hubspot_tickets", 
      schedule: "Every 2 hours",
      type: "Cron",
      risk: "P1",
      description: "Syncs tickets from HubSpot"
    },
    // Periodic Workers
    { 
      name: "HubspotPeriodicRunner", 
      schedule: "Every 60 min (12h cooldown)",
      type: "Worker",
      risk: "P1",
      description: "Syncs companies modified in last 12 hours"
    },
    { 
      name: "hubspot_user_usage_dispatcher", 
      schedule: "Every 15 min",
      type: "Cron",
      risk: "P1",
      description: "Dispatches user usage sync jobs"
    },
    { 
      name: "hubspot_contact_list_membership_dag", 
      schedule: "Every hour (min 15)",
      type: "Airflow DAG",
      risk: "P2",
      description: "Syncs marketing contact list memberships"
    },
    // Daily Crons
    { 
      name: "long_runs_cron", 
      schedule: "Daily 21:00",
      type: "Cron",
      risk: "P1",
      description: "Long-running sync operations"
    },
    { 
      name: "daily_data_integrity_tasks", 
      schedule: "Daily 6:00",
      type: "Cron",
      risk: "P1",
      description: "HubSpot contacts data integrity checks"
    },
    // Backfill
    { 
      name: "HubspotBackfillWorker", 
      schedule: "On-demand",
      type: "Worker",
      risk: "P1",
      description: "Bulk backfill triggered via API: POST /hubspot/sync/"
    }
  ],

  eventSources: [
    { source: "Timed Scheduler", trigger: "Interval elapsed", description: "HubspotPeriodicRunner triggers" },
    { source: "Airflow Scheduler", trigger: "Cron expression", description: "DAG execution on schedule" },
    { source: "API Request", trigger: "POST /hubspot/sync/", description: "Manual backfill trigger by user" },
    { source: "backfill_job_created", trigger: "HubspotSyncHandler", description: "Backfill job created event" },
    { source: "backfill_batch_created", trigger: "BackfillJobManager", description: "Batch ready to process" }
  ],

  backfillOperations: [
    { operation: "Company Backfill", entity: "Company", description: "Sync all company properties to HubSpot" },
    { operation: "Contact Backfill", entity: "Contact", description: "Sync all contact properties to HubSpot" },
    { operation: "Field-Specific Backfill", entity: "Company/Contact", description: "Sync specific fields only" }
  ],
  
  syncOperations: [
    { operation: "Company Usage Sync", direction: "Matrix → HubSpot", description: "Publish company usage events" },
    { operation: "Calls Sync", direction: "HubSpot → Matrix", description: "Fetch call engagements" },
    { operation: "Deals Sync", direction: "HubSpot → Matrix", description: "Fetch deal records" },
    { operation: "Tickets Sync", direction: "HubSpot → Matrix", description: "Fetch ticket records" },
    { operation: "Meetings Sync", direction: "HubSpot → Matrix", description: "Fetch meeting engagements" },
    { operation: "Email Engagements Sync", direction: "HubSpot → Matrix", description: "Fetch email engagements" },
    { operation: "Email Events Sync", direction: "HubSpot → Matrix", description: "Fetch email opens/clicks" },
    { operation: "List Membership Sync", direction: "HubSpot → Matrix", description: "Fetch contact list memberships" },
    { operation: "DQA Tests", direction: "Matrix", description: "Data quality assurance monitoring" },
    { operation: "Data Integrity", direction: "Matrix", description: "Contact data integrity validation" }
  ],

  tables: {
    read: [
      "company_profile_usage",
      "hubspot_sync",
      "hubspot_backfill",
      "hubspot_backfill_task"
    ],
    write: [
      "hubspot_sync",
      "meeting",
      "call",
      "email",
      "hubspot_email_events",
      "hubspot_deal_v2",
      "hubspot_ticket",
      "hubspot_engagement_association_v3",
      "hubspot_contact_list_membership",
      "hubspot_backfill",
      "hubspot_backfill_task",
      "hubspot_dqa_results",
      "hubspot_alerts"
    ]
  },

  businessImpact: [
    { area: "Data Quality Monitoring", description: "DQA tests catch data issues before they impact business" },
    { area: "Data Completeness", description: "Catches missed real-time events ensuring no data gaps" },
    { area: "Meeting Tracking", description: "Meeting data drives CS engagement metrics and follow-ups" },
    { area: "Call Analytics", description: "Call data enables sales performance and coaching analysis" },
    { area: "Email Insights", description: "Email engagement data informs marketing effectiveness" },
    { area: "Deal Pipeline", description: "Deal sync ensures accurate revenue forecasting" },
    { area: "Support Context", description: "Ticket sync provides support history for CS/Sales" },
    { area: "Marketing Lists", description: "List membership affects campaign targeting accuracy" },
    { area: "Data Recovery", description: "Backfill enables bulk data repair after issues" },
    { area: "Rate Limit Management", description: "Alerts prevent API quota exhaustion" }
  ],

  validationGaps: {
    p0: [
      "No automatic recovery when DQA tests fail"
    ],
    p1: [
      "No sync completeness validation",
      "No meeting deduplication",
      "No backfill batch size limits",
      "No retry logic for failed batches",
      "No email engagement deduplication"
    ],
    p2: [
      "No stale sync detection"
    ]
  }
};

export default {
  push: hubspotPushFlowData,
  pull: hubspotPullFlowData,
  scheduled: hubspotScheduledFlowData
};

