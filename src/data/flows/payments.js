export const paymentsFlowDiagram = `
flowchart TD
    subgraph Sources["💳 PAYMENT EVENT SOURCES"]
        S1[Chargebee Webhooks<br/>Primary Source]
        S2[Matrix Admin APIs<br/>CS/Sales Tools]
        S3[Product/Website<br/>User Actions]
    end

    subgraph AdminAPIs["🔧 ADMIN APIs"]
        subgraph PlanPaymentMgmt["Plan/Payment Management"]
            A1[PaymentRequestHandler<br/>AdminConnecteamApi.post]
            A2[ChangePlanHandler<br/>AdminConnecteamApi.post]
        end
        subgraph InvoiceBilling["Invoice/Billing Operations"]
            A3[OneTimeChargeHandler<br/>chargebee.Invoice.create]
            A3a[⚠️ DIRECT Chargebee Call]
        end
    end

    subgraph ProductAPI["🌐 PRODUCT API"]
        PA[Product API<br/>pymobi / get_pymobi_url]
    end

    subgraph Chargebee["☁️ CHARGEBEE"]
        CB[Chargebee API<br/>Source of Truth]
    end

    subgraph Webhook["📥 WEBHOOK PROCESSING"]
        W1[POST /bi/api/PaymentEvents/<br/>finance_router.py:64-87]
        W2[PaymentEventModel Created]
        W3[⚠️ NO SIGNATURE VERIFICATION]
    end

    subgraph Topics["📨 PUB/SUB TOPICS"]
        T1[Topic.generic_db_data]
        T2[Topic.payments_webhook]
        T3[Topic.invoice_tracking]
        T4[Topic.company_payment_status_event]
        T5[Topic.company_metadata_changed]
    end

    subgraph DbWriter["💾 RAW DATA"]
        DB1[DbWriterRunner]
        DB2[payment_events table<br/>Raw webhook data]
    end

    subgraph Workers["⚙️ PAYMENT WORKERS (6)"]
        PW1[PaymentRunner<br/>payment_sub.py<br/>Queue: matrix.payment_2_subscriptions]
        PW2[TransactionPaymentRunner<br/>transaction_payments_sub.py<br/>Queue: matrix.transaction_payments]
        PW3[CompanyDiscountStatusWorker<br/>company_discount_status_worker.py<br/>Queue: matrix.company_discount_status]
    end

    subgraph MRR["📊 MRR CALCULATION"]
        M1[Base Plan MRR]
        M2[Addon MRR<br/>ops, hr, comms, seats]
        M3[Discount MRR<br/>Coupons]
        M4[sales_effective_mrr<br/>After free months]
    end

    subgraph Tables["🗄️ DATABASE TABLES (7 Write)"]
        TB1[subscription_events<br/>calculatedMRR, seats]
        TB2[transaction_payments<br/>Revenue tracking]
        TB3[chargebee_invoices<br/>Dunning management]
        TB4[company_current_discount]
    end

    subgraph Downstream["📤 DOWNSTREAM WORKERS"]
        D1[CompanyProfileMetaDataRunner<br/>company_metadata_worker.py<br/>Queue: matrix.company_profile_metadata]
        D2[CompanyArrRangeWorker<br/>company_arr_range_worker.py]
        D3[CompanyPaymentsStatusWorker<br/>company_payments_status_worker.py<br/>Queue: matrix.company_payments_status]
        D4[InvoiceTrackingWorker<br/>invoice_tracking_worker.py<br/>Queue: matrix.invoice_tracking]
    end

    subgraph Output["📊 OUTPUT TABLES"]
        O1[company_profile_meta_data<br/>currentMrr, effective_mrr]
        O2[company_profile_arr_range]
        O3[company_payments_status]
    end

    subgraph External["🔄 EXTERNAL SYNC"]
        E1[HubSpot Sync<br/>Topic.company_payment_status_changed]
        E2[Canny Sync<br/>Feature voting]
    end

    %% Admin APIs flow - SPLIT into two paths
    S2 --> AdminAPIs
    
    %% Path 1: Plan/Payment handlers go through Product API
    A1 --> PA
    A2 --> PA
    PA --> CB
    
    %% Path 2: OneTimeChargeHandler goes DIRECTLY to Chargebee
    A3 --> A3a
    A3a -->|chargebee.Invoice.create| CB
    
    %% Product/Website also goes through Product API
    S3 --> PA
    
    %% Chargebee sends webhooks back to Matrix
    CB -->|webhooks| W1
    S1 --> W1
    W1 --> W2
    W1 --> W3
    W2 --> T1
    W2 --> T2
    
    %% Raw data storage
    T1 --> DbWriter
    DbWriter --> DB2
    
    %% Payment workers subscribe to payments_webhook
    T2 --> PW1
    T2 --> PW2
    T2 --> PW3
    
    %% PaymentRunner publishes to downstream topics
    PW1 -->|Topic.invoice_tracking| T3
    PW1 -->|Topic.company_payment_status_event| T4
    PW1 -->|Topic.company_metadata_changed| T5
    
    %% MRR calculation
    PW1 --> MRR
    MRR --> TB1
    PW2 --> TB2
    PW3 --> TB4
    
    %% Downstream workers subscribe to their topics
    T3 --> D4
    T4 --> D3
    T5 --> D1
    T2 --> D1
    
    D4 --> TB3
    D1 --> O1
    D2 --> O2
    D3 --> O3
    
    %% External sync
    D3 -->|Topic.company_payment_status_changed| E1
    O1 --> External
    O2 --> External

    style Sources fill:#e3f2fd,stroke:#1976d2
    style ProductAPI fill:#e8f5e9,stroke:#2e7d32
    style Chargebee fill:#fff3e0,stroke:#f57c00
    style Workers fill:#e3f2fd,stroke:#1976d2
    style MRR fill:#f3e5f5,stroke:#7b1fa2
    style External fill:#e8f5e9,stroke:#2e7d32
    style Webhook fill:#ffebee,stroke:#c62828
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
      queue: "matrix.payment_2_subscriptions",
      risk: "P0",
      description: "Processes subscriptions, calculates MRR with coupons/addons",
      subscribesTo: ["Topic.payments_webhook", "company_events (payment:failed)", "Topic.free_months_changed"],
      publishes: ["Topic.invoice_tracking", "Topic.company_payment_status_event", "Topic.company_metadata_changed"]
    },
    { 
      name: "TransactionPaymentRunner", 
      file: "matrix/worker/subscribers/payments/transaction_payments_sub.py", 
      queue: "matrix.transaction_payments",
      risk: "P0",
      description: "Processes payment_succeeded/payment_refunded, calculates USD amounts",
      subscribesTo: ["Topic.payments_webhook"],
      writesTo: ["transaction_payments"]
    },
    { 
      name: "CompanyProfileMetaDataRunner", 
      file: "matrix/worker/subscribers/company_profile/company_metadata_worker.py", 
      queue: "matrix.company_profile_metadata",
      risk: "P0",
      description: "Updates company currentMrr, effective_mrr from payment events",
      subscribesTo: ["Topic.payments_webhook", "Topic.new_subscription_event", "multiple company_events"],
      writesTo: ["company_profile_meta_data"]
    },
    { 
      name: "CompanyPaymentsStatusWorker", 
      file: "matrix/worker/subscribers/company_payments_status/company_payments_status_worker.py",
      queue: "matrix.company_payments_status", 
      risk: "P1",
      description: "Tracks payment_failed/payment_succeeded/subscription_changed for HubSpot",
      subscribesTo: ["Topic.company_payment_status_event"],
      publishes: ["Topic.company_payment_status_changed"],
      writesTo: ["company_payments_status"]
    },
    { 
      name: "InvoiceTrackingWorker", 
      file: "matrix/worker/subscribers/invoice_tracking/invoice_tracking_worker.py",
      queue: "matrix.invoice_tracking", 
      risk: "P1",
      description: "Tracks invoice_generated/invoice_updated/invoice_deleted events",
      subscribesTo: ["Topic.invoice_tracking"],
      writesTo: ["chargebee_invoices"]
    },
    { 
      name: "CompanyDiscountStatusWorker", 
      file: "matrix/worker/subscribers/discount_status/company_discount_status_worker.py",
      queue: "matrix.company_discount_status", 
      risk: "P1",
      description: "Tracks discount status from payments and base seat changes",
      subscribesTo: ["Topic.payments_webhook", "Topic.company_base_seat_change", "Topic.company_discount_term_finished"],
      writesTo: ["company_current_discount"]
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
      "company_profile_meta_data", 
      "company_current_discount"
    ]
  },

  eventSources: [
    {
      name: "Chargebee Webhooks",
      description: "Primary source - subscription lifecycle events",
      endpoint: "POST /bi/api/PaymentEvents/",
      handler: "biengine/bi/api/finance/finance_router.py:64-87",
      publishes: "Topic.payments_webhook",
      events: ["subscription_created", "subscription_renewed", "subscription_cancelled", "payment_succeeded", "payment_failed", "invoice_generated"],
      securityGap: "⚠️ NO WEBHOOK SIGNATURE VERIFICATION"
    },
    {
      name: "Matrix Admin APIs - Plan/Payment Management",
      description: "CS/Sales tools for plan changes and payment requests",
      handlers: ["PaymentRequestHandler", "ChangePlanHandler"],
      implementation: "matrix/logic/web/AdminConnecteamApi.py:35-41",
      flow: "Admin APIs → Product API (pymobi) → Chargebee → Webhooks → Matrix",
      note: "Uses AdminConnecteamApi().post() → get_pymobi_url_by_environment()"
    },
    {
      name: "Matrix Admin APIs - Invoice/Billing Operations",
      description: "⚠️ DIRECT Chargebee calls - bypasses Product API",
      handlers: ["OneTimeChargeHandler"],
      implementation: "matrix/logic/company_profile/CompanyPaymentLogic.py:640-664",
      flow: "Admin APIs → Chargebee DIRECTLY → Webhooks → Matrix",
      note: "Uses chargebee.Invoice.create() - direct SDK call, NOT AdminConnecteamApi",
      securityNote: "Direct Chargebee access from Matrix - different auth path"
    },
    {
      name: "Product/Website",
      description: "User-initiated subscription changes via Product API",
      actions: ["Plan upgrades/downgrades", "Seat changes", "Discount codes"],
      flow: "Product → Chargebee → Webhooks → Matrix"
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
      "🔴 CRITICAL: No webhook signature verification in finance_router.py",
      "subscription_events: calculatedMRR, sales_effective_mrr no >= 0 constraint",
      "transaction_payments: No amount validation (must be > 0)",
      "PaymentRunner: No pre-validation of MRR calculations",
      "TransactionPaymentRunner: No exchange rate validation (must be > 0)",
      "CompanyMetadataWorker: No MRR field validation before DB write",
      "company_profile_meta_data: currentMrr, effective_mrr, collections no >= 0 validation"
    ],
    p1: [
      "payment_events: No eventType enum validation",
      "subscription_events: No status enum validation",
      "PaymentRunner: No coupon validation (discount amount reasonable)",
      "No Pydantic DTOs for payment event inputs",
      "company_payments_status: No enum validation for status/context"
    ],
    p2: [
      "No comprehensive unit tests for validation paths",
      "No monitoring dashboards for validation errors",
      "No alerts for negative MRR values",
      "No circuit breakers for external API calls"
    ]
  },

  businessImpact: {
    p0: [
      "🔴 Security: Fake payment events can corrupt revenue data",
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



