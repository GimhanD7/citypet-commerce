import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  PawPrint,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Truck,
  Upload,
  User,
  X,
} from 'lucide-react'
import { profileService, orderService, petService } from '../../services/api'
import useStoreProducts from '../../services/useStoreProducts'
import ProductVisual from '../common/ProductVisual'

// Assets
import profileCatBanner from '../../assets/profile-cat-banner.jpg'
import petBuddyDog from '../../assets/pet-buddy-dog.jpg'
import petLunaCat from '../../assets/pet-luna-cat.jpg'

export default function CustomerProfile({
  authUser,
  onLogout,
  onNavigate,
  onAddToCart,
  onSelectProduct,
}) {
  const storeProducts = useStoreProducts()
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | orders | track | wishlist | addresses | pets | settings
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [profile, setProfile] = useState(() => ({
    id: authUser?.id || '',
    name: authUser?.name || '',
    firstName: authUser?.firstName || (authUser?.name ? authUser.name.split(' ')[0] : ''),
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    avatar: authUser?.avatar || '👤',
    memberSince: authUser?.memberSince || authUser?.member_since || 'Active Member',
    stats: {
      totalOrders: 0,
      wishlistCount: 0,
      petProfilesCount: 0,
    },
    addresses: authUser?.addresses || (authUser?.addressLine1 ? [{
      id: 'addr-primary',
      title: 'Primary Delivery Address',
      recipient: authUser?.name || 'Customer',
      phone: authUser?.phone || '',
      addressLine1: authUser.addressLine1,
      addressLine2: authUser.addressLine2 || '',
      city: authUser.city || 'Colombo',
      postalCode: authUser.postalCode || '',
      isDefault: true,
    }] : []),
    ...(authUser || {}),
  }))
  const [orders, setOrders] = useState([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [pets, setPets] = useState([])
  const [petsLoaded, setPetsLoaded] = useState(false)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [trackingSearchInput, setTrackingSearchInput] = useState('')
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [selectedPetRecord, setSelectedPetRecord] = useState(null)
  const [isAskVetModalOpen, setIsAskVetModalOpen] = useState(false)
  const [askVetSubmitted, setAskVetSubmitted] = useState(false)

  // Modals & form state for real database actions
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    recipient: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Colombo',
    postalCode: '',
    isDefault: true,
  })
  const [addressSaving, setAddressSaving] = useState(false)

  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    weight: '',
  })
  const [petSaving, setPetSaving] = useState(false)

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: authUser?.avatar || '',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState('')

  // Sync settings form when profile updates
  useEffect(() => {
    setSettingsForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      avatar: profile.avatar || '',
    })
  }, [profile.name, profile.email, profile.phone, profile.avatar])

  // Live API Fetching from database
  useEffect(() => {
    let mounted = true
    async function loadData() {
      const uId = authUser?.id || authUser?.phone || authUser?.email || ''
      if (!uId) {
        setOrders([])
        setPets([])
        setOrdersLoaded(true)
        setPetsLoaded(true)
        return
      }
      try {
        const [profData, ordersData, petsData] = await Promise.all([
          profileService.getProfile(uId),
          orderService.getUserOrders(uId),
          petService.getPets(uId),
        ])
        if (mounted) {
          if (profData) {
            setProfile((prev) => ({
              ...prev,
              ...profData,
              addresses: Array.isArray(profData.addresses) ? profData.addresses : (prev.addresses || []),
            }))
          }
          if (Array.isArray(ordersData)) {
            setOrders(ordersData)
            setTrackingOrder(ordersData.length > 0 ? ordersData[0] : null)
          } else {
            setOrders([])
            setTrackingOrder(null)
          }
          setOrdersLoaded(true)

          if (Array.isArray(petsData)) {
            setPets(petsData)
          } else {
            setPets([])
          }
          setPetsLoaded(true)
        }
      } catch (err) {
        console.warn('CustomerProfile API error:', err)
        if (mounted) {
          setOrders([])
          setPets([])
          setOrdersLoaded(true)
          setPetsLoaded(true)
        }
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [authUser?.id, authUser?.phone, authUser?.email])

  // Sync profile when authUser prop updates
  useEffect(() => {
    if (authUser) {
      setProfile((prev) => ({ ...prev, ...authUser }))
    }
  }, [authUser])

  // Save Settings to database
  const handleSaveSettings = async (e) => {
    e?.preventDefault()
    setSettingsSaving(true)
    setSettingsSuccess('')
    try {
      const uId = profile.id || authUser?.id || authUser?.phone || ''
      await profileService.updateProfile({
        userId: uId,
        name: settingsForm.name,
        email: settingsForm.email,
        phone: settingsForm.phone,
        avatar: settingsForm.avatar,
      })
      setProfile((prev) => ({
        ...prev,
        name: settingsForm.name,
        firstName: settingsForm.name ? settingsForm.name.split(' ')[0] : '',
        email: settingsForm.email,
        phone: settingsForm.phone,
        avatar: settingsForm.avatar || prev.avatar,
      }))
      try {
        const local = JSON.parse(localStorage.getItem('citypet_auth_user') || localStorage.getItem('authUser') || '{}')
        const updated = {
          ...local,
          name: settingsForm.name,
          email: settingsForm.email,
          phone: settingsForm.phone,
          avatar: settingsForm.avatar,
        }
        localStorage.setItem('citypet_auth_user', JSON.stringify(updated))
        localStorage.setItem('authUser', JSON.stringify(updated))
      } catch {}
      setSettingsSuccess('Account preferences saved successfully to database!')
      setTimeout(() => setSettingsSuccess(''), 4000)
    } catch (err) {
      alert('Failed to save settings: ' + (err.message || 'Unknown error'))
    } finally {
      setSettingsSaving(false)
    }
  }

  // Save Address to database
  const handleSaveAddress = async (e) => {
    e?.preventDefault()
    if (!addressForm.addressLine1.trim()) {
      alert('Please enter Address Line 1')
      return
    }
    setAddressSaving(true)
    try {
      const uId = profile.id || authUser?.id || authUser?.phone || ''
      await profileService.updateProfile({
        userId: uId,
        newAddress: {
          ...addressForm,
          recipient: addressForm.recipient.trim() || profile.name || 'Valued Customer',
          phone: addressForm.phone.trim() || profile.phone || '',
        },
      })
      const refreshedProf = await profileService.getProfile(uId)
      if (refreshedProf && Array.isArray(refreshedProf.addresses)) {
        setProfile((prev) => ({ ...prev, addresses: refreshedProf.addresses }))
      } else {
        setProfile((prev) => ({
          ...prev,
          addresses: [
            ...(prev.addresses || []),
            {
              id: 'addr-' + Date.now(),
              ...addressForm,
            },
          ],
        }))
      }
      setIsAddAddressModalOpen(false)
      setAddressForm({
        title: 'Home',
        recipient: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: 'Colombo',
        postalCode: '',
        isDefault: true,
      })
    } catch (err) {
      alert('Failed to save address: ' + (err.message || 'Unknown error'))
    } finally {
      setAddressSaving(false)
    }
  }

  // Save Pet to database
  const handleSavePet = async (e) => {
    e?.preventDefault()
    if (!petForm.name.trim()) {
      alert('Please enter your pet name')
      return
    }
    setPetSaving(true)
    try {
      const uId = profile.id || authUser?.id || authUser?.phone || ''
      const payload = {
        userId: uId,
        name: petForm.name.trim(),
        species: petForm.species,
        breed: petForm.breed.trim() || 'Mixed Breed',
        age: petForm.age.trim() || '1 year',
        gender: petForm.gender,
        weight: petForm.weight.trim() || '5 kg',
      }
      if (petForm.id) {
        await petService.updatePet(petForm.id, payload)
      } else {
        await petService.createPet(payload)
      }
      const refreshedPets = await petService.getPets(uId)
      if (Array.isArray(refreshedPets)) {
        setPets(refreshedPets)
      }
      setIsAddPetModalOpen(false)
      resetPetForm()
    } catch (err) {
      alert('Failed to save pet: ' + (err.message || 'Unknown error'))
    } finally {
      setPetSaving(false)
    }
  }

  const handleEditPet = (pet) => {
    setPetForm({
      id: pet.id,
      name: pet.name || '',
      species: pet.species || 'Dog',
      breed: pet.breed || '',
      age: pet.age || '',
      gender: pet.gender || 'Male',
      weight: pet.weight || '',
    })
    setIsAddPetModalOpen(true)
  }

  const handleDeletePet = async (pet) => {
    if (!window.confirm(`Delete ${pet.name}'s pet profile?`)) return
    setPetSaving(true)
    try {
      await petService.deletePet(pet.id)
      setPets((prev) => prev.filter((item) => item.id !== pet.id))
      if (selectedPetRecord?.id === pet.id) setSelectedPetRecord(null)
    } catch (err) {
      alert('Failed to delete pet profile: ' + (err.message || 'Unknown error'))
    } finally {
      setPetSaving(false)
    }
  }

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    if (file.size > 1024 * 1024) {
      alert('Please choose an image smaller than 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, avatar: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  function resetPetForm() {
    setPetForm({
      name: '',
      species: 'Dog',
      breed: '',
      age: '',
      gender: 'Male',
      weight: '',
    })
  }

  // Navigate to full track order page
  const handleTrackOrder = (order) => {
    setTrackingOrder(order || orders[0] || null)
    setActiveTab('track')
    setSelectedOrder(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Tracking search handler
  const handleSearchTracking = async (e) => {
    e?.preventDefault()
    if (!trackingSearchInput.trim()) return
    const query = trackingSearchInput.trim()
    try {
      const liveOrder = await orderService.trackOrder(query)
      if (liveOrder) {
        setTrackingOrder(liveOrder)
      }
    } catch {
      const found = orders.find(
        (o) =>
          o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          o.trackingNumber.toLowerCase().includes(query.toLowerCase()) ||
          (o.itemTitle && o.itemTitle.toLowerCase().includes(query.toLowerCase()))
      )
      if (found) {
        setTrackingOrder(found)
      } else {
        alert(`No order found matching "${trackingSearchInput}". Please verify your Order # or Tracking ID.`)
      }
    }
  }

  // Copy tracking number to clipboard
  const copyTrackingNumber = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  // Sidebar navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'track', label: 'Track Order', icon: Truck },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'pets', label: 'Pet Profiles', icon: PawPrint },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ]

  const mobileMenuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'track', label: 'Track', icon: Truck },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Account', icon: User },
  ]

  const handleProfileTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'track' && !trackingOrder && orders.length > 0) {
      setTrackingOrder(orders[0])
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShopForPet = (pet) => {
    onNavigate('catalog', {
      category: 'all',
      petType: pet.species === 'Dog' ? 'dogs' : 'cats',
    })
  }

  const deliveryMethodName = (method) => {
    if (method === 'express') return 'Express Delivery'
    if (method === 'standard') return 'Standard Delivery'
    if (method === 'pickup') return 'Hospital Pickup'
    return 'Delivery'
  }

  const orderSubtotal = (order) => Number(order?.subtotal ?? 0)
  const orderDeliveryFee = (order) => Number(order?.deliveryFee ?? 0)
  const orderDiscount = (order) => Number(order?.discountAmount ?? 0)
  const orderTotal = (order) => Number(order?.totalPrice ?? order?.total ?? 0)
  const isPaymentRejected = (order) => order?.paymentStatus === 'rejected' || order?.status === 'Payment Rejected'

  return (
    <div className="profile-page">
      <div className="container profile-container">
        {/* Main 2-Column Profile Layout */}
        <div className="profile-layout-grid">
          {/* ========================================================
              LEFT COLUMN: Navigation Sidebar & Promo Box
             ======================================================== */}
          <aside className="profile-sidebar">
            <nav className="profile-sidebar-nav" aria-label="Account Navigation">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    className={`profile-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleProfileTabChange(item.id)}
                  >
                    <Icon size={18} className="nav-item-icon" />
                    <span>{item.label}</span>
                  </button>
                )
              })}

              <div className="profile-sidebar-divider" />

              <button
                type="button"
                className="profile-nav-item profile-nav-logout-btn"
                onClick={() => {
                  if (onLogout) {
                    onLogout()
                  } else {
                    onNavigate('login')
                  }
                }}
              >
                <LogOut size={18} className="nav-item-icon" />
                <span>Sign Out / Switch</span>
              </button>
            </nav>

            {/* Sidebar Bottom Promo Card */}
            <div className="profile-sidebar-promo-box">
              <div className="promo-paw-watermark" aria-hidden="true">
                <PawPrint size={60} />
              </div>
              <div className="promo-script-wrap">
                <span className="promo-script-line">Happier</span>
                <span className="promo-script-line">Pets</span>
                <span className="promo-script-line">Healthier</span>
                <span className="promo-script-line">
                  Lives <span className="script-heart">♡</span>
                </span>
              </div>
              <div className="promo-dog-wrap">
                <img
                  src={petBuddyDog}
                  alt="Happy smiling Golden Retriever dog"
                  className="promo-sidebar-dog-img"
                />
              </div>
            </div>
          </aside>

          {/* ========================================================
              RIGHT COLUMN: Main Content Area
             ======================================================== */}
          <main className="profile-main-content">
            {/* ----------------------------------------------------
                TAB 1: DASHBOARD (Exact Match to Screenshot)
               ---------------------------------------------------- */}
            {activeTab === 'dashboard' && (
              <div className="profile-dashboard-view">
                {/* 1. Welcome Banner */}
                <div className="profile-welcome-banner">
                  <div className="welcome-banner-text">
                    <span className="welcome-eyebrow">MY ACCOUNT</span>
                    <h1 className="welcome-title">
                      Welcome back{profile.firstName ? `, ${profile.firstName}` : (profile.name ? `, ${profile.name}` : '')}! <span className="script-heart">♡</span>
                    </h1>
                    <p className="welcome-desc">
                      Thanks for being part of the City Pet family. Together, we're creating healthier, happier lives for pets.
                    </p>

                    <div className="welcome-actions">
                      <button
                        className="button welcome-btn-shop"
                        onClick={() => onNavigate('catalog')}
                      >
                        <ShoppingBag size={17} />
                        <span>Shop Now</span>
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="button welcome-btn-askvet"
                        onClick={() => setIsAskVetModalOpen(true)}
                      >
                        <MessageCircle size={17} />
                        <span>Ask a Vet</span>
                      </button>
                    </div>
                  </div>

                  <div className="welcome-banner-visual">
                    <img
                      src={profileCatBanner}
                      alt="Gentle human hand petting a relaxed tabby cat"
                      className="welcome-cat-img"
                    />
                    <div className="welcome-cat-script">
                      <span>Small choices</span>
                      <span>make healthier,</span>
                      <span>happier days</span>
                    </div>
                  </div>
                </div>

                {/* 2. Summary Metric Cards (3 Cards) */}
                <div className="profile-metrics-row">
                  {/* Card 1: Total Orders */}
                  <div
                    className="profile-metric-card"
                    onClick={() => setActiveTab('orders')}
                  >
                    <div className="metric-icon-circle mint-icon">
                      <Package size={22} />
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Total Orders</span>
                      <strong className="metric-value">
                        {ordersLoaded ? (profile?.stats?.totalOrders ?? orders.length) : orders.length}
                      </strong>
                      <span className="metric-link">View Orders →</span>
                    </div>
                  </div>

                  {/* Card 2: Wishlist Items */}
                  <div
                    className="profile-metric-card"
                    onClick={() => setActiveTab('wishlist')}
                  >
                    <div className="metric-icon-circle mint-icon">
                      <Heart size={22} />
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Wishlist Items</span>
                      <strong className="metric-value">
                        {profile?.stats?.wishlistCount ?? 0}
                      </strong>
                      <span className="metric-link">View Wishlist →</span>
                    </div>
                  </div>

                  {/* Card 3: Pet Profiles */}
                  <div
                    className="profile-metric-card"
                    onClick={() => setActiveTab('pets')}
                  >
                    <div className="metric-icon-circle mint-icon">
                      <PawPrint size={22} />
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Pet Profiles</span>
                      <strong className="metric-value">
                        {petsLoaded ? (pets.length ?? profile?.stats?.petProfilesCount ?? 0) : (profile?.stats?.petProfilesCount ?? 0)}
                      </strong>
                      <span className="metric-link">Manage Pets →</span>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Orders Section */}
                <section className="profile-section-card orders-section-card">
                  <div className="profile-card-header">
                    <div>
                      <span className="section-sub-eyebrow">RECENT ORDERS</span>
                      <h2 className="section-heading-custom">Your recent orders</h2>
                    </div>
                    <button
                      className="store-text-link"
                      onClick={() => setActiveTab('orders')}
                    >
                      View all orders <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="orders-table-wrapper">
                    {!ordersLoaded ? (
                      <div className="profile-empty-state" style={{ padding: '32px', textAlign: 'center', color: '#9ab3b0' }}>
                        <div style={{ fontSize: 13 }}>Loading your orders…</div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="profile-empty-state">
                        <div className="empty-state-icon-wrap">
                          <ShoppingBag size={34} strokeWidth={1.5} />
                        </div>
                        <h3 className="empty-state-title">No orders yet</h3>
                        <p className="empty-state-desc">Your order history will appear here once you place your first order.</p>
                        <button
                          className="empty-state-cta-btn"
                          onClick={() => onNavigate && onNavigate('catalog')}
                        >
                          Start Shopping →
                        </button>
                      </div>
                    ) : (
                      <table className="profile-orders-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 4).map((order, idx) => (
                            <tr key={idx}>
                              <td className="order-id-cell">
                                <strong>{order.orderNumber}</strong>
                              </td>
                              <td className="order-date-cell">{order.date}</td>
                              <td className="order-item-cell">
                                <div className="order-item-flex">
                                  <div className="order-item-mini-visual">
                                    <ProductVisual
                                      type={order.itemImage}
                                      name={order.itemTitle}
                                    />
                                  </div>
                                  <span className="order-item-title">
                                    {order.itemTitle}
                                  </span>
                                </div>
                              </td>
                              <td className="order-total-cell">
                                <strong>LKR {(order.totalPrice || order.total || 0).toLocaleString()}</strong>
                              </td>
                              <td className="order-status-cell">
                                <span
                                  className={`order-status-pill status-${order.statusType}`}
                                >
                                  <span className="status-dot" />
                                  {order.status}
                                </span>
                              </td>
                              <td className="order-actions-cell">
                                <button
                                  className="order-action-btn"
                                  onClick={() => {
                                    if (order.statusType === 'ready_pickup' || order.actionLabel === 'Track Order') {
                                      handleTrackOrder(order)
                                    } else {
                                      setSelectedOrder(order)
                                    }
                                  }}
                                >
                                  {order.actionLabel || 'View Details'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* 4. Your Pet Profiles Section */}
                <section className="profile-section-card pets-section-card">
                  <div className="profile-card-header">
                    <div>
                      <span className="section-sub-eyebrow">YOUR PET PROFILES</span>
                      <h2 className="section-heading-custom">Your furry family</h2>
                    </div>
                    <button
                      className="store-text-link"
                      onClick={() => setActiveTab('pets')}
                    >
                      Manage Pets <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Pet Cards Grid — dynamic from API */}
                  <div className="pet-profiles-grid">
                    {!petsLoaded ? (
                      <div className="profile-empty-state" style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#9ab3b0' }}>
                        <div style={{ fontSize: 13 }}>Loading pet profiles…</div>
                      </div>
                    ) : pets.length === 0 ? (
                      <div className="profile-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state-icon-wrap">
                          <span style={{ fontSize: 36 }}>🐾</span>
                        </div>
                        <h3 className="empty-state-title">No pet profiles yet</h3>
                        <p className="empty-state-desc">Add your pet's profile to access vet records, shop by pet, and get personalised care tips.</p>
                        <button
                          className="empty-state-cta-btn"
                          onClick={() => setActiveTab('pets')}
                        >
                          Add Pet Profile →
                        </button>
                      </div>
                    ) : (
                      pets.slice(0, 2).map((pet, idx) => (
                        <div key={pet.id || idx} className="pet-profile-card">
                          <div className="pet-card-avatar-wrap">
                            {pet.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="pet-card-avatar-img" />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                                {(pet.species || '').toLowerCase().includes('cat') ? '🐱' : '🐶'}
                              </div>
                            )}
                          </div>

                          <div className="pet-card-content">
                            <div className="pet-card-top-row">
                              <h3 className="pet-name">{pet.name}</h3>
                            <button
                              className="pet-edit-btn"
                              aria-label={`Edit ${pet.name}'s profile`}
                              onClick={() => handleEditPet(pet)}
                            >
                              <Edit2 size={15} />
                            </button>
                            </div>

                            <span className="pet-breed-line">
                              {(pet.species || '').toLowerCase().includes('cat') ? '🐱' : '🐕'} {pet.species || 'Pet'}{pet.breed ? ` • ${pet.breed}` : ''}
                            </span>

                            <div className="pet-info-grid">
                              {pet.age && (
                                <div className="pet-info-col">
                                  <span className="info-key">Age</span>
                                  <strong className="info-val">{pet.age}</strong>
                                </div>
                              )}
                              {pet.primaryVet && (
                                <div className="pet-info-col">
                                  <span className="info-key">Primary Vet</span>
                                  <strong className="info-val">{pet.primaryVet}</strong>
                                </div>
                              )}
                              {pet.lastVisit && (
                                <div className="pet-info-col">
                                  <span className="info-key">Last Visit</span>
                                  <strong className="info-val">{pet.lastVisit}</strong>
                                </div>
                              )}
                            </div>

                            <div className="pet-card-buttons-row">
                              <button
                                className="pet-btn-records"
                                onClick={() => setSelectedPetRecord(pet)}
                              >
                                <FileText size={15} />
                                <span>View Records</span>
                              </button>
                              <button
                                className="pet-btn-shop"
                                onClick={() => handleShopForPet(pet)}
                              >
                                <ShoppingBag size={15} />
                                <span>Shop for this Pet</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* 5. Bottom Action Cards (Order Tracking & Ask a Vet) */}
                <div className="profile-action-cards-row">
                  {/* Action Card 1: Track Orders */}
                  <div className="profile-action-card prescription-card">
                    <div className="action-card-icon-circle">
                      <Truck size={22} />
                    </div>
                    <div className="action-card-text">
                      <span className="action-card-eyebrow">ORDER TRACKING</span>
                      <h4 className="action-card-title">Track your package</h4>
                      <p className="action-card-desc">
                        Check real-time delivery status and dispatch progress for all your orders.
                      </p>
                    </div>
                    <button
                      className="action-card-cta-btn"
                      onClick={() => {
                        if (orders.length > 0) {
                          setTrackingOrder(orders[0])
                        }
                        setActiveTab('track')
                      }}
                    >
                      <span>Track Active Orders</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  {/* Action Card 2: Ask a Vet Support */}
                  <div className="profile-action-card ask-vet-card">
                    <div className="action-card-icon-circle">
                      <Stethoscope size={22} />
                    </div>
                    <div className="action-card-text">
                      <span className="action-card-eyebrow">ASK A VET</span>
                      <h4 className="action-card-title">Have a question?</h4>
                      <p className="action-card-desc">
                        Get trusted advice from our veterinary team about your pet's health, behavior or products.
                      </p>
                      <button
                        className="action-card-cta-btn dark-cta"
                        onClick={() => setIsAskVetModalOpen(true)}
                      >
                        <span>Ask a Vet</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="ask-vet-dog-visual">
                      <img
                        src={petBuddyDog}
                        alt="Support veterinary assistant dog"
                        className="ask-vet-dog-img"
                      />
                      <div className="ask-vet-speech-badge">
                        <span>We're</span>
                        <span>here for</span>
                        <span>you! <span className="script-heart">♡</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. 4 Bottom Value Proposition Badges */}
                <div className="profile-trust-strip">
                  <div className="profile-trust-pill">
                    <span className="profile-trust-icon">
                      <Award size={18} />
                    </span>
                    <div className="profile-trust-texts">
                      <strong>Genuine Products</strong>
                      <span>100% authentic, trusted brands</span>
                    </div>
                  </div>

                  <div className="profile-trust-pill">
                    <span className="profile-trust-icon">
                      <Stethoscope size={18} />
                    </span>
                    <div className="profile-trust-texts">
                      <strong>Vet Recommended</strong>
                      <span>Chosen by our veterinary team</span>
                    </div>
                  </div>

                  <div className="profile-trust-pill">
                    <span className="profile-trust-icon">
                      <Truck size={18} />
                    </span>
                    <div className="profile-trust-texts">
                      <strong>Islandwide Delivery</strong>
                      <span>Fast and reliable service</span>
                    </div>
                  </div>

                  <div className="profile-trust-pill">
                    <span className="profile-trust-icon">
                      <Home size={18} />
                    </span>
                    <div className="profile-trust-texts">
                      <strong>Pickup Available</strong>
                      <span>Collect from our hospital locations</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 2: MY ORDERS
               ---------------------------------------------------- */}
            {activeTab === 'orders' && (
              <div className="profile-section-card">
                <div className="profile-card-header">
                  <div>
                    <span className="section-sub-eyebrow">ORDER HISTORY</span>
                    <h2 className="section-heading-custom">All Your Orders</h2>
                  </div>
                  <button
                    className="store-text-link"
                    onClick={() => onNavigate('catalog')}
                  >
                    Continue Shopping <ArrowRight size={16} />
                  </button>
                </div>

                <div className="orders-table-wrapper">
                  {!ordersLoaded ? (
                    <div className="profile-empty-state" style={{ padding: '32px', textAlign: 'center', color: '#9ab3b0' }}>
                      <div style={{ fontSize: 13 }}>Loading your orders…</div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="profile-empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div className="empty-state-icon-wrap" style={{ margin: '0 auto 16px' }}>
                        <ShoppingBag size={34} strokeWidth={1.5} />
                      </div>
                      <h3 className="empty-state-title">No orders yet</h3>
                      <p className="empty-state-desc">Your order history will appear here once you place your first order.</p>
                      <button
                        className="empty-state-cta-btn"
                        onClick={() => onNavigate && onNavigate('catalog')}
                      >
                        Start Shopping →
                      </button>
                    </div>
                  ) : (
                    <table className="profile-orders-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, idx) => (
                          <tr key={order.id || idx}>
                            <td className="order-id-cell">
                              <strong>{order.orderNumber}</strong>
                            </td>
                            <td className="order-date-cell">{order.date}</td>
                            <td className="order-item-cell">
                              <div className="order-item-flex">
                                <div className="order-item-mini-visual">
                                  <ProductVisual
                                    type={order.itemImage || (order.itemsList?.[0]?.imageType) || 'royal-canin-dog'}
                                    name={order.itemTitle || (order.itemsList?.[0]?.name) || 'Pet Care Order'}
                                  />
                                </div>
                                <span className="order-item-title">
                                  {order.itemTitle || (order.itemsList?.[0]?.name) || 'Pet Care Order'}
                                </span>
                              </div>
                            </td>
                            <td className="order-total-cell">
                              <strong>LKR {(order.totalPrice || order.total || 0).toLocaleString()}</strong>
                            </td>
                            <td className="order-status-cell">
                              <span
                                className={`order-status-pill status-${order.statusType || 'processing'}`}
                              >
                                <span className="status-dot" />
                                {order.status || 'Processing'}
                              </span>
                            </td>
                            <td className="order-actions-cell">
                              <div className="table-actions-cluster">
                                <button
                                  className="order-action-btn"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  View Details
                                </button>
                                <button
                                  className="order-action-btn track-btn-accent"
                                  onClick={() => handleTrackOrder(order)}
                                >
                                  <Truck size={13} /> Track
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 3: TRACK ORDER (Dedicated Full Interactive Page)
               ---------------------------------------------------- */}
            {activeTab === 'track' && (
              <div className="track-order-page-view">
                {/* 1. Track Order Header Banner */}
                <div className="profile-section-card track-header-card">
                  <div className="profile-card-header mb-2.5">
                    <div>
                      <span className="section-sub-eyebrow">LIVE ORDER TRACKER</span>
                      <h2 className="section-heading-custom">Track Your Order & Delivery</h2>
                    </div>
                    <button
                      className="store-text-link"
                      onClick={() => setActiveTab('orders')}
                    >
                      View All Orders <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="track-header-intro">
                    Real-time status updates on your pet food, medications, and accessories with direct City Pet pharmacy & courier synchronization.
                  </p>

                  {/* Search & Quick Selector Row */}
                  <form className="track-search-form" onSubmit={handleSearchTracking}>
                    <div className="track-search-input-wrap">
                      <Search size={18} className="track-search-icon" />
                      <input
                        type="text"
                        placeholder="Enter Order # (e.g. #CP73920) or Tracking ID (e.g. CP-PU-739201)..."
                        value={trackingSearchInput}
                        onChange={(e) => setTrackingSearchInput(e.target.value)}
                      />
                      {trackingSearchInput && (
                        <button
                          type="button"
                          className="clear-search-btn"
                          onClick={() => setTrackingSearchInput('')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <button type="submit" className="button primary track-search-btn">
                      Track Package
                    </button>
                  </form>

                  {/* Quick Switch Order Pills */}
                  <div className="quick-orders-selector-bar">
                    <span className="selector-label">Your Recent Orders:</span>
                    <div className="quick-order-chips">
                      {orders.length === 0 ? (
                        <span style={{ fontSize: 13, color: '#9ab3b0', padding: '4px 8px' }}>
                          No orders placed yet
                        </span>
                      ) : (
                        orders.map((ord) => {
                          const isSelected = trackingOrder?.orderNumber === ord.orderNumber
                          return (
                            <button
                              key={ord.orderNumber || ord.id}
                              type="button"
                              className={`quick-order-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => setTrackingOrder(ord)}
                            >
                              <span className="chip-ord-id">{ord.orderNumber}</span>
                              <span className={`order-status-pill status-${ord.statusType} chip-pill`}>
                                <span className="status-dot" />
                                {ord.status}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {trackingOrder ? (
                  <>
                    {/* 2. Current Selected Order Live Hero Status Card */}
                    <div className="profile-section-card track-main-hero-card">
                      {isPaymentRejected(trackingOrder) && (
                        <div className="track-live-alert-bar" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#991b1b', marginBottom: '16px' }}>
                          <div className="alert-left">
                            <AlertCircle size={18} />
                            <span>
                              <strong>Payment Rejected:</strong> LKR {orderTotal(trackingOrder).toLocaleString()} was not accepted for this order. This order cannot be processed until a correct bank transfer is submitted.
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="track-hero-meta-row">
                        <div className="track-meta-left">
                          <span className="track-meta-tag">CURRENT SHIPMENT</span>
                          <h3 className="track-order-num">{trackingOrder.orderNumber}</h3>
                          <div className="track-id-copy-line">
                            <span>Tracking ID: <strong>{trackingOrder.trackingNumber}</strong></span>
                            <button
                              type="button"
                              className="track-copy-btn"
                              onClick={() => copyTrackingNumber(trackingOrder.trackingNumber)}
                              title="Copy Tracking ID"
                            >
                              {copiedTracking ? (
                                <span className="copied-text"><Check size={13} /> Copied</span>
                              ) : (
                                <><Copy size={13} /> Copy</>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="track-meta-right">
                          <div className="track-status-badge-wrap">
                            <span className={`order-status-pill status-${trackingOrder.statusType} large-status-pill`}>
                              <span className="status-dot pulse" />
                              {trackingOrder.status}
                            </span>
                          </div>
                          <div className="track-est-box">
                            <span className="est-label">
                              {trackingOrder.statusType === 'ready_pickup'
                                ? 'Pickup Window:'
                                : trackingOrder.statusType === 'delivered'
                                ? 'Delivered On:'
                                : 'Estimated Delivery:'}
                            </span>
                            <strong className="est-time">
                              {trackingOrder.statusType === 'ready_pickup'
                                ? 'Today (09:00 AM - 08:00 PM)'
                                : trackingOrder.statusType === 'delivered'
                                ? trackingOrder.date
                                : 'Tomorrow by 04:00 PM'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* 3. Visual Interactive Stepper Progress Road Map */}
                      <div className="track-stepper-container">
                        <div className="track-stepper-track">
                          {trackingOrder.trackingSteps.map((step, sIdx) => {
                            const isDone = step.done
                            const isCurrent = isDone && (sIdx === trackingOrder.trackingSteps.filter(s => s.done).length - 1)
                            return (
                              <div
                                key={sIdx}
                                className={`track-stepper-stage ${isDone ? 'done' : 'pending'} ${isCurrent ? 'current' : ''}`}
                              >
                                <div className="stepper-stage-node">
                                  {isDone ? (
                                    <Check size={16} />
                                  ) : (
                                    <span className="stage-num">{sIdx + 1}</span>
                                  )}
                                </div>
                                <div className="stepper-stage-info">
                                  <strong className="stage-title">{step.label}</strong>
                                  <span className="stage-timestamp">{step.time}</span>
                                </div>
                                {sIdx < trackingOrder.trackingSteps.length - 1 && (
                                  <div className={`stepper-connector ${isDone && trackingOrder.trackingSteps[sIdx + 1].done ? 'filled' : ''}`} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Live SMS & WhatsApp Updates Alert */}
                      <div className="track-live-alert-bar">
                        <div className="alert-left">
                          <CheckCircle2 size={18} className="alert-icon-check" />
                          <span>
                            <strong>SMS & WhatsApp Updates Active:</strong> Live delivery notifications are sent to <strong>{trackingOrder.phone || profile.phone || 'your phone number'}</strong>.
                          </span>
                        </div>
                        <span className="carrier-badge">
                          {trackingOrder.statusType === 'ready_pickup'
                            ? '🏥 Hospital Pharmacy Pickup'
                            : '🚚 City Pet Express Islandwide Courier'}
                        </span>
                      </div>
                    </div>

                    {/* 4. Two-Column Information Details (Package Contents & Destination Info) */}
                    <div className="track-two-col-grid">
                      {/* Left Col: Items in this Shipment */}
                      <div className="profile-section-card track-col-card">
                        <div className="profile-card-header">
                          <div>
                            <span className="section-sub-eyebrow">SHIPMENT CONTENT</span>
                            <h3 className="section-heading-custom text-[17px]">
                              Package Items ({trackingOrder.itemsList?.length || 1})
                            </h3>
                          </div>
                        </div>

                        <div className="track-items-list">
                          {trackingOrder.itemsList?.map((itm, iIdx) => (
                            <div key={iIdx} className="track-item-card">
                              <div className="track-item-visual">
                                <ProductVisual type={itm.imageType} name={itm.name} />
                              </div>
                              <div className="track-item-details">
                                <h4 className="track-item-name">{itm.name}</h4>
                                <div className="track-item-qty-row">
                                  <span>Quantity: <strong>{itm.qty}</strong></span>
                                  <strong className="track-item-price">LKR {itm.price.toLocaleString()}</strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="track-price-breakdown">
                          <div className="price-breakdown-row">
                            <span>Subtotal</span>
                            <span>LKR {(orderSubtotal(trackingOrder) || orderTotal(trackingOrder)).toLocaleString()}</span>
                          </div>
                          {orderDiscount(trackingOrder) > 0 && (
                            <div className="price-breakdown-row">
                              <span>Promo Discount</span>
                              <span>- LKR {orderDiscount(trackingOrder).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="price-breakdown-row">
                            <span>{deliveryMethodName(trackingOrder.deliveryMethod)} Fee</span>
                            <span className={orderDeliveryFee(trackingOrder) > 0 ? '' : 'text-free'}>
                              {orderDeliveryFee(trackingOrder) > 0 ? `LKR ${orderDeliveryFee(trackingOrder).toLocaleString()}` : 'FREE'}
                            </span>
                          </div>
                          <div className="price-breakdown-row total-row">
                            <strong>Total Amount</strong>
                            <strong className="total-val">LKR {orderTotal(trackingOrder).toLocaleString()}</strong>
                          </div>
                          <div className="payment-status-badge">
                            <ShieldCheck size={15} />
                            <span>Payment Cleared • Direct Bank Transfer / Online</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Col: Fulfillment / Delivery Location & Direct Support */}
                      <div className="profile-section-card track-col-card">
                        <div className="profile-card-header">
                          <div>
                            <span className="section-sub-eyebrow">
                              {trackingOrder.statusType === 'ready_pickup' ? 'PICKUP POINT' : 'DELIVERY DESTINATION'}
                            </span>
                            <h3 className="section-heading-custom text-[17px]">
                              {trackingOrder.statusType === 'ready_pickup' ? 'Hospital Pharmacy' : 'Delivery Address'}
                            </h3>
                          </div>
                        </div>

                        {trackingOrder.statusType === 'ready_pickup' ? (
                          <div className="track-location-box pickup-style">
                            <div className="loc-icon-circle">
                              <MapPin size={22} />
                            </div>
                            <div className="loc-text-details">
                              <strong>City Pet Animal Hospital (Main Branch)</strong>
                              <p>No. 42, Flower Road, Colombo 07, Sri Lanka</p>
                              <span className="pickup-instructions">
                                ℹ️ Please present Order <strong>{trackingOrder.orderNumber}</strong> or your phone number at the Ground Floor Pharmacy Desk.
                              </span>
                              <div className="branch-hours-row">
                                <Clock size={14} />
                                <span>Pharmacy Counter Hours: <strong>08:00 AM – 09:00 PM Daily</strong></span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="track-location-box delivery-style">
                            <div className="loc-icon-circle">
                              <Home size={22} />
                            </div>
                            <div className="loc-text-details">
                              <strong>{trackingOrder.customerName || profile.name || 'Valued Customer'}</strong>
                              <p>
                                {[
                                  trackingOrder.address?.line1 || trackingOrder.address_line1 || profile.addresses?.[0]?.addressLine1,
                                  trackingOrder.address?.line2 || trackingOrder.address_line2 || profile.addresses?.[0]?.addressLine2,
                                  trackingOrder.address?.city || trackingOrder.city || profile.addresses?.[0]?.city,
                                  trackingOrder.address?.postalCode || trackingOrder.postal_code || profile.addresses?.[0]?.postalCode,
                                ].filter(Boolean).join(', ') || 'Islandwide Delivery Address'}
                              </p>
                              <span className="loc-phone">Phone: {trackingOrder.phone || profile.phone || 'N/A'}</span>
                            </div>
                          </div>
                        )}

                        <div className="track-actions-cluster">
                          <h4 className="support-actions-title">Need Assistance With This Order?</h4>
                          <div className="support-buttons-grid">
                            <a
                              href={`https://wa.me/94718419273?text=${encodeURIComponent(`Hi City Pet team, I have a question regarding my order ${trackingOrder.orderNumber} (Tracking: ${trackingOrder.trackingNumber}).`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="track-support-btn whatsapp-btn"
                            >
                              <MessageCircle size={16} />
                              <span>WhatsApp Duty Desk</span>
                            </a>
                            <a
                              href="tel:+94718419273"
                              className="track-support-btn call-btn"
                            >
                              <Phone size={16} />
                              <span>(071) 841 9273</span>
                            </a>
                            <button
                              type="button"
                              className="track-support-btn invoice-btn"
                              onClick={() => alert(`Downloading official e-invoice for ${trackingOrder.orderNumber}...`)}
                            >
                              <Download size={16} />
                              <span>Download Receipt</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="profile-section-card empty-track-state">
                    <Package size={48} color="#04959d" />
                    <h3>No Order Selected for Tracking</h3>
                    <p>Select any of your recent orders above or enter a tracking code to view live timeline status.</p>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 4: WISHLIST
               ---------------------------------------------------- */}
            {activeTab === 'wishlist' && (
              <div className="profile-section-card">
                <div className="profile-card-header">
                  <div>
                    <span className="section-sub-eyebrow">SAVED ITEMS</span>
                    <h2 className="section-heading-custom">My Wishlist (8 items)</h2>
                  </div>
                </div>

                <div className="store-products-grid">
                  {storeProducts.slice(0, 4).map((prod) => {
                    const stockCount = prod.stockCount !== undefined ? prod.stockCount : (prod.inStock ? 15 : 0)
                    const isOut = stockCount === 0 || !prod.inStock

                    return (
                      <article
                        key={prod.id}
                        className="store-product-card clickable-product-card"
                        onClick={() => onSelectProduct && onSelectProduct(prod)}
                      >
                        <div className="product-card-top">
                          <span className="product-badge-pill">Saved</span>
                          <Heart size={16} fill="#ed7f72" color="#ed7f72" />
                        </div>
                        <div className="product-card-visual-area">
                          <ProductVisual type={prod.imageType} name={prod.name} />
                        </div>
                        <div className="product-card-info">
                          <h4 className="product-card-title">{prod.name}</h4>
                          <strong className="product-main-price">
                            LKR {prod.price.toLocaleString()}
                          </strong>
                          <button
                            className={`product-add-cart-btn ${isOut ? 'disabled' : ''}`}
                            disabled={isOut}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isOut) {
                                onAddToCart(prod)
                              }
                            }}
                          >
                            {isOut ? (
                              <>
                                <X size={15} /> Out of Stock
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={15} /> Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 5: ADDRESSES
               ---------------------------------------------------- */}
            {activeTab === 'addresses' && (
              <div className="profile-section-card">
                <div className="profile-card-header">
                  <div>
                    <span className="section-sub-eyebrow">DELIVERY LOCATIONS</span>
                    <h2 className="section-heading-custom">Saved Addresses</h2>
                  </div>
                  <button
                    className="button primary"
                    style={{ padding: '8px 16px' }}
                    onClick={() => setIsAddAddressModalOpen(true)}
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                </div>

                <div className="addresses-grid">
                  {profile.addresses && profile.addresses.length > 0 ? (
                    profile.addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className={`address-card ${addr.isDefault ? 'default' : ''}`}
                      >
                        <div className="addr-top">
                          <strong>{addr.title || 'Delivery Address'}</strong>
                          {addr.isDefault && <span className="default-chip">Primary</span>}
                        </div>
                        <p className="addr-recipient">{addr.recipient || profile.name || 'Valued Customer'}</p>
                        <p className="addr-lines">
                          {[addr.addressLine1, addr.addressLine2, addr.city, addr.postalCode].filter(Boolean).join(', ')}
                        </p>
                        <p className="addr-phone">Phone: {addr.phone || profile.phone || 'N/A'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="profile-empty-state" style={{ gridColumn: '1 / -1', padding: '36px 20px', textAlign: 'center' }}>
                      <div className="empty-state-icon-wrap" style={{ margin: '0 auto 14px' }}>
                        <MapPin size={34} strokeWidth={1.5} />
                      </div>
                      <h3 className="empty-state-title">No Saved Addresses</h3>
                      <p className="empty-state-desc">You have not added any delivery addresses yet. Add an address for faster checkout.</p>
                      <button
                        className="empty-state-cta-btn"
                        onClick={() => setIsAddAddressModalOpen(true)}
                      >
                        + Add Delivery Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 6: PET PROFILES
               ---------------------------------------------------- */}
            {activeTab === 'pets' && (
              <div className="profile-section-card">
                <div className="profile-card-header">
                  <div>
                    <span className="section-sub-eyebrow">FAMILY PROFILES</span>
                    <h2 className="section-heading-custom">Manage Your Pets</h2>
                  </div>
                  <button
                    className="button primary"
                    style={{ padding: '8px 16px' }}
                    onClick={() => setIsAddPetModalOpen(true)}
                  >
                    <Plus size={16} /> Add New Pet
                  </button>
                </div>

                <div className="pet-profiles-grid">
                  {!petsLoaded ? (
                    <div className="profile-empty-state" style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#9ab3b0' }}>
                      <div style={{ fontSize: 13 }}>Loading pet profiles…</div>
                    </div>
                  ) : pets.length === 0 ? (
                    <div className="profile-empty-state" style={{ gridColumn: '1 / -1', padding: '36px 20px', textAlign: 'center' }}>
                      <div className="empty-state-icon-wrap" style={{ margin: '0 auto 14px' }}>
                        <span style={{ fontSize: 36 }}>🐾</span>
                      </div>
                      <h3 className="empty-state-title">No Pet Profiles Registered</h3>
                      <p className="empty-state-desc">Add your dogs, cats, or other pets to receive personalized healthcare recommendations and maintain clinical history.</p>
                      <button
                        className="empty-state-cta-btn"
                        onClick={() => setIsAddPetModalOpen(true)}
                      >
                        + Add Pet Profile
                      </button>
                    </div>
                  ) : (
                    pets.map((pet, idx) => (
                      <div key={pet.id || idx} className="pet-profile-card">
                        <div className="pet-card-avatar-wrap">
                          {pet.photoUrl || (pet.avatarImg && pet.avatarImg.includes('.jpg')) ? (
                            <img
                              src={pet.photoUrl || (pet.species === 'Dog' ? petBuddyDog : petLunaCat)}
                              alt={pet.name}
                              className="pet-card-avatar-img"
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                              {(pet.species || '').toLowerCase().includes('cat') ? '🐱' : '🐶'}
                            </div>
                          )}
                        </div>
                        <div className="pet-card-content">
                          <div className="pet-card-top-row">
                            <h3 className="pet-name">{pet.name}</h3>
                            <button
                              className="pet-edit-btn"
                              aria-label={`Edit ${pet.name}`}
                              onClick={() => handleEditPet(pet)}
                            >
                              <Edit2 size={15} />
                            </button>
                          </div>
                          <span className="pet-breed-line">
                            {pet.speciesEmoji || ((pet.species || '').toLowerCase().includes('cat') ? '🐱' : '🐕')} {pet.species} • {pet.breed || 'Breed Not Specified'}
                          </span>
                          <div className="pet-info-grid">
                            <div className="pet-info-col">
                              <span className="info-key">Age</span>
                              <strong className="info-val">{pet.age || 'Not specified'}</strong>
                            </div>
                            <div className="pet-info-col">
                              <span className="info-key">Primary Vet</span>
                              <strong className="info-val">{pet.primaryVet || 'City Pet Vet'}</strong>
                            </div>
                            <div className="pet-info-col">
                              <span className="info-key">Last Visit</span>
                              <strong className="info-val">{pet.lastVisit || 'None recorded'}</strong>
                            </div>
                          </div>
                          <div className="pet-card-buttons-row">
                            <button
                              className="pet-btn-records"
                              onClick={() => setSelectedPetRecord(pet)}
                            >
                              <FileText size={15} />
                              <span>View Records</span>
                            </button>
                            <button
                              className="pet-btn-shop"
                              onClick={() => handleShopForPet(pet)}
                            >
                              <ShoppingBag size={15} />
                              <span>Shop for {pet.name}</span>
                            </button>
                            <button
                              className="pet-btn-records pet-delete-btn"
                              onClick={() => handleDeletePet(pet)}
                              disabled={petSaving}
                            >
                              <X size={15} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 7: ACCOUNT SETTINGS
               ---------------------------------------------------- */}
            {activeTab === 'settings' && (
              <div className="profile-section-card">
                <div className="profile-card-header">
                  <div>
                    <span className="section-sub-eyebrow">PREFERENCES</span>
                    <h2 className="section-heading-custom">Account Settings</h2>
                  </div>
                </div>

                {settingsSuccess && (
                  <div style={{ padding: '12px 16px', background: '#e6f7f2', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings}>
                  <div className="account-settings-hero">
                    <div className="account-settings-avatar">
                      {settingsForm.avatar && (settingsForm.avatar.startsWith('data:image') || settingsForm.avatar.startsWith('/')) ? (
                        <img src={settingsForm.avatar} alt={settingsForm.name || 'Profile'} />
                      ) : (
                        <span>{(settingsForm.name || profile.name || 'U').trim().charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="account-settings-copy">
                      <strong>{settingsForm.name || 'Your City Pet Account'}</strong>
                      <span>{settingsForm.email || 'Add your email for order updates'}</span>
                      <label className="account-image-upload-btn">
                        <Upload size={15} />
                        <span>Change Profile Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="button primary"
                    style={{ marginTop: '20px' }}
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? 'Saving Changes…' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      <nav className="profile-mobile-bottom-nav" aria-label="Mobile account navigation">
        {mobileMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`profile-mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleProfileTabChange(item.id)}
            >
              <span className="profile-mobile-nav-icon">
                <Icon size={isActive ? 22 : 19} />
              </span>
              <span className="profile-mobile-nav-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ========================================================
          MODAL 1: Order Details Modal
         ======================================================== */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <h3>Order {selectedOrder.orderNumber}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-content">
              {isPaymentRejected(selectedOrder) && (
                <div className="track-live-alert-bar" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#991b1b', marginBottom: '14px' }}>
                  <div className="alert-left">
                    <AlertCircle size={18} />
                    <span>
                      <strong>Payment Rejected:</strong> LKR {orderTotal(selectedOrder).toLocaleString()} was not accepted. Please submit the correct bank transfer before this order can continue.
                    </span>
                  </div>
                </div>
              )}
              <div className="order-summary-box">
                <div>
                  <span>Date:</span> <strong>{selectedOrder.date}</strong>
                </div>
                <div>
                  <span>Status:</span>{' '}
                  <span
                    className={`order-status-pill status-${selectedOrder.statusType}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <span>Tracking:</span>{' '}
                  <strong>{selectedOrder.trackingNumber}</strong>
                </div>
              </div>

              <div className="modal-items-list">
                {selectedOrder.itemsList.map((item, iIdx) => (
                  <div key={iIdx} className="modal-item-row">
                    <ProductVisual type={item.imageType} name={item.name} />
                    <div className="modal-item-info">
                      <strong>{item.name}</strong>
                      <span>Qty: {item.qty}</span>
                    </div>
                    <strong className="modal-item-price">
                      LKR {item.price.toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="modal-total-bar">
                <span>{deliveryMethodName(selectedOrder.deliveryMethod)}:</span>
                <strong>
                  {orderDeliveryFee(selectedOrder) > 0
                    ? `LKR ${orderDeliveryFee(selectedOrder).toLocaleString()}`
                    : 'FREE'}
                </strong>
              </div>

              <div className="modal-total-bar">
                <span>Total Amount:</span>
                <strong>LKR {orderTotal(selectedOrder).toLocaleString()}</strong>
              </div>

              <div className="modal-actions-footer-row" style={{ marginTop: '16px' }}>
                <button
                  className="button primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => handleTrackOrder(selectedOrder)}
                >
                  <Truck size={17} />
                  <span>Track Live Order & Timeline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: Pet Medical Records Modal
         ======================================================== */}
      {selectedPetRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedPetRecord(null)}>
          <div
            className="profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <h3>{selectedPetRecord.name}'s Medical Records</h3>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedPetRecord(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-content">
              <div className="pet-record-meta-bar">
                <span>
                  <strong>Species:</strong> {selectedPetRecord.species} (
                  {selectedPetRecord.breed})
                </span>
                <span>
                  <strong>Primary Vet:</strong> {selectedPetRecord.primaryVet}
                </span>
                <span>
                  <strong>Weight:</strong> {selectedPetRecord.weight}
                </span>
              </div>

              <h4>Clinical History & Vaccinations</h4>
              <table className="medical-records-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Procedure / Vaccine</th>
                    <th>Veterinary Surgeon</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPetRecord.medicalHistory.map((rec, rIdx) => (
                    <tr key={rIdx}>
                      <td>{rec.date}</td>
                      <td>
                        <strong>{rec.type}</strong>
                      </td>
                      <td>{rec.doctor}</td>
                      <td>
                        <span className="record-status-pill">{rec.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: Ask a Vet Support Modal
         ======================================================== */}
      {isAskVetModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAskVetModalOpen(false)}>
          <div
            className="profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <h3>Ask City Pet Veterinary Team</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAskVetModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-content">
              {askVetSubmitted ? (
                <div className="modal-success-state">
                  <CheckCircle2 size={48} color="#00b074" />
                  <h4>Inquiry Sent to Duty Veterinarian</h4>
                  <p>
                    Dr. Amanda Perera and our clinical team will review your question and respond within 30 minutes.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => {
                      setAskVetSubmitted(false)
                      setIsAskVetModalOpen(false)
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="ask-vet-form">
                  <div className="form-group">
                    <label>Select Pet</label>
                    <select>
                      <option>Buddy (Dog)</option>
                      <option>Luna (Cat)</option>
                      <option>General Pet Health Question</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Describe your question or symptom</label>
                    <textarea
                      rows={4}
                      placeholder="e.g. Buddy has been scratching his left ear after swimming..."
                    />
                  </div>
                  <button
                    className="button primary"
                    style={{ width: '100%', marginTop: '16px' }}
                    onClick={() => setAskVetSubmitted(true)}
                  >
                    <Send size={16} /> Send to Duty Vet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 5: Add Delivery Address Modal
         ======================================================== */}
      {isAddAddressModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddAddressModalOpen(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Add Delivery Address</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddAddressModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-content">
              <form onSubmit={handleSaveAddress} className="settings-form-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Address Label / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Home, Office, Vacation Home"
                    value={addressForm.title}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Recipient Name</label>
                  <input
                    type="text"
                    placeholder={profile.name || 'Recipient Full Name'}
                    value={addressForm.recipient}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, recipient: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder={profile.phone || '07X XXX XXXX'}
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 1 (Street / House No.) *</label>
                  <input
                    type="text"
                    placeholder="e.g. No. 42, Temple Road"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 2 (Area / Landmark)</label>
                  <input
                    type="text"
                    placeholder="e.g. Apt 3B, Near Clock Tower"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 00700"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="addrDefaultCheck"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  <label htmlFor="addrDefaultCheck" style={{ fontSize: 13, color: '#2c4b47', cursor: 'pointer', margin: 0 }}>
                    Set as my primary delivery address
                  </label>
                </div>
                <button
                  type="submit"
                  className="button primary"
                  style={{ width: '100%', marginTop: '16px' }}
                  disabled={addressSaving}
                >
                  {addressSaving ? 'Saving to Database…' : 'Save Delivery Address'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: Add Pet Profile Modal
         ======================================================== */}
      {isAddPetModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddPetModalOpen(false)
            resetPetForm()
          }}
        >
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>{petForm.id ? 'Edit Pet Profile' : 'Register New Pet Profile'}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setIsAddPetModalOpen(false)
                  resetPetForm()
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-content">
              <form onSubmit={handleSavePet} className="settings-form-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Pet Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Charlie, Bella, Rocky"
                    value={petForm.name}
                    onChange={(e) => setPetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Species</label>
                    <select
                      value={petForm.species}
                      onChange={(e) => setPetForm(prev => ({ ...prev, species: e.target.value }))}
                    >
                      <option value="Dog">Dog 🐕</option>
                      <option value="Cat">Cat 🐱</option>
                      <option value="Bird">Bird 🦜</option>
                      <option value="Rabbit">Rabbit 🐇</option>
                      <option value="Other">Other 🐾</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={petForm.gender}
                      onChange={(e) => setPetForm(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Neutered Male">Neutered Male</option>
                      <option value="Spayed Female">Spayed Female</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Breed</label>
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever, Persian, Mixed"
                    value={petForm.breed}
                    onChange={(e) => setPetForm(prev => ({ ...prev, breed: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 years, 6 months"
                      value={petForm.age}
                      onChange={(e) => setPetForm(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Approx. Weight</label>
                    <input
                      type="text"
                      placeholder="e.g. 12 kg, 4.5 kg"
                      value={petForm.weight}
                      onChange={(e) => setPetForm(prev => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="button primary"
                  style={{ width: '100%', marginTop: '16px' }}
                  disabled={petSaving}
                >
                  {petSaving ? 'Saving to Database…' : petForm.id ? 'Save Pet Changes' : 'Register Pet in Database'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
