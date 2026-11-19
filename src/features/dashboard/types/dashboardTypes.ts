export interface Metric {
  key: string;
  label: string;
  value: number;
  /** Percentage change vs. the previous period, if the backend provides it. */
  change?: number;
}

export interface Activity {
  id: string;
  description: string;
  occurredAt: string; // ISO-8601
}

export interface DashboardSummary {
  metrics: Metric[];
  recentActivity: Activity[];
}
