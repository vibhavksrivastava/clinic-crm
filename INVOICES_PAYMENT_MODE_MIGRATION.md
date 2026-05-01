# Invoice Payment Mode Migration

## Overview
Adds `payment_mode` column to the `invoices` table to track how payments are made (cash, card, or UPI).

## Steps to Apply

1. **Open Supabase Dashboard**
   - Navigate to your clinic-crm project
   - Go to SQL Editor

2. **Copy and Paste the Migration**
   ```sql
   ALTER TABLE public.invoices 
   ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) NULL DEFAULT NULL;

   ALTER TABLE public.invoices 
   ADD CONSTRAINT invoices_payment_mode_check 
   CHECK (payment_mode IS NULL OR payment_mode IN ('cash', 'card', 'upi'));

   CREATE INDEX IF NOT EXISTS idx_invoices_payment_mode ON public.invoices(payment_mode);

   COMMENT ON COLUMN public.invoices.payment_mode IS 'Payment method used: cash, card, or upi. NULL if not yet paid.';
   ```

3. **Execute the Query**
   - Click "Run" button
   - Wait for confirmation: "Success. No rows returned"

## Verification

After applying, verify the column was added:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'payment_mode';
```

Should return:
- column_name: `payment_mode`
- data_type: `character varying`
- is_nullable: `YES`

## API Usage

### Update Invoice with Payment Mode

**Request:**
```bash
PUT /api/invoices?id={invoiceId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "paid",
  "payment_mode": "card",
  "notes": "Payment received"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "appointment_id": "uuid",
  "amount": 1500.00,
  "status": "paid",
  "payment_mode": "card",
  "paid_date": "2026-04-22T10:30:00Z",
  "notes": "Payment received",
  "created_at": "2026-04-21T09:00:00Z",
  "updated_at": "2026-04-22T10:30:00Z"
}
```

### Valid Payment Modes
- `"cash"` - Cash payment
- `"card"` - Credit/Debit card payment
- `"upi"` - UPI/Digital payment

### Authorization
Only users with these roles can update invoice payment modes:
- `receptionist`
- `clinic_admin`
- `branch_admin`
- `super_admin`

## Rollback (if needed)

If you need to undo this migration:
```sql
DROP INDEX IF EXISTS idx_invoices_payment_mode;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payment_mode_check;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS payment_mode;
```
