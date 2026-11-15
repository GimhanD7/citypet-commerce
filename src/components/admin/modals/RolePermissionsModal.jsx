import React, { useState } from 'react'
import {
  X,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react'

const COLOR_PRESETS = [
  '#04959d', // CityPet Teal
  '#123835', // Dark Forest
  '#00a86b', // Emerald Green
  '#8b5cf6', // Violet Purple
  '#2563eb', // Royal Blue
  '#f59e0b', // Amber Orange
  '#e11d48', // Rose Red
  '#64748b', // Slate Gray
]

export default function RolePermissionsModal({
  role,
  isNew = false,
  modules = [],
  onClose,
  onSave,
  saving = false,
  error = '',
}) {
  const [roleId, setRoleId] = useState(role?.id || '')
  const [roleName, setRoleName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [badgeColor, setBadgeColor] = useState(role?.badgeColor || '#04959d')
  const [permissions, setPermissions] = useState(() => {
    const initial = {}
    modules.forEach((m) => {
      initial[m.id] = {
        create: Boolean(role?.permissions?.[m.id]?.create),
        read: Boolean(role?.permissions?.[m.id]?.read),
        update: Boolean(role?.permissions?.[m.id]?.update),
        delete: Boolean(role?.permissions?.[m.id]?.delete),
      }
    })
    return initial
  })

  // Toggle individual permission checkbox
  const handleToggle = (moduleId, action) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action],
      },
    }))
  }

  // Toggle all permissions for a specific module row
  const handleToggleModuleRow = (moduleId) => {
    const current = permissions[moduleId] || {}
    const allChecked = current.create && current.read && current.update && current.delete
    const nextVal = !allChecked

    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        create: nextVal,
        read: nextVal,
        update: nextVal,
        delete: nextVal,
      },
    }))
  }

  // Toggle all permissions for an entire column (Create, Read, Update, or Delete)
  const handleToggleColumn = (action) => {
    const allChecked = modules.every((m) => permissions[m.id]?.[action])
    const nextVal = !allChecked

    setPermissions((prev) => {
      const updated = { ...prev }
      modules.forEach((m) => {
        updated[m.id] = {
          ...updated[m.id],
          [action]: nextVal,
        }
      })
      return updated
    })
  }

  // Grant or Revoke All
  const handleSelectAll = (grantAll) => {
    const updated = {}
    modules.forEach((m) => {
      updated[m.id] = {
        create: grantAll,
        read: grantAll,
        update: grantAll,
        delete: grantAll,
      }
    })
    setPermissions(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!roleName.trim()) return

    onSave({
      id: isNew ? roleId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : role.id,
      name: roleName.trim(),
      description: description.trim(),
      badgeColor,
      permissions,
    })
  }

  // Count active permissions
  const totalGranted = Object.values(permissions).reduce((acc, row) => {
    return acc + (row.create ? 1 : 0) + (row.read ? 1 : 0) + (row.update ? 1 : 0) + (row.delete ? 1 : 0)
  }, 0)
  const maxPossible = modules.length * 4

  return (
    <div className="order-modal-backdrop" onClick={onClose} style={{ overflowY: 'auto', padding: '16px' }}>
      <div
        className="order-modal-card role-modal-card-fixed"
        style={{
          maxWidth: '880px',
          width: '100%',
          maxHeight: 'calc(100vh - 36px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(10, 30, 28, 0.28)',
          background: '#ffffff',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="order-modal-header" style={{ padding: '20px 24px', flexShrink: 0, borderBottom: '1px solid #ebf4f1' }}>
          <div className="order-modal-header-left">
            <div
              className="order-modal-icon"
              style={{ background: `${badgeColor}18`, color: badgeColor }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="order-modal-title">
                {isNew ? 'Create New System Role' : `Edit Role: ${role?.name}`}
              </h3>
              <p className="order-modal-subtitle">
                Assign granular Add (Create), Read (View), Update (Edit), and Delete (Remove) permissions.
              </p>
            </div>
          </div>
          <button type="button" className="order-modal-close" onClick={onClose} disabled={saving}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
          <div
            className="order-modal-body"
            style={{ padding: '20px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            {/* Role Metadata Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isNew ? '1fr 1fr' : '1fr',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#173d3b', marginBottom: '6px' }}>
                  Role Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Veterinary Staff, Store Manager"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #d4e8e3',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    color: '#123835',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {isNew && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#173d3b', marginBottom: '6px' }}>
                    Role Identifier Key (slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. veterinary_staff, store_manager"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #d4e8e3',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      color: '#123835',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#173d3b', marginBottom: '6px' }}>
                  Role Description
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of duties and access level..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #d4e8e3',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#325854',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#173d3b', marginBottom: '6px' }}>
                  Badge Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBadgeColor(color)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: color,
                        border: badgeColor === color ? '2.5px solid #123835' : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transform: badgeColor === color ? 'scale(1.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Permissions Matrix Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#eef8f6',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #d4ece7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#123835' }}>
                  Granted Permissions:
                </span>
                <span
                  style={{
                    background: '#04959d',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                  }}
                >
                  {totalGranted} of {maxPossible} Actions
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #c2e2dc',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#04959d',
                    cursor: 'pointer',
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2ece9',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#638581',
                    cursor: 'pointer',
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Permissions Matrix Table */}
            <div
              style={{
                border: '1.5px solid #d4ece7',
                borderRadius: '12px',
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '340px',
                boxShadow: '0 2px 8px rgba(18, 56, 53, 0.03)',
                background: '#ffffff',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f5faf8' }}>
                  <tr style={{ background: '#f5faf8', borderBottom: '1.5px solid #d4ece7' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#2b524e' }}>
                      System Module / Resource
                    </th>
                    <th
                      style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 800, color: '#2b524e', textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleToggleColumn('create')}
                      title="Click to toggle all Add permissions"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Add (Create)</span>
                      </div>
                    </th>
                    <th
                      style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 800, color: '#2b524e', textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleToggleColumn('read')}
                      title="Click to toggle all Read permissions"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Read (View)</span>
                      </div>
                    </th>
                    <th
                      style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 800, color: '#2b524e', textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleToggleColumn('update')}
                      title="Click to toggle all Update permissions"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Update (Edit)</span>
                      </div>
                    </th>
                    <th
                      style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 800, color: '#2b524e', textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleToggleColumn('delete')}
                      title="Click to toggle all Delete permissions"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Delete (Remove)</span>
                      </div>
                    </th>
                    <th style={{ padding: '12px 12px', fontSize: '11px', fontWeight: 800, color: '#7a9f9b', textAlign: 'center' }}>
                      Row Toggle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => {
                    const row = permissions[m.id] || { create: false, read: false, update: false, delete: false }
                    const isAllRow = row.create && row.read && row.update && row.delete
                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: '1px solid #eef5f3',
                          background: isAllRow ? '#fafffe' : '#ffffff',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Module Name & Desc */}
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ display: 'block', fontSize: '13px', color: '#173d3b' }}>
                            {m.name}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#688d88' }}>{m.desc}</span>
                        </td>

                        {/* Add (Create) */}
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.create}
                              onChange={() => handleToggle(m.id, 'create')}
                              style={{ width: '18px', height: '18px', accentColor: '#04959d', cursor: 'pointer' }}
                            />
                          </label>
                        </td>

                        {/* Read (View) */}
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.read}
                              onChange={() => handleToggle(m.id, 'read')}
                              style={{ width: '18px', height: '18px', accentColor: '#04959d', cursor: 'pointer' }}
                            />
                          </label>
                        </td>

                        {/* Update (Edit) */}
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.update}
                              onChange={() => handleToggle(m.id, 'update')}
                              style={{ width: '18px', height: '18px', accentColor: '#04959d', cursor: 'pointer' }}
                            />
                          </label>
                        </td>

                        {/* Delete (Remove) */}
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.delete}
                              onChange={() => handleToggle(m.id, 'delete')}
                              style={{ width: '18px', height: '18px', accentColor: '#e11d48', cursor: 'pointer' }}
                            />
                          </label>
                        </td>

                        {/* Row Quick Toggle */}
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleRow(m.id)}
                            style={{
                              background: '#f0f7f5',
                              border: '1px solid #d4e8e3',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#04959d',
                              cursor: 'pointer',
                            }}
                          >
                            {isAllRow ? 'Revoke' : 'All 4'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {error && (
              <p style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: '#fff1f2', color: '#be123c', fontSize: '13px', fontWeight: 600 }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              flexShrink: 0,
              padding: '16px 24px',
              borderTop: '1px solid #ebf4f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              boxShadow: '0 -4px 14px rgba(18, 56, 53, 0.03)',
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: '12px', color: '#688d88' }}>
              Changes take effect immediately for all users assigned to this role.
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="order-action-btn"
                onClick={onClose}
                disabled={saving}
                style={{ padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !roleName.trim() || (isNew && !roleId.trim())}
                className="orders-create-btn"
                style={{ padding: '9px 24px', background: badgeColor }}
              >
                <ShieldCheck size={16} />
                <span>{saving ? 'Saving Role...' : isNew ? 'Create Role' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
