export const paymentsFlowDiagram = `
flowchart TD
    subgraph Sources["💳 PAYMENT EVENT SOURCES"]
        S1[Chargebee Webhooks<br/>Primary Source]
        S2[Matrix Admin APIs<br/>CS/Sales Tools]
        S3[Product/Website<br/>User Actions]
    end

    subgraph AdminAPIs["🔧 ADMIN APIs"]
        A1[PaymentRequestHandler]
        A2[ChangePlanHandler]
        A3[OneTimeChargeHandler]
    end

    subgraph Chargebee["☁️ CHARGEBEE"]
        CB[Chargebee API<br/>Source of Truth]
    end

    subgraph Webhook["📥 WEBHOOK PROCESSING"]
        W1[POST /PaymentEvents/<br/>FinanceRequestHandler]
        W2[PaymentEventModel Created]
    end

    subgraph Topics["📨 PUB/SUB TOPICS"]
        T1[Topic.generic_db_data]
        T2[Topic.payments_webhook]
    end

    subgraph DbWriter["💾 RAW DATA"]
        DB1[DbWriterRunner]
        DB2[payment_events table<br/>Raw webhook data]
    end

    subgraph Workers["⚙️ PAYMENT WORKERS"]
        PW1[PaymentRunner<br/>Subscriptions, MRR calc]
        PW2[TransactionPaymentRunner<br/>Payment transactions]
        PW3[CompanyFreeMonthsWorker<br/>Free months tracking]
    end

    subgraph MRR["📊 MRR CALCULATION"]
        M1[Base Plan MRR]
        M2[Addon MRR<br/>ops, hr, comms, seats]
        M3[Discount MRR<br/>Coupons]
        M4[sales_effective_mrr<br/>After free months]
    end

    subgraph Tables["🗄️ DATABASE TABLES"]
        TB1[subscription_events<br/>calculatedMRR, seats]
        TB2[transaction_payments<br/>Revenue tracking]
        TB3[chargebee_invoices<br/>Dunning management]
    end

    subgraph Downstream["📤 DOWNSTREAM UPDATES"]
        D1[CompanyMetadataWorker<br/>currentMrr, collections]
        D2[CompanyArrRangeWorker<br/>ARR categorization]
        D3[CompanyPaymentsStatusWorker<br/>Payment status]
        D4[InvoiceTrackingWorker<br/>Invoice management]
    end

    subgraph Output["📊 OUTPUT TABLES"]
        O1[company_profile_metadata<br/>MRR, collections]
        O2[company_profile_arr_range]
        O3[company_payments_status]
    end

    subgraph External["🔄 EXTERNAL SYNC"]
        E1[HubSpot Sync<br/>CRM data]
        E2[Canny Sync<br/>Feature voting]
    end

    S2 --> AdminAPIs
    S3 --> CB
    AdminAPIs --> CB
    S1 --> W1
    CB --> W1
    W1 --> W2
    W2 --> T1
    W2 --> T2
    T1 --> DbWriter
    DbWriter --> DB2
    T2 --> Workers
    PW1 --> MRR
    MRR --> TB1
    PW2 --> TB2
    Workers --> D1
    Workers --> D2
    Workers --> D3
    PW1 --> D4
    D4 --> TB3
    D1 --> O1
    D2 --> O2
    D3 --> O3
    O1 --> External
    O2 --> External

    style Sources fill:#e3f2fd,stroke:#1976d2
    style Chargebee fill:#fff3e0,stroke:#f57c00
    style Workers fill:#e3f2fd,stroke:#1976d2
    style MRR fill:#f3e5f5,stroke:#7b1fa2
    style External fill:#e8f5e9,stroke:#2e7d32
`;

export const paymentsFlowData = {
  title: "Payments Processing Flow",
  category: "Payments",
  createdDate: "2025-11-25",
  description: "Complete payment processing architecture from Chargebee webhooks through MRR calculations to CRM sync",
  
  workers: [
    { 
      name: "PaymentRunner", 
      file: "matrix/worker/subscribers/payments/payment_sub.py", 
      risk: "P0",
      description: "Processes subscriptions, calculates MRR with coupons/addons"
    },
    { 
      name: "TransactionPaymentRunner", 
      file: "matrix/worker/subscribers/payments/transaction_payments_sub.py", 
      risk: "P0",
      description: "Processes payment transactions, calculates USD amounts"
    },
    { 
      name: "CompanyMetadataWorker", 
      file: "matrix/worker/subscribers/company_profile/company_metadata_worker.py", 
      risk: "P0",
      description: "Updates company MRR, collections, conversion timestamps"
    },
    { 
      name: "InvoiceTrackingWorker", 
      file: "matrix/worker/subscribers/invoice_tracking/invoice_tracking_worker.py", 
      risk: "P1",
      description: "Tracks invoice status and dunning management"
    },
    { 
      name: "CompanyPaymentsStatusWorker", 
      file: "matrix/worker/subscribers/company_payments_status/company_payments_status_worker.py", 
      risk: "P1",
      description: "Tracks payment status for HubSpot sync"
    },
    { 
      name: "CompanyArrRangeRunner", 
      file: "matrix/worker/subscribers/company_arr_range/company_arr_range_worker.py", 
      risk: "P1",
      description: "Calculates ARR from MRR for segmentation"
    }
  ],
  
  tables: {
    read: [
      "payment_events", 
      "company_profile_meta_data"
    ],
    write: [
      "payment_events", 
      "subscription_events", 
      "transaction_payments", 
      "chargebee_invoices", 
      "company_payments_status", 
      "company_profile_metadata", 
      "company_profile_arr_range"
    ]
  },

  eventSources: [
    {
      name: "Chargebee Webhooks",
      description: "Primary source - subscription lifecycle events",
      events: ["subscription_created", "subscription_renewed", "subscription_cancelled", "payment_succeeded", "payment_failed", "invoice_generated"]
    },
    {
      name: "Matrix Admin APIs",
      description: "CS/Sales tools for subscription management",
      handlers: ["PaymentRequestHandler", "ChangePlanHandler", "OneTimeChargeHandler"]
    },
    {
      name: "Product/Website",
      description: "User-initiated subscription changes",
      actions: ["Plan upgrades/downgrades", "Seat changes", "Discount codes"]
    }
  ],

  mrrCalculation: {
    components: [
      "Base Plan MRR (adjusted for billing period)",
      "Addon MRR (seats, ops, hr, comms bundles)",
      "Discount MRR (coupons - fixed and percentage)",
      "Sales Effective MRR (after free months)"
    ],
    couponOrder: [
      "1. Fixed amount to specific items",
      "2. Percentage to specific items",
      "3. Fixed amount to invoice total",
      "4. Percentage to invoice total"
    ]
  },

  validationGaps: {
    p0: [
      "subscription_events: calculatedMRR, sales_effective_mrr no >= 0 constraint",
      "transaction_payments: No amount validation (must be > 0)",
      "PaymentRunner: No pre-validation of MRR calculations",
      "TransactionPaymentRunner: No exchange rate validation (must be > 0)",
      "CompanyMetadataWorker: No MRR field validation before DB write",
      "company_profile_metadata: currentMrr, effective_mrr, collections no >= 0 validation"
    ],
    p1: [
      "payment_events: No eventType enum validation",
      "subscription_events: No status enum validation",
      "PaymentRunner: No coupon validation (discount amount reasonable)",
      "No webhook signature verification",
      "company_payments_status: No enum validation for status/context"
    ],
    p2: [
      "No comprehensive unit tests for validation paths",
      "No monitoring dashboards for validation errors",
      "No alerts for negative MRR values"
    ]
  },

  businessImpact: {
    p0: [
      "Negative MRR → Underreported revenue",
      "Missing subscription events → Lost revenue tracking",
      "Incorrect exchange rates → Wrong USD revenue",
      "Corrupted transaction amounts → Wrong collections total"
    ],
    p1: [
      "Invalid MRR synced to HubSpot → Sales targets wrong",
      "Invalid ARR ranges → CS assignment wrong",
      "Invalid payment status → CS follows up incorrectly"
    ]
  }
};

export default paymentsFlowData;

