import { GetCommand } from '../commands/GetCommand.js';
import StatisticsDataRepository from '../repositories/StatisticsDataRepository.js';

export class StatisticsDataInvoker {
  constructor() {
    this.repository = new StatisticsDataRepository();
  }

  async run(command) {
    return command.execute();
  }

  async getBusinessStatistics() {
    const command = new GetCommand(this.repository, { type: 'business-statistics' });
    return this.run(command);
  }

  async getRecentActivities() {
    const command = new GetCommand(this.repository, { type: 'recent-activities' });
    return this.run(command);
  }

  // Direct methods for easier access
  async fetchBusinessStatistics() {
    try {
      const command = new GetCommand(this.repository, { type: 'business-statistics' });
      return await this.run(command);
    } catch (error) {
      console.error('Failed to fetch business statistics:', error);
      // Try to get cached data as fallback
      return await this.repository.getCachedBusinessStatistics();
    }
  }

  async fetchRecentActivities() {
    try {
      const command = new GetCommand(this.repository, { type: 'recent-activities' });
      return await this.run(command);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Try to get cached data as fallback
      return await this.repository.getCachedRecentActivities();
    }
  }
}

export default StatisticsDataInvoker;
