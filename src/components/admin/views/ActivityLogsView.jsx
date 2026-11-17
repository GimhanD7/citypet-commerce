import React, { useEffect, useState } from 'react'
import { Activity, Database, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react'
import { activityService } from '../../../services/api'
import './activity-logs.css'

const pageSize = 25
const emptyResult = { logs: [], total: 0, summary: {}, actions: [] }
const actionLabel = (action) => action.toLowerCase().replaceAll('_', ' ')

export default function ActivityLogsView() {
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener('citypet_activity_updated', refresh)
    return () => window.removeEventListener('citypet_activity_updated', refresh)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const timer = setTimeout(async () => {
      try {
        const data = await activityService.getActivityLogs({ search, action, limit: pageSize, offset: (page - 1) * pageSize })
        if (!active) return
        setResult(data)
        const lastPage = Math.max(1, Math.ceil(data.total / pageSize))
        if (page > lastPage) setPage(lastPage)
      } catch (failure) {
        if (active) { setError(failure.message || 'Unable to load activity logs.'); setResult(emptyResult) }
      } finally {
        if (active) setLoading(false)
      }
    }, search ? 250 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [search, action, page, revision])

  const summary = result.summary || {}
  const pages = Math.max(1, Math.ceil(result.total / pageSize))
  const cards = [
    { label: 'Audit Logs', value: result.total, icon: Database },
    { label: 'Administrator Actions', value: summary.admin, icon: ShieldCheck },
    { label: 'Customer Actions', value: summary.customer, icon: Users },
    { label: 'Inventory Updates', value: summary.inventory, icon: Activity },
  ]

  return (
    <section className="audit-page" aria-labelledby="audit-title">
      <header className="audit-header">
        <div><h2 id="audit-title">Activity Logs</h2><p>Saved user actions, stock changes and order activity.</p></div>
        <button type="button" className="audit-refresh" disabled={loading} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16} />{loading ? 'Loading…' : 'Refresh Logs'}</button>
      </header>
      <div className="audit-metrics">
        {cards.map(({ label, value, icon: Icon }) => <article className="audit-metric" key={label}><div><span>{label}</span><Icon size={17} /></div><strong>{loading || error ? '—' : Number(value || 0).toLocaleString()}</strong></article>)}
      </div>
      <div className="audit-toolbar">
        <label className="audit-search"><Search size={16} /><input aria-label="Search activity logs" placeholder="Search user, action, details or IP address" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); setPage(1) }}><X size={15} /></button>}</label>
        <label className="audit-action"><span>Action</span><select value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }}><option value="all">All actions</option>{[...new Set([...result.actions, ...(action === 'all' ? [] : [action])])].map((value) => <option key={value} value={value}>{actionLabel(value)}</option>)}</select></label>
      </div>
      {error && <div className="audit-error" role="alert">{error} <button type="button" onClick={() => setRevision((value) => value + 1)}>Retry</button></div>}
      <div className="audit-table-card">
        <div className="audit-table-scroll" tabIndex={0} role="region" aria-label="Activity records" aria-busy={loading}>
          <table className="audit-table">
            <thead><tr><th>Timestamp</th><th>User &amp; Role</th><th>Action</th><th>Activity Details</th><th>Entity</th><th>IP Address</th></tr></thead>
            <tbody>
              {!loading && !error && result.logs.map((log) => <tr key={log.id}>
                <td><time dateTime={String(log.created_at).replace(' ', 'T')}><span>{String(log.created_at).split(' ')[0]}</span><small>{String(log.created_at).split(' ')[1]}</small></time></td>
                <td><strong>{log.user_name || log.user_id || 'Unknown user'}</strong><small className="audit-role">{log.role || 'Unknown role'}</small></td>
                <td><span className={`audit-badge ${log.action === 'STOCK_UPDATE' ? 'audit-stock' : ''}`}>{actionLabel(log.action)}</span></td>
                <td className="audit-description">{log.description}</td>
                <td className="audit-entity">{log.entity_id ? <><small>{log.entity_type || 'item'}</small><span>{log.entity_id}</span></> : '—'}</td>
                <td className="audit-ip">{log.ip_address || '—'}</td>
              </tr>)}
              {(loading || error || !result.logs.length) && <tr><td className="audit-empty" colSpan={6}>{loading ? 'Loading activity logs…' : error ? 'Activity logs could not be loaded.' : 'No activity matches these filters.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="audit-pagination">
          <span role="status">{loading ? 'Loading…' : `${result.total ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, result.total)} of ${result.total} records`}</span>
          <div><button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={loading || page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </footer>
      </div>
    </section>
  )
}
