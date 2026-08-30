import {
  LayoutDashboard,
  Sprout,
  Wheat,
  Beef,
  Receipt,
  TrendingUp,
  ShoppingBag,
  Package,
  CloudSun,
  IndianRupee,
  Landmark,
  Stethoscope,
  Bot,
  Users,
  Store,
  ClipboardList,
  Boxes,
  Truck,
  History,
  Wallet,
  ShieldCheck,
  Award,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/api/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  FARMER: [
    { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
    { label: "My Farm", to: "/app/farm", icon: Sprout },
    { label: "Crops", to: "/app/crops", icon: Wheat },
    { label: "Livestock", to: "/app/livestock", icon: Beef },
    { label: "Expenses", to: "/app/expenses", icon: Receipt },
    { label: "Analytics", to: "/app/analytics", icon: TrendingUp },
    { label: "Marketplace", to: "/marketplace", icon: ShoppingBag },
    { label: "My Orders", to: "/app/orders", icon: Package },
    { label: "Weather", to: "/weather", icon: CloudSun },
    { label: "Market Prices", to: "/market-prices", icon: IndianRupee },
    { label: "Schemes", to: "/app/schemes", icon: Landmark },
    { label: "Book a Vet", to: "/app/vets", icon: Stethoscope },
    { label: "AI Assistant", to: "/app/ai", icon: Bot },
  ],
  SELLER: [
    { label: "Dashboard", to: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Products", to: "/seller/products", icon: Package },
    { label: "Add Product", to: "/seller/products/new", icon: Store },
    { label: "Orders", to: "/seller/orders", icon: ClipboardList },
    { label: "Inventory", to: "/seller/inventory", icon: Boxes },
    { label: "Revenue", to: "/seller/revenue", icon: IndianRupee },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Vet Verification", to: "/admin/veterinarians", icon: ShieldCheck },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Sellers", to: "/admin/sellers", icon: Store },
    { label: "Products", to: "/admin/products", icon: Package },
    { label: "Orders", to: "/admin/orders", icon: ClipboardList },
    { label: "Schemes", to: "/admin/schemes", icon: Landmark },
    { label: "Analytics", to: "/admin/analytics", icon: TrendingUp },
  ],
  VETERINARIAN: [
    { label: "Dashboard", to: "/vet/dashboard", icon: LayoutDashboard },
    { label: "Appointments", to: "/vet/appointments", icon: ClipboardList },
    { label: "Patients", to: "/vet/patients", icon: Beef },
    { label: "Earnings", to: "/vet/earnings", icon: Wallet },
    { label: "Verification Status", to: "/vet/verification-status", icon: Award },
  ],
  DELIVERY_PARTNER: [
    { label: "Dashboard", to: "/delivery/dashboard", icon: LayoutDashboard },
    { label: "Available Orders", to: "/delivery/available", icon: Package },
    { label: "Active", to: "/delivery/active", icon: Truck },
    { label: "History", to: "/delivery/history", icon: History },
    { label: "Earnings", to: "/delivery/earnings", icon: Wallet },
  ],
};
