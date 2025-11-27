# Payment Processing Flow Diagram

**Created:** 2025-11-27  
**Purpose:** Document the complete payment flow from Chargebee webhooks through Matrix processing to downstream systems (HubSpot, Canary, MRR calculations)

---

## ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT EVENT SOURCES                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ Product/Website     │ Matrix Admin APIs   │ Chargebee Webhooks                  │
│ User Actions        │ CS/Sales Tools      │ (Primary Source)                    │
└──────────┬──────────┴──────────┬──────────┴──────────────┬──────────────────────┘
           │                     │                         │
           ▼                     ▼                         │
┌─────────────────────────────────────────────────────────┐│
│                      ADMIN APIs                         ││
├─────────────────────────────┬───────────────────────────┤│
│ Plan/Payment Management     │ Invoice/Billing Operations││
│                             │                           ││
│ PaymentRequestHandler       │ ChangePlanHandler         ││
│ AdminConnecteamApi.post     │ AdminConnecteamApi.post   ││
│                             │                           ││
│                             │ OneTimeChargeHandler      ││
│                             │ chargebee.Invoice.create  ││
└─────────────────────────────┴───────────────────────────┘│
           │                                               │
           ▼                                               │
┌─────────────────────────────────────────────────────────┐│
│                     PRODUCT API                         ││
│                                                         ││
│  Product API                                            ││
│  pymnt_id / get_pymnt_url                               ││
│                                                         ││
│  ⚠️ DIRECT Chargebee Call                               ││
└─────────────────────────────────────────────────────────┘│
           │                                               │
           │                   chargebee.Invoice.create    │
           │                           │                   │
           └───────────────────────────┼───────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CHARGEBEE                                          │
│                                                                                 │
│                     ┌─────────────────────────────┐                             │
│                     │ Chargebee API               │                             │
│                     │ Source of Truth             │                             │
│                     └─────────────────────────────┘                             │
│                                                                                 │
│  Subscription Events:                                                           │
│  - subscription_created, subscription_changed, subscription_activated           │
│  - subscription_renewed, subscription_reactivated, subscription_cancelled       │
│  - subscription_trial_end_reminder, subscription_scheduled_cancellation_removed │
│                                                                                 │
│  Payment Events:                                                                │
│  - payment_succeeded, payment_refunded                                          │
│                                                                                 │
│  Invoice Events:                                                                │
│  - invoice_generated, invoice_updated                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ webhooks
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WEBHOOK PROCESSING                                      │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ POST /bi/api/PaymentEvents/                                               │  │
│  │ finance_router.py:64-87                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                         │
│                                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ PaymentEventModel Created                                                 │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ NO SIGNATURE VERIFICATION                                              │  │
│  │                                                                           │  │
│  │ CRITICAL P0 SECURITY GAP:                                                 │  │
│  │ No webhook signature verification - fake webhooks could corrupt data      │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PUB/SUB TOPICS                                         │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ Topic.payments_webhook                │ Topic.generic_db_data                   │
│ (Payment events)                      │ (Generic data sync)                     │
└───────────────────────────────────────┴─────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT WORKERS (6)                                     │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ TransactionPayment  │ CompanyDiscount     │ PaymentRunner                       │
│ Runner              │ StatusWorker        │                                     │
│                     │                     │                                     │
│ transaction_        │ company_discount_   │ payment_sub.py                      │
│ payments_sub.py     │ status_worker.py    │                                     │
│                     │                     │                                     │
│ Queue:              │ Queue:              │ Queue:                              │
│ matrix.transaction_ │ matrix.company_     │ matrix.payment_2_subscription       │
│ payments            │ discount_status     │                                     │
│                     │                     │                                     │
│ Events:             │ Events:             │ Events:                             │
│ - payment_succeeded │ - subscription_*    │ - subscription_created              │
│ - payment_refunded  │ - coupon_*          │ - subscription_changed              │
│                     │                     │ - subscription_activated            │
│                     │                     │ - subscription_renewed              │
│                     │                     │ - subscription_reactivated          │
│                     │                     │ - subscription_cancelled            │
│                     │                     │ - subscription_trial_end_reminder   │
│                     │                     │ - subscription_scheduled_           │
│                     │                     │   cancellation_removed              │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RAW DATA                                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ DbWriterRunner                                                          │    │
│  │                                                                         │    │
│  │ Writes to: payment_events table                                         │    │
│  │ (Raw webhook data storage)                                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           │    Topic.invoice_tracking │ Topic.company_metadata_   │ Topic.company_payment_
           │                           │ changed                   │ status_event
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DOWNSTREAM WORKERS                                      │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ InvoiceTracking     │ CompanyProfile      │ CompanyPayments                     │
│ Worker              │ MetaDataRunner      │ StatusWorker                        │
│                     │                     │                                     │
│ invoice_tracking_   │ company_metadata_   │ company_payments_                   │
│ worker.py           │ worker.py           │ status_worker.py                    │
│                     │                     │                                     │
│ Queue:              │ Queue:              │ Queue:                              │
│ matrix.invoice_     │ matrix.company_     │ matrix.company_                     │
│ tracking            │ profile_metadata    │ payments_status                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
           │                           │                           │
           │                           │                           │
           │                           │                           ▼
           │                           │           ┌─────────────────────────────┐
           │                           │           │ CompanyArrRangeWorker       │
           │                           │           │                             │
           │                           │           │ company_arr_range_worker.py │
           │                           │           │                             │
           │                           │           │ Calculates ARR range from   │
           │                           │           │ MRR for CS stage assignment │
           │                           │           └─────────────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MRR CALCULATION                                            │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ Base Plan MRR       │ Addon MRR           │ Discount MRR                        │
│                     │ ops, hr, comms,     │ Coupons                             │
│                     │ seats               │                                     │
│                     │                     │                                     │
│                     │                     │ ↓                                   │
│                     │                     │                                     │
│                     │                     │ sales_effective_mrr                 │
│                     │                     │ After free months                   │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
                    Topic.company_payment_status_changed
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE TABLES (7 Write)                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ subscription_events │ transaction_        │ chargebee_invoices                  │
│ calculateMRR, seats │ payments            │ Dunning management                  │
│                     │ Revenue tracking    │                                     │
├─────────────────────┼─────────────────────┼─────────────────────────────────────┤
│ company_current_    │                     │                                     │
│ discount            │                     │                                     │
│ currentPrice,       │                     │                                     │
│ effective_mrr       │                     │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT TABLES                                           │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│ company_profile_    │ company_profile_    │ company_payments_status             │
│ meta_data           │ arr_range           │                                     │
│                     │                     │                                     │
│ Status, planId,     │ ARR segmentation    │ Payment status history              │
│ MRR fields          │ for CS routing      │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SYNC                                          │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ HubSpot Sync                          │ Canary Sync                             │
│ Topic.company_payment_status_changed  │ Feature voting                          │
│                                       │                                         │
│ Updates HubSpot company properties:   │ Updates Canary with payment status      │
│ - MRR, ARR, plan details              │ for feature access control              │
│ - Payment status                      │                                         │
│ - Subscription info                   │                                         │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## Key Data Points

### Timing
- **Webhook Processing:** Real-time (event-driven)
- **MRR Calculation:** Triggered on each subscription event
- **External Sync:** Real-time via Pub/Sub

### Chargebee Event Types
| Category | Events |
|----------|--------|
| Subscription | subscription_created, subscription_changed, subscription_activated, subscription_renewed, subscription_reactivated, subscription_cancelled, subscription_trial_end_reminder, subscription_scheduled_cancellation_removed |
| Payment | payment_succeeded, payment_refunded |
| Invoice | invoice_generated, invoice_updated |

### MRR Components
| Component | Description |
|-----------|-------------|
| Base Plan MRR | Core subscription cost |
| Addon MRR | ops, hr, comms, seats add-ons |
| Discount MRR | Coupon discounts applied |
| sales_effective_mrr | Net MRR after free months and discounts |

### ARR Ranges (for CS Routing)
| Range | CS Stage |
|-------|----------|
| $1-2,000 | cs_no_touch |
| $2,001-8,000 | cs_success (if paying > 90 days) |
| $8,001+ | cs_onboarding or cs_success |

---

## Critical Dependencies

### Input Events (Chargebee Webhooks)
| Event | Processing Worker | Description |
|-------|-------------------|-------------|
| subscription_* | PaymentRunner | Subscription lifecycle events |
| payment_succeeded | TransactionPaymentRunner | Successful payment |
| payment_refunded | TransactionPaymentRunner | Payment refund |
| coupon_* | CompanyDiscountStatusWorker | Coupon/discount changes |

### Output Events (Published Topics)
| Topic | Publisher | Consumers |
|-------|-----------|-----------|
| company_metadata_changed | PaymentRunner | CompanyProfileMetaDataRunner |
| company_payment_status_event | PaymentRunner | CompanyPaymentsStatusWorker |
| invoice_tracking | PaymentRunner | InvoiceTrackingWorker |
| company_payment_status_changed | CompanyPaymentsStatusWorker | HubSpot Sync, Canary Sync |
| new_subscription_event | PaymentRunner | CompanyArrRangeWorker |

### Database Tables
**Read:**
- `bi.company_profile_meta_data` - Company information
- `bi.subscription_events` - Subscription history
- `bi.chargebee_invoices` - Invoice data

**Write:**
- `bi.payment_events` - Raw webhook data
- `bi.subscription_events` - Subscription changes, MRR calculations
- `bi.transaction_payments` - Payment transactions
- `bi.chargebee_invoices` - Invoice records
- `bi.company_current_discount` - Active discounts
- `bi.company_profile_meta_data` - Company status updates
- `bi.company_profile_arr_range` - ARR segmentation
- `bi.company_payments_status` - Payment status history

---

## Workers Summary

| Worker | File | Queue | Events Processed |
|--------|------|-------|------------------|
| PaymentRunner | `payment_sub.py` | matrix.payment_2_subscription | subscription_* events |
| TransactionPaymentRunner | `transaction_payments_sub.py` | matrix.transaction_payments | payment_succeeded, payment_refunded |
| CompanyDiscountStatusWorker | `company_discount_status_worker.py` | matrix.company_discount_status | subscription_*, coupon_* |
| DbWriterRunner | N/A | N/A | All events (raw storage) |
| InvoiceTrackingWorker | `invoice_tracking_worker.py` | matrix.invoice_tracking | invoice_tracking topic |
| CompanyProfileMetaDataRunner | `company_metadata_worker.py` | matrix.company_profile_metadata | company_metadata_changed |
| CompanyPaymentsStatusWorker | `company_payments_status_worker.py` | matrix.company_payments_status | company_payment_status_event |
| CompanyArrRangeWorker | `company_arr_range_worker.py` | N/A | new_subscription_event |

---

## Data Quality Considerations

### Current State
- ✅ Comprehensive event processing for all Chargebee events
- ✅ MRR calculation with multiple components
- ✅ ARR range segmentation for CS routing
- ✅ Audit trail via payment_events table
- ❌ **CRITICAL P0:** No webhook signature verification
- ❌ No retry logic for failed event processing
- ❌ No validation on MRR calculation inputs

### Critical Security Gap

```
⚠️ CRITICAL P0 SECURITY VULNERABILITY ⚠️

Endpoint: POST /bi/api/PaymentEvents/
File: biengine/bi/api/finance/finance_router.py

Issue: No webhook signature verification
Risk: Malicious actors could send fake webhooks to:
  - Create fake subscriptions
  - Modify MRR data
  - Corrupt payment history
  - Trigger incorrect CS routing

Recommendation: Implement Chargebee webhook signature verification
Reference: https://www.chargebee.com/docs/2.0/webhook_settings.html#verify-webhooks
```

### Edge Cases Handled
1. **Subscription upgrades/downgrades** - PaymentRunner recalculates MRR
2. **Refunds** - TransactionPaymentRunner updates payment history
3. **Trial conversions** - subscription_activated triggers status change
4. **Cancellations** - subscription_cancelled updates company status

### Known Limitations
1. **No idempotency** - Duplicate webhooks may cause issues
2. **No replay mechanism** - Failed events are lost
3. **Sequential processing** - No parallel processing of independent events

---

## Business Logic Flow Summary

```
Chargebee Event (subscription_*, payment_*)
    ↓
POST /bi/api/PaymentEvents/ (⚠️ NO SIGNATURE VERIFICATION)
    ↓
PaymentEventModel Created
    ↓
Publish to Topic.payments_webhook
    ↓
┌─────────────────────┬────────────────────────┐
│                     │                        │
▼                     ▼                        ▼
PaymentRunner    TransactionPayment    CompanyDiscount
                 Runner                StatusWorker
│                     │                        │
└─────────┬───────────┴────────────────────────┘
          │
          ▼
MRR Calculation (Base + Addon - Discount)
          │
          ▼
Update company_profile_meta_data (status, MRR)
          │
          ▼
Update company_profile_arr_range (ARR segmentation)
          │
          ▼
Publish company_payment_status_changed
          │
          ▼
External Sync: HubSpot, Canary
```

---

## Monitoring & Observability

### Key Metrics to Track
- Webhook processing success rate
- MRR calculation accuracy
- Event processing latency
- Failed payment rate
- Subscription churn rate

### Critical Alerts
- Webhook processing failures
- Unusual MRR changes (> 50% in 24h)
- High refund rate
- Missing subscription events
- Chargebee API errors


