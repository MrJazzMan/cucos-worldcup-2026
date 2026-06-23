import { fromZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";
import { TIMEZONE } from "@/lib/timezone";

export interface AdminAnalyticsKpis {
  total_users: number;
  activated_users: number;
  sessions_today: number;
  page_views_today: number;
}

export interface AdminAnalyticsChartPoint {
  date: string;
  registrations: number;
  sessions: number;
  page_views: number;
}

export interface AdminAnalyticsTopPage {
  page: string;
  visits: number;
}

export interface AdminAnalyticsLatestUser {
  display_name: string | null;
  email: string | null;
  created_at: string;
}

export interface AdminAnalyticsData {
  kpis: AdminAnalyticsKpis;
  charts: AdminAnalyticsChartPoint[];
  top_pages: AdminAnalyticsTopPage[];
  latest_users: AdminAnalyticsLatestUser[];
}

/** Início do dia actual em Europe/Lisbon, como ISO UTC (para o RPC). */
export function getTodayStartLisbonIso(): string {
  const dayKey = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
  return fromZonedTime(`${dayKey}T00:00:00`, TIMEZONE).toISOString();
}
