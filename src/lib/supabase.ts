import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://qptdtnchhhfuohlqtpsr.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_-Bhk9heSHorBSyHTuXoe-Q_mZU4JSku";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  DEFAULT_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  session?: unknown;
  user?: unknown;
}

/** Translates Supabase auth errors into user-friendly messages */
export function formatSupabaseAuthError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";
  const msg = typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
  const status = typeof err === "object" && "status" in err ? Number((err as { status: unknown }).status) : 0;

  if (msg.toLowerCase().includes("invalid api key") || msg.toLowerCase().includes("invalid api_key")) {
    return "Authentication service configuration error: Invalid API key. Please check your Supabase publishable key.";
  }
  if (msg.toLowerCase().includes("sending confirmation email") || msg.toLowerCase().includes("error sending email")) {
    return "Failed to send verification email. Please check your SMTP settings in Supabase Dashboard (requires Google App Password).";
  }
  if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
    return "Too many verification attempts. Please wait and try again.";
  }
  if (msg.toLowerCase().includes("invalid email") || msg.toLowerCase().includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("token has expired")) {
    return "This verification code has expired. Please request a new code.";
  }
  if (
    msg.toLowerCase().includes("invalid token") ||
    msg.toLowerCase().includes("token is invalid") ||
    msg.toLowerCase().includes("otp") ||
    msg.toLowerCase().includes("token")
  ) {
    return "Invalid verification code. Please check the code and try again.";
  }
  if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
    return "Unable to connect to the server. Please try again.";
  }

  return msg || "Something went wrong. Please try again.";
}

/** Requests a 6-digit email OTP from Supabase Auth */
export async function sendEmailOtp(email: string): Promise<SupabaseAuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        success: false,
        error: formatSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      message: "Verification code sent to your email.",
    };
  } catch (err) {
    return {
      success: false,
      error: formatSupabaseAuthError(err),
    };
  }
}

/** Verifies a 6-digit email OTP with Supabase Auth */
export async function verifyEmailOtp(email: string, token: string): Promise<SupabaseAuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      return {
        success: false,
        error: formatSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      message: "Email verified successfully.",
      session: data.session,
      user: data.user,
    };
  } catch (err) {
    return {
      success: false,
      error: formatSupabaseAuthError(err),
    };
  }
}
