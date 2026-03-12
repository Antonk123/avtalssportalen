-- Migration: Add department-based Row Level Security to contracts table
-- Purpose: Enforce department-level access control so users only see their department's contracts
--
-- This migration:
-- 1. Creates helper function to get user's department_id
-- 2. Replaces permissive READ policy with department-aware policy
-- 3. Admins can see all contracts, non-admins only see their department's contracts
-- 4. Contracts without department_id are only visible to admins

-- Helper function: Get user's department ID
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE id = _user_id;
$$;

-- Replace the permissive READ policy with department-based policy
DROP POLICY IF EXISTS "Authenticated users can read contracts" ON public.contracts;

CREATE POLICY "Department-based contract read access"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    -- Admins see all contracts
    public.has_role(auth.uid(), 'admin')
    OR
    -- Non-admins only see contracts from their department
    (
      department_id IS NOT NULL
      AND department_id = public.get_user_department_id(auth.uid())
    )
    -- Note: Contracts with NULL department_id are only visible to admins
  );

-- Write policies remain unchanged (they already use has_role_level)
-- Users and admins can create/update contracts
-- Only admins can delete contracts
