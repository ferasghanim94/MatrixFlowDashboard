export const attributionFlowDiagram = `
flowchart TD
    subgraph Sources["🎯 USER JOURNEY STARTS: AD CLICK"]
        A1[Google Ads<br/>gclid, wbraid, gbraid]
        A2[Facebook Ads<br/>fbclid, fbp]
        A3[Bing Ads<br/>msclkid]
        A4[LinkedIn Ads<br/>custom params]
    end

    subgraph Visit["🌐 WEBSITE VISIT"]
        B[Website Visit<br/>JavaScript tracking]
        C[Session Created<br/>client_id, session_id]
    end

    subgraph Stage1["📊 STAGE 1: SESSION → VISIT"]
        D[VisitsRunner<br/>sessions_to_visits_sub.py]
        E[bi.visits table<br/>Enriched data]
    end

    subgraph Stage2["🎯 STAGE 2: INTERACTION TOUCHPOINT"]
        F[create_interaction_from_visit]
        G[bi.interaction_touchpoints<br/>Normalized attribution]
    end

    subgraph ParallelFlows["⚡ PARALLEL FLOWS"]
        H1[Form Submissions<br/>LeadsRunner<br/>MarketingSiteFormsRunner]
        H2[Mobile Signups<br/>MobileSignupsWorker]
    end

    subgraph Stage3["🏢 STAGE 3: COMPANY ATTRIBUTION"]
        I[Company Signup Trigger<br/>CompanyEventModel]
        J[ClientAttributionRunner<br/>attribution_sub.py]
        K[Map Identifiers<br/>client_id → company]
        L[Recursive Discovery<br/>Max 5 hops]
        M[bi.company_interactions]
    end

    subgraph Models["📈 ATTRIBUTION MODELS"]
        N1[First-Touch<br/>company_profile_attribution]
        N2[Last-Touch<br/>company_profile_attribution_last]
        N3[First-Touch Limited<br/>28 days window]
    end

    subgraph Stage4["👤 STAGE 4: CONTACT ATTRIBUTION"]
        O[ContactAttributionRunner<br/>contact_attribution_sub.py]
        P[Connect Email to Client IDs]
        Q[bi.contact_interactions]
        R[contact_profile_attribution_first]
    end

    subgraph Stage5["⏰ STAGE 5: DELAYED RE-CALC"]
        S[DelayedAttributionRunner<br/>6 + 30 min delays]
    end

    subgraph Downstream["📤 DOWNSTREAM CONSUMERS"]
        T1[HubSpot Sync]
        T2[Reporting/Analytics]
        T3[Conversion Workers]
    end

    Sources --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> ParallelFlows
    ParallelFlows --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> Models
    Models --> S
    I --> O
    O --> P
    P --> Q
    Q --> R
    R --> S
    S -.-> J
    S -.-> O
    M --> Downstream
    R --> Downstream

    style Sources fill:#e0f2fe,stroke:#0284c7
    style Stage3 fill:#dbeafe,stroke:#2563eb
    style Stage4 fill:#dbeafe,stroke:#2563eb
    style Stage5 fill:#fef3c7,stroke:#d97706
    style Models fill:#f3e8ff,stroke:#9333ea
    style Downstream fill:#dcfce7,stroke:#16a34a
`;

export const attributionFlowData = {
  title: "Attribution Flow",
  category: "Marketing",
  createdDate: "2025-11-25",
  description: "Complete Marketing Attribution Flow from ad click through company and contact attribution",
  
  workers: [
    { 
      name: "VisitsRunner", 
      file: "matrix/worker/subscribers/visits/sessions_to_visits_sub.py", 
      risk: "P1",
      description: "Converts sessions to visits, enriches with channel data"
    },
    { 
      name: "ClientAttributionRunner", 
      file: "matrix/worker/subscribers/attribution/attribution_sub.py", 
      risk: "P0",
      description: "Company-level attribution with recursive discovery"
    },
    { 
      name: "ContactAttributionRunner", 
      file: "matrix/worker/subscribers/attribution/contact_attribution_sub.py", 
      risk: "P0",
      description: "Contact-level attribution, connects email to client IDs"
    },
    { 
      name: "DelayedAttributionRunner", 
      file: "matrix/worker/subscribers/attribution/delayed_attribution_worker.py", 
      risk: "P2",
      description: "Re-runs attribution after 6 and 30 minute delays"
    },
    { 
      name: "LeadsRunner", 
      file: "matrix/worker/subscribers/leads/leads_worker.py", 
      risk: "P1",
      description: "Processes form submissions and creates touchpoints"
    },
    { 
      name: "MobileSignupsWorker", 
      file: "matrix/worker/subscribers/mobile_signups/mobile_signups_worker.py", 
      risk: "P1",
      description: "Handles mobile app signups"
    }
  ],
  
  tables: {
    read: [
      "sessions_p", 
      "user_profile", 
      "contact_profile_metadata", 
      "company_profile_meta_data", 
      "interaction_touchpoints",
      "company_to_client_id",
      "company_to_email",
      "email_to_client_id"
    ],
    write: [
      "visits", 
      "interaction_touchpoints", 
      "company_interactions", 
      "contact_interactions", 
      "company_profile_attribution", 
      "company_profile_attribution_last", 
      "company_profile_attribution_first_limited", 
      "contact_profile_attribution_first",
      "company_to_client_id",
      "company_to_email"
    ]
  },
  
  topics: {
    subscribes: [
      "Topic.sessions",
      "company_events_webhook (companyCreated)",
      "event_hit (signup)",
      "new_contact_created",
      "new_interaction_touchpoint",
      "mobile_event_hit",
      "delayed_attribution_trigger"
    ],
    publishes: [
      "Topic.new_interaction_touchpoint",
      "Topic.company_post_attribution_event",
      "Topic.contact_update_attribution_to_hubspot",
      "Topic.delayed_attribution_trigger"
    ]
  },

  validationGaps: {
    p0: [
      "visits: client_id, session_id, dateCreated NOT NULL constraints missing",
      "sessions_p: client_id, session_id NOT NULL constraints missing",
      "interaction_touchpoints: date_created NOT NULL constraint missing",
      "ClientAttributionRunner: No validation of found touchpoints",
      "ContactAttributionRunner: No email format validation",
      "No validation that recursive discovery doesn't create cycles"
    ],
    p1: [
      "visits: No channel enum validation",
      "interaction_touchpoints: No email format validation",
      "VisitsRunner: No UUID validation for client_id/session_id",
      "LeadsRunner: No email hash collision detection",
      "No validation of channel derivation logic"
    ],
    p2: [
      "DelayedAttributionRunner: No validation of stale data",
      "No monitoring of attribution success/failure rates",
      "No tracking of recursive discovery depth"
    ]
  },

  keyMetrics: {
    timing: {
      visitsRunner: "Real-time (~1-5 seconds)",
      clientAttribution: "~1-2 seconds on signup",
      contactAttribution: "~1-2 seconds on contact creation",
      delayedAttribution: "6 + 30 minutes"
    },
    attributionModels: [
      "First-Touch (oldest interaction)",
      "Last-Touch (newest interaction)",
      "First-Touch Limited (28-day window)"
    ]
  }
};

export default attributionFlowData;

