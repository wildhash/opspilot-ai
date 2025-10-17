/**
 * Unit tests for utility functions
 */

import {
  parseArn,
  validateSeverity,
  calculateConfidence,
  extractErrorMessage,
  isSafeAction
} from '../utils/helpers';

describe('Utility Functions', () => {
  describe('parseArn', () => {
    it('should parse valid Lambda ARN', () => {
      const arn = 'arn:aws:lambda:us-east-1:123456789012:function:my-function';
      const result = parseArn(arn);

      expect(result).not.toBeNull();
      expect(result?.service).toBe('lambda');
      expect(result?.region).toBe('us-east-1');
      expect(result?.accountId).toBe('123456789012');
      expect(result?.resourceType).toBe('function');
      expect(result?.resourceName).toBe('my-function');
    });

    it('should return null for invalid ARN', () => {
      const result = parseArn('invalid-arn');
      expect(result).toBeNull();
    });
  });

  describe('validateSeverity', () => {
    it('should validate correct severity levels', () => {
      expect(validateSeverity('critical')).toBe(true);
      expect(validateSeverity('high')).toBe(true);
      expect(validateSeverity('medium')).toBe(true);
      expect(validateSeverity('low')).toBe(true);
    });

    it('should reject invalid severity levels', () => {
      expect(validateSeverity('invalid')).toBe(false);
      expect(validateSeverity('CRITICAL')).toBe(false);
      expect(validateSeverity('')).toBe(false);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate weighted confidence correctly', () => {
      const result = calculateConfidence(0.8, 0.9, 1.0);
      expect(result).toBeCloseTo(0.91, 2);
    });

    it('should handle zero values', () => {
      const result = calculateConfidence(0, 0, 0);
      expect(result).toBe(0);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract error from logs', () => {
      const logs = [
        'INFO: Starting function',
        'ERROR: Connection timeout',
        'INFO: Retrying'
      ];

      const result = extractErrorMessage(logs);
      expect(result).toContain('ERROR: Connection timeout');
    });

    it('should return null when no errors found', () => {
      const logs = [
        'INFO: Starting function',
        'INFO: Success'
      ];

      const result = extractErrorMessage(logs);
      expect(result).toBeNull();
    });
  });

  describe('isSafeAction', () => {
    it('should identify safe actions', () => {
      expect(isSafeAction('update_config')).toBe(true);
      expect(isSafeAction('restart_service')).toBe(true);
      expect(isSafeAction('scale_resources')).toBe(true);
    });

    it('should identify unsafe actions', () => {
      expect(isSafeAction('delete_resource')).toBe(false);
      expect(isSafeAction('custom')).toBe(false);
      expect(isSafeAction('rollback')).toBe(false);
    });
  });
});
