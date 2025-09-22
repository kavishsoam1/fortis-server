-- Payment Service Database Schema

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payment;

-- Invoices table
CREATE TABLE IF NOT EXISTS payment.invoices (
  invoice_id UUID PRIMARY KEY,
  member_id UUID NOT NULL,
  hospital_guid VARCHAR(100),
  appointment_id UUID,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded, partially_paid
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS payment.invoice_items (
  item_id SERIAL PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES payment.invoices(invoice_id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  item_type VARCHAR(50), -- consultation, procedure, medicine, lab_test, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payment.payments (
  payment_id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES payment.invoices(invoice_id),
  member_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL, -- credit_card, debit_card, upi, cash, etc.
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded
  transaction_id VARCHAR(100),
  payment_gateway VARCHAR(50), -- stripe, razorpay, etc.
  gateway_response JSONB DEFAULT '{}'::jsonb,
  refund_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds table
CREATE TABLE IF NOT EXISTS payment.refunds (
  refund_id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payment.payments(payment_id),
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed
  transaction_id VARCHAR(100),
  gateway_response JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table (stored payment methods for recurring payments)
CREATE TABLE IF NOT EXISTS payment.payment_methods (
  payment_method_id UUID PRIMARY KEY,
  member_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- credit_card, debit_card, upi, etc.
  provider VARCHAR(50), -- visa, mastercard, etc.
  last_four VARCHAR(4),
  expiry_month VARCHAR(2),
  expiry_year VARCHAR(4),
  token VARCHAR(255), -- tokenized payment info
  is_default BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON payment.invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON payment.invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON payment.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payment.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payment.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON payment.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_member_id ON payment.payment_methods(member_id);
