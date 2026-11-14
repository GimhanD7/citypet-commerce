import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Home,
  Info,
  Lock,
  Mail,
  Minus,
  Package,
  PawPrint,
  Phone,
  Plus,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Tag,
  Trash2,
  Truck,
  UploadCloud,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import ProductVisual from '../common/ProductVisual'
import checkoutHeroPets from '../../assets/checkout-hero-pets.jpg'
import { API_BASE_URL } from '../../config/api'
import { orderService, authService } from '../../services/api'

const cartItemKey = (product) =>
  `${product?.id || ''}::${product?.selectedSize || product?.size || ''}`

export default function CheckoutPage({
  cartItems = [],
  authUser: authUserProp = null,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onNavigate,
  onOpenCart,
  onCheckoutLogin,
}) {
  // Local auth state — starts from prop, can be updated via Checkout Auth Gate
  const [authUser, setAuthUser] = useState(authUserProp)
  // ── Checkout Auth Gate State ────────────────────────────────────
  // 'login' → sign in | 'register' → create account | 'done' → authenticated
  const [otpStep, setOtpStep] = useState(() => (authUserProp ? 'done' : 'login'))
  const [gateEmail, setGateEmail] = useState('')
  const [gatePassword, setGatePassword] = useState('')
  const [gateShowPass, setGateShowPass] = useState(false)
  const [gateRegName, setGateRegName] = useState('')
  const [gateRegEmail, setGateRegEmail] = useState('')
  const [gateRegPhone, setGateRegPhone] = useState('')
  const [gateRegPass, setGateRegPass] = useState('')
  const [gateRegConfirm, setGateRegConfirm] = useState('')
  const [gateSubmitting, setGateSubmitting] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [googleClientId, setGoogleClientId] = useState(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('citypet_google_client_id')) ||
      ''
  )

  // Sync local auth when prop changes (e.g. user logs in elsewhere)
  useEffect(() => {
    if (authUserProp) {
      prefillFormFromUser(authUserProp)
      setAuthUser(authUserProp)
      setOtpStep('done')
    }
  }, [authUserProp])

  // Load Google Identity Services script and fetch server Google Client ID
  useEffect(() => {
    if (otpStep === 'done') return
    authService
      .getSession()
      .then((res) => {
        if (res?.googleClientId && !googleClientId) {
          setGoogleClientId(res.googleClientId)
        }
      })
      .catch(() => {})

    if (typeof window !== 'undefined' && !window.google?.accounts && !document.getElementById('google-gsi-client-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-client-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [otpStep, googleClientId])

  // Helper to filter out system placeholder names/emails
  const isDummyName = (name) => {
    if (!name || typeof name !== 'string') return true
    const n = name.trim().toLowerCase()
    return (
      n === '' ||
      n === 'valued client' ||
      n === 'valued customer' ||
      n === 'hospital administrator' ||
      n.startsWith('usr-') ||
      n.startsWith('user-') ||
      n.startsWith('adm-')
    )
  }

  const isDummyEmail = (email) => {
    if (!email || typeof email !== 'string') return true
    const e = email.trim().toLowerCase()
    return (
      e === '' ||
      e.endsWith('@guest.citypet.lk') ||
      e.includes('customer@citypet.lk')
    )
  }

  // Form State: Leave name and email empty for new customers; prefill for returning customers
  const [formData, setFormData] = useState(() => {
    const isNew = Boolean(authUserProp?.isNewCustomer)
    const validName = authUserProp?.name && !isDummyName(authUserProp.name) ? authUserProp.name : ''
    const validEmail = authUserProp?.email && !isDummyEmail(authUserProp.email) ? authUserProp.email : ''

    return {
      fullName: isNew ? '' : validName,
      email: isNew ? '' : validEmail,
      phone: authUserProp?.phone || '',
      addressLine1: isNew ? '' : (authUserProp?.addressLine1 || authUserProp?.address || ''),
      addressLine2: isNew ? '' : (authUserProp?.addressLine2 || ''),
      city: isNew ? 'Colombo' : (authUserProp?.city || 'Colombo'),
      district: isNew ? 'Colombo' : (authUserProp?.district || 'Colombo'),
      postalCode: isNew ? '' : (authUserProp?.postalCode || ''),
      saveAddress: true,
    }
  })

  // Prefill form fields when OTP login succeeds
  const prefillFormFromUser = (user) => {
    if (!user) return
    const isNew = Boolean(user.isNewCustomer)
    const validName = user.name && !isDummyName(user.name) ? user.name : ''
    const validEmail = user.email && !isDummyEmail(user.email) ? user.email : ''

    setFormData((prev) => ({
      ...prev,
      // For a new customer, do NOT autofill name and email (leave blank for user to type)
      // For returning user, autofill their saved name and email
      fullName: isNew ? '' : (validName || prev.fullName || ''),
      email: isNew ? '' : (validEmail || prev.email || ''),
      phone: user.phone || prev.phone || '',
      // Autofill saved address fields for returning customer
      addressLine1: isNew ? '' : (user.addressLine1 || user.address || prev.addressLine1 || ''),
      addressLine2: isNew ? '' : (user.addressLine2 || prev.addressLine2 || ''),
      city: isNew ? 'Colombo' : (user.city || prev.city || 'Colombo'),
      district: isNew ? 'Colombo' : (user.district || prev.district || 'Colombo'),
      postalCode: isNew ? '' : (user.postalCode || prev.postalCode || ''),
      saveAddress: true,
    }))
  }

  // Delivery & Payment Method selections
  const [deliveryMethod, setDeliveryMethod] = useState('standard') // 'standard' | 'express'
  const [deliveryOptions, setDeliveryOptions] = useState([
    { id: 'standard', name: 'Standard Delivery', time: '2 - 4 working days', price: 350, fee: 350, enabled: true, icon: Truck },
    { id: 'express', name: 'Express Delivery', time: '1 - 2 working days', price: 700, fee: 700, enabled: true, icon: Truck },
  ])
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card' (PayHere) | 'bank'
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderPlacedData, setOrderPlacedData] = useState(null)

  // Validation errors
  const [formErrors, setFormErrors] = useState({})

  // Bank Transfer Slip Upload State
  const [uploadedSlip, setUploadedSlip] = useState(null) // { url, filename, size, type, preview }
  const [isUploadingSlip, setIsUploadingSlip] = useState(false)
  const [isDraggingSlip, setIsDraggingSlip] = useState(false)
  const [copiedBankAcc, setCopiedBankAcc] = useState(false)
  const fileInputRef = useRef(null)

  // PayHere Sandbox Demo Modal State
  const [isPayHereSimulatorOpen, setIsPayHereSimulatorOpen] = useState(false)
  const [payHerePendingOrder, setPayHerePendingOrder] = useState(null)

  // Dynamically load PayHere official SDK
  useEffect(() => {
    if (!document.getElementById('payhere-sdk-script')) {
      const script = document.createElement('script')
      script.id = 'payhere-sdk-script'
      script.src = 'https://www.payhere.lk/lib/payhere.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    orderService.getDeliverySettings()
      .then((methods) => {
        if (!mounted || !Array.isArray(methods) || methods.length === 0) return
        const enabledMethods = methods
          .filter((method) => method.enabled !== false)
          .map((method) => ({
            ...method,
            price: Number(method.price ?? method.fee ?? 0),
            fee: Number(method.fee ?? method.price ?? 0),
            icon: Truck,
          }))
        if (enabledMethods.length === 0) return
        setDeliveryOptions(enabledMethods)
        if (!enabledMethods.some((method) => method.id === deliveryMethod)) {
          setDeliveryMethod(enabledMethods[0].id)
        }
      })
      .catch((err) => console.warn('Failed to load delivery settings:', err))
    return () => {
      mounted = false
    }
  }, [deliveryMethod])

  // Delivery fee calculation
  const selectedDeliveryOption = deliveryOptions.find((method) => method.id === deliveryMethod) || deliveryOptions[0]
  const deliveryFee = Number(selectedDeliveryOption?.fee ?? selectedDeliveryOption?.price ?? 0)

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 0) * item.quantity,
    0
  )

  // Total calculation
  const total = Math.max(0, subtotal - (discountApplied ? discountAmount : 0) + deliveryFee)

  const isProductOut = (product) => {
    if (!product) return true
    if (product.stockCount !== undefined && product.stockCount !== null && product.stockCount !== '') {
      return Number(product.stockCount) <= 0
    }
    return !product.inStock
  }

  const hasOutOfStockItems = cartItems.some(({ product }) => isProductOut(product))

  const handleApplyDiscount = (e) => {
    e.preventDefault()
    setDiscountError('')
    if (!discountCode.trim()) return

    const code = discountCode.trim().toUpperCase()
    if (code === 'CITYPET1000' || code === 'SAVE1000' || code === 'WELCOME') {
      setDiscountAmount(1000)
      setDiscountApplied(true)
    } else if (code === 'VET500') {
      setDiscountAmount(500)
      setDiscountApplied(true)
    } else {
      setDiscountError('Invalid promo code. Try CITYPET1000')
      setDiscountApplied(false)
    }
  }

  // Clear single field error on input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Copy Bank Account Number to Clipboard
  const handleCopyBankAccount = () => {
    navigator.clipboard?.writeText('100048293301')
    setCopiedBankAcc(true)
    setTimeout(() => setCopiedBankAcc(false), 2500)
  }

  // Handle Bank Transfer Slip File Upload
  const processSlipFile = async (file) => {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        paymentSlip: 'Please upload a valid receipt (JPG, PNG, WebP image or PDF document).',
      }))
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        paymentSlip: 'File size exceeds 8 MB. Please select a smaller file.',
      }))
      return
    }

    // Clear slip error
    setFormErrors((prev) => ({ ...prev, paymentSlip: undefined }))
    setIsUploadingSlip(true)

    // Generate local preview immediately
    const isPdf = file.type === 'application/pdf'
    let localPreviewUrl = ''
    if (!isPdf) {
      localPreviewUrl = URL.createObjectURL(file)
    }

    try {
      const res = await orderService.uploadPaymentSlip(file)
      setUploadedSlip({
        file,
        url: res.url || localPreviewUrl,
        filename: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: isPdf ? 'pdf' : 'image',
        preview: localPreviewUrl,
      })
    } catch (err) {
      console.warn('Direct upload error, falling back to local slip preview:', err)
      setUploadedSlip({
        file,
        url: localPreviewUrl,
        filename: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: isPdf ? 'pdf' : 'image',
        preview: localPreviewUrl,
      })
    } finally {
      setIsUploadingSlip(false)
    }
  }

  const handleSlipFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) processSlipFile(file)
  }

  const handleSlipDrop = (e) => {
    e.preventDefault()
    setIsDraggingSlip(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processSlipFile(file)
  }

  const handleRemoveSlip = () => {
    if (uploadedSlip?.preview) {
      URL.revokeObjectURL(uploadedSlip.preview)
    }
    setUploadedSlip(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Strict Validation: ALL customer address fields are required
  const validateCustomerFields = () => {
    const errors = {}

    // 1. Full Name
    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Full Name is required'
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter a valid full name'
    }

    // 2. Email Address
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com)'
    }

    // 3. Phone Number
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Phone Number is required'
    } else if (formData.phone.replace(/\D/g, '').length < 9) {
      errors.phone = 'Please enter a valid 9-10 digit contact number'
    }

    // 4. Address Line 1
    if (!formData.addressLine1 || !formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required'
    }

    // 5. Address Line 2 (Mandatory)
    if (!formData.addressLine2 || !formData.addressLine2.trim()) {
      errors.addressLine2 = 'Address Line 2 (Apartment, Suite, Unit, or Street) is required'
    }

    // 6. City
    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City is required'
    }

    // 7. District
    if (!formData.district || !formData.district.trim()) {
      errors.district = 'District is required'
    }

    // 8. Postal Code
    if (!formData.postalCode || !formData.postalCode.trim()) {
      errors.postalCode = 'Postal Code is required'
    } else if (formData.postalCode.trim().length < 3) {
      errors.postalCode = 'Please enter a valid postal code'
    }

    // 9. Payment Slip (if Bank Transfer)
    if (paymentMethod === 'bank' && !uploadedSlip) {
      errors.paymentSlip = 'Please upload your bank transfer / deposit slip to place this order'
    }

    setFormErrors(errors)

    // Auto-scroll to the first invalid field
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      const firstFieldId = `field-${errorKeys[0]}`
      const el = document.getElementById(firstFieldId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus?.()
      }
      return false
    }

    return true
  }

  // ── Checkout Auth Gate Handlers (Email/Password, Register & Google) ─────
  const completeGateAuth = (res) => {
    const user = res?.user
    setAuthUser(user)
    setOtpStep('done')
    prefillFormFromUser(user)
    if (onCheckoutLogin && user) onCheckoutLogin(user)
  }

  const handleGateLogin = async (e) => {
    e?.preventDefault()
    if (!gateEmail.trim() || !gatePassword) {
      setOtpError('Please enter your email address and password.')
      return
    }
    setOtpError('')
    setGateSubmitting(true)
    try {
      const res = await authService.login(gateEmail.trim(), gatePassword)
      completeGateAuth(res)
    } catch (err) {
      setOtpError(err.message || 'Invalid email or password.')
    } finally {
      setGateSubmitting(false)
    }
  }

  const handleGateRegister = async (e) => {
    e?.preventDefault()
    if (gateRegName.trim().length < 2) {
      setOtpError('Please enter your full name.')
      return
    }
    if (!gateRegEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gateRegEmail.trim())) {
      setOtpError('Please enter a valid email address.')
      return
    }
    if (gateRegPass.length < 6) {
      setOtpError('Password must be at least 6 characters long.')
      return
    }
    if (gateRegPass !== gateRegConfirm) {
      setOtpError('Passwords do not match.')
      return
    }
    setOtpError('')
    setGateSubmitting(true)
    try {
      const res = await authService.register({
        name: gateRegName.trim(),
        email: gateRegEmail.trim(),
        phone: gateRegPhone.trim(),
        password: gateRegPass,
      })
      completeGateAuth(res)
    } catch (err) {
      setOtpError(err.message || 'Registration failed. Please try again.')
    } finally {
      setGateSubmitting(false)
    }
  }

  const handleGateGoogleLogin = () => {
    setOtpError('')
    if (!googleClientId) {
      setOtpError('Google Client ID is not configured yet. Please sign in or create an account with your email and password.')
      return
    }
    if (!window.google?.accounts?.oauth2) {
      setOtpError('Google Sign-In is still loading. Please try again in a moment.')
      return
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          setOtpError('Google sign-in was cancelled or denied.')
          return
        }
        if (tokenResponse?.access_token) {
          setGateSubmitting(true)
          try {
            const res = await authService.googleLogin({
              access_token: tokenResponse.access_token,
            })
            completeGateAuth(res)
          } catch (err) {
            setOtpError(err.message || 'Unable to sign in with Google.')
          } finally {
            setGateSubmitting(false)
          }
        }
      },
    })
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }

  // Finalize order creation after payment approval or slip upload
  const completeOrderCreation = async (extraOrderFields = {}) => {
    setIsPlacingOrder(true)
    try {
      const payload = {
        cartItems: [...cartItems],
        subtotal: subtotal,
        discountAmount: discountApplied ? discountAmount : 0,
        deliveryFee: deliveryFee,
        total: total,
        deliveryMethod,
        paymentMethod,
        paymentSlip: uploadedSlip?.url || null,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        postalCode: formData.postalCode.trim(),
        userId: authUser?.id || null,
        saveAddress: formData.saveAddress,
        ...extraOrderFields,
      }

      const res = await orderService.createOrder(payload)
      setIsPlacingOrder(false)

      // Synchronize customer account with their newly submitted name, email, and address
      const updatedUser = res.user || {
        ...(authUser || {}),
        id: authUser?.id || res.userId || 'usr-' + Date.now(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        postalCode: formData.postalCode.trim(),
        role: authUser?.role || 'user',
        isNewCustomer: false,
      }
      setAuthUser(updatedUser)
      if (onCheckoutLogin) {
        onCheckoutLogin(updatedUser)
      }
      try {
        localStorage.setItem('citypet_auth_user', JSON.stringify(updatedUser))
      } catch { /* ignore */ }

      setOrderPlacedData({
        orderNumber: res.orderNumber,
        trackingNumber: res.trackingNumber,
        items: [...cartItems],
        total: total,
        deliveryMethod,
        paymentMethod,
        paymentSlip: uploadedSlip?.url || null,
        paymentStatus: extraOrderFields.paymentStatus || (paymentMethod === 'card' ? 'paid' : 'pending_verification'),
        recipient: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: `${formData.addressLine1.trim()}, ${formData.addressLine2.trim()}, ${formData.city.trim()}`,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      })
      if (onClearCart) {
        onClearCart()
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setIsPlacingOrder(false)
      console.error('Error placing order:', err)
      alert('Unable to place order: ' + (err.message || 'Please check your connection and try again.'))
    }
  }

  // Main Submit Handler
  const handlePlaceOrder = async () => {
    if (hasOutOfStockItems || cartItems.length === 0) {
      return
    }

    if (!authUser?.id || otpStep !== 'done') {
      setOtpError('Please verify your phone number before placing an order.')
      return
    }
    // 1. Validate All Customer Address Fields
    const isValid = validateCustomerFields()
    if (!isValid) return

    // 2. Branch by Payment Method
    if (paymentMethod === 'card') {
      // === PAYHERE PAYMENT FLOW ===
      setIsPlacingOrder(true)
      const tempOrderSeq = 'CP-' + Date.now()

      try {
        // Fetch PayHere hash from backend
        const hashRes = await orderService.getPayHereHash(tempOrderSeq, total, 'LKR')

        const paymentObject = {
          sandbox: hashRes.isSandbox !== undefined ? hashRes.isSandbox : true,
          merchant_id: hashRes.merchantId || '1211149',
          return_url: window.location.href,
          cancel_url: window.location.href,
          notify_url: `${window.location.origin}${API_BASE_URL}/payhere.php`,
          order_id: tempOrderSeq,
          items: `City Pet Veterinary Pharmacy Order (${cartItems.length} items)`,
          amount: Number(total).toFixed(2),
          currency: 'LKR',
          hash: hashRes.hash,
          first_name: formData.fullName.split(' ')[0] || 'Customer',
          last_name: formData.fullName.split(' ').slice(1).join(' ') || 'Customer',
          email: formData.email,
          phone: formData.phone,
          address: `${formData.addressLine1}, ${formData.addressLine2}`,
          city: formData.city,
          country: 'Sri Lanka',
          delivery_address: `${formData.addressLine1}, ${formData.addressLine2}`,
          delivery_city: formData.city,
          delivery_country: 'Sri Lanka',
        }

        if (window.payhere && typeof window.payhere.startPayment === 'function') {
          // PayHere SDK Callbacks
          window.payhere.onCompleted = async function onCompleted(orderId) {
            console.log('PayHere payment completed:', orderId)
            await completeOrderCreation({
              paymentStatus: 'paid',
              payherePaymentId: orderId || tempOrderSeq,
            })
          }

          window.payhere.onDismissed = function onDismissed() {
            setIsPlacingOrder(false)
            console.log('PayHere checkout popup closed by user')
          }

          window.payhere.onError = function onError(error) {
            console.warn('PayHere gateway error:', error)
            setIsPlacingOrder(false)
            // Open fallback simulator if PayHere sandbox fails to open
            setPayHerePendingOrder(paymentObject)
            setIsPayHereSimulatorOpen(true)
          }

          // Launch PayHere Checkout Modal
          window.payhere.startPayment(paymentObject)
        } else {
          // If PayHere script is blocked by browser adblockers, provide smooth simulator modal
          setIsPlacingOrder(false)
          setPayHerePendingOrder(paymentObject)
          setIsPayHereSimulatorOpen(true)
        }
      } catch (err) {
        setIsPlacingOrder(false)
        console.warn('PayHere initiation fallback:', err)
        setPayHerePendingOrder({
          order_id: tempOrderSeq,
          amount: Number(total).toFixed(2),
          currency: 'LKR',
        })
        setIsPayHereSimulatorOpen(true)
      }
    } else {
      // === BANK TRANSFER FLOW (WITH PAYMENT SLIP) ===
      await completeOrderCreation({
        paymentStatus: 'pending_slip_verification',
      })
    }
  }

  // Payment method options (Cash on Delivery and Store Pickup removed)
  const paymentOptions = [
    {
      id: 'card',
      title: 'Card Payment (PayHere)',
      desc: 'Visa, Mastercard, AMEX & Digital Wallets',
      icon: CreditCard,
      badge: 'Instant & Secure',
    },
    {
      id: 'bank',
      title: 'Direct Bank Transfer',
      desc: 'Commercial Bank deposit with slip upload',
      icon: Building,
      badge: 'Slip Required',
    },
  ]

  return (
    <div className="checkout-page-root">

      {/* ============================================================
          ACCOUNT SIGN IN / REGISTER GATE — shows when user is not yet authenticated
         ============================================================ */}
      {otpStep !== 'done' && (
        <div className="otp-gate-overlay">
          <div className="otp-gate-card">
            {/* Brand header */}
            <div className="otp-gate-brand">
              <span className="otp-brand-paw"><PawPrint size={20} /></span>
              <span className="otp-brand-name">City Pet</span>
            </div>

            <div className="auth-mode-tabs" role="tablist">
              <button
                type="button"
                className={`auth-mode-tab-btn ${otpStep !== 'register' ? 'active' : ''}`}
                onClick={() => { setOtpStep('login'); setOtpError('') }}
              >
                <Lock size={14} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-mode-tab-btn ${otpStep === 'register' ? 'active' : ''}`}
                onClick={() => { setOtpStep('register'); setOtpError('') }}
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
            </div>

            <h2 className="otp-gate-title">
              {otpStep === 'register' ? 'Create Account to Checkout' : 'Sign In to Checkout'}
            </h2>
            <p className="otp-gate-desc">
              {otpStep === 'register'
                ? 'Create your City Pet account or connect Google to complete your order.'
                : 'Sign in with your email and password or Google account to continue.'}
            </p>

            {/* Google Sign-In Button */}
            <div className="google-auth-section">
              <button
                type="button"
                className="google-continue-btn"
                onClick={handleGateGoogleLogin}
                disabled={gateSubmitting}
              >
                <svg className="google-g-logo" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{otpStep === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="auth-or-separator">
              <span>or with email</span>
            </div>

            {otpError && <p className="otp-error-msg"><AlertCircle size={13} />{otpError}</p>}

            {otpStep !== 'register' ? (
              <form className="admin-login-form" onSubmit={handleGateLogin} style={{ textAlign: 'left' }}>
                <div className="admin-form-group">
                  <label className="admin-field-label">Email Address</label>
                  <div className="auth-input-cluster">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-text-input"
                      placeholder="you@example.com"
                      value={gateEmail}
                      onChange={(e) => { setGateEmail(e.target.value); setOtpError('') }}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label">Password</label>
                  <div className="auth-input-cluster">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={gateShowPass ? 'text' : 'password'}
                      className="auth-text-input"
                      placeholder="Enter your password"
                      value={gatePassword}
                      onChange={(e) => { setGatePassword(e.target.value); setOtpError('') }}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setGateShowPass((p) => !p)}
                    >
                      {gateShowPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="otp-primary-btn" disabled={gateSubmitting}>
                  {gateSubmitting ? (
                    <><RefreshCw size={16} className="spin-icon" /> Signing In…</>
                  ) : (
                    <><Check size={16} /> Sign In & Continue</>
                  )}
                </button>

                <div className="auth-switch-prompt">
                  <span>Don't have an account?</span>
                  <button type="button" className="auth-switch-link" onClick={() => { setOtpStep('register'); setOtpError('') }}>
                    Create an account
                  </button>
                </div>
              </form>
            ) : (
              <form className="admin-login-form" onSubmit={handleGateRegister} style={{ textAlign: 'left' }}>
                <div className="admin-form-group">
                  <label className="admin-field-label">Full Name</label>
                  <div className="auth-input-cluster">
                    <User size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-text-input"
                      placeholder="Your full name"
                      value={gateRegName}
                      onChange={(e) => { setGateRegName(e.target.value); setOtpError('') }}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label">Email Address</label>
                  <div className="auth-input-cluster">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-text-input"
                      placeholder="you@example.com"
                      value={gateRegEmail}
                      onChange={(e) => { setGateRegEmail(e.target.value); setOtpError('') }}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label">Phone Number</label>
                  <div className="auth-input-cluster">
                    <Phone size={16} className="auth-input-icon" />
                    <input
                      type="tel"
                      className="auth-text-input"
                      placeholder="+94 77 123 4567"
                      value={gateRegPhone}
                      onChange={(e) => { setGateRegPhone(e.target.value); setOtpError('') }}
                    />
                  </div>
                </div>

                <div className="auth-form-two-col">
                  <div className="admin-form-group">
                    <label className="admin-field-label">Password</label>
                    <div className="auth-input-cluster">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={gateShowPass ? 'text' : 'password'}
                        className="auth-text-input"
                        placeholder="Min. 6 chars"
                        value={gateRegPass}
                        onChange={(e) => { setGateRegPass(e.target.value); setOtpError('') }}
                        required
                      />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-field-label">Confirm</label>
                    <div className="auth-input-cluster">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={gateShowPass ? 'text' : 'password'}
                        className="auth-text-input"
                        placeholder="Repeat"
                        value={gateRegConfirm}
                        onChange={(e) => { setGateRegConfirm(e.target.value); setOtpError('') }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="otp-primary-btn" disabled={gateSubmitting}>
                  {gateSubmitting ? (
                    <><RefreshCw size={16} className="spin-icon" /> Creating Account…</>
                  ) : (
                    <><Check size={16} /> Create Account & Continue</>
                  )}
                </button>

                <div className="auth-switch-prompt">
                  <span>Already have an account?</span>
                  <button type="button" className="auth-switch-link" onClick={() => { setOtpStep('login'); setOtpError('') }}>
                    Sign In
                  </button>
                </div>
              </form>
            )}

            <p className="otp-gate-footnote">
              <Lock size={11} /> Secured by City Pet Animal Hospital
            </p>
          </div>
        </div>
      )}

      {/* Render the checkout only once OTP is verified */}
      {otpStep === 'done' && (orderPlacedData ? (

        /* ========================================================
            SUCCESSFUL ORDER CONFIRMATION VIEW
           ======================================================== */
        <div className="container checkout-container">
          <div className="order-success-card">
            <div className="success-icon-circle-large">
              <CheckCircle2 size={56} color="#00b074" />
            </div>
            <span className="success-eyebrow">ORDER CONFIRMED</span>
            <h1 className="success-main-title">Thank You For Your Order!</h1>
            <p className="success-sub">
              Your order <strong>{orderPlacedData.orderNumber}</strong> has been received and is being prepared by the City Pet veterinary pharmacy team.
            </p>

            <div className="success-details-summary-box">
              <div className="summary-col">
                <span className="lbl">Order Number</span>
                <strong className="val">{orderPlacedData.orderNumber}</strong>
              </div>
              <div className="summary-col">
                <span className="lbl">Tracking ID</span>
                <strong className="val">{orderPlacedData.trackingNumber}</strong>
              </div>
              <div className="summary-col">
                <span className="lbl">Total Paid</span>
                <strong className="val text-teal">LKR {orderPlacedData.total.toLocaleString()}</strong>
              </div>
              <div className="summary-col">
                <span className="lbl">Recipient</span>
                <strong className="val">{orderPlacedData.recipient}</strong>
              </div>
            </div>

            {/* Payment Channel Feedback in Success Card */}
            <div className="success-payment-status-card">
              <div className="payment-status-icon-wrap">
                {orderPlacedData.paymentMethod === 'card' ? (
                  <ShieldCheck size={26} color="#04959d" />
                ) : (
                  <Receipt size={26} color="#04959d" />
                )}
              </div>
              <div className="payment-status-text-wrap">
                <strong>
                  {orderPlacedData.paymentMethod === 'card'
                    ? 'Payment Confirmed via PayHere Gateway'
                    : 'Bank Transfer Payment Slip Attached'}
                </strong>
                <p>
                  {orderPlacedData.paymentMethod === 'card'
                    ? 'Your card transaction was securely processed and verified. Tax invoice has been generated.'
                    : 'Your bank payment receipt has been received and is undergoing verification by the hospital accounts desk.'}
                </p>
                {orderPlacedData.paymentSlip && (
                  <div className="success-slip-preview-row">
                    <span className="slip-preview-label">Attached Slip:</span>
                    <a
                      href={orderPlacedData.paymentSlip}
                      target="_blank"
                      rel="noreferrer"
                      className="slip-preview-link"
                    >
                      <FileText size={14} />
                      <span>View Uploaded Slip</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="success-actions-row">
              <button
                className="button primary"
                onClick={() => onNavigate('account')}
              >
                <Truck size={17} />
                <span>Track Order in My Account</span>
              </button>
              <button
                className="button secondary"
                onClick={() => onNavigate('catalog')}
              >
                <ShoppingBag size={17} />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            MAIN CHECKOUT VIEW
           ======================================================== */
        <div className="container checkout-container">
          {/* 1. Hero Header Banner */}
          <div className="checkout-hero-banner">
            <div className="checkout-hero-text">
              <span className="checkout-eyebrow-pill">SECURE CHECKOUT</span>
              <h1 className="checkout-main-title">
                Complete your order
                <span className="checkout-script-line">
                  For a happier, healthier tomorrow.
                </span>
              </h1>
              <p className="checkout-subtitle">
                Quality pet care products, delivered safely to your doorstep.
              </p>
            </div>

            <div className="checkout-hero-visual-area">
              <div className="hero-pets-img-wrapper">
                <img
                  src={checkoutHeroPets}
                  alt="Happy smiling Golden Retriever dog and tabby cat"
                  className="checkout-hero-pets-img"
                />
              </div>

              {/* Script Text Overlay */}
              <div className="checkout-script-tag">
                <span>Happy</span>
                <span>Pets</span>
                <span>Brighter</span>
                <span>Days <span className="script-heart">♡</span></span>
              </div>

              {/* Teal Circular Trust Badge */}
              <div className="same-care-circular-badge">
                <span className="badge-line1">100%</span>
                <span className="badge-line2">Secure</span>
                <span className="badge-line3">Payment</span>
                <span className="badge-heart">🔒</span>
              </div>
            </div>
          </div>

          {/* 2. Top 4-Step Stepper Bar */}
          <div className="checkout-stepper-bar">
            <div className="checkout-step-item active">
              <span className="step-circle">1</span>
              <span className="step-text">Contact</span>
            </div>
            <div className="step-line active" />
            <div className="checkout-step-item active">
              <span className="step-circle">2</span>
              <span className="step-text">Delivery Address</span>
            </div>
            <div className="step-line active" />
            <div className="checkout-step-item active">
              <span className="step-circle">3</span>
              <span className="step-text">Courier Method</span>
            </div>
            <div className="step-line active" />
            <div className="checkout-step-item active">
              <span className="step-circle">4</span>
              <span className="step-text">PayHere / Bank</span>
            </div>
          </div>

          {/* 3. Main 2-Column Checkout Layout */}
          <div className="checkout-main-grid">
            {/* ====================================================
                LEFT COLUMN: 4 Accordion Form Blocks
               ==================================================== */}
            <div className="checkout-forms-col">
              {/* BLOCK 1: Contact Details */}
              <section className="checkout-form-card">
                <div className="card-section-heading">
                  <span className="step-number-pill">1</span>
                  <div>
                    <h2 className="step-heading-title">Contact Details</h2>
                    <p className="step-heading-desc">
                      All fields marked with <span className="req-star">*</span> are required for dispatch &amp; tracking.
                    </p>
                  </div>
                </div>

                <div className="form-fields-grid-3">
                  <div className="form-field-group">
                    <label htmlFor="field-fullName">
                      Full Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-fullName"
                      type="text"
                      className={formErrors.fullName ? 'input-has-error' : ''}
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g. Nimal Perera"
                    />
                    {formErrors.fullName && (
                      <span className="checkout-field-error">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-email">
                      Email Address <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-email"
                      type="email"
                      className={formErrors.email ? 'input-has-error' : ''}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="e.g. nimal.perera@gmail.com"
                    />
                    {formErrors.email && (
                      <span className="checkout-field-error">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-phone">
                      Phone Number <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-phone"
                      type="tel"
                      className={formErrors.phone ? 'input-has-error' : ''}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="e.g. 077 123 4567"
                    />
                    {formErrors.phone && (
                      <span className="checkout-field-error">{formErrors.phone}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* BLOCK 2: Delivery Address (ALL fields required) */}
              <section className="checkout-form-card">
                <div className="card-section-heading">
                  <span className="step-number-pill">2</span>
                  <div>
                    <h2 className="step-heading-title">Delivery Address</h2>
                    <p className="step-heading-desc">
                      Every address field is mandatory for accurate courier delivery.
                    </p>
                  </div>
                </div>

                <div className="form-fields-grid-2">
                  <div className="form-field-group">
                    <label htmlFor="field-addressLine1">
                      Address Line 1 (Street / House No) <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-addressLine1"
                      type="text"
                      className={formErrors.addressLine1 ? 'input-has-error' : ''}
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      placeholder="No. 45, Alfred House Gardens"
                    />
                    {formErrors.addressLine1 && (
                      <span className="checkout-field-error">{formErrors.addressLine1}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-addressLine2">
                      Address Line 2 (Apartment / Suite / Area) <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-addressLine2"
                      type="text"
                      className={formErrors.addressLine2 ? 'input-has-error' : ''}
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      placeholder="Apartment 4B or Locality"
                    />
                    {formErrors.addressLine2 && (
                      <span className="checkout-field-error">{formErrors.addressLine2}</span>
                    )}
                  </div>
                </div>

                <div className="form-fields-grid-3 mt-3.5">
                  <div className="form-field-group">
                    <label htmlFor="field-city">
                      City <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-city"
                      type="text"
                      className={formErrors.city ? 'input-has-error' : ''}
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Colombo, Kandy, Galle..."
                    />
                    {formErrors.city && (
                      <span className="checkout-field-error">{formErrors.city}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-district">
                      District <span className="req-star">*</span>
                    </label>
                    <select
                      id="field-district"
                      className={formErrors.district ? 'input-has-error' : ''}
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                    >
                      <option value="Colombo">Colombo</option>
                      <option value="Gampaha">Gampaha</option>
                      <option value="Kalutara">Kalutara</option>
                      <option value="Kandy">Kandy</option>
                      <option value="Matale">Matale</option>
                      <option value="Nuwara Eliya">Nuwara Eliya</option>
                      <option value="Galle">Galle</option>
                      <option value="Matara">Matara</option>
                      <option value="Hambantota">Hambantota</option>
                      <option value="Kurunegala">Kurunegala</option>
                      <option value="Puttalam">Puttalam</option>
                      <option value="Anuradhapura">Anuradhapura</option>
                      <option value="Polonnaruwa">Polonnaruwa</option>
                      <option value="Badulla">Badulla</option>
                      <option value="Monaragala">Monaragala</option>
                      <option value="Ratnapura">Ratnapura</option>
                      <option value="Kegalle">Kegalle</option>
                      <option value="Jaffna">Jaffna</option>
                      <option value="Batticaloa">Batticaloa</option>
                    </select>
                    {formErrors.district && (
                      <span className="checkout-field-error">{formErrors.district}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-postalCode">
                      Postal Code <span className="req-star">*</span>
                    </label>
                    <input
                      id="field-postalCode"
                      type="text"
                      className={formErrors.postalCode ? 'input-has-error' : ''}
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="00300"
                    />
                    {formErrors.postalCode && (
                      <span className="checkout-field-error">{formErrors.postalCode}</span>
                    )}
                  </div>
                </div>

                <label className="checkbox-custom-row">
                  <input
                    type="checkbox"
                    checked={formData.saveAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, saveAddress: e.target.checked })
                    }
                  />
                  <span className="checkbox-custom-box" />
                  <span className="checkbox-text">Save this address to my profile for future orders</span>
                </label>
              </section>

              {/* BLOCK 3: Delivery Method (Store Pickup Removed) */}
              <section className="checkout-form-card">
                <div className="card-section-heading">
                  <span className="step-number-pill">3</span>
                  <div>
                    <h2 className="step-heading-title">Delivery Method</h2>
                    <p className="step-heading-desc">
                      All orders are dispatched via tracked temperature-controlled pet courier.
                    </p>
                  </div>
                </div>

                <div className="delivery-methods-grid">
                  {deliveryOptions.length === 0 ? (
                    <div className="checkout-field-error">
                      Delivery is temporarily unavailable. Please contact City Pet before placing this order.
                    </div>
                  ) : deliveryOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = deliveryMethod === opt.id
                    return (
                      <div
                        key={opt.id}
                        className={`method-select-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setDeliveryMethod(opt.id)}
                      >
                        <div className="method-icon-wrap">
                          <Icon size={24} />
                        </div>
                        <strong className="method-name">{opt.name}</strong>
                        <span className="method-time">{opt.time}</span>
                        <span className="method-price">LKR {Number(opt.price ?? opt.fee ?? 0).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* BLOCK 4: Payment Method (Cash on Delivery & Pickup Removed) */}
              <section className="checkout-form-card">
                <div className="card-section-heading">
                  <span className="step-number-pill">4</span>
                  <div>
                    <h2 className="step-heading-title">Payment Method</h2>
                    <p className="step-heading-desc">
                      Choose between secure online PayHere card payment or direct bank deposit.
                    </p>
                  </div>
                </div>

                <div className="payment-methods-grid payment-methods-2col">
                  {paymentOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = paymentMethod === opt.id
                    return (
                      <div
                        key={opt.id}
                        className={`method-select-card payment-style ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setPaymentMethod(opt.id)
                          if (formErrors.paymentSlip) {
                            setFormErrors((prev) => ({ ...prev, paymentSlip: undefined }))
                          }
                        }}
                      >
                        <div className="method-top-line">
                          <Icon size={20} className="payment-icon" />
                          <strong className="method-name">{opt.title}</strong>
                        </div>
                        <span className="method-desc-text">{opt.desc}</span>
                        {opt.badge && (
                          <span className="method-badge-pill">{opt.badge}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* --- 4A. PAYHERE CARD PAYMENT SECTION --- */}
                {paymentMethod === 'card' && (
                  <div className="payhere-gateway-box">
                    <div className="payhere-gateway-header">
                      <div className="payhere-badge-group">
                        <span className="payhere-brand-pill">
                          <ShieldCheck size={16} /> PayHere Connect
                        </span>
                        <span className="payhere-ssl-badge">
                          <Lock size={12} /> 256-Bit SSL Secured
                        </span>
                      </div>
                      <span className="cbsl-approved-text">
                        Central Bank of Sri Lanka Approved
                      </span>
                    </div>

                    <div className="payhere-gateway-body">
                      <p className="payhere-description">
                        Clicking <strong>Place Order</strong> will securely connect to Sri Lanka's leading payment gateway <strong>PayHere</strong>. You can pay with any Visa, Mastercard, AMEX, or supported Sri Lankan digital wallet.
                      </p>

                      <div className="payhere-supported-channels">
                        <span className="channel-pill">VISA</span>
                        <span className="channel-pill">Mastercard</span>
                        <span className="channel-pill">AMEX</span>
                        <span className="channel-pill">Sampath Vishwa</span>
                        <span className="channel-pill">FriMi</span>
                        <span className="channel-pill">Genie</span>
                        <span className="channel-pill">eZ Cash</span>
                        <span className="channel-pill">mCash</span>
                      </div>

                      <div className="payhere-guarantee-note">
                        <CheckCircle2 size={16} color="#00b074" />
                        <span>Instant automated payment confirmation with digital tax receipt</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 4B. BANK TRANSFER & SLIP UPLOAD SECTION --- */}
                {paymentMethod === 'bank' && (
                  <div className="bank-transfer-box" id="field-paymentSlip">
                    <div className="bank-account-card">
                      <div className="bank-account-header">
                        <div className="bank-header-left">
                          <Building size={20} className="bank-icon" />
                          <div>
                            <strong className="bank-name-title">Commercial Bank of Ceylon</strong>
                            <span className="bank-branch-text">Colombo 07 Branch (Cinnamon Gardens)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="copy-acc-btn"
                          onClick={handleCopyBankAccount}
                          title="Copy account number"
                        >
                          {copiedBankAcc ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedBankAcc ? 'Copied!' : 'Copy Acc #'}</span>
                        </button>
                      </div>

                      <div className="bank-details-grid">
                        <div className="bank-detail-item">
                          <span className="bank-detail-lbl">Account Name</span>
                          <strong className="bank-detail-val">City Pet Animal Hospital (Pvt) Ltd</strong>
                        </div>
                        <div className="bank-detail-item">
                          <span className="bank-detail-lbl">Account Number</span>
                          <strong className="bank-detail-val acc-highlight">1000 4829 3301</strong>
                        </div>
                        <div className="bank-detail-item">
                          <span className="bank-detail-lbl">Branch Code</span>
                          <strong className="bank-detail-val">044 (Colombo 07)</strong>
                        </div>
                        <div className="bank-detail-item">
                          <span className="bank-detail-lbl">Payment Reference</span>
                          <strong className="bank-detail-val">{formData.phone || 'Your Phone Number'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Slip Upload Box */}
                    <div className="slip-upload-wrapper">
                      <label className="slip-upload-label">
                        <span>Upload Bank Transfer Slip / Deposit Receipt</span>
                        <span className="req-star">* Required</span>
                      </label>
                      <p className="slip-upload-hint">
                        Attach a screenshot of your bank transfer receipt or a photo of your bank deposit slip (JPG, PNG, WebP or PDF).
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        id="slip-file-input"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleSlipFileSelect}
                      />

                      {!uploadedSlip ? (
                        <div
                          className={`slip-dropzone ${isDraggingSlip ? 'dragging' : ''} ${formErrors.paymentSlip ? 'dropzone-error' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDraggingSlip(true)
                          }}
                          onDragLeave={() => setIsDraggingSlip(false)}
                          onDrop={handleSlipDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="dropzone-inner">
                            <div className="dropzone-icon-circle">
                              {isUploadingSlip ? (
                                <RefreshCw size={24} className="spin-icon" />
                              ) : (
                                <UploadCloud size={24} />
                              )}
                            </div>
                            <strong className="dropzone-title">
                              {isUploadingSlip
                                ? 'Uploading payment slip...'
                                : 'Click to browse or drag & drop payment slip'}
                            </strong>
                            <span className="dropzone-subtext">
                              Supports JPG, PNG, WebP or PDF (Max 8 MB)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="uploaded-slip-card">
                          <div className="uploaded-slip-left">
                            {uploadedSlip.type === 'pdf' ? (
                              <div className="slip-thumb-pdf">
                                <FileText size={28} />
                                <span>PDF</span>
                              </div>
                            ) : (
                              <img
                                src={uploadedSlip.preview || uploadedSlip.url}
                                alt="Payment slip preview"
                                className="slip-thumb-img"
                              />
                            )}
                            <div className="uploaded-slip-meta">
                              <div className="slip-verified-pill">
                                <Check size={12} />
                                <span>Slip Attached</span>
                              </div>
                              <strong className="uploaded-slip-name">
                                {uploadedSlip.filename}
                              </strong>
                              <span className="uploaded-slip-size">
                                {uploadedSlip.size}
                              </span>
                            </div>
                          </div>

                          <div className="uploaded-slip-actions">
                            {uploadedSlip.url && (
                              <a
                                href={uploadedSlip.url}
                                target="_blank"
                                rel="noreferrer"
                                className="slip-action-btn view-btn"
                                title="View slip"
                              >
                                <Eye size={15} />
                                <span>View</span>
                              </a>
                            )}
                            <button
                              type="button"
                              className="slip-action-btn replace-btn"
                              onClick={() => fileInputRef.current?.click()}
                              title="Replace file"
                            >
                              <RefreshCw size={14} />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              className="slip-action-btn delete-btn"
                              onClick={handleRemoveSlip}
                              title="Remove slip"
                            >
                              <Trash2 size={15} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {formErrors.paymentSlip && (
                        <div className="slip-error-alert">
                          <AlertCircle size={15} />
                          <span>{formErrors.paymentSlip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* ====================================================
                RIGHT COLUMN: Order Summary Card
               ==================================================== */}
            <aside className="checkout-summary-col">
              <div className="checkout-summary-sticky-card">
                <div className="summary-card-header">
                  <div>
                    <h3 className="summary-title">Order Summary</h3>
                    <span className="summary-items-count">
                      {cartItems.reduce((a, b) => a + b.quantity, 0)} items in your cart
                    </span>
                  </div>
                  <button
                    type="button"
                    className="edit-cart-link"
                    onClick={() => {
                      if (onOpenCart) onOpenCart()
                      else onNavigate('catalog')
                    }}
                  >
                    Edit Cart
                  </button>
                </div>

                {/* Items List */}
                <div className="summary-items-list">
                  {cartItems.length === 0 ? (
                    <p className="empty-items-text">Your cart is empty.</p>
                  ) : (
                    cartItems.map((item) => {
                      const isItemOut = isProductOut(item.product)
                      const itemKey = cartItemKey(item.product)

                      return (
                        <div key={itemKey} className={`summary-item-row ${isItemOut ? 'item-out-of-stock' : ''}`}>
                          <div className="summary-item-thumb">
                            <ProductVisual
                              type={item.product.imageType}
                              name={item.product.name}
                            />
                          </div>

                          <div className="summary-item-info">
                            <div className="summary-item-name-row">
                              <div>
                            <h4 className="summary-item-title">
                              {item.product.name}
                            </h4>
                            {item.product.selectedSize && (
                              <span className="summary-item-variant">Size: {item.product.selectedSize}</span>
                            )}
                            {isItemOut && (
                              <span className="cart-out-badge">Out of Stock</span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="summary-delete-btn"
                                onClick={() => onRemoveItem && onRemoveItem(itemKey)}
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            <div className="summary-item-bottom-row">
                              <div className="summary-qty-pill">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateQty &&
                                    onUpdateQty(itemKey, item.quantity - 1)
                                  }
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="qty-num">{item.quantity}</span>
                                <button
                                  type="button"
                                  disabled={isItemOut}
                                  onClick={() =>
                                    onUpdateQty &&
                                    onUpdateQty(itemKey, item.quantity + 1)
                                  }
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <strong className="summary-item-line-total">
                                LKR {((item.product.price || 0) * item.quantity).toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Discount Code Input Box */}
                <form className="summary-discount-form" onSubmit={handleApplyDiscount}>
                  <div className="discount-input-wrap">
                    <Tag size={16} className="discount-tag-icon" />
                    <input
                      type="text"
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="discount-apply-btn">
                    Apply
                  </button>
                </form>

                {discountError && (
                  <span className="discount-error-text">{discountError}</span>
                )}
                {discountApplied && (
                  <span className="discount-applied-text">
                    ✓ Promo code applied (-LKR {discountAmount.toLocaleString()})
                  </span>
                )}

                {/* Price Breakdown */}
                <div className="summary-price-breakdown">
                  <div className="breakdown-row">
                    <span>Subtotal</span>
                    <strong>LKR {subtotal.toLocaleString()}</strong>
                  </div>

                  {discountApplied && (
                    <div className="breakdown-row discount-row">
                      <span>Discount</span>
                      <strong className="discount-value">
                        - LKR {discountAmount.toLocaleString()}
                      </strong>
                    </div>
                  )}

                  <div className="breakdown-row">
                    <span>Delivery Charge ({deliveryMethod === 'standard' ? 'Standard' : 'Express'})</span>
                    <strong>LKR {deliveryFee.toLocaleString()}</strong>
                  </div>

                  <div className="breakdown-total-row">
                    <span className="total-label">Total</span>
                    <strong className="total-price">
                      LKR {total.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Trust Guarantee Cards */}
                <div className="summary-trust-boxes">
                  <div className="trust-mini-card">
                    <div className="trust-mini-icon">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="trust-mini-text">
                      <strong>PayHere Protected</strong>
                      <p>256-bit encrypted secure Sri Lankan payment gateway.</p>
                    </div>
                  </div>

                  <div className="trust-mini-card">
                    <div className="trust-mini-icon">
                      <Award size={20} />
                    </div>
                    <div className="trust-mini-text">
                      <strong>Veterinary Support</strong>
                      <p>City Pet hospital pharmacy staff reviews every dispatch.</p>
                    </div>
                  </div>
                </div>

                {hasOutOfStockItems && (
                  <div className="checkout-stock-alert-banner">
                    <AlertCircle size={17} />
                    <span>Your cart contains out-of-stock items. Please remove them before placing your order.</span>
                  </div>
                )}

                {/* Dynamic Place Order CTA Button */}
                <button
                  type="button"
                  className={`place-order-main-btn ${hasOutOfStockItems ? 'disabled' : ''}`}
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cartItems.length === 0 || hasOutOfStockItems}
                >
                  <Lock size={16} />
                  <span>
                    {hasOutOfStockItems
                      ? 'Out of Stock Items in Cart'
                      : isPlacingOrder
                      ? paymentMethod === 'card'
                        ? 'Connecting to PayHere...'
                        : 'Confirming Order...'
                      : paymentMethod === 'card'
                      ? `Pay with PayHere • LKR ${total.toLocaleString()}`
                      : `Confirm Order with Slip • LKR ${total.toLocaleString()}`}
                  </span>
                </button>

                <p className="summary-disclaimer">
                  By placing your order, you agree to our{' '}
                  <a href="#terms" onClick={(e) => e.preventDefault()}>
                    Terms &amp; Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </aside>
          </div>

          {/* 4. Bottom Value Proposition Guarantee Badges (Pickup Removed) */}
          <div className="checkout-trust-badges-strip">
            <div className="checkout-trust-pill">
              <span className="trust-icon-box">
                <Award size={20} />
              </span>
              <div className="trust-pill-texts">
                <strong>Genuine Products</strong>
                <span>100% authentic, trusted brands</span>
              </div>
            </div>

            <div className="checkout-trust-pill">
              <span className="trust-icon-box">
                <Stethoscope size={20} />
              </span>
              <div className="trust-pill-texts">
                <strong>Vet Recommended</strong>
                <span>Chosen by our veterinary team</span>
              </div>
            </div>

            <div className="checkout-trust-pill">
              <span className="trust-icon-box">
                <Truck size={20} />
              </span>
              <div className="trust-pill-texts">
                <strong>Islandwide Delivery</strong>
                <span>Fast and reliable courier service</span>
              </div>
            </div>

            <div className="checkout-trust-pill">
              <span className="trust-icon-box">
                <ShieldCheck size={20} />
              </span>
              <div className="trust-pill-texts">
                <strong>100% Secure Payment</strong>
                <span>PayHere Gateway &amp; Direct Bank Transfer</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ========================================================
          PAYHERE SANDBOX FALLBACK / TEST SIMULATOR MODAL
          Guarantees seamless checkout testing in all environments
         ======================================================== */}
      {isPayHereSimulatorOpen && payHerePendingOrder && (
        <div className="payhere-simulator-backdrop" onClick={() => setIsPayHereSimulatorOpen(false)}>
          <div className="payhere-simulator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payhere-sim-header">
              <div className="payhere-sim-brand">
                <div className="payhere-sim-logo-badge">PayHere</div>
                <span className="payhere-sim-tag">Sandbox Gateway</span>
              </div>
              <button
                type="button"
                className="payhere-sim-close"
                onClick={() => setIsPayHereSimulatorOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="payhere-sim-body">
              <div className="payhere-sim-merchant-row">
                <div>
                  <span className="sim-lbl">Merchant</span>
                  <strong className="sim-merchant-name">City Pet Animal Hospital</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="sim-lbl">Amount Due</span>
                  <strong className="sim-amount">LKR {Number(total).toLocaleString()}</strong>
                </div>
              </div>

              <div className="payhere-sim-notice">
                <Info size={16} />
                <span>
                  This PayHere secure checkout connector is operating in Sandbox / Test Mode. Click below to simulate an approved payment.
                </span>
              </div>

              <div className="payhere-sim-cards-preview">
                <div className="sim-card-option selected">
                  <CreditCard size={18} color="#04959d" />
                  <div>
                    <strong>Visa / Mastercard (Test Card)</strong>
                    <span>•••• •••• •••• 4242 &bull; Instant Approval</span>
                  </div>
                </div>
              </div>

              <div className="payhere-sim-actions">
                <button
                  type="button"
                  className="payhere-sim-approve-btn"
                  onClick={async () => {
                    setIsPayHereSimulatorOpen(false)
                    await completeOrderCreation({
                      paymentStatus: 'paid',
                      payherePaymentId: 'PH-' + Math.floor(1000000 + Math.random() * 9000000),
                    })
                  }}
                >
                  <Lock size={15} />
                  <span>Approve Test Payment (LKR {Number(total).toLocaleString()})</span>
                </button>
                <button
                  type="button"
                  className="payhere-sim-cancel-btn"
                  onClick={() => setIsPayHereSimulatorOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
