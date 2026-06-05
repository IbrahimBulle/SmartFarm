import { formatNumber, formatMaybeDate } from '../utils/formatters'

export function UsageMeter({ compact = false, summary }) {
  const headingLabel = summary.connected
    ? summary.plan
    : summary.issue
      ? 'Usage not working'
      : 'Usage waiting'
  const headingValue = summary.connected
    ? `${summary.percent}% used`
    : summary.issue
      ? 'Endpoint failed'
      : 'Connect API'

  return (
    <div
      className={compact ? 'usage-meter compact' : 'usage-meter'}
      style={{ '--usage-width': `${summary.percent}%` }}
    >
      <div className="usage-meter-heading">
        <span>{headingLabel}</span>
        <strong>{headingValue}</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        <span></span>
      </div>
      {summary.issue ? <p className="usage-meter-message">{summary.issue}</p> : null}
      <div className="usage-meter-stats">
        <span>
          <strong>{formatNumber(summary.used, summary.connected ? '0' : '--')}</strong>
          Requests used
        </span>
        <span>
          <strong>{formatNumber(summary.remaining)}</strong>
          Requests left
        </span>
        <span>
          <strong>{formatNumber(summary.limit)}</strong>
          Request limit
        </span>
        <span>
          <strong>{formatNumber(summary.aiUsed, summary.connected ? '0' : '--')}</strong>
          AI used
        </span>
        <span>
          <strong>{formatNumber(summary.aiRemaining)}</strong>
          AI left
        </span>
        <span>
          <strong>{formatNumber(summary.aiLimit)}</strong>
          AI limit
        </span>
      </div>
      {summary.connected ? (
        <p className="usage-meter-period">
          Billing: {formatMaybeDate(summary.periodStart)} to {formatMaybeDate(summary.reset)}
        </p>
      ) : null}
    </div>
  )
}
