-- Create the pipeline_stages table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow read access for all authenticated users" ON public.pipeline_stages
    FOR SELECT TO authenticated USING (true);

-- Create policy to allow all authenticated users to insert/update/delete (since this is a CRM and we want users to customize it)
-- You might want to restrict this to admins later, but for now we'll allow authenticated users
CREATE POLICY "Allow full access for all authenticated users" ON public.pipeline_stages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default stages
INSERT INTO public.pipeline_stages (name, position, color) VALUES
    ('Novo Lead', 0, 'bg-blue-500'),
    ('Em Contato', 1, 'bg-yellow-500'),
    ('Proposta Enviada', 2, 'bg-purple-500'),
    ('Negociação', 3, 'bg-orange-500'),
    ('Ganho', 4, 'bg-green-500'),
    ('Perdido', 5, 'bg-red-500')
ON CONFLICT (name) DO NOTHING;
