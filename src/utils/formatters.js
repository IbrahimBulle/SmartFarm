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
 * Handles multiple possible API response formats
 */
export function summarizeUsage(usage, issue = '') {
  const hasUsage = Boolean(usage)
  
  // Try multiple paths for remaining requests
  let remaining = firstNumber([
    usage?.remaining?.requests,
    usage?.remaining,
    usage?.requests_remaining,
    usage?.request_remaining,
    usage?.requests?.remaining,
    usage?.quota?.requests_remaining,
  ])

  // Try multiple paths for request limit
  let limit = hasUsage
    ? firstNumber([
        usage?.limits?.requests,
        usage?.quota?.limit,
        usage?.quota?.requests_limit,
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

  // Try multiple paths for used requests
  let used = firstNumber([
    usage?.period?.requestCount,
    usage?.requestCount,
    usage?.quota?.requests_used,
    usage?.used,
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

  // If we have remaining and limit, calculate used
  if (used === null && limit !== null && remaining !== null) {
    used = Math.max(limit - remaining, 0)
  }

  // If we have used and limit, calculate remaining
  if (remaining === null && limit !== null && used !== null) {
    remaining = Math.max(limit - used, 0)
  }

  // Default used to 0 if still null (new user or fresh month)
  if (used === null) used = 0
  if (remaining === null && limit !== null) remaining = limit

  // Calculate percentage safely
  const percent = limit ? Math.min(Math.max((used / limit) * 100, 0), 100) : 0
  
  // AI quotas
  const aiLimit = hasUsage
    ? firstNumber([
        usage?.limits?.aiRequests,
        usage?.quota?.ai_request_limit,
        usage?.quota?.ai_requests_limit,
        usage?.ai_request_limit,
      ])
    : null
  const aiUsed = hasUsage
    ? firstNumber([
        usage?.period?.aiRequestCount,
        usage?.aiRequestCount,
        usage?.quota?.ai_requests_used,
        usage?.ai_used,
      ])
    : null
  const aiRemaining = hasUsage
    ? firstNumber([
        usage?.remaining?.aiRequests,
        usage?.ai_requests_remaining,
        usage?.quota?.ai_requests_remaining,
      ])
    : null

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

// Debug helper for development
export function debugUsageSummary(summary) {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('DEBUG_USAGE')) {
    console.debug('📊 Usage Summary:', {
      percent: `${summary.percent}%`,
      used: summary.used,
      remaining: summary.remaining,
      limit: summary.limit,
      connected: summary.connected,
      issue: summary.issue || 'none',
      plan: summary.plan,
    })
  }
}

export function formatMaybeDate(value) {
  if (!value) return 'Monthly cycle'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return friendlyDate(value)
}
