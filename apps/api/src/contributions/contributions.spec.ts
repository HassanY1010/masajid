import { calculateShares } from '@masajid/shared-validation';

describe('Critical Business Calculations - Mosque Shares & Contributions', () => {
  const estimatedCost = 20000;
  const totalShares = 2000;
  const shareValue = 10; // 10 SAR

  test('Case 1: 2000 shares * 10 SAR, Contribution = 100 SAR -> 10 shares', () => {
    const result = calculateShares(100, shareValue);
    expect(result.isValid).toBe(true);
    expect(result.shares).toBe(10);
  });

  test('Case 2: Non-multiple contribution -> rejected (e.g. 15 SAR with shareValue 10)', () => {
    const result = calculateShares(15, shareValue);
    expect(result.isValid).toBe(false);
    expect(result.shares).toBe(0);
    expect(result.error).toContain('من مضاعفات');
  });

  test('Case 3: Remaining 5 shares, Contribution 50 SAR -> exactly 5 shares allowed', () => {
    const remainingShares = 5;
    const result = calculateShares(50, shareValue);
    expect(result.isValid).toBe(true);
    expect(result.shares).toBe(5);
    expect(result.shares <= remainingShares).toBe(true);
  });

  test('Case 4: Remaining 5 shares, Contribution 60 SAR -> exceeds remaining shares', () => {
    const remainingShares = 5;
    const result = calculateShares(60, shareValue);
    expect(result.isValid).toBe(true);
    expect(result.shares).toBe(6);
    expect(result.shares <= remainingShares).toBe(false);
  });

  test('Case 5: Zero or negative values return invalid', () => {
    expect(calculateShares(0, 10).isValid).toBe(false);
    expect(calculateShares(-50, 10).isValid).toBe(false);
    expect(calculateShares(100, 0).isValid).toBe(false);
  });
});
