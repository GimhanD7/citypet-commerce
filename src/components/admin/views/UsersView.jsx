import React, { useEffect, useRef, useState } from 'react'
import { RefreshCw, Search, Users, ShieldCheck, UserRound, Filter, Pencil, X, CheckCircle2 } from 'lucide-react'
import './users.css'
import { apiFetch } from '../../../config/api'

export default function UsersView({ onSessionExpired }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [refresh, setRefresh] = useState(0)
  const [csrfToken, setCsrfToken] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const editDialogRef = useRef(null)
  const isEditing = Boolean(editing)

  useEffect(() => {
    if (!isEditing) return
    const dialog = editDialogRef.current
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isEditing])

  async function saveUser(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      const data = await apiFetch('admin/users.php', {
        method: 'PUT',
        body: { id: editing.id, name: editing.name, email: editing.email,
          phone: editing.phone || '', role: editing.role, csrfToken },
      })
      setUsers((previous) => previous.map((user) => user.id === data.user.id ? data.user : user))
      setEditing(null)
      setNotice('User details saved successfully.')
      if (data.sessionRoleChanged) onSessionExpired?.()
    } catch (err) {
      setSaveError(err.message)
      if (err.status === 401) onSessionExpired?.()
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    async function loadUsers() {
      try {
        const data = await apiFetch('admin/users.php', { credentials: 'include' })
        if (!Array.isArray(data?.users)) throw new Error('Unable to load system users.')
        if (mounted) {
          setUsers(data.users)
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        if (mounted) {
          if (err.status === 401) {
            onSessionExpired?.()
            return
          }
          setUsers([])
          setError(err.message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [refresh])

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter((user) =>
    (role === 'all' || user.role === role) &&
    [user.id, user.name, user.email, user.phone].some((value) => String(value || '').toLowerCase().includes(query))
  )

  return (
    <div className="pm-page users-page">
      <div className="pm-page-header">
        <div>
          <span className="pm-eyebrow">People &amp; Access Management</span>
          <h2 className="pm-page-title">Users</h2>
          <p className="pm-page-desc">Manage your City Pet community, account details and user roles.</p>
        </div>
        <button type="button" className="pm-add-btn" disabled={loading || saving}
          onClick={() => setRefresh((value) => value + 1)}>
          <RefreshCw size={16} /> Refresh Users
        </button>
      </div>
      <div className="pm-kpi-strip users-kpis">
        {[
          { label: 'Total Users', value: users.length, sub: 'Registered accounts', icon: Users },
          { label: 'Administrators', value: users.filter((user) => user.role === 'admin').length, sub: 'System management access', icon: ShieldCheck },
          { label: 'Customers', value: users.filter((user) => user.role === 'user').length, sub: 'Pet parents & store customers', icon: UserRound },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div className="pm-kpi-card" key={label}>
            <div className="pm-kpi-row"><span className="pm-kpi-label">{label}</span>
              <span className="pm-kpi-icon-bubble pm-bubble-mint"><Icon size={18} /></span>
            </div>
            <strong className="pm-kpi-value">{loading || error ? '—' : value}</strong>
            <small className="pm-kpi-sub">{sub}</small>
          </div>
        ))}
      </div>
      {notice && <p className="users-notice" role="status"><CheckCircle2 size={18} />{notice}</p>}
      {editing && (
        <dialog ref={editDialogRef} className="apm-card users-edit-dialog" aria-labelledby="edit-user-title"
          onCancel={(event) => {
            event.preventDefault()
            if (!saving) setEditing(null)
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget || saving) return
            const bounds = event.currentTarget.getBoundingClientRect()
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) setEditing(null)
          }}>
          <div className="apm-header">
            <div className="apm-header-left"><span className="apm-header-icon"><Pencil size={20} /></span>
              <div><h3 className="apm-title" id="edit-user-title">Edit User</h3><p className="apm-subtitle">{editing.name} · {editing.id}</p></div>
            </div>
            <button type="button" className="apm-close-btn" aria-label="Close edit form" disabled={saving} onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <form className="users-edit-form" onSubmit={saveUser}>
            <fieldset disabled={saving} className="users-edit-fields">
              {[
                ['name', 'Name', 'text', 120],
                ['email', 'Email', 'email', 150],
                ['phone', 'Phone', 'tel', 30],
              ].map(([field, label, type, maxLength]) => (
                <div className="apm-field-full" key={field}>
                  <label className="apm-label" htmlFor={`user-${field}`}>{label}</label>
                  <input id={`user-${field}`} className="apm-input" type={type}
                    maxLength={maxLength} required={field !== 'phone'} value={editing[field] || ''}
                    onChange={(e) => setEditing((user) => ({ ...user, [field]: e.target.value }))} />
                </div>
              ))}
              <div className="apm-field-full">
                <label className="apm-label" htmlFor="user-role">Role</label>
                <select id="user-role" className="apm-select" value={editing.role}
                  onChange={(e) => setEditing((user) => ({ ...user, role: e.target.value }))}>
                  <option value="user">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {saveError && <p className="users-error" role="alert">{saveError}</p>}
              <div className="apm-footer-actions users-edit-actions">
                <button type="button" className="apm-cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="apm-submit-btn">{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </fieldset>
          </form>
        </dialog>
      )}
      <div className="pm-toolbar">
        <div className="pm-search-box">
          <Search size={16} className="pm-search-icon" />
          <input className="pm-search-input" aria-label="Search users"
            placeholder="Search by name, email, phone or user ID…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && <button type="button" className="pm-search-clear" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="pm-filter-pill"><Filter size={14} />
        <select className="pm-filter-select" aria-label="Filter users by role" value={role}
          onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="admin">Administrators</option>
          <option value="user">Customers</option>
        </select>
        </div>
        <span className="pm-result-badge">{loading || error ? '—' : `${filteredUsers.length} of ${users.length}`}</span>
      </div>
      {error ? <p className="users-error" role="alert">{error}</p> : loading ? <div className="pm-table-card users-empty" role="status"><Users size={32} /><p>Loading users…</p></div> : (
        <div className="pm-table-card">
          <div className="users-table-heading"><h3>User Directory</h3><span>All system accounts</span></div>
          <div className="pm-table-scroll">
          <table className="pm-table users-table">
            <thead><tr>
              {['User ID', 'Name', 'Email', 'Phone', 'Role', 'Member Since', 'Actions'].map((label) =>
                <th key={label} scope="col" className="pm-th">{label}</th>
              )}
            </tr></thead>
            <tbody>
              {filteredUsers.map((user) => <tr key={user.id} className="pm-row">
                <td className="pm-td"><span className="users-id">{user.id}</span></td>
                <td className="pm-td"><div className="users-identity"><span className={`users-avatar ${user.role === 'admin' ? 'users-avatar-admin' : ''}`} aria-hidden="true">{user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><strong>{user.name}</strong></div></td>
                <td className="pm-td">{user.email}</td>
                <td className="pm-td">{user.phone || '—'}</td>
                <td className="pm-td"><span className={`users-role ${user.role === 'admin' ? 'users-role-admin' : ''}`}>{user.role === 'admin' ? <ShieldCheck size={13} /> : <UserRound size={13} />}{user.role === 'admin' ? 'Administrator' : 'Customer'}</span></td>
                <td className="pm-td">{user.member_since || user.created_at?.slice(0, 10) || '—'}</td>
                <td className="pm-td"><button type="button" className="pm-btn-edit" disabled={saving}
                  aria-label={`Edit ${user.name}`} onClick={() => {
                    setEditing({ ...user }); setSaveError(''); setNotice('')
                  }}><Pencil size={13} />Edit</button></td>
              </tr>)}
              {filteredUsers.length === 0 && <tr><td colSpan={7} className="pm-td"><div className="users-empty"><Users size={32} />
                {users.length === 0 ? 'No system users found.' : 'No users match your search or role filter.'}
              </div></td></tr>}
            </tbody>
          </table>
          </div>
          <div className="pm-table-footer"><span>Showing {filteredUsers.length} of {users.length} users</span><span className="users-footer-note"><ShieldCheck size={14} />Administrator managed accounts</span></div>
        </div>
      )}
    </div>
  )
}
