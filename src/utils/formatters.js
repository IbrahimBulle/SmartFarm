/**
 * Utility functions for data formatting
 */

export function getFarmSize(farm) {
  if (typeof farm.size_acres === 'number') return farm.size_acres
  if (farm.size_acres?.Valid) return farm.size_acres.Float64
  return 0
}

export function friendlyDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value.replace(/,/g, ''))
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

export function formatNumber(value, fallback = '--') {
  const numeric = toNumber(value)
  if (numeric === null) return fallback
  return new Intl.NumberFormat('en').format(numeric)
}

export function displayValue(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}

export function asList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

export function findValue(source, names) {
  if (!source || typeof source !== 'object') return null

  for (const [key, value] of Object.entries(source)) {
    if (names.includes(key) && value !== null && value !== undefined && value !== '') {
      return value
    }

    if (typeof value === 'object') {
      const nested = findValue(value, names)
      if (nested !== null && nested !== undefined && nested !== '') return nested
    }
  }

  return null
}

function firstNumber(values) {
  for (const value of values) {
    const numeric = toNumber(value)
    if (numeric !== null) return numeric
  }
  return null
}

/**
 * Parse usage data from WeatherAI response
 */
export function summarizeUsage(usage, issue = '') {
  const hasUsage = Boolean(usage)
  const rawRemaining =
    usage?.remaining?.requests ||
    usage?.remaining ||
    usage?.requests_remaining ||
    usage?.request_remaining ||
    usage?.requests?.remaining ||
    null

  const limit =
    hasUsage
      ? firstNumber([
          usage?.limits?.requests,
          findValue(usage, [
            'limit',
            'requests_limit',
            'request_limit',
            'monthly_limit',
            'quota',
            'quota_limit',
            'max_requests',
          ]),
        ]) ?? 1000
      : null

  let used = firstNumber([
    usage?.period?.requestCount,
    usage?.requestCount,
    findValue(usage, [
      'used',
      'requests_used',
      'request_used',
      'used_requests',
      'requestsUsed',
      'usage_count',
      'count',
    ]),
  ])

  let remaining = firstNumber([rawRemaining])
  const aiLimit = hasUsage
    ? firstNumber([usage?.limits?.aiRequests, usage?.ai_request_limit])
    : null
  const aiUsed = hasUsage ? firstNumber([usage?.period?.aiRequestCount, usage?.aiRequestCount]) : null
  const aiRemaining = hasUsage
    ? firstNumber([usage?.remaining?.aiRequests, usage?.ai_requests_remaining])
    : null

  if (used === null && limit !== null && remaining !== null) {
    used = Math.max(limit - remaining, 0)
  }

  if (remaining === null && limit !== null && used !== null) {
    remaining = Math.max(limit - used, 0)
  }

  const percent = limit && used !== null ? Math.min(Math.max((used / limit) * 100, 0), 100) : 0
  const plan = hasUsage ? findValue(usage, ['plan', 'tier', 'subscription_plan']) || 'Free' : ''
  const reset =
    usage?.period?.end ||
    findValue(usage, ['reset_at', 'resets_at', 'resetDate', 'renewal_date', 'period_end'])
  const periodStart = usage?.period?.start || findValue(usage, ['period_start', 'billing_start'])

  return {
    aiLimit,
    aiRemaining,
    aiUsed,
    connected: hasUsage,
    issue,
    limit,
    periodStart,
    plan,
    remaining,
    reset,
    used,
    percent: Math.round(percent),
  }
}

export function formatMaybeDate(value) {
  if (!value) return 'Monthly cycle'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return friendlyDate(value)
}
