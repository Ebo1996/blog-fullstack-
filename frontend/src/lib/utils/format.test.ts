import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateShort,
  formatRelative,
  formatNumber,
  formatPercent,
  truncate,
  slugify,
  getInitials,
  formatTicketCode,
  formatOrderId,
} from './format'

describe('Currency Formatting', () => {
  it('formats cents to currency', () => {
    expect(formatCurrency(1000)).toBe('$10.00')
    expect(formatCurrency(99)).toBe('$0.99')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large amounts compactly', () => {
    expect(formatCurrencyCompact(1_500_000)).toBe('$15.0K')
    expect(formatCurrencyCompact(5_000_000_00)).toBe('$50.0M')
    expect(formatCurrencyCompact(500)).toBe('$5.00')
  })
})

describe('Date Formatting', () => {
  const testDate = '2024-03-15T14:30:00Z'

  it('formats date with default pattern', () => {
    const result = formatDate(testDate)
    expect(result).toMatch(/Mar 15, 2024/)
  })

  it('formats time correctly', () => {
    const result = formatTime(testDate)
    expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/)
  })

  it('formats date and time together', () => {
    const result = formatDateTime(testDate)
    expect(result).toContain('Mar 15')
    expect(result).toContain('2024')
  })

  it('formats short date', () => {
    const result = formatDateShort(testDate)
    expect(result).toBe('Mar 15')
  })

  it('formats relative time', () => {
    const now = new Date()
    const result = formatRelative(now.toISOString())
    expect(result).toContain('ago')
  })
})

describe('Number Formatting', () => {
  it('formats numbers with thousands separator', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('formats percentages', () => {
    expect(formatPercent(25.5)).toBe('25.5%')
    expect(formatPercent(100, 0)).toBe('100%')
  })
})

describe('String Formatting', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...')
    expect(truncate('Short', 10)).toBe('Short')
  })

  it('slugifies strings', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
    expect(slugify('Test   Multiple   Spaces')).toBe('test-multiple-spaces')
    expect(slugify('Special@#$Characters')).toBe('specialcharacters')
  })

  it('extracts initials', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Jane')).toBe('J')
    expect(getInitials(null)).toBe('?')
    expect(getInitials('')).toBe('?')
  })
})

describe('Ticket & Order Formatting', () => {
  it('formats ticket codes', () => {
    expect(formatTicketCode('ns-1234-5678')).toBe('NS-1234-5678')
  })

  it('formats order IDs', () => {
    const uuid = 'abc12345-1234-1234-1234-123456789012'
    expect(formatOrderId(uuid)).toBe('#ABC12345')
  })
})
