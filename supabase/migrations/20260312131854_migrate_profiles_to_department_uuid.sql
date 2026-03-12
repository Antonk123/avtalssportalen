-- Migration: Normalize profiles.department from TEXT to department_id UUID
-- Purpose: Establish proper foreign key relationship between profiles and departments
--
-- This migration:
-- 1. Adds department_id UUID column to profiles table
-- 2. Migrates existing TEXT department values to match department UUIDs
-- 3. Creates index for performance
-- 4. Keeps old 'department' column for rollback safety (can be dropped in future migration)

-- Add new department_id column (UUID, normalized)
ALTER TABLE public.profiles
  ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Migrate existing TEXT data to UUIDs
-- Matches department names (case-insensitive) against departments table
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE LOWER(TRIM(p.department)) = LOWER(d.name);

-- Create index for faster lookups
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);

-- Note: Old 'department' TEXT column is kept temporarily for rollback safety
-- It can be dropped in a future migration after verification:
-- ALTER TABLE public.profiles DROP COLUMN department;
