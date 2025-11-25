export const companyFunnelFlowDiagram = `
flowchart TD
    subgraph Triggers["🎯 TRIGGER SOURCES"]
        A1[CompanyProfileMetaDataRunner<br/>Payment/Company events]
        A2[TablesUpdateRunner<br/>Manual data sync]
        A3[CompanyArrRangeRunner<br/>MRR changes]
        A4[LeadscoreEmptyDays<br/>Periodic task]
        A5[Lock Expiration Events<br/>CS Manager/Stage locks]
    end

    subgraph Queue["📨 PUB/SUB QUEUE"]
        B[matrix.company_journey_events]
    end

    subgraph Runner["⚙️ COMPANY JOURNEY RUNNER"]
        C[CompanyJourneyRunner<br/>company_journey_runner.py]
        D[Redis Lock<br/>company_journey_company]
    end

    subgraph Validation["✅ DATA VALIDATION"]
        E{Company Valid?}
        E1[Status != LEAD]
        E2[signupTimestamp NOT NULL]
        E3[numOfEmployeesRange NOT NULL]
    end

    subgraph CSStage["📊 CS STAGE DETERMINATION"]
        F{Priority Rules}
        F1[1. CHURN + CS EXISTS<br/>→ No change]
        F2[2. STAGE LOCKED<br/>→ Use locked stage]
        F3[3. SBP PLAN<br/>→ cs_sbp]
        F4[4. TRIAL/DEMO/FREE<br/>→ cs_sales]
        F5[5. ARR 1-2000<br/>→ cs_no_touch]
        F6[6. Subjectively Onboarded<br/>→ cs_success]
        F7[7. ARR 2001-8000 + 90 days<br/>→ cs_success]
        F8[8. Paying<br/>→ cs_onboarding]
        F9[9. Fallback<br/>→ cs_error]
    end

    subgraph Assignment["👤 MANAGER ASSIGNMENT"]
        G[CS Manager Assignment Logic]
        G1[Check Manual Lock]
        G2[Check Correct Bucket]
        G3[Check History]
        G4[Round-Robin Assignment]
    end

    subgraph Database["🗄️ DATABASE UPDATES"]
        H1[company_profile_meta_data<br/>CS manager, stage]
        H2[company_change_log<br/>Audit trail]
    end

    subgraph Output["📤 OUTPUT"]
        I{Changed?}
        I1[Publish company_journey_changed]
        I2[No event]
    end

    subgraph Downstream["🔄 DOWNSTREAM"]
        J1[HubSpot Company<br/>Property Updater]
        J2[Intercom Events<br/>Runner]
    end

    Triggers --> B
    B --> C
    C --> D
    D --> E
    E -->|Valid| F
    E -->|Invalid| I2
    F --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    F6 --> F7
    F7 --> F8
    F8 --> F9
    F --> G
    G --> G1
    G1 --> G2
    G2 --> G3
    G3 --> G4
    G4 --> H1
    H1 --> H2
    H2 --> I
    I -->|Yes| I1
    I -->|No| I2
    I1 --> Downstream

    style Triggers fill:#e3f2fd,stroke:#1976d2
    style Runner fill:#e3f2fd,stroke:#1976d2
    style CSStage fill:#f3e5f5,stroke:#7b1fa2
    style Assignment fill:#fff3e0,stroke:#f57c00
    style Downstream fill:#e8f5e9,stroke:#2e7d32
`;

export const companyFunnelFlowData = {
  title: "Company Funnel (CF) Flow",
  category: "CRM",
  createdDate: "2025-11-25",
  description: "Automatic assignment of Sales and Customer Success managers based on company attributes",
  
  workers: [
    { 
      name: "CompanyJourneyRunner", 
      file: "matrix/worker/subscribers/company_journey/company_journey_runner.py", 
      risk: "P0",
      description: "Main worker for CS stage determination and manager assignment"
    },
    { 
      name: "CompanyArrRangeWorker", 
      file: "matrix/worker/subscribers/company_arr_range/company_arr_range_worker.py", 
      risk: "P1",
      description: "Calculates ARR range from MRR for segmentation"
    },
    { 
      name: "HubspotCompanyWebhookSub", 
      file: "matrix/worker/subscribers/hubspot_events/hubspot_company_webhook_sub.py", 
      risk: "P1",
      description: "Syncs company data bidirectionally with HubSpot"
    },
    { 
      name: "CompanyProfileMetaDataRunner", 
      file: "matrix/worker/subscribers/company_profile/company_metadata_worker.py", 
      risk: "P0",
      description: "Updates company metadata, triggers journey events"
    }
  ],
  
  tables: {
    read: [
      "company_profile_meta_data", 
      "company_profile_arr_range", 
      "hubspot_company_property_value",
      "company_change_log",
      "business_cases", 
      "user_profile"
    ],
    write: [
      "company_profile_meta_data", 
      "company_change_log"
    ]
  },

  csStages: [
    { stage: "cs_sales", description: "Trial/Demo/Free plans (handled by Sales)", arrRange: "N/A" },
    { stage: "cs_sbp", description: "Small Business Plan", arrRange: "SBP plan" },
    { stage: "cs_no_touch", description: "Automated/minimal touch", arrRange: "$1-2,000" },
    { stage: "cs_onboarding", description: "New paying customers", arrRange: "Paying < 90 days" },
    { stage: "cs_success", description: "Established customers", arrRange: "$2,001-8,000 + >90 days" },
    { stage: "cs_error", description: "Requires manual review", arrRange: "Fallback" }
  ],

  topics: {
    subscribes: [
      "company_state_update_event",
      "company_arr_range_changed",
      "non_active_company_event",
      "cs_manager_lock_expiration",
      "cs_stage_lock_expiration"
    ],
    publishes: [
      "company_journey_changed"
    ]
  },

  validationGaps: {
    p0: [
      "CompanyProfileMetaData: No validation that cs_stage is valid enum",
      "CompanyProfileMetaData: No validation that manager IDs exist",
      "CompanyJourneyRunner: No validation of race conditions beyond RedisLock",
      "No validation that ARR range matches actual ARR value"
    ],
    p1: [
      "No validation that cs_manager_lock_expiration_timestamp is in future",
      "No validation that ARR range changes are reasonable (not jumping tiers instantly)",
      "No validation of manager bucket configuration"
    ],
    p2: [
      "No monitoring of manager assignment distribution",
      "No tracking of cs_error stage frequency",
      "No alerts for unbalanced CS assignments"
    ]
  },

  assignmentLogic: {
    steps: [
      "1. Check if CS Manager is manually locked → Keep existing",
      "2. Check if current CS Manager is in correct bucket → Keep existing",
      "3. Check history for matching CS Manager in correct bucket → Reassign",
      "4. Round-robin assign new CS Manager from correct bucket"
    ],
    bucketFilters: [
      "department = customer_success",
      "cs_stage matches company stage",
      "region matches company region",
      "arr_range matches company ARR"
    ]
  }
};

export default companyFunnelFlowData;

