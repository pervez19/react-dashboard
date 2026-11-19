import type { DashboardSummary } from '../types/dashboardTypes';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** Static sample data: the backend has no dashboard endpoint yet, so nothing is requested. */
export const dashboardService = {
  getSummary: (): DashboardSummary => ({
    metrics: [
      { key: 'users', label: 'Total users', value: 1284, change: 12 },
      { key: 'sessions', label: 'Active sessions', value: 342, change: 5 },
      { key: 'products', label: 'Products', value: 96, change: -2 },
      { key: 'orders', label: 'Orders today', value: 57, change: 8 },
    ],
    recentActivity: [
      { id: 'a1', description: 'New user registered: jane.doe@example.com', occurredAt: minutesAgo(12) },
      { id: 'a2', description: 'Product "Wireless Mouse" price updated', occurredAt: minutesAgo(47) },
      { id: 'a3', description: 'Order #10234 marked as shipped', occurredAt: minutesAgo(95) },
      { id: 'a4', description: 'Role MANAGER granted to john.smith@example.com', occurredAt: minutesAgo(180) },
      { id: 'a5', description: 'Weekly sales report generated', occurredAt: minutesAgo(1440) },
    ],
  }),
};
