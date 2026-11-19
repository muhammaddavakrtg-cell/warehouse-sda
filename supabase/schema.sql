-- =============================================================================
-- GudangKu WMS — Skema Database Supabase (PostgreSQL + Realtime + RLS)
-- Jalankan script ini di Supabase SQL Editor proyek Anda.
-- =============================================================================

-- 1. Tabel Master Data Material
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  unit TEXT NOT NULL,
  min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel Transaksi Barang Masuk (Inbound) & Keluar (Outbound)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_no TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  staff_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Index untuk performa kueri dashboard & filter
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_material_id ON public.transactions(material_id);

-- 4. Function atomik untuk mencatat transaksi dan memperbarui stok otomatis
CREATE OR REPLACE FUNCTION public.record_material_transaction(
  p_material_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_reference_no TEXT DEFAULT '',
  p_notes TEXT DEFAULT ''
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_material public.materials%ROWTYPE;
  v_new_stock INTEGER;
  v_staff_email TEXT;
  v_tx public.transactions%ROWTYPE;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Jumlah transaksi harus lebih dari 0';
  END IF;

  IF p_type NOT IN ('inbound', 'outbound') THEN
    RAISE EXCEPTION 'Tipe transaksi harus inbound atau outbound';
  END IF;

  SELECT * INTO v_material
  FROM public.materials
  WHERE id = p_material_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material tidak ditemukan';
  END IF;

  IF p_type = 'inbound' THEN
    v_new_stock := v_material.current_stock + p_quantity;
  ELSE
    IF v_material.current_stock < p_quantity THEN
      RAISE EXCEPTION 'Stok tidak mencukupi (tersedia: % %)', v_material.current_stock, v_material.unit;
    END IF;
    v_new_stock := v_material.current_stock - p_quantity;
  END IF;

  UPDATE public.materials
  SET current_stock = v_new_stock,
      updated_at = now()
  WHERE id = p_material_id;

  v_staff_email := COALESCE(auth.jwt() ->> 'email', 'staf@gudangku.id');

  INSERT INTO public.transactions (
    material_id,
    material_code,
    material_name,
    unit,
    type,
    quantity,
    stock_before,
    stock_after,
    reference_no,
    notes,
    staff_email
  )
  VALUES (
    v_material.id,
    v_material.code,
    v_material.name,
    v_material.unit,
    p_type,
    p_quantity,
    v_material.current_stock,
    v_new_stock,
    COALESCE(p_reference_no, ''),
    COALESCE(p_notes, ''),
    v_staff_email
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- 5. Aktifkan Row Level Security (RLS) untuk staf terautentikasi
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read materials"
  ON public.materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert materials"
  ON public.materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can update materials"
  ON public.materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can delete materials"
  ON public.materials FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can read transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Aktifkan Supabase Realtime pada tabel materials dan transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
