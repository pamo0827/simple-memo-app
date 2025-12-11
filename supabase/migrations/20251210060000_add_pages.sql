-- Create pages table
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    list_order JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add page_id to recipes and categories
ALTER TABLE recipes ADD COLUMN page_id UUID REFERENCES pages(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN page_id UUID REFERENCES pages(id) ON DELETE CASCADE;

-- Enable RLS on pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pages" ON pages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages" ON pages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages" ON pages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages" ON pages
    FOR DELETE USING (auth.uid() = user_id);

-- Migration function to move existing data to a default page
CREATE OR REPLACE FUNCTION migrate_user_data_to_pages()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    default_page_id UUID;
    settings_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Create default page for user
        INSERT INTO pages (user_id, name)
        VALUES (user_record.id, 'メイン')
        RETURNING id INTO default_page_id;

        -- Get existing list_order from user_settings
        SELECT list_order INTO settings_record FROM user_settings WHERE user_id = user_record.id;

        -- Update default page with existing list_order if available
        IF settings_record.list_order IS NOT NULL THEN
            UPDATE pages SET list_order = settings_record.list_order WHERE id = default_page_id;
        END IF;

        -- Move recipes to default page
        UPDATE recipes SET page_id = default_page_id WHERE user_id = user_record.id AND page_id IS NULL;

        -- Move categories to default page
        UPDATE categories SET page_id = default_page_id WHERE user_id = user_record.id AND page_id IS NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_user_data_to_pages();

-- Cleanup function
DROP FUNCTION migrate_user_data_to_pages();

-- Add index for performance
CREATE INDEX idx_pages_user_id ON pages(user_id);
CREATE INDEX idx_recipes_page_id ON recipes(page_id);
CREATE INDEX idx_categories_page_id ON categories(page_id);
