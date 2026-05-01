-- Migration: Add payment_mode column to invoices table
-- Description: Adds support for tracking payment methods (cash, card, upi)

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) NULL DEFAULT NULL;

-- Add constraint to validate payment_mode values
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_payment_mode_check 
CHECK (payment_mode IS NULL OR payment_mode IN ('cash', 'card', 'upi'));

-- Create index for payment_mode queries
CREATE INDEX IF NOT EXISTS idx_invoices_payment_mode ON public.invoices(payment_mode);

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.payment_mode IS 'Payment method used: cash, card, or upi. NULL if not yet paid.';
