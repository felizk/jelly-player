import { describe, it, expect } from 'vitest';
import { toTime } from './helper';

describe('toTime', () => {
  it('formats seconds under a minute', () => {
    expect(toTime(45)).toBe('00:45');
  });

  it('formats whole minutes', () => {
    expect(toTime(60)).toBe('01:00');
  });

  it('formats minutes and seconds', () => {
    expect(toTime(125)).toBe('02:05');
  });

  it('pads single-digit seconds', () => {
    expect(toTime(61)).toBe('01:01');
  });
});
