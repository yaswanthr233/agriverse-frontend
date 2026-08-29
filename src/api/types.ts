/* ── Envelope ─────────────────────────────────────────── */
export interface FieldValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errorCode?: string;
  errors?: FieldValidationError[];
  timestamp: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // ZERO-indexed
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/* ── Enums (exact backend values) ─────────────────────── */
export type Role =
  | "FARMER" | "SELLER" | "ADMIN" | "VETERINARIAN" | "DELIVERY_PARTNER";

export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED"
  | "OUT_FOR_DELIVERY" | "DELIVERED"
  | "CANCELLED" | "RETURNED" | "REFUNDED";

export type ProductCategory =
  | "SEEDS" | "FERTILIZERS" | "PESTICIDES" | "TOOLS_EQUIPMENT"
  | "IRRIGATION" | "ANIMAL_FEED" | "ORGANIC" | "MACHINERY" | "OTHER";

/* ── Auth ─────────────────────────────────────────────── */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  city: string | null;
  state: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
}

/** The session user. `role` is read ONLY from here. */
export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  city: string | null;
  state: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
}

export interface UserProfileResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  city: string | null;
  state: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  city?: string;
  state?: string;
}

export interface OtpResponse {
  verified: boolean;
  expiresInSeconds: number;
  resent: boolean;
}

/* ── Products ─────────────────────────────────────────── */
export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  categoryLabel: string;
  stock: number;
  unit: string;
  imageUrl: string | null;
  brand: string | null;
  isActive: boolean;
  sellerName: string;
  sellerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  stock?: number;
  unit?: string;
  imageUrl?: string;
  brand?: string;
  isActive?: boolean;
}

/* ── Livestock ────────────────────────────────────────── */
export interface LivestockResponse {
  id: number;
  name: string;
  breed: string;
  age: string | null;
  weightKg: number | null;
  healthStatus: string | null;
  milkYield: string | null;
  vaccinated: boolean | null;
  certified: boolean | null;
  forSale: boolean | null;
  price: number | null;
  location: string | null;
  imageUrl: string | null;
  notes: string | null;
  farmerName: string;
  farmerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface LivestockRequest {
  name: string;
  breed: string;
  age?: string;
  weightKg?: number;
  healthStatus?: string;
  milkYield?: string;
  vaccinated?: boolean;
  certified?: boolean;
  forSale?: boolean;
  price?: number;
  location?: string;
  imageUrl?: string;
  notes?: string;
}

/* ── Orders & Payments ────────────────────────────────── */
export interface OrderItemResponse {
  productId: number;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  paymentRef: string | null;
  buyerName: string;
  buyerEmail: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOrderRequest {
  deliveryAddress: string;
  items: { productId: number; quantity: number }[];
  paymentMethod?: string;
  paymentRef?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface PaymentConfigResponse {
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
}

export interface CreateRazorpayOrderResponse {
  razorpayOrderId: string;
  keyId: string;
  currency: string;
  amountPaise: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

/* ── Farm, Crops, Expenses, Analytics ─────────────────── */
export type CropStatus =
  | "PLANNED"
  | "GROWING"
  | "READY_TO_HARVEST"
  | "HARVESTED"
  | "FAILED";

export type ExpenseCategory =
  | "SEEDS"
  | "FERTILIZERS"
  | "PESTICIDES"
  | "LABOUR"
  | "IRRIGATION"
  | "MACHINERY"
  | "TRANSPORT"
  | "VETERINARY"
  | "ELECTRICITY"
  | "OTHER";

export interface FarmRequest {
  farmName: string;
  village?: string;
  district: string;
  state: string;
  totalAreaAcres?: number;
  primaryActivity?: string;
  soilType?: string;
  hasIrrigation?: boolean;
  imageUrl?: string;
}

export interface FarmResponse extends FarmRequest {
  id: number;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropRequest {
  cropName: string;
  variety?: string;
  fieldAreaAcres?: number;
  sowingDate?: string;
  expectedHarvestDate?: string;
  status?: CropStatus;
  notes?: string;
  expectedYieldKg?: number;
}

export interface CropResponse extends CropRequest {
  id: number;
  farmerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  expenseDate: string;
}

export interface ExpenseResponse {
  id: number;
  category: ExpenseCategory;
  categoryLabel: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  createdAt: string;
}

export interface FarmerAnalyticsResponse {
  kpis: { label: string; value: string; trend: string; color: string }[];
  monthlyCashflow: { month: string; income: number; expense: number }[];
  expenseBreakdown: { name: string; value: number; color: string }[];
  yieldTrend: { cropName: string; yieldPerAcre: number }[];
}

/* ── Weather & Market ─────────────────────────────────── */
export interface WeatherResponse {
  city: string;
  state: string;
  tempCelsius: number;
  feelsLikeCelsius: number;
  condition: string;
  humidity: number;
  windSpeedKmh: number;
  rainProbability: string;
  advisory: string;
  source: string;
  forecast: {
    day: string;
    tempCelsius: number;
    tempMinCelsius: number;
    tempMaxCelsius: number;
    condition: string;
    rainProbability: number;
  }[];
  hourly: {
    time: string;
    tempCelsius: number;
    rainProbability: number;
    condition: string;
  }[];
}

export interface WeatherLocationResponse {
  city: string;
  state: string;
  label: string;
}

export interface MarketPriceResponse {
  id: number;
  commodity: string;
  mandi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: string;
  changePercent: number;
  priceDate: string;
  stale: boolean;
}

/* ── Schemes, Vets & AI ───────────────────────────────── */
export interface GovernmentSchemeResponse {
  id: number;
  code: string;
  name: string;
  category: string;
  amount: string;
  eligibility: string;
  description: string;
  deadline: string;
  portalUrl: string;
  ministry: string;
  highlight: boolean;
  status: string | null; // per-user application status
  progress: number | null; // 0–100
  currentStep: string | null;
}

export interface VetDirectoryResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

export interface AppointmentRequest {
  vetId: number;
  animalDescription?: string;
  scheduledAt: string;
  notes?: string;
}

export interface AppointmentResponse {
  id: number;
  farmerName: string;
  farmerEmail: string;
  vetName: string;
  vetEmail: string;
  animalDescription: string | null;
  scheduledAt: string;
  status: string;
  notes: string | null;
  vetNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatResponse {
  reply: string;
  message?: string;
  source: string;
  disclaimer: string;
  language?: string;
  category?: string;
  conversationId?: string;
  suggestedFollowUps?: string[];
  toolsUsed?: string[];
}

export interface AiDiseaseScanResponse {
  scanType: string;
  disease: string;
  confidence: number;
  severity: string;
  affected: string;
  possibleCauses?: string;
  treatment: string[];
  prevention: string;
  whenToConsultExpert?: string;
  source: string;
  disclaimer: string;
  nextStep?: string;
}

export interface AiCropRecommendResponse {
  season?: string;
  soil?: string;
  irrigation?: string;
  areaAcres?: number;
  recommendations: {
    crop: string;
    score: number;
    season: string;
    water: string;
    revenue: string;
    icon: string;
    reason: string;
  }[];
  source?: string;
  disclaimer: string;
}

export interface AiHealthResponse {
  ai: 'configured' | 'not_configured';
  providers: {
    gemini: boolean;
    openWeather: boolean;
    database: boolean;
    multilingual: boolean;
  };
}

/* ── Admin Management Types ───────────────────────────── */
export interface UserAdminResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  city: string | null;
  state: string | null;
  isActive: boolean;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // non-null => soft-deleted, offer Restore
}

export interface ProductAdminResponse extends ProductResponse {
  sellerName: string;
  sellerEmail: string;
}

export interface OrderAdminResponse extends OrderResponse {
  sellerName: string;
  sellerEmail: string;
  itemCount: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingVerification: number;
  usersByRole: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  recentUsers: UserAdminResponse[];
  recentOrders: OrderAdminResponse[];
  featuredProducts: ProductAdminResponse[];
}

/**
 * The ADMIN scheme shape — the raw JPA entity from GET /api/admin/schemes.
 * This is NOT the same as GovernmentSchemeResponse (the farmer DTO).
 * See 03-BACKEND-ISSUES.md §3.
 */
export interface GovernmentScheme {
  id: number;
  code: string;
  name: string;
  category: string;
  benefitAmount: string;
  eligibilitySummary: string;
  description: string | null;
  deadline: string;
  portalUrl: string | null;
  ministry: string | null;
  highlight: boolean;
  eligibilityRule: "ALL_FARMERS" | "SMALL_MARGINAL" | "CLUSTER_ONLY";
}

export interface SchemeRequest {
  code: string;
  name: string;
  category: string;
  benefitAmount: string;
  eligibilitySummary: string;
  description?: string;
  deadline: string;
  portalUrl?: string;
  ministry?: string;
  highlight: boolean;
  eligibilityRule: "ALL_FARMERS" | "SMALL_MARGINAL" | "CLUSTER_ONLY";
}

/* ── Veterinarian & Delivery Types ───────────────────── */
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface VetEarningsResponse {
  totalEarnings: number;
  thisMonthEarnings: number;
  completedVisits: number;
  monthlyBreakdown: { month: string; earnings: number }[];
  recentTransactions: {
    appointmentId: number;
    farmerName: string;
    animal: string;
    amount: number;
    completedAt: string;
  }[];
}

/** NOTE: totalAmount is a STRING here, unlike OrderResponse.totalAmount (number). */
export interface DeliveryOrderBrief {
  id: number;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  buyerName: string;
  buyerPhone: string;
  itemCount: number;
  createdAt: string;
}

export interface DeliveryEarningsResponse {
  totalEarnings: number;
  thisWeekEarnings: number;
  totalDeliveries: number;
  thisWeekDeliveries: number;
  weeklyBreakdown: { day: string; earnings: number }[];
  recentTransactions: {
    orderId: number;
    customer: string;
    amount: number;
    completedAt: string;
  }[];
}

export interface UploadResponse {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimetype: string;
  provider: "supabase" | "local";
}








