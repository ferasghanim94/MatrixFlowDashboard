export const offlineConversionsFlowDiagram = `
flowchart TD
    subgraph ExternalDAGs["🔬 EXTERNAL DS PREDICTION MODELS"]
        direction TB
        DAG1[ds_cp_predict<br/>Company CP Prediction<br/>Output: ct-data-science-v2.cp.*]
        DAG2[ds_acv_predict<br/>Company ACV Prediction<br/>Output: ct-data-science-v2.acv.*]
        DAG3[ds_bad_day_all_predict_specific_build<br/>Contact Book-a-Demo Prediction<br/>Output: ct-dbt.stg.*]
    end

    subgraph MainDAG["🔄 DAG: bigquery_to_mysql_ds_data<br/>Schedule: Every hour at minute 5"]
        START[start_sync]
        
        subgraph Sensors["External Task Sensors"]
            WAIT1[wait_for_cp_predict]
            WAIT2[wait_for_acv_predict]
            WAIT3[wait_for_bad_prod_predict]
        end
        
        subgraph CompanyFlow["Company Predictions Flow"]
            COMP_SYNC[bq_to_mysql_stg_stg_ds_to_de_cp<br/>Source: ct-dbt.stg.stg_ds_to_de_cp]
        end
        
        END_SYNC[end_sync]
        
        subgraph ContactScoreSync["Contact Score Syncs - Parallel"]
            CP_SYNC[bq_to_mysql_cp_ds_cp_contact_table_score<br/>→ bi.contact_cp_score]
            ACV_SYNC[bq_to_mysql_acv_ds_acv_contact_table_score<br/>→ bi.contact_acv_score]
        end
        
        subgraph ContactMerge["Contact Prediction Merge"]
            MERGE[trigger_update_contact_predictions<br/>Kubernetes Operator<br/>contact_conversions_logic.py]
        end
        
        END_CONTACT[end_contact_sync]
    end

    subgraph MySQL["🗄️ MYSQL DATABASE bi.*"]
        DB1[company_conversion_probability<br/>company, cp1, cp1_arpu, cp3, cp3_arpu<br/>employees_range_*]
        DB2[contact_cp_score<br/>Contact CP scores]
        DB3[contact_acv_score<br/>Contact ACV scores]
        DB4[contact_conversion_probability<br/>combined1/3_conversion_probability<br/>cp1/3_signup_first_value<br/>book_a_demo_1/3_probability]
    end

    subgraph Workers["⚙️ CONVERSION WORKERS - Timed Runners"]
        W1[GoogleConversionRunner<br/>Interval: 30 min<br/>google_conversion_sub.py]
        W2[FacebookConversionRunner<br/>Interval: 60 min<br/>facebook_conversion_sub.py]
        W3[BingConversionRunner<br/>Interval: 60 min<br/>bing_conversion_sub.py]
    end

    subgraph WorkerLogic["📋 WORKER LOGIC"]
        L1[Google Logic<br/>Channels: cpc-google*<br/>Click IDs: gclid/wbraid/gbraid<br/>Date Range: 8 days]
        L2[Facebook Logic<br/>Channel: cpc-facebook<br/>Click IDs: fbclid, fbp<br/>Date Range: 7 days]
        L3[Bing Logic<br/>Channels: cpc-bing*<br/>Click ID: msclkid<br/>Date Range: 8 days]
    end

    subgraph Dedup["🔒 DEDUPLICATION & FILTERING"]
        D1[bi.google_conversion<br/>bi.generic_conversions<br/>Filter: legitimacy]
        D2[bi.facebook_conversion_v2<br/>Filter: spam, corrupted phones<br/>CA consent check]
        D3[bi.bing_conversion<br/>bi.generic_conversions<br/>Filter: legitimacy]
    end

    subgraph APIs["🌐 ADVERTISING PLATFORM APIs"]
        A1[Google Ads API<br/>create_batch_offline_conversions<br/>Customer IDs: 3625606301+]
        A2[Facebook Conversion API<br/>v18.0 - Pixel: 1459709444231724<br/>User Data + Custom Data<br/>Batch Size: 500]
        A3[Bing Ads API<br/>send_offline_conversion<br/>No batching]
    end

    subgraph Audit["📊 AUDIT TRAIL TABLES"]
        AU1[bi.google_conversion<br/>clid, clid_type, company<br/>conversion_type, value, error]
        AU2[bi.facebook_conversion_v2<br/>conversion_id, fbclid, fbp<br/>external_id, email, phone]
        AU3[bi.bing_conversion<br/>clid, company<br/>conversion_type, visit_time]
    end

    %% External DAGs to Main DAG
    DAG1 --> WAIT1
    DAG2 --> WAIT2
    DAG3 --> WAIT3

    %% Main DAG Flow
    START --> Sensors
    WAIT1 --> COMP_SYNC
    WAIT2 --> COMP_SYNC
    WAIT1 --> CP_SYNC
    WAIT2 --> CP_SYNC
    WAIT1 --> ACV_SYNC
    WAIT2 --> ACV_SYNC
    COMP_SYNC --> END_SYNC
    END_SYNC --> ContactScoreSync
    CP_SYNC --> MERGE
    ACV_SYNC --> MERGE
    MERGE --> END_CONTACT

    %% MySQL writes
    COMP_SYNC --> DB1
    CP_SYNC --> DB2
    ACV_SYNC --> DB3
    MERGE --> DB4

    %% Workers read from MySQL
    DB1 --> Workers
    DB4 --> Workers

    %% Worker to Logic
    W1 --> L1
    W2 --> L2
    W3 --> L3

    %% Logic to Dedup
    L1 --> D1
    L2 --> D2
    L3 --> D3

    %% Dedup to APIs
    D1 --> A1
    D2 --> A2
    D3 --> A3

    %% APIs to Audit
    A1 --> AU1
    A2 --> AU2
    A3 --> AU3

    style ExternalDAGs fill:#e8f5e9,stroke:#2e7d32
    style MainDAG fill:#e3f2fd,stroke:#1976d2
    style MySQL fill:#fff8e1,stroke:#f9a825
    style Workers fill:#fce4ec,stroke:#c2185b
    style APIs fill:#fff3e0,stroke:#f57c00
    style Audit fill:#f3e5f5,stroke:#7b1fa2
`;

export const offlineConversionsFlowData = {
  title: "Offline Conversions Flow",
  category: "Marketing",
  createdDate: "2025-11-25",
  description: "Complete flow from DS model predictions to advertising platform APIs for offline conversion tracking",
  
  workers: [
    { 
      name: "GoogleConversionRunner", 
      file: "matrix/worker/google_conversion/google_conversion_sub.py", 
      risk: "P1",
      interval: "1800s (30 min)",
      description: "Sends conversions to Google Ads API"
    },
    { 
      name: "FacebookConversionRunner", 
      file: "matrix/worker/facebook_conversion/facebook_conversion_sub.py", 
      risk: "P1",
      interval: "3600s (60 min)",
      description: "Sends conversions to Facebook Conversion API"
    },
    { 
      name: "BingConversionRunner", 
      file: "matrix/worker/bing_conversion/bing_conversion_sub.py", 
      risk: "P1",
      interval: "3600s (60 min)",
      description: "Sends conversions to Bing Ads API"
    }
  ],

  dags: [
    { 
      name: "ds_cp_predict", 
      file: "External DAG",
      output: "ct-data-science-v2.cp.*",
      description: "Company CP Prediction (Company Signup)"
    },
    { 
      name: "ds_acv_predict", 
      file: "External DAG",
      output: "ct-data-science-v2.acv.*",
      description: "Company ACV Prediction (Company Signup)"
    },
    { 
      name: "ds_bad_day_all_predict_specific_build", 
      file: "External DAG",
      output: "ct-dbt.stg.*",
      description: "Contact Book-a-Demo Prediction (BOD/BAD)"
    },
    { 
      name: "bigquery_to_mysql_ds_data", 
      file: "airflow-dags/bigquery_to_mysql_data_science_data.py",
      schedule: "5 * * * * (Every hour at minute 5)",
      description: "Syncs DS predictions from BigQuery to MySQL"
    }
  ],

  syncTasks: [
    {
      name: "wait_for_cp_predict",
      type: "ExternalTaskSensor",
      waitsFor: "ds_cp_predict"
    },
    {
      name: "wait_for_acv_predict",
      type: "ExternalTaskSensor",
      waitsFor: "ds_acv_predict"
    },
    {
      name: "wait_for_bad_prod_predict",
      type: "ExternalTaskSensor",
      waitsFor: "ds_bad_day_all_predict_specific_build"
    },
    {
      name: "bq_to_mysql_stg_stg_ds_to_de_cp",
      type: "BigQueryToMySQL",
      source: "ct-dbt.stg.stg_ds_to_de_cp",
      target: "bi.company_conversion_probability"
    },
    {
      name: "bq_to_mysql_cp_ds_cp_contact_table_score",
      type: "BigQueryToMySQL",
      source: "ct-data-science-v2.cp.ds_cp_contact_table_score",
      target: "bi.contact_cp_score"
    },
    {
      name: "bq_to_mysql_acv_ds_acv_contact_table_score",
      type: "BigQueryToMySQL",
      source: "ct-data-science-v2.acv.ds_acv_contact_table_score",
      target: "bi.contact_acv_score"
    },
    {
      name: "trigger_update_contact_predictions",
      type: "KubernetesOperator",
      logic: "contact_conversions_logic.py",
      description: "Merges CP + ACV scores into contact_conversion_probability"
    }
  ],
  
  tables: {
    read: [
      "company_conversion_probability", 
      "contact_conversion_probability", 
      "contact_cp_score",
      "contact_acv_score",
      "visits", 
      "company_interactions",
      "contact_interactions",
      "company_profile_meta_data"
    ],
    write: [
      "google_conversion",
      "facebook_conversion_v2",
      "bing_conversion",
      "generic_conversions"
    ],
    bigquery: [
      "ct-dbt.stg.stg_ds_to_de_cp",
      "ct-data-science-v2.cp.ds_cp_contact_table_score",
      "ct-data-science-v2.acv.ds_acv_contact_table_score"
    ]
  },

  conversionTypes: {
    google: [
      "MQL (11+, 51+, 101+)",
      "Signup (11+)",
      "Paid",
      "Lead Score 250+",
      "Started Funnel",
      "CP1 Conversions: cp1 11+ no ecl, cp1 signup funnel v3",
      "CP3 Conversions: cp3 11+ no ecl, cp3 signup funnel v3",
      "Signup with consent test"
    ],
    facebook: [
      "MQL (11+, 51+, 51-300, Midtier)",
      "Signup (11+, 500+, Added 5 users)",
      "Paid",
      "Lead Score 250+",
      "Started Funnel",
      "CP1 Conversions: cp1 11+ no ecl, cp1 signup funnel v3, cp1 1%/2%/5% (11+), cp1 ROAS ($1/$10/$100)",
      "CP3 Conversions: cp3 11+ no ecl, cp3 signup funnel v3, cp3 1%/2%/5%/15% (11+)",
      "Combined CP1: Combined1 with value, Combined1 without ACV, Combined1 (signup funnel)",
      "Server Events: Contact Book Demo, SU Contact Book Demo, SU (11+, Added 5 users), SU delayed test, SU without FBP, SU hashed external ID, Donate (Voyantis test)",
      "Demo Events: First Demo Booked (QA legacy/new), First Demo Done",
      "Lead Index Conversions"
    ],
    bing: [
      "MQL (11+, 51+, 101+, Midtier)",
      "Signup (11+, 51+, 101+, 500+)",
      "Paid",
      "Lead",
      "Started Funnel",
      "CP1 Conversions: CP1 11+ Intent Score, CP1 ALL Pred Paying Score",
      "CP3 Conversions: CP3 11+ Intent Score, CP3 ALL Pred Paying Score",
      "Combined CP1: Combined1 ALL, Combined1 11+ (signup funnel)",
      "Combined CP3: Combined3 ALL",
      "Book-a-Demo (BAD): Filled demo form 11+, Booked demo (v1 & v2), Combined BAD conversions"
    ]
  },

  clickTracking: {
    google: {
      channels: ["cpc-google*"],
      clickIds: ["gclid", "wbraid", "gbraid"],
      dateRange: "Last 8 days"
    },
    facebook: {
      channels: ["cpc-facebook"],
      clickIds: ["fbclid", "fbp"],
      dateRange: "Last 7 days"
    },
    bing: {
      channels: ["cpc-bing*"],
      clickIds: ["msclkid"],
      dateRange: "Last 8 days"
    }
  },

  apiDetails: {
    google: {
      endpoint: "create_batch_offline_conversions",
      customerIds: ["3625606301", "Multiple accounts"],
      batchSize: "Variable (API dependent)",
      queryBatchSize: 100000,
      dataSent: ["GCLID/WBRAID/GBRAID", "Conversion Name", "Conversion Time", "Conversion Value", "Visit Time", "User Agent", "IP Address", "Customer ID"]
    },
    facebook: {
      apiVersion: "v18.0",
      pixelId: "1459709444231724",
      eventSource: "WEBSITE",
      batchSize: 500,
      dataSent: ["Event ID", "Event Name", "FBC/FBP", "External ID", "PII (hashed)", "Value", "User Data (email, phone, IP, UA)"]
    },
    bing: {
      endpoint: "send_offline_conversion",
      batchSize: 1,
      dataSent: ["CLID (msclkid)", "Conversion Name", "Conversion Time", "Conversion Value", "Visit Time", "User Agent", "IP Address"]
    }
  },

  deduplication: {
    strategy: "Each platform checks its own audit table before sending",
    compositeKey: "(conversion_type, clid, company)",
    facebookKey: "event_id as deduplication key",
    purpose: "Prevents duplicate conversions to platforms"
  },

  validationGaps: {
    p0: [
      "No validation that wait tasks succeeded before proceeding to sync",
      "No validation that BigQuery source tables exist before sync starts",
      "No row count checks after BigQuery → MySQL sync operations",
      "No validation that contact scores are merged correctly",
      "No alerting for contact score sync failures"
    ],
    p1: [
      "No validation at conversion worker level (workers read from MySQL blindly)",
      "No Pydantic DTOs for conversion data",
      "Minimal error handling in batch processing",
      "No metrics for failed conversions",
      "No monitoring of prediction data freshness",
      "No validation of click ID format (gclid, fbclid, msclkid)",
      "No retry logic for transient API failures"
    ],
    p2: [
      "No validation that contact_conversion_probability has all expected records after merge",
      "No check that merged predictions align with source scores",
      "No validation that company predictions contain all active companies",
      "Race conditions possible if DS models haven't fully written to BigQuery when wait task completes",
      "No monitoring of conversion upload success rates",
      "No tracking of API response times",
      "No alerts for unusual conversion volumes"
    ]
  },

  timing: {
    airflowSync: "Every hour at minute 5",
    googleConversions: "Every 30 minutes (1800s)",
    facebookConversions: "Every 60 minutes (3600s)",
    bingConversions: "Every 60 minutes (3600s)"
  },

  recommendations: {
    p0: [
      "Add wait task validation to verify external DAG success",
      "Add post-sync row count checks between BigQuery and MySQL",
      "Add contact merge validation to verify merged counts"
    ],
    p1: [
      "Add Pydantic models for conversion row validation",
      "Implement retry logic for transient API failures",
      "Add comprehensive metrics for conversion success/failure rates",
      "Monitor prediction data freshness in conversion workers"
    ],
    p2: [
      "Track DAG duration trends",
      "Alert on unusually long wait times",
      "Daily row count trends for all tables",
      "Alert if conversion upload rates drop"
    ]
  }
};

export default offlineConversionsFlowData;
