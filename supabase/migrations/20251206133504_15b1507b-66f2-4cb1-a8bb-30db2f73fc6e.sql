-- Add policy to allow admins to view all reports
CREATE POLICY "Admins can view all reports"
ON public.user_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));