import {
  Activity,
  BarChart3,
  CreditCard,
  Home,
  Layers,
  MessageSquare,
  Package,
  PawPrint,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react'

// Modern Grouped Sidebar Navigation Sections
export const navSections = [
  {
    title: 'MAIN MONITOR',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, badge: 'Live' },
      { id: 'activity', label: 'Activity Logs', icon: Activity },
    ],
  },
  {
    title: 'STORE & CLINIC',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'categories', label: 'Categories', icon: Layers },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    title: 'MANAGEMENT & ROLES',
    items: [
      { id: 'users', label: 'Users & Roles', icon: Users, badge: '10 Roles' },
      { id: 'sms', label: 'SMS Notifications', icon: MessageSquare, badge: 'Gateway' },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Flat list for backwards-compatibility
export const navItems = navSections.flatMap((s) => s.items)

export const salesData = []

export const ordersTrendData = []

export const defaultRecentOrders = []

export const topProducts = []

export const lowStockItems = []

export const defaultPatients = []
