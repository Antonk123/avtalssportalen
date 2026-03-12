-- Migration: Add department-based Row Level Security to customers table
-- Purpose: Filter customers so users only see customers with contracts in their department
--
-- This migration:
-- 1. Replaces permissive READ policy with department-aware policy
-- 2. Admins can see all customers
-- 3. Non-admins only see customers that have at least one contract in their department
-- 4. Customers without any contracts are only visible to admins

-- Replace the permissive READ policy with department-based policy
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;

CREATE POLICY "Department-based customer read access"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    -- Admins see all customers
    public.has_role(auth.uid(), 'admin')
    OR
    -- Non-admins only see customers that have contracts in their department
    EXISTS (
      SELECT 1
      FROM public.contracts
      WHERE contracts.customer_id = customers.id
        AND contracts.department_id = public.get_user_department_id(auth.uid())
    )
  );

-- Write policies remain unchanged (they already use has_role_level)
-- Users and admins can create/update customers
-- Only admins can delete customers
