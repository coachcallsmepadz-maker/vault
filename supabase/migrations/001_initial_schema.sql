-- Vault Database Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ Users Table ============
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  basiq_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Index for quick lookup by basiq_user_id
CREATE INDEX idx_users_basiq_user_id ON users(basiq_user_id);

-- ============ Transactions Table ============
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basiq_transaction_id TEXT UNIQUE NOT NULL,
  merchant_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

-- ============ Subscriptions Table ============
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
  next_billing_date DATE NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  auto_detected BOOLEAN DEFAULT TRUE
);

-- Index for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);

-- ============ AI Recommendations Table ============
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for recommendations
CREATE INDEX idx_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_recommendations_expires ON ai_recommendations(expires_at);

-- ============ Row Level Security ============
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- For development, allow all operations (adjust for production)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_recommendations" ON ai_recommendations FOR ALL USING (true);
