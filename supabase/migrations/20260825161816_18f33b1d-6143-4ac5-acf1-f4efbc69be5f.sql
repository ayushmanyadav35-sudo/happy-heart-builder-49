-- 1. Prevent self-granted premium on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_premium ON public.profiles;
CREATE TRIGGER profiles_protect_premium
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_premium();

-- 2. Premium-aware read policies for content tables
DROP POLICY IF EXISTS notes_read ON public.notes;
CREATE POLICY notes_read_free ON public.notes
FOR SELECT TO anon, authenticated
USING (is_premium = false);

CREATE POLICY notes_read_premium ON public.notes
FOR SELECT TO authenticated
USING (
  is_premium = true AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium)
    OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  )
);

DROP POLICY IF EXISTS pyqs_read ON public.pyqs;
CREATE POLICY pyqs_read_free ON public.pyqs
FOR SELECT TO anon, authenticated
USING (is_premium = false);

CREATE POLICY pyqs_read_premium ON public.pyqs
FOR SELECT TO authenticated
USING (
  is_premium = true AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium)
    OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  )
);

DROP POLICY IF EXISTS tests_read ON public.tests;
CREATE POLICY tests_read_free ON public.tests
FOR SELECT TO anon, authenticated
USING (is_premium = false);

CREATE POLICY tests_read_premium ON public.tests
FOR SELECT TO authenticated
USING (
  is_premium = true AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium)
    OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  )
);

-- test_questions: never anon; premium tests need premium
DROP POLICY IF EXISTS test_questions_read ON public.test_questions;
REVOKE SELECT ON public.test_questions FROM anon;
CREATE POLICY test_questions_read ON public.test_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_questions.test_id
      AND (
        t.is_premium = false
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium)
        OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
      )
  )
);

-- 3. Replace has_role() usage in admin policies with direct user_roles checks
DROP POLICY IF EXISTS subjects_admin_manage ON public.subjects;
CREATE POLICY subjects_admin_manage ON public.subjects FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS units_admin_manage ON public.units;
CREATE POLICY units_admin_manage ON public.units FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS topics_admin_manage ON public.topics;
CREATE POLICY topics_admin_manage ON public.topics FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS notes_admin_manage ON public.notes;
CREATE POLICY notes_admin_manage ON public.notes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS pyqs_admin_manage ON public.pyqs;
CREATE POLICY pyqs_admin_manage ON public.pyqs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS tests_admin_manage ON public.tests;
CREATE POLICY tests_admin_manage ON public.tests FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS test_questions_admin_manage ON public.test_questions;
CREATE POLICY test_questions_admin_manage ON public.test_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

-- 4. SECURITY DEFINER functions no longer executable by app roles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_premium() FROM PUBLIC, anon, authenticated;

-- 5. Storage: premium-aware reads on notes-pdfs
DROP POLICY IF EXISTS notes_pdfs_read ON storage.objects;
CREATE POLICY notes_pdfs_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'notes-pdfs'
  AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.file_url LIKE '%' || storage.objects.name
        AND (
          n.is_premium = false
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium)
        )
    )
  )
);
