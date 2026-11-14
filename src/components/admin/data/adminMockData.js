import {
  Activity,
  BarChart3,
  CreditCard,
  Home,
  Layers,
  Package,
  PawPrint,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react'

// Sidebar Menu Items
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pets', label: 'Pets', icon: PawPrint },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'activity', label: 'Activity Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const salesData = []

export const ordersTrendData = []

export const defaultRecentOrders = []

export const topProducts = []

export const lowStockItems = []

export const defaultPatients = []
