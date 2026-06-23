-- A RPC é chamada via service_role (API já valida admin em Node).
-- is_site_admin() usa auth.uid(), que é NULL com service_role → falso positivo.
CREATE OR REPLACE FUNCTION public.get_admin_analytics(today_start timestamptz)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH kpis AS (
    SELECT
      (SELECT COUNT(*) FROM profiles) AS total_users,
      (SELECT COUNT(last_seen_at) FROM profiles) AS activated_users,
      (SELECT COUNT(DISTINCT session_id) FROM page_visits WHERE created_at >= today_start) AS sessions_today,
      (SELECT COUNT(*) FROM page_visits WHERE created_at >= today_start) AS page_views_today
  ),
  days AS (
    SELECT day::date AS day FROM generate_series(
      (today_start AT TIME ZONE 'Europe/Lisbon')::date - INTERVAL '29 days',
      (today_start AT TIME ZONE 'Europe/Lisbon')::date,
      '1 day'::interval
    ) AS day
  ),
  regs AS (
    SELECT
      (created_at AT TIME ZONE 'Europe/Lisbon')::date AS day,
      COUNT(*) AS registrations
    FROM profiles
    GROUP BY 1
  ),
  visits AS (
    SELECT
      (created_at AT TIME ZONE 'Europe/Lisbon')::date AS day,
      COUNT(id) AS page_views,
      COUNT(DISTINCT session_id) AS sessions
    FROM page_visits
    GROUP BY 1
  ),
  charts_data AS (
    SELECT
      d.day::text AS date,
      COALESCE(r.registrations, 0)::int AS registrations,
      COALESCE(v.sessions, 0)::int AS sessions,
      COALESCE(v.page_views, 0)::int AS page_views
    FROM days d
    LEFT JOIN regs r ON r.day = d.day
    LEFT JOIN visits v ON v.day = d.day
    ORDER BY d.day ASC
  ),
  top_pages_data AS (
    SELECT
      page,
      COUNT(*)::int AS visits
    FROM page_visits
    GROUP BY page
    ORDER BY visits DESC
    LIMIT 20
  ),
  latest_users_data AS (
    SELECT
      display_name,
      email,
      created_at::text AS created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 20
  )
  SELECT row_to_json(t) INTO result
  FROM (
    SELECT
      (SELECT row_to_json(kpis.*) FROM kpis) AS kpis,
      (SELECT COALESCE(json_agg(charts_data.*), '[]'::json) FROM charts_data) AS charts,
      (SELECT COALESCE(json_agg(top_pages_data.*), '[]'::json) FROM top_pages_data) AS top_pages,
      (SELECT COALESCE(json_agg(latest_users_data.*), '[]'::json) FROM latest_users_data) AS latest_users
  ) t;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(timestamptz) TO service_role;
