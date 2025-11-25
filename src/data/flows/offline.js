export const offlineConversionsFlowDiagram = `
flowchart TD
    subgraph Airflow["🔄 AIRFLOW DAGS - DS Predictions"]
        A1[ds_cp_predict<br/>Contact Conversion Probability]
        A2[ds_acv_predict<br/>Annual Contract Value]
        A3[ds_bad_day_all_predict<br/>Book a Demo Predictions]
    end

    subgraph BigQuery["☁️ BIGQUERY"]
        B1[ct-data-science-v2.cp.*]
        B2[ct-data-science-v2.acv.*]
        B3[ct-dbt.stg.*]
    end

    subgraph Sync["🔄 DATA SYNC"]
        C[bigquery_to_mysql_ds_data<br/>Every hour at minute 5]
    end

    subgraph MySQL["🗄️ MYSQL DATABASE"]
        D1[company_conversion_probability<br/>CP1, CP3, ARPU]
        D2[contact_conversion_probability<br/>Combined1, Combined3, BAD]
    end

    subgraph Workers["⚙️ CONVERSION WORKERS"]
        E1[GoogleConversionRunner<br/>30 min interval]
        E2[FacebookConversionRunner<br/>60 min interval]
        E3[BingConversionRunner<br/>60 min interval]
    end

    subgraph Logic["📋 WORKER LOGIC"]
        F1[Filter: cpc-google*<br/>gclid/wbraid/gbraid<br/>Last 8 days]
        F2[Filter: cpc-facebook<br/>fbclid, fbp<br/>Last 7 days]
        F3[Filter: cpc-bing*<br/>msclkid<br/>Last 8 days]
    end

    subgraph Dedup["🔒 DEDUPLICATION"]
        G1[google_conversion table]
        G2[facebook_conversion_v2 table]
        G3[bing_conversion table]
    end

    subgraph APIs["🌐 AD PLATFORM APIs"]
        H1[Google Ads API<br/>create_batch_offline_conversions<br/>Batch: 2000]
        H2[Facebook Conversion API<br/>v18.0, Pixel 1459709444231724<br/>Batch: 500]
        H3[Bing Ads API<br/>send_offline_conversion<br/>No batch]
    end

    subgraph Output["📊 AD OPTIMIZATION"]
        I[Enhanced Conversion Tracking<br/>Lookalike Audiences<br/>Campaign Optimization]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    B1 --> C
    B2 --> C
    B3 --> C
    C --> D1
    C --> D2
    D1 --> Workers
    D2 --> Workers
    E1 --> F1
    E2 --> F2
    E3 --> F3
    F1 --> G1
    F2 --> G2
    F3 --> G3
    G1 --> H1
    G2 --> H2
    G3 --> H3
    H1 --> I
    H2 --> I
    H3 --> I

    style Airflow fill:#e8f5e9,stroke:#2e7d32
    style Sync fill:#e8f5e9,stroke:#2e7d32
    style Workers fill:#e3f2fd,stroke:#1976d2
    style APIs fill:#fff3e0,stroke:#f57c00
    style Output fill:#f3e5f5,stroke:#7b1fa2
`;

export const offlineConversionsFlowData = {
  title: "Offline Conversions Flow",
  category: "Marketing",
  createdDate: "2025-11-25",
  description: "DS model predictions to advertising platform APIs for conversion tracking",
  
  workers: [
    { 
      name: "GoogleConversionRunner", 
      file: "matrix/worker/google_conversion/google_conversion_sub.py", 
      risk: "P1",
      description: "Sends conversions to Google Ads API every 30 minutes"
    },
    { 
      name: "FacebookConversionRunner", 
      file: "matrix/worker/facebook_conversion/facebook_conversion_sub.py", 
      risk: "P1",
      description: "Sends conversions to Facebook Conversion API every hour"
    },
    { 
      name: "BingConversionRunner", 
      file: "matrix/worker/bing_conversion/bing_conversion_sub.py", 
      risk: "P1",
      description: "Sends conversions to Bing Ads API every hour"
    }
  ],

  dags: [
    { 
      name: "ds_cp_predict_dag", 
      file: "airflow-dags/ds_cp_predict_dag.py",
      description: "Critical Path prediction model"
    },
    { 
      name: "ds_acv_predict_dag", 
      file: "airflow-dags/ds_acv_predict_dag.py",
      description: "Annual Contract Value prediction model"
    },
    { 
      name: "ds_bad_day_all_predict_dag", 
      file: "airflow-dags/ds_bad_day_all_predict_specific_build_dag.py",
      description: "Book a Demo prediction model"
    },
    { 
      name: "bigquery_to_mysql_ds_data", 
      file: "airflow-dags/bigquery_to_mysql_data_science_data.py",
      description: "Syncs DS predictions from BigQuery to MySQL"
    }
  ],
  
  tables: {
    read: [
      "company_conversion_probability", 
      "contact_conversion_probability", 
      "visits", 
      "company_interactions",
      "company_profile_meta_data"
    ],
    write: [
      "google_conversion",
      "facebook_conversion_v2",
      "bing_conversion",
      "generic_conversions"
    ]
  },

  conversionTypes: {
    google: [
      "MQL (11+, 51+, 101+)",
      "Signup (11+)",
      "Paid",
      "Lead Score 250+",
      "Started Funnel",
      "CP1/CP3 Conversions"
    ],
    facebook: [
      "MQL (11+, 51+, Midtier)",
      "Signup (11+, 500+, Added 5 users)",
      "Server Events (Book Demo, SU)",
      "Combined CP1/CP3",
      "Lead Index Conversions"
    ],
    bing: [
      "MQL (11+, 51+, 101+, Midtier)",
      "Signup (11+, 51+, 101+, 500+)",
      "CP1/CP3 Conversions",
      "Book-a-Demo Conversions"
    ]
  },

  validationGaps: {
    p0: [
      "contact_conversion_probability: combined1_conversion_probability_predicted must be NOT NULL when combined1_conversion_name is NOT NULL"
    ],
    p1: [
      "Conversion workers: No validation of click ID format (gclid, fbclid, msclkid)",
      "Conversion workers: No validation of API rate limits",
      "No retry logic for transient API failures",
      "No validation that DS predictions are fresh"
    ],
    p2: [
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
  }
};

export default offlineConversionsFlowData;

