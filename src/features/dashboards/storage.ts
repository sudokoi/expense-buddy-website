import type { DashboardDefinition } from '@/features/dashboards/schema'

export const dashboardStorage = {
  async loadDashboardConfigs(): Promise<DashboardDefinition[]> {
    return []
  },
  async saveDashboardConfigs(_dashboards: DashboardDefinition[]): Promise<void> {
    return
  },
  async resetDashboardConfigs(): Promise<void> {
    return
  },
}
