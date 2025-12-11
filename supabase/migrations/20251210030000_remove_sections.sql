-- Remove sections column from recipes table
-- This removes the custom sections feature

ALTER TABLE recipes
DROP COLUMN IF EXISTS sections;
