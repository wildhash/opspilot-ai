/**
 * AWS CloudWatch integration for metrics and logs analysis
 */

import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery,
  MetricStat,
  GetMetricDataCommandOutput
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  FilterLogEventsCommandOutput
} from '@aws-sdk/client-cloudwatch-logs';
import { MetricData, LogEntry } from '../types';

export class CloudWatchService {
  private cwClient: CloudWatchClient;
  private logsClient: CloudWatchLogsClient;

  constructor(region: string = 'us-east-1') {
    this.cwClient = new CloudWatchClient({ region });
    this.logsClient = new CloudWatchLogsClient({ region });
  }

  /**
   * Fetch metrics for a specific resource over a time period
   */
  async getMetrics(
    namespace: string,
    metricName: string,
    dimensions: Record<string, string>,
    startTime: Date,
    endTime: Date,
    period: number = 300
  ): Promise<MetricData> {
    const dimensionsArray = Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: value
    }));

    const metricStat: MetricStat = {
      Metric: {
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: dimensionsArray
      },
      Period: period,
      Stat: 'Average'
    };

    const query: MetricDataQuery = {
      Id: 'm1',
      MetricStat: metricStat
    };

    const command = new GetMetricDataCommand({
      MetricDataQueries: [query],
      StartTime: startTime,
      EndTime: endTime
    });

    const response: GetMetricDataCommandOutput = await this.cwClient.send(command);
    const result = response.MetricDataResults?.[0];

    return {
      metricName,
      namespace,
      dimensions,
      timestamps: result?.Timestamps?.map(ts => new Date(ts)) || [],
      values: result?.Values || [],
      unit: 'None'
    };
  }

  /**
   * Get multiple metrics at once for comprehensive analysis
   */
  async getMultipleMetrics(
    metricConfigs: Array<{
      namespace: string;
      metricName: string;
      dimensions: Record<string, string>;
    }>,
    startTime: Date,
    endTime: Date
  ): Promise<MetricData[]> {
    const results = await Promise.all(
      metricConfigs.map(config =>
        this.getMetrics(
          config.namespace,
          config.metricName,
          config.dimensions,
          startTime,
          endTime
        )
      )
    );
    return results;
  }

  /**
   * Query logs from CloudWatch Logs
   */
  async queryLogs(
    logGroupName: string,
    startTime: Date,
    endTime: Date,
    filterPattern?: string,
    limit: number = 100
  ): Promise<LogEntry[]> {
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      filterPattern,
      limit
    });

    const response: FilterLogEventsCommandOutput = await this.logsClient.send(command);
    
    return (response.events || []).map(event => {
      const message = event.message || '';
      let level: LogEntry['level'] = 'INFO';
      
      if (message.includes('ERROR') || message.includes('Error')) {
        level = 'ERROR';
      } else if (message.includes('WARN') || message.includes('Warning')) {
        level = 'WARN';
      } else if (message.includes('DEBUG')) {
        level = 'DEBUG';
      }

      return {
        timestamp: new Date(event.timestamp || Date.now()),
        message,
        level,
        requestId: this.extractRequestId(message)
      };
    });
  }

  /**
   * Extract request ID from log message
   */
  private extractRequestId(message: string): string | undefined {
    const match = message.match(/RequestId:\s*([a-f0-9-]+)/i);
    return match?.[1];
  }

  /**
   * Analyze metrics for anomalies
   */
  async analyzeMetricAnomalies(
    metricData: MetricData,
    threshold: number = 2
  ): Promise<{
    hasAnomaly: boolean;
    anomalies: Array<{ timestamp: Date; value: number; zscore: number }>;
  }> {
    if (metricData.values.length < 3) {
      return { hasAnomaly: false, anomalies: [] };
    }

    const mean = metricData.values.reduce((a, b) => a + b, 0) / metricData.values.length;
    const variance = metricData.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricData.values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = metricData.values
      .map((value, index) => {
        const zscore = stdDev === 0 ? 0 : Math.abs((value - mean) / stdDev);
        return {
          timestamp: metricData.timestamps[index],
          value,
          zscore
        };
      })
      .filter(item => item.zscore > threshold);

    return {
      hasAnomaly: anomalies.length > 0,
      anomalies
    };
  }

  /**
   * Get Lambda function metrics
   */
  async getLambdaMetrics(
    functionName: string,
    startTime: Date,
    endTime: Date
  ): Promise<Record<string, MetricData>> {
    const dimensions = { FunctionName: functionName };
    const metricNames = ['Errors', 'Duration', 'Throttles', 'ConcurrentExecutions', 'Invocations'];

    const metrics = await this.getMultipleMetrics(
      metricNames.map(metricName => ({
        namespace: 'AWS/Lambda',
        metricName,
        dimensions
      })),
      startTime,
      endTime
    );

    const result: Record<string, MetricData> = {};
    metrics.forEach((metric, index) => {
      result[metricNames[index]] = metric;
    });

    return result;
  }
}
