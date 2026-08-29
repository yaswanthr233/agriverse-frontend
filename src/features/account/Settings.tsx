import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Globe,
  Bell,
  Lock,
  Check,
  Shield,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { settingsApi, type UserPreferencesResponse } from "@/api/endpoints/settings";
import { userApi, type ChangePasswordRequest } from "@/api/endpoints/user";
import { qk } from "@/api/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { formatEnum } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import type { SupportedLanguage } from "@/i18n/translations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  native: string;
  greeting: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", greeting: "Hello / Welcome" },
  { code: "te", name: "Telugu", native: "తెలుగు", greeting: "నమస్కారం / స్వాగతం" },
  { code: "hi", name: "Hindi", native: "हिन्दी", greeting: "नमस्ते / स्वागत है" },
];

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function Settings() {
  const { t, language, setLanguage } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security">("general");

  // Load preferences from Supabase PostgreSQL
  const { data: prefs, isLoading: isPrefsLoading } = useQuery({
    queryKey: qk.userSettings(),
    queryFn: settingsApi.get,
  });

  // Mutation to persist preferences to Supabase PostgreSQL
  const updatePrefsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: qk.userSettings() });
      void queryClient.invalidateQueries({ queryKey: qk.notifications() });
      void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
    },
    onError: () => {
      toast.error(t("action.retry", "Couldn't save settings. Please try again."));
    },
  });

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    updatePrefsMutation.mutate({ language: lang });
    const langName = LANGUAGES.find((l) => l.code === lang)?.native || lang;
    toast.success(`Language set to ${langName}.`);
  };

  const handleNotificationToggle = (
    key: keyof Omit<UserPreferencesResponse, "language" | "updatedAt">
  ) => {
    if (!prefs) return;
    const nextValue = !prefs[key];
    updatePrefsMutation.mutate(
      { [key]: nextValue },
      {
        onSuccess: () => {
          toast.success(t("notifications.markedAllSuccess", "Settings updated successfully."));
        },
      }
    );
  };

  // Password change form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => {
      const payload: ChangePasswordRequest = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      return userApi.changePassword(payload);
    },
    onSuccess: () => {
      toast.success(t("settings.sessionEncrypted", "Password updated successfully."));
      reset();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Couldn't update password. Please verify current password.";
      toast.error(msg);
    },
  });

  if (isPrefsLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const currentPrefs: UserPreferencesResponse = prefs || {
    language: language,
    notificationsEnabled: true,
    orderNotifications: true,
    marketNotifications: true,
    weatherNotifications: true,
    aiNotifications: true,
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t("settings.title", "Settings")}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {t("settings.subtitle", "Manage your account preferences, language, alerts, and security options.")}
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex rounded-lg border border-border bg-surface-sunk p-1 w-full sm:w-fit gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-all",
            activeTab === "general"
              ? "bg-surface text-primary-700 shadow-sm border border-border"
              : "text-ink-600 hover:text-ink-900"
          )}
        >
          <Globe className="size-4" aria-hidden="true" />
          {t("settings.tab.general", "Language & Display")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-all",
            activeTab === "notifications"
              ? "bg-surface text-primary-700 shadow-sm border border-border"
              : "text-ink-600 hover:text-ink-900"
          )}
        >
          <Bell className="size-4" aria-hidden="true" />
          {t("settings.tab.notifications", "Notifications")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-all",
            activeTab === "security"
              ? "bg-surface text-primary-700 shadow-sm border border-border"
              : "text-ink-600 hover:text-ink-900"
          )}
        >
          <Lock className="size-4" aria-hidden="true" />
          {t("settings.tab.security", "Security")}
        </button>
      </div>

      {/* TAB 1: LANGUAGE & DISPLAY */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="border-b border-border pb-4 mb-6">
              <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                <Globe className="size-4 text-primary-600" />
                {t("settings.langTitle", "Language Preferences")}
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                {t(
                  "settings.langDesc",
                  "Choose your preferred interface and AI Assistant language. Changes persist across sessions and page refreshes."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={cn(
                      "relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary-600 bg-primary-50/40 shadow-sm"
                        : "border-border hover:border-primary-300 hover:bg-surface-sunk/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-lg font-bold text-ink-900">
                          {lang.native}
                        </span>
                        <p className="text-xs text-ink-500 font-medium">{lang.name}</p>
                      </div>
                      {isSelected ? (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary-600 text-white">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full border border-border" />
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-ink-400">
                      Sample: <span className="text-ink-600 font-medium">{lang.greeting}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2.5 rounded-lg bg-accent-50/60 p-3 text-xs text-ink-700">
              <Sparkles className="size-4 text-accent-600 shrink-0" />
              <span>
                The <strong>Floating AI Assistant</strong> automatically updates its responses to match your selected language (
                <strong>{LANGUAGES.find((l) => l.code === language)?.native}</strong>).
              </span>
            </div>
          </Card>

          {/* Account Identity Summary */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-2">
              {t("settings.accountStatus", "Account Status")}
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-ink-600">
              <div>
                <span className="text-ink-400">Logged in as:</span>{" "}
                <span className="font-mono font-medium text-ink-900">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink-400">Role:</span>
                <Badge tone="neutral">{user?.role ? formatEnum(user.role) : "User"}</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <Card className="p-6">
          <div className="border-b border-border pb-4 mb-6">
            <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
              <Bell className="size-4 text-primary-600" />
              {t("settings.notifTitle", "Notification & Advisory Alerts")}
            </h2>
            <p className="text-xs text-ink-500 mt-1">
              {t(
                "settings.notifDesc",
                "Configure real-time alerts dispatched to your in-app notification center and linked contact methods."
              )}
            </p>
          </div>

          <div className="space-y-4">
            {/* Master Switch */}
            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-primary-200 bg-primary-50/30 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-ink-900">
                  {t("settings.masterNotif", "Receive AgriVerse Notifications")}
                </span>
                <p className="text-xs text-ink-500">
                  {t(
                    "settings.masterNotifDesc",
                    "Master switch to enable or disable all notification channels."
                  )}
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentPrefs.notificationsEnabled}
                onChange={() => handleNotificationToggle("notificationsEnabled")}
                className="size-5 rounded border-border text-primary-600 focus:ring-primary-500"
              />
            </label>

            {/* Category switches */}
            <div className={cn("space-y-3", !currentPrefs.notificationsEnabled && "opacity-50 pointer-events-none")}>
              <label className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-surface-sunk/30 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-ink-900">
                    {t("settings.orderNotif", "Order & Delivery Notifications")}
                  </span>
                  <p className="text-xs text-ink-500">
                    {t(
                      "settings.orderNotifDesc",
                      "Receive live updates when order status changes (Confirmed, Packed, Out for Delivery, Delivered)."
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPrefs.orderNotifications}
                  onChange={() => handleNotificationToggle("orderNotifications")}
                  className="size-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-surface-sunk/30 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-ink-900">
                    {t("settings.marketNotif", "Mandi Market Price Alerts")}
                  </span>
                  <p className="text-xs text-ink-500">
                    {t(
                      "settings.marketNotifDesc",
                      "Daily APMC commodity price movements and MSP trend alerts for your local mandis."
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPrefs.marketNotifications}
                  onChange={() => handleNotificationToggle("marketNotifications")}
                  className="size-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-surface-sunk/30 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-ink-900">
                    {t("settings.weatherNotif", "Weather Forecasts & Rain Warnings")}
                  </span>
                  <p className="text-xs text-ink-500">
                    {t(
                      "settings.weatherNotifDesc",
                      "Real-time precipitation warnings, temperature spikes, and optimal irrigation windows."
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPrefs.weatherNotifications}
                  onChange={() => handleNotificationToggle("weatherNotifications")}
                  className="size-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-surface-sunk/30 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-ink-900">
                    {t("settings.aiNotif", "AI Farming & Crop Diagnostics")}
                  </span>
                  <p className="text-xs text-ink-500">
                    {t(
                      "settings.aiNotifDesc",
                      "Automated seasonal crop recommendations and plant disease scan results."
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPrefs.aiNotifications}
                  onChange={() => handleNotificationToggle("aiNotifications")}
                  className="size-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="border-b border-border pb-4 mb-6">
              <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                <Lock className="size-4 text-primary-600" />
                {t("settings.changePassword", "Change Password")}
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                {t(
                  "settings.changePasswordDesc",
                  "Enter your existing password and choose a secure new password (min. 6 characters)."
                )}
              </p>
            </div>

            <form
              onSubmit={handleSubmit((data) => passwordMutation.mutate(data))}
              className="max-w-md space-y-4"
              noValidate
            >
              <Input
                label={t("settings.currentPassword", "Current Password") + " *"}
                type="password"
                placeholder="••••••••"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />

              <Input
                label={t("settings.newPassword", "New Password") + " *"}
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />

              <Input
                label={t("settings.confirmPassword", "Confirm New Password") + " *"}
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  loading={passwordMutation.isPending}
                >
                  {t("settings.updatePasswordBtn", "Update Password")}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
              <Shield className="size-4 text-primary-600" />
              {t("settings.sessionProtection", "Session Protection")}
            </h3>
            <p className="text-xs text-ink-500 mb-4">
              Your account is guarded with SHA-256 rotating refresh tokens and JWT authentication.
            </p>
            <div className="flex items-center gap-2 text-xs text-success-700 font-medium">
              <CheckCircle2 className="size-4" />
              <span>{t("settings.sessionEncrypted", "Current session is encrypted and authenticated.")}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
