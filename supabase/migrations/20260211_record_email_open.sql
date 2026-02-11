CREATE OR REPLACE FUNCTION record_email_open(email_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE emails_sent
  SET
    opened = true,
    open_count = open_count + 1,
    opened_at = CASE WHEN opened_at IS NULL THEN now() ELSE opened_at END
  WHERE id = email_id;
END;
$$;
