-- ==========================================
-- AVON Platform - Supabase PostgreSQL Schema
-- Luxury Medical & Aesthetic Center
-- ==========================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Core Tables
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    working_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(50),
    duration_minutes INT NOT NULL,
    price_iqd DECIMAL(15, 2), -- استخدام Decimal لمنع أخطاء Floating Point
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('room', 'device', 'staff')),
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID, -- سيتم ربطه بـ auth.users لاحقاً
    service_id UUID REFERENCES services(id),
    branch_id UUID REFERENCES branches(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_price_iqd DECIMAL(15, 2),
    paid_amount_iqd DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول ربط الموارد بالمواعيد (لمنع التعارض)
CREATE TABLE appointment_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id),
    UNIQUE(appointment_id, resource_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS) - أمان مستوى الصف
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- سياسة: المريض يرى فقط مواعيده
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = patient_id);
