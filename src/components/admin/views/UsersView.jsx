import React, { useEffect, useRef, useState } from 'react'
import {
  RefreshCw,
  Search,
  Users,
  ShieldCheck,
  UserRound,
  Filter,
  Pencil,
  X,
  CheckCircle2,
  Plus,
  Trash2,
  Key,
  Lock,
  Layers,
  Sparkles,
  ShieldAlert,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  SlidersHorizontal,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react'
import './users.css'
import { apiFetch } from '../../../config/api'
import { roleService, userService } from '../../../services/api'
import RolePermissionsModal from '../modals/RolePermissionsModal'

export default function UsersView({ onSessionExpired }) {
  // Tabs: 'users' (User Directory) or 'roles' (Roles & Permissions Management)
  const [activeTab, setActiveTab] = useState('users')

  // Users states
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [refresh, setRefresh] = useState(0)
  const [csrfToken, setCsrfToken] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [savingUser, setSavingUser] = useState(false)
  const [userSaveError, setUserSaveError] = useState('')
  const [notice, setNotice] = useState('')

  // Quick Password Reset Modal state
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    user: null,
    newPassword: '',
    showPassword: false,
    copied: false,
    saving: false,
    error: '',
  })

  // Delete User Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
    deleting: false,
    error: '',
  })

  // Add User Modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'veterinarian',
    password: '',
  })
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  // Roles & Permissions states
  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [roleModalState, setRoleModalState] = useState({ isOpen: false, isNew: false, role: null })
  const [savingRole, setSavingRole] = useState(false)
  const [roleModalError, setRoleModalError] = useState('')

  // Fetch Users
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    async function loadUsers() {
      try {
        const data = await userService.getUsers()
        if (!Array.isArray(data?.users)) throw new Error('Unable to load system users.')
        if (mounted) {
          setUsers(data.users)
          setCsrfToken(data.csrfToken)
          if (data.currentUserId) {
            setCurrentUserId(data.currentUserId)
          }
          if (Array.isArray(data?.roles) && data.roles.length > 0) {
            setRoles((prev) => (prev.length === 0 ? data.roles : prev))
          }
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
    return () => {
      mounted = false
    }
  }, [refresh])

  // Fetch Roles & Permissions
  const loadRoles = async () => {
    setLoadingRoles(true)
    try {
      const data = await roleService.getRoles()
      if (Array.isArray(data?.roles)) {
        setRoles(data.roles)
      }
      if (Array.isArray(data?.modules)) {
        setModules(data.modules)
      }
      if (data?.csrfToken) {
        setCsrfToken(data.csrfToken)
      }
    } catch (err) {
      console.warn('Failed to load roles from API:', err)
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [refresh])

  // Save User Edit (Name, Email, Phone, Role, and optional Password)
  async function handleSaveUser(e) {
    e.preventDefault()
    if (savingUser || !editingUser) return
    setSavingUser(true)
    setUserSaveError('')
    try {
      const data = await userService.updateUser({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone || '',
        role: editingUser.role,
        password: editingUser.newPassword || '',
        csrfToken,
      })
      setUsers((prev) =>
        prev.map((user) => (user.id === data.user.id ? data.user : user))
      )
      setEditingUser(null)
      setNotice(`User account "${data.user.name}" updated successfully.${data.passwordChanged ? ' Password was also changed.' : ''}`)
      loadRoles()
      if (data.sessionRoleChanged) onSessionExpired?.()
    } catch (err) {
      setUserSaveError(err.message)
      if (err.status === 401) onSessionExpired?.()
    } finally {
      setSavingUser(false)
    }
  }

  // Quick Change Password for User
  async function handlePasswordReset(e) {
    e.preventDefault()
    if (!passwordModal.user || passwordModal.saving) return
    const pw = passwordModal.newPassword.trim()
    if (!pw || pw.length < 6) {
      setPasswordModal((prev) => ({ ...prev, error: 'Password must be at least 6 characters long.' }))
      return
    }
    setPasswordModal((prev) => ({ ...prev, saving: true, error: '' }))
    try {
      await userService.updateUser({
        id: passwordModal.user.id,
        name: passwordModal.user.name,
        email: passwordModal.user.email,
        phone: passwordModal.user.phone || '',
        role: passwordModal.user.role,
        password: pw,
        csrfToken,
      })
      setNotice(`Password for "${passwordModal.user.name}" updated successfully!`)
      setPasswordModal({
        isOpen: false,
        user: null,
        newPassword: '',
        showPassword: false,
        copied: false,
        saving: false,
        error: '',
      })
    } catch (err) {
      setPasswordModal((prev) => ({ ...prev, error: err.message || 'Failed to update password.' }))
    } finally {
      setPasswordModal((prev) => ({ ...prev, saving: false }))
    }
  }

  // Delete User Account
  async function handleDeleteAccount() {
    if (!deleteModal.user || deleteModal.deleting) return
    setDeleteModal((prev) => ({ ...prev, deleting: true, error: '' }))
    try {
      await userService.deleteUser(deleteModal.user.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id))
      setNotice(`User account "${deleteModal.user.name}" was permanently removed.`)
      setDeleteModal({ isOpen: false, user: null, deleting: false, error: '' })
      loadRoles()
    } catch (err) {
      setDeleteModal((prev) => ({ ...prev, error: err.message || 'Failed to delete user account.' }))
    } finally {
      setDeleteModal((prev) => ({ ...prev, deleting: false }))
    }
  }

  // Create New User & Assign Role
  async function handleAddUser(e) {
    e.preventDefault()
    if (addingUser) return
    setAddingUser(true)
    setAddUserError('')
    try {
      const data = await userService.createUser({
        ...newUserForm,
        csrfToken,
      })
      if (data?.user) {
        setUsers((prev) => [data.user, ...prev])
        setNotice(`User account "${data.user.name}" created successfully as ${getRoleMeta(data.user.role).name}!`)
        setIsAddUserOpen(false)
        setNewUserForm({ name: '', email: '', phone: '', role: 'veterinarian', password: '' })
        loadRoles()
      }
    } catch (err) {
      setAddUserError(err.message || 'Failed to create user account.')
      if (err.status === 401) onSessionExpired?.()
    } finally {
      setAddingUser(false)
    }
  }

  // Save Role & Permissions (Create / Update)
  async function handleSaveRole(rolePayload) {
    setSavingRole(true)
    setRoleModalError('')
    try {
      if (roleModalState.isNew) {
        await roleService.createRole(rolePayload)
        setNotice(`Role "${rolePayload.name}" created with assigned permissions!`)
      } else {
        await roleService.updateRole(rolePayload)
        setNotice(`Role "${rolePayload.name}" permissions updated!`)
      }
      setRoleModalState({ isOpen: false, isNew: false, role: null })
      await loadRoles()
      setRefresh((r) => r + 1)
    } catch (err) {
      setRoleModalError(err.message || 'Failed to save role.')
    } finally {
      setSavingRole(false)
    }
  }

  // Delete Custom Role
  async function handleDeleteRole(roleItem) {
    if (roleItem.isSystem) return
    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${roleItem.name}"?\nAny users assigned to this role will automatically revert to Customer access.`
    )
    if (!confirmed) return

    try {
      await roleService.deleteRole(roleItem.id)
      setNotice(`Role "${roleItem.name}" deleted.`)
      await loadRoles()
      setRefresh((r) => r + 1)
    } catch (err) {
      setError(err.message || 'Failed to delete role.')
    }
  }

  // Helper to find role metadata
  const getRoleMeta = (roleId) => {
    return (
      roles.find((r) => r.id === roleId) || {
        id: roleId,
        name: roleId === 'admin' ? 'Administrator' : roleId === 'user' ? 'Customer' : roleId,
        badgeColor: roleId === 'admin' ? '#123835' : '#64748b',
        description: '',
      }
    )
  }

  // Filtered users search & role filter
  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    const matchRole = roleFilter === 'all' || user.role === roleFilter
    const matchSearch =
      !query ||
      [user.id, user.name, user.email, user.phone, user.role].some((val) =>
        String(val || '').toLowerCase().includes(query)
      )
    return matchRole && matchSearch
  })

  // KPI counts
  const adminCount = users.filter((u) => u.role === 'admin').length
  const staffCount = users.filter(
    (u) => u.role !== 'admin' && u.role !== 'user'
  ).length
  const customerCount = users.filter((u) => u.role === 'user').length

  return (
    <div className="pm-page users-page">
      {/* ── Page Header ── */}
      <div className="pm-page-header">
        <div>
          <span className="pm-eyebrow">Access Control &amp; RBAC</span>
          <h2 className="pm-page-title">Users &amp; Roles Management</h2>
          <p className="pm-page-desc">
            Manage user accounts, assign custom roles, and configure granular Add, Read, Update, and Delete permissions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher: Users vs Roles */}
          <div
            style={{
              display: 'inline-flex',
              background: '#eef6f4',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #d4e8e3',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              style={{
                border: 'none',
                borderRadius: '9px',
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeTab === 'users' ? '#ffffff' : 'transparent',
                color: activeTab === 'users' ? '#04959d' : '#557e79',
                boxShadow: activeTab === 'users' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={14} /> User Accounts ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              style={{
                border: 'none',
                borderRadius: '9px',
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeTab === 'roles' ? '#ffffff' : 'transparent',
                color: activeTab === 'roles' ? '#04959d' : '#557e79',
                boxShadow: activeTab === 'roles' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={14} /> Roles &amp; Permissions ({roles.length})
            </button>
          </div>

          {activeTab === 'roles' ? (
            <button
              type="button"
              className="pm-add-btn"
              onClick={() => setRoleModalState({ isOpen: true, isNew: true, role: null })}
            >
              <Plus size={16} /> Add Role
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="pm-btn-secondary users-refresh-btn"
                disabled={loading || savingUser}
                onClick={() => setRefresh((v) => v + 1)}
                title="Refresh user list"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                className="pm-add-btn primary-teal"
                onClick={() => {
                  setIsAddUserOpen(true)
                  setAddUserError('')
                }}
              >
                <UserPlus size={16} /> Add User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="pm-kpi-strip users-kpis">
        {[
          { label: 'Total Users', value: users.length, sub: 'Registered accounts', icon: Users, color: '#04959d', bg: '#eef8f6' },
          { label: 'Administrators', value: adminCount, sub: 'Root security access', icon: ShieldCheck, color: '#123835', bg: '#e6f5f3' },
          { label: 'Staff & Specialists', value: staffCount, sub: 'Doctors, Pharmacists, Cashiers', icon: Key, color: '#8b5cf6', bg: '#f5f0fb' },
          { label: 'Customers', value: customerCount, sub: 'Pet parents & shoppers', icon: UserRound, color: '#0284c7', bg: '#eef8fc' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div className="pm-kpi-card users-modern-kpi" key={label}>
            <div className="pm-kpi-row">
              <span className="pm-kpi-label">{label}</span>
              <span className="pm-kpi-icon-bubble" style={{ background: bg, color }}>
                <Icon size={18} />
              </span>
            </div>
            <strong className="pm-kpi-value">{loading || error ? '—' : value}</strong>
            <small className="pm-kpi-sub">{sub}</small>
          </div>
        ))}
      </div>

      {notice && (
        <p className="users-notice" role="status">
          <CheckCircle2 size={18} /> {notice}
        </p>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: USERS DIRECTORY
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <>
          {/* Add User Modal */}
          {isAddUserOpen && (
            <div className="users-modal-overlay" onClick={() => !addingUser && setIsAddUserOpen(false)}>
              <div
                className="users-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-user-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="users-modal-header">
                  <div className="users-modal-header-left">
                    <span className="users-modal-icon-badge" style={{ background: '#e6f5f3', color: '#0e5d59' }}>
                      <UserPlus size={20} />
                    </span>
                    <div>
                      <h3 className="users-modal-title" id="add-user-title">
                        Add New System User
                      </h3>
                      <p className="users-modal-subtitle">
                        Register a hospital doctor, staff specialist, or customer account
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="users-modal-close-btn"
                    aria-label="Close add form"
                    disabled={addingUser}
                    onClick={() => setIsAddUserOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form className="users-modal-body" onSubmit={handleAddUser}>
                  <fieldset disabled={addingUser} className="users-edit-fields">
                    <div className="apm-field-full">
                      <label className="apm-label" htmlFor="new-user-name">Full Name *</label>
                      <input
                        id="new-user-name"
                        className="apm-input"
                        type="text"
                        required
                        placeholder="e.g. Dr. Sugath Weerasinghe"
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="apm-field-half">
                      <label className="apm-label" htmlFor="new-user-email">Email Address *</label>
                      <input
                        id="new-user-email"
                        className="apm-input"
                        type="email"
                        required
                        placeholder="doctor@citypet.lk"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div className="apm-field-half">
                      <label className="apm-label" htmlFor="new-user-phone">Phone Number</label>
                      <input
                        id="new-user-phone"
                        className="apm-input"
                        type="tel"
                        placeholder="077 123 4567"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div className="apm-field-full">
                      <label className="apm-label" htmlFor="new-user-role">Assigned Role &amp; Access Level *</label>
                      <select
                        id="new-user-role"
                        className="apm-select"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                        style={{ fontWeight: 700 }}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.isSystem ? '(System Role)' : ''}
                          </option>
                        ))}
                      </select>
                      {roles.find((r) => r.id === newUserForm.role)?.description && (
                        <small style={{ display: 'block', marginTop: '6px', fontSize: '11.5px', color: '#5a7e79' }}>
                          {roles.find((r) => r.id === newUserForm.role).description}
                        </small>
                      )}
                    </div>

                    <div className="apm-field-full">
                      <label className="apm-label" htmlFor="new-user-password">Initial Password (optional)</label>
                      <input
                        id="new-user-password"
                        className="apm-input"
                        type="password"
                        placeholder="Default: CityPet@123"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#799792' }}>
                        Leave blank to use default temporary password (CityPet@123). User can change it after login.
                      </small>
                    </div>

                    {addUserError && (
                      <p className="users-error" role="alert">
                        {addUserError}
                      </p>
                    )}

                    <div className="apm-footer-actions">
                      <button
                        type="button"
                        className="apm-cancel-btn"
                        onClick={() => setIsAddUserOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="apm-submit-btn">
                        {addingUser ? 'Creating...' : 'Create Account & Assign Role'}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="users-modal-overlay" onClick={() => !savingUser && setEditingUser(null)}>
              <div
                className="users-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-user-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="users-modal-header">
                  <div className="users-modal-header-left">
                    <span className="users-modal-icon-badge" style={{ background: '#eef6f4', color: '#04959d' }}>
                      <Pencil size={20} />
                    </span>
                    <div>
                      <h3 className="users-modal-title" id="edit-user-title">
                        Edit User &amp; Assign Role
                      </h3>
                      <p className="users-modal-subtitle">
                        {editingUser.name} &bull; ID: {editingUser.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="users-modal-close-btn"
                    aria-label="Close edit form"
                    disabled={savingUser}
                    onClick={() => setEditingUser(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form className="users-modal-body" onSubmit={handleSaveUser}>
                  <fieldset disabled={savingUser} className="users-edit-fields">
                    {[
                      ['name', 'Full Name', 'text', 120],
                      ['email', 'Email Address', 'email', 150],
                      ['phone', 'Phone Number', 'tel', 30],
                    ].map(([field, label, type, maxLength]) => (
                      <div className="apm-field-full" key={field}>
                        <label className="apm-label" htmlFor={`user-${field}`}>
                          {label}
                        </label>
                        <input
                          id={`user-${field}`}
                          className="apm-input"
                          type={type}
                          maxLength={maxLength}
                          required={field !== 'phone'}
                          value={editingUser[field] || ''}
                          onChange={(e) =>
                            setEditingUser((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                        />
                      </div>
                    ))}

                    {/* Dynamic Role Assignment Dropdown */}
                    <div className="apm-field-full">
                      <label className="apm-label" htmlFor="user-role">
                        Assigned Role &amp; Permissions Level
                      </label>
                      <select
                        id="user-role"
                        className="apm-select"
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser((prev) => ({ ...prev, role: e.target.value }))
                        }
                        style={{ fontWeight: 700 }}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.isSystem ? '(System Role)' : ''}
                          </option>
                        ))}
                      </select>
                      {roles.find((r) => r.id === editingUser.role)?.description && (
                        <small style={{ display: 'block', marginTop: '6px', fontSize: '11.5px', color: '#5a7e79' }}>
                          {roles.find((r) => r.id === editingUser.role).description}
                        </small>
                      )}
                    </div>

                    {/* Change Password (optional) */}
                    <div className="apm-field-full">
                      <label className="apm-label" htmlFor="user-edit-password">
                        New Password (optional)
                      </label>
                      <input
                        id="user-edit-password"
                        className="apm-input"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={editingUser.newPassword || ''}
                        onChange={(e) =>
                          setEditingUser((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                      <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#799792' }}>
                        Only enter a value if you wish to reset or change this user's password.
                      </small>
                    </div>

                    {userSaveError && (
                      <p className="users-error" role="alert">
                        {userSaveError}
                      </p>
                    )}

                    <div className="apm-footer-actions">
                      <button
                        type="button"
                        className="apm-cancel-btn"
                        onClick={() => setEditingUser(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="apm-submit-btn">
                        {savingUser ? 'Saving...' : 'Save User & Role'}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          )}

          {/* Quick Password Reset Modal */}
          {passwordModal.isOpen && passwordModal.user && (
            <div
              className="users-modal-overlay"
              onClick={() => !passwordModal.saving && setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
            >
              <div
                className="users-modal-card"
                style={{ maxWidth: '480px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="users-modal-header">
                  <div className="users-modal-header-left">
                    <span className="users-modal-icon-badge" style={{ background: '#fffbeb', color: '#b45309' }}>
                      <Key size={20} />
                    </span>
                    <div>
                      <h3 className="users-modal-title" id="change-password-title">
                        Change User Password
                      </h3>
                      <p className="users-modal-subtitle">
                        {passwordModal.user.name} &bull; {passwordModal.user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="users-modal-close-btn"
                    disabled={passwordModal.saving}
                    onClick={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form className="users-modal-body" onSubmit={handlePasswordReset}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '12px 14px', background: '#f8faf9', borderRadius: '12px', border: '1px solid #e2eee8', fontSize: '12.5px', color: '#486e68' }}>
                      As administrator, you can reset or assign a new password for <strong>{passwordModal.user.name}</strong>. The user can log in with this password immediately.
                    </div>

                    <div className="apm-field-full">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="apm-label" htmlFor="reset-new-password">
                          New Secure Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
                            let gen = 'CityPet@'
                            for (let i = 0; i < 4; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length))
                            setPasswordModal((prev) => ({ ...prev, newPassword: gen, showPassword: true }))
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#04959d',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0,
                          }}
                        >
                          <Sparkles size={12} /> Auto Generate
                        </button>
                      </div>

                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          id="reset-new-password"
                          className="apm-input"
                          style={{ width: '100%', paddingRight: '80px', fontFamily: passwordModal.showPassword ? 'inherit' : 'monospace' }}
                          type={passwordModal.showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Enter at least 6 characters"
                          value={passwordModal.newPassword}
                          onChange={(e) => setPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {passwordModal.newPassword && (
                            <button
                              type="button"
                              title="Copy password"
                              onClick={() => {
                                navigator.clipboard.writeText(passwordModal.newPassword)
                                setPasswordModal((prev) => ({ ...prev, copied: true }))
                                setTimeout(() => setPasswordModal((prev) => ({ ...prev, copied: false })), 2000)
                              }}
                              style={{ border: 'none', background: 'none', color: '#688d88', cursor: 'pointer', padding: '4px' }}
                            >
                              {passwordModal.copied ? <Check size={14} color="#00a86b" /> : <Copy size={14} />}
                            </button>
                          )}
                          <button
                            type="button"
                            title={passwordModal.showPassword ? 'Hide' : 'Show'}
                            onClick={() => setPasswordModal((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                            style={{ border: 'none', background: 'none', color: '#688d88', cursor: 'pointer', padding: '4px' }}
                          >
                            {passwordModal.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {passwordModal.error && (
                      <p className="users-error" role="alert">
                        {passwordModal.error}
                      </p>
                    )}

                    <div className="apm-footer-actions">
                      <button
                        type="button"
                        className="apm-cancel-btn"
                        onClick={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="apm-submit-btn"
                        disabled={passwordModal.saving || !passwordModal.newPassword.trim()}
                        style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}
                      >
                        {passwordModal.saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete User Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.user && (
            <div
              className="users-modal-overlay"
              onClick={() => !deleteModal.deleting && setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
            >
              <div
                className="users-modal-card"
                style={{ maxWidth: '480px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="users-modal-header" style={{ background: '#fff5f5', borderBottomColor: '#fecdd3' }}>
                  <div className="users-modal-header-left">
                    <span className="users-modal-icon-badge" style={{ background: '#fee2e2', color: '#e11d48' }}>
                      <AlertTriangle size={20} />
                    </span>
                    <div>
                      <h3 className="users-modal-title" id="delete-account-title" style={{ color: '#9f1239' }}>
                        Delete User Account
                      </h3>
                      <p className="users-modal-subtitle">
                        Permanent removal from hospital database
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="users-modal-close-btn"
                    disabled={deleteModal.deleting}
                    onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="users-modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.45' }}>
                      Are you sure you want to permanently delete the account for <strong>{deleteModal.user.name}</strong>?
                    </p>

                    <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '12.5px', color: '#4b5563' }}>
                        <strong>User ID:</strong> <code style={{ fontFamily: 'monospace' }}>{deleteModal.user.id}</code>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#4b5563' }}>
                        <strong>Email Address:</strong> {deleteModal.user.email}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#4b5563' }}>
                        <strong>Role Level:</strong> {getRoleMeta(deleteModal.user.role).name}
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3', fontSize: '12px', color: '#be123c' }}>
                      ⚠️ Warning: All privileges and login credentials for this account will be terminated immediately.
                    </div>

                    {deleteModal.error && (
                      <p className="users-error" role="alert">
                        {deleteModal.error}
                      </p>
                    )}

                    <div className="apm-footer-actions">
                      <button
                        type="button"
                        className="apm-cancel-btn"
                        onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="apm-submit-btn"
                        disabled={deleteModal.deleting}
                        onClick={handleDeleteAccount}
                        style={{ background: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)' }}
                      >
                        {deleteModal.deleting ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="pm-toolbar">
            <div className="pm-search-box">
              <Search size={16} className="pm-search-icon" />
              <input
                className="pm-search-input"
                aria-label="Search users"
                placeholder="Search by name, email, phone or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="pm-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Role */}
            <div className="pm-filter-pill">
              <Filter size={14} />
              <select
                className="pm-filter-select"
                aria-label="Filter users by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="pm-result-badge">
              {loading || error ? '—' : `${filteredUsers.length} of ${users.length} users`}
            </span>
          </div>

          {/* Users Table */}
          {error ? (
            <p className="users-error" role="alert">
              {error}
            </p>
          ) : loading ? (
            <div className="pm-table-card users-empty" role="status">
              <Users size={32} />
              <p>Loading users from database...</p>
            </div>
          ) : (
            <div className="pm-table-card">
              <div className="users-table-heading">
                <div>
                  <h3>User Directory</h3>
                  <span>Registered accounts &amp; assigned access roles</span>
                </div>
                <span className="pm-result-badge">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>
              <div className="pm-table-scroll">
                <table className="pm-table users-table">
                  <thead>
                    <tr>
                      <th scope="col" className="pm-th">User ID</th>
                      <th scope="col" className="pm-th">Name &amp; Account</th>
                      <th scope="col" className="pm-th">Email Address</th>
                      <th scope="col" className="pm-th">Phone Number</th>
                      <th scope="col" className="pm-th">Assigned Role</th>
                      <th scope="col" className="pm-th">Member Since</th>
                      <th scope="col" className="pm-th pm-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const roleMeta = getRoleMeta(user.role)
                      const userName = user?.name || user?.email || 'User'
                      const initials = (
                        userName
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part?.[0] || '')
                          .join('') || 'U'
                      ).toUpperCase()

                      return (
                        <tr key={user.id} className="pm-row users-modern-row">
                          <td className="pm-td">
                            <span className="users-id-pill">{user.id}</span>
                          </td>
                          <td className="pm-td">
                            <div className="users-identity">
                              <span
                                className="users-avatar"
                                style={{
                                  background: `${roleMeta.badgeColor || '#04959d'}16`,
                                  color: roleMeta.badgeColor || '#04959d',
                                  border: `1.5px solid ${roleMeta.badgeColor || '#04959d'}38`,
                                }}
                                aria-hidden="true"
                              >
                                {initials}
                              </span>
                              <div className="users-identity-texts">
                                <strong className="user-primary-name">{userName}</strong>
                                <span className="users-sub-tag">
                                  {user.role === 'admin' || user.role === 'super_admin'
                                    ? 'Security Administrator'
                                    : 'Hospital Staff / Client'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="pm-td">
                            <div className="users-contact-cell">
                              <Mail size={13} className="cell-icon" />
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td className="pm-td">
                            <div className="users-contact-cell">
                              <Phone size={13} className="cell-icon" />
                              <span>{user.phone || '—'}</span>
                            </div>
                          </td>
                          <td className="pm-td">
                            <span
                              className="users-role-pill"
                              style={{
                                background: `${roleMeta.badgeColor || '#64748b'}14`,
                                color: roleMeta.badgeColor || '#64748b',
                                border: `1.5px solid ${roleMeta.badgeColor || '#64748b'}38`,
                              }}
                            >
                              <span
                                className="role-pill-dot"
                                style={{ background: roleMeta.badgeColor || '#64748b' }}
                              />
                              <ShieldCheck size={13} />
                              {roleMeta.name}
                            </span>
                          </td>
                          <td className="pm-td">
                            <div className="users-contact-cell">
                              <Calendar size={13} className="cell-icon" />
                              <span>{user.member_since || user.created_at?.slice(0, 10) || '—'}</span>
                            </div>
                          </td>
                          <td className="pm-td pm-td-actions">
                            <div className="users-action-btn-group">
                              <button
                                type="button"
                                className="users-action-btn edit"
                                title={`Edit details & role for ${userName}`}
                                onClick={() => {
                                  setEditingUser({ ...user, newPassword: '' })
                                  setUserSaveError('')
                                  setNotice('')
                                }}
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                className="users-action-btn password"
                                title={`Change password for ${userName}`}
                                onClick={() => {
                                  setPasswordModal({
                                    isOpen: true,
                                    user,
                                    newPassword: '',
                                    showPassword: false,
                                    copied: false,
                                    saving: false,
                                    error: '',
                                  })
                                  setNotice('')
                                }}
                              >
                                <Key size={12} />
                                <span>Password</span>
                              </button>

                              <button
                                type="button"
                                className="users-action-btn delete"
                                title={
                                  user.id === currentUserId
                                    ? 'Cannot delete your active account'
                                    : `Delete account ${userName}`
                                }
                                disabled={user.id === currentUserId}
                                onClick={() => {
                                  setDeleteModal({
                                    isOpen: true,
                                    user,
                                    deleting: false,
                                    error: '',
                                  })
                                  setNotice('')
                                }}
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="pm-td">
                          <div className="users-empty">
                            <Users size={32} />
                            {users.length === 0
                              ? 'No system users found.'
                              : 'No users match your search or role filter.'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pm-table-footer">
                <span>
                  Showing {filteredUsers.length} of {users.length} users
                </span>
                <span className="users-footer-note">
                  <ShieldCheck size={14} /> Roles managed through Role-Based Access Control (RBAC)
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: ROLES & PERMISSIONS MATRIX MANAGEMENT
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'roles' && (
        <div className="roles-management-view">
          <div className="roles-matrix-banner">
            <div className="roles-matrix-banner-left">
              <div className="roles-matrix-title-row">
                <Key size={20} className="roles-banner-icon" />
                <h3>System Roles &amp; Permissions Matrix</h3>
              </div>
              <p>
                Configure granular privileges: Add (Create), Read (View), Update (Edit), and Delete (Remove) across 9 hospital &amp; store modules.
              </p>
            </div>
            <button
              type="button"
              className="pm-add-btn"
              onClick={() => setRoleModalState({ isOpen: true, isNew: true, role: null })}
            >
              <Plus size={15} /> Add Role
            </button>
          </div>

          {loadingRoles ? (
            <div className="users-empty">
              <RefreshCw size={28} className="animate-spin" />
              <p>Loading roles and permissions matrix...</p>
            </div>
          ) : (
            <div className="roles-grid">
              {roles.map((r) => {
                // Calculate permissions count
                const permRows = Object.values(r.permissions || {})
                const grantedCount = permRows.reduce(
                  (acc, row) =>
                    acc +
                    (row.create ? 1 : 0) +
                    (row.read ? 1 : 0) +
                    (row.update ? 1 : 0) +
                    (row.delete ? 1 : 0),
                  0
                )
                const totalActions = modules.length * 4

                return (
                  <div className="role-card" key={r.id}>
                    {/* Header */}
                    <div className="role-card-header">
                      <div className="role-card-badge-wrap">
                        <span
                          className="role-color-dot"
                          style={{ background: r.badgeColor || '#04959d' }}
                        />
                        <div>
                          <h4 className="role-title-text">{r.name}</h4>
                          <span className="role-id-tag">key: {r.id}</span>
                        </div>
                      </div>

                      {r.isSystem ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: '#f1f5f9',
                            color: '#475569',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Lock size={11} /> Built-in
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: '#eef9f8',
                            color: '#04959d',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Custom Role
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="role-desc">{r.description || 'No description provided.'}</p>

                    {/* Stats */}
                    <div className="role-stats-row">
                      <div className="role-stat-item">
                        <Users size={14} color="#04959d" />
                        <span>{r.userCount || 0} user{r.userCount !== 1 ? 's' : ''} assigned</span>
                      </div>
                      <div className="role-stat-item">
                        <ShieldCheck size={14} color="#00a86b" />
                        <span>{grantedCount} / {totalActions} privileges</span>
                      </div>
                    </div>

                    {/* Active Permissions Summary Chips */}
                    <div className="role-permissions-preview">
                      {modules.slice(0, 6).map((m) => {
                        const mPerm = r.permissions?.[m.id] || {}
                        const hasAny = mPerm.create || mPerm.read || mPerm.update || mPerm.delete
                        const isFull = mPerm.create && mPerm.read && mPerm.update && mPerm.delete
                        if (!hasAny) return null
                        return (
                          <span
                            key={m.id}
                            className="role-perm-chip"
                            title={`${m.name}: ${[
                              mPerm.create ? 'Add' : '',
                              mPerm.read ? 'Read' : '',
                              mPerm.update ? 'Update' : '',
                              mPerm.delete ? 'Delete' : '',
                            ].filter(Boolean).join(', ')}`}
                          >
                            {m.name.split(' ')[0]}:{' '}
                            {isFull
                              ? 'CRUD'
                              : [
                                  mPerm.create ? 'C' : '',
                                  mPerm.read ? 'R' : '',
                                  mPerm.update ? 'U' : '',
                                  mPerm.delete ? 'D' : '',
                                ].filter(Boolean).join('')}
                          </span>
                        )
                      })}
                      {grantedCount === 0 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No privileges assigned</span>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="role-card-footer">
                      <button
                        type="button"
                        className="role-configure-btn"
                        onClick={() =>
                          setRoleModalState({ isOpen: true, isNew: false, role: r })
                        }
                      >
                        <ShieldCheck size={14} />
                        <span>Configure Permissions</span>
                      </button>

                      {!r.isSystem && (
                        <button
                          type="button"
                          className="role-delete-btn"
                          onClick={() => handleDeleteRole(r)}
                          title={`Delete role ${r.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Role & Granular Permissions Modal (CRUD: Add, Read, Update, Delete) ── */}
      {roleModalState.isOpen && (
        <RolePermissionsModal
          role={roleModalState.role}
          isNew={roleModalState.isNew}
          modules={modules}
          onClose={() => setRoleModalState({ isOpen: false, isNew: false, role: null })}
          onSave={handleSaveRole}
          saving={savingRole}
          error={roleModalError}
        />
      )}
    </div>
  )
}
