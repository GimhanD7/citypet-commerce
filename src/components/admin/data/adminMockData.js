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

// Assets
import royalCaninImg from '../../../assets/pdp-royal-canin-main.jpg'
import kibbleBowlImg from '../../../assets/pdp-kibble-bowl.jpg'
import jackRussellImg from '../../../assets/pdp-jack-russell.jpg'
import buddyDog from '../../../assets/pet-buddy-dog.jpg'
import lunaCat from '../../../assets/pet-luna-cat.jpg'

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

// Chart Data: Sales & Revenue (Apr 1 - Apr 30)
export const salesData = [
  { date: 'Apr 1', day: 1, revenue: 130000, orders: 42 },
  { date: 'Apr 5', day: 5, revenue: 205000, orders: 58 },
  { date: 'Apr 10', day: 10, revenue: 260000, orders: 74 },
  { date: 'Apr 15', day: 15, revenue: 320450, orders: 86 },
  { date: 'Apr 20', day: 20, revenue: 195000, orders: 52 },
  { date: 'Apr 25', day: 25, revenue: 245000, orders: 68 },
  { date: 'Apr 30', day: 30, revenue: 335000, orders: 92 },
]

// Chart Data: Orders Trend (This Month vs. Last Month)
export const ordersTrendData = [
  { date: 'Apr 1', day: 1, thisMonth: 22, lastMonth: 15 },
  { date: 'Apr 5', day: 5, thisMonth: 38, lastMonth: 28 },
  { date: 'Apr 10', day: 10, thisMonth: 72, lastMonth: 44 },
  { date: 'Apr 15', day: 15, thisMonth: 64, lastMonth: 52 },
  { date: 'Apr 20', day: 20, thisMonth: 96, lastMonth: 68 },
  { date: 'Apr 25', day: 25, thisMonth: 78, lastMonth: 54 },
  { date: 'Apr 30', day: 30, thisMonth: 95, lastMonth: 72 },
]

// Recent Orders Data
export const defaultRecentOrders = [
  {
    id: '#CP75821',
    date: 'Apr 28, 2024',
    customer: 'Sarah Perera',
    items: '3 items',
    total: 'LKR 7,950',
    status: 'Delivered',
    statusType: 'success',
  },
  {
    id: '#CP75820',
    date: 'Apr 28, 2024',
    customer: 'Nimesh Fernando',
    items: '2 items',
    total: 'LKR 6,800',
    status: 'Processing',
    statusType: 'info',
  },
  {
    id: '#CP75819',
    date: 'Apr 27, 2024',
    customer: 'Dilini Jayasuriya',
    items: '1 item',
    total: 'LKR 4,200',
    status: 'Shipped',
    statusType: 'purple',
  },
  {
    id: '#CP75818',
    date: 'Apr 26, 2024',
    customer: 'Kasun Wijesinghe',
    items: '4 items',
    total: 'LKR 12,450',
    status: 'Delivered',
    statusType: 'success',
  },
  {
    id: '#CP75817',
    date: 'Apr 26, 2024',
    customer: 'Tharushi Kimara',
    items: '2 items',
    total: 'LKR 5,600',
    status: 'Processing',
    statusType: 'info',
  },
]

// Top Selling Products
export const topProducts = [
  {
    rank: 1,
    name: 'Royal Canin Mini Adult Dry Dog Food 2kg',
    sold: '124 sold',
    price: 'LKR 7,950',
    img: royalCaninImg,
  },
  {
    rank: 2,
    name: "Hill's Science Diet Adult Cat Food 1.5kg",
    sold: '98 sold',
    price: 'LKR 6,800',
    img: kibbleBowlImg,
  },
  {
    rank: 3,
    name: 'KONG Cozie Plush Dog Toy',
    sold: '76 sold',
    price: 'LKR 2,450',
    img: jackRussellImg,
  },
  {
    rank: 4,
    name: "Vet's Best Omega-3 for Dogs",
    sold: '64 sold',
    price: 'LKR 4,200',
    img: royalCaninImg,
  },
  {
    rank: 5,
    name: 'Cat Litter Box (Large)',
    sold: '61 sold',
    price: 'LKR 3,900',
    img: kibbleBowlImg,
  },
]

// Low Stock Inventory
export const lowStockItems = [
  {
    product: 'Royal Canin Mini Adult 2kg',
    sku: 'RC002',
    stock: 5,
    img: royalCaninImg,
  },
  {
    product: "Hill's Science Diet Cat 1.5kg",
    sku: 'HS001',
    stock: 4,
    img: kibbleBowlImg,
  },
  {
    product: 'KONG Dog Toy (M)',
    sku: 'KONG003',
    stock: 6,
    img: jackRussellImg,
  },
  {
    product: "Vet's Best Omega-3",
    sku: 'VB001',
    stock: 8,
    img: royalCaninImg,
  },
  {
    product: 'Cat Litter Box (Large)',
    sku: 'CLB002',
    stock: 4,
    img: kibbleBowlImg,
  },
]

// Clinical In-Patients & Treatment Records
export const defaultPatients = [
  {
    id: 'pat-1',
    date: 'Apr 29, 2024',
    petName: 'Buddy',
    petType: 'Golden Retriever',
    ownerName: 'Sarah Perera',
    service: 'General Checkup & Care',
    vet: 'Dr. Amanda',
    status: 'In Recovery',
    avatar: buddyDog,
  },
  {
    id: 'pat-2',
    date: 'Apr 29, 2024',
    petName: 'Luna',
    petType: 'Tabby Cat',
    ownerName: 'Nimesh Fernando',
    service: 'Vaccination & Deworming',
    vet: 'Dr. Sugath',
    status: 'Completed',
    avatar: lunaCat,
  },
  {
    id: 'pat-3',
    date: 'Apr 29, 2024',
    petName: 'Max',
    petType: 'German Shepherd',
    ownerName: 'Dilini Jayasuriya',
    service: 'Dental Scaling & Polishing',
    vet: 'Dr. Kevin',
    status: 'Under Treatment',
    avatar: jackRussellImg,
  },
  {
    id: 'pat-4',
    date: 'Apr 29, 2024',
    petName: 'Bella',
    petType: 'Labrador',
    ownerName: 'Kasun Wijesinghe',
    service: 'Dermatology & Skin Care',
    vet: 'Dr. Amanda',
    status: 'Follow-up',
    avatar: buddyDog,
  },
  {
    id: 'pat-5',
    date: 'Apr 30, 2024',
    petName: 'Milo',
    petType: 'Persian Cat',
    ownerName: 'Tharushi Kimara',
    service: 'Post-Op Follow-up',
    vet: 'Dr. Sugandhika',
    status: 'Completed',
    avatar: lunaCat,
  },
]
