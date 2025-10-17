/**
 * Unit tests for CloudWatch service
 */

import { CloudWatchService } from '../aws/cloudwatch';
import { MetricData } from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-cloudwatch-logs');

describe('CloudWatchService', () => {
  let service: CloudWatchService;

  beforeEach(() => {
    service = new CloudWatchService('us-east-1');
  });

  describe('getMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const result: MetricData = await service.getMetrics(
        'AWS/Lambda',
        'Errors',
        { FunctionName: 'test-function' },
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result).toBeDefined();
      expect(result.metricName).toBe('Errors');
      expect(result.namespace).toBe('AWS/Lambda');
    });
  });

  describe('analyzeMetricAnomalies', () => {
    it('should detect anomalies using z-score', async () => {
      const metricData: MetricData = {
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        dimensions: { FunctionName: 'test' },
        timestamps: [
          new Date('2024-01-01T00:00:00Z'),
          new Date('2024-01-01T01:00:00Z'),
          new Date('2024-01-01T02:00:00Z'),
          new Date('2024-01-01T03:00:00Z')
        ],
        values: [1, 2, 1, 10], // 10 is an outlier
        unit: 'Count'
      };

      const result = await service.analyzeMetricAnomalies(metricData, 2);

      expect(result.hasAnomaly).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0].value).toBe(10);
    });

    it('should not detect anomalies in normal data', async () => {
      const metricData: MetricData = {
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        dimensions: { FunctionName: 'test' },
        timestamps: [
          new Date('2024-01-01T00:00:00Z'),
          new Date('2024-01-01T01:00:00Z'),
          new Date('2024-01-01T02:00:00Z')
        ],
        values: [1, 2, 1],
        unit: 'Count'
      };

      const result = await service.analyzeMetricAnomalies(metricData, 2);

      expect(result.hasAnomaly).toBe(false);
      expect(result.anomalies.length).toBe(0);
    });
  });
});
