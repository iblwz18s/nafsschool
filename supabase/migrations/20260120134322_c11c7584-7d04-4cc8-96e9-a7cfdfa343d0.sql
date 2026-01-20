-- 1. Remove insecure public policies from students table
DROP POLICY IF EXISTS "Anyone can read students" ON public.students;

-- 2. Remove insecure public policies from student_progress table
DROP POLICY IF EXISTS "Anyone can read progress" ON public.student_progress;
DROP POLICY IF EXISTS "Anyone can insert progress" ON public.student_progress;

-- 3. Add CHECK constraints to student_progress table for data validation
ALTER TABLE public.student_progress 
ADD CONSTRAINT check_score_non_negative CHECK (score >= 0);

ALTER TABLE public.student_progress 
ADD CONSTRAINT check_total_questions_positive CHECK (total_questions > 0);

ALTER TABLE public.student_progress 
ADD CONSTRAINT check_score_not_exceeds_total CHECK (score <= total_questions);

-- 4. Create secure policy: Only admins can read all student progress (for reporting)
CREATE POLICY "Admins can read all progress"
ON public.student_progress
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create secure policy: Service role can insert progress (via edge function)
-- Note: Direct inserts from client are blocked, must go through submit-progress edge function
-- The edge function uses service role key which bypasses RLS

-- 6. Create policy for admins to manage students data (already exists)
-- Keeping existing admin policies for students table