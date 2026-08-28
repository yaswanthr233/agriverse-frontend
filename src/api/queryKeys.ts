import type { ProductQuery } from "./endpoints/products";

export const qk = {
  me: () => ["auth", "me"] as const,

  products: (q: ProductQuery) => ["products", q] as const,
  product: (id: number) => ["product", id] as const,
  myProducts: () => ["products", "mine"] as const,

  livestockMarket: (page: number) => ["livestock", "market", page] as const,
  livestockItem: (id: number) => ["livestock", id] as const,
  myLivestock: () => ["livestock", "mine"] as const,

  myOrders: () => ["orders", "my"] as const,
  order: (id: number) => ["order", id] as const,
  sellerOrders: () => ["orders", "seller"] as const,

  myFarm: () => ["farm", "my"] as const,
  myCrops: () => ["crops", "my"] as const,
  myExpenses: (month?: number, year?: number) =>
    ["expenses", "my", month, year] as const,
  farmerAnalytics: () => ["analytics", "farmer"] as const,

  weather: (city?: string, state?: string) =>
    ["weather", city, state] as const,
  weatherLocations: () => ["weather", "locations"] as const,
  marketPrices: () => ["market-prices"] as const,

  schemes: () => ["schemes"] as const,
  vets: () => ["vets"] as const,
  myAppointments: () => ["appointments", "my"] as const,

  paymentConfig: () => ["payments", "config"] as const,

  adminDashboard: () => ["admin", "dashboard"] as const,
  adminUsers: (q: unknown) => ["admin", "users", q] as const,
  adminUser: (id: number) => ["admin", "user", id] as const,
  adminSellers: () => ["admin", "sellers"] as const,
  adminProducts: (q: unknown) => ["admin", "products", q] as const,
  adminOrders: (q: unknown) => ["admin", "orders", q] as const,
  adminOrder: (id: number) => ["admin", "order", id] as const,
  adminSchemes: () => ["admin", "schemes"] as const,

  vetSchedule: () => ["vet", "schedule"] as const,
  vetEarnings: () => ["vet", "earnings"] as const,

  deliveryAvailable: () => ["delivery", "available"] as const,
  deliveryPipeline: () => ["delivery", "pipeline"] as const,
  deliveryEarnings: () => ["delivery", "earnings"] as const,
};


