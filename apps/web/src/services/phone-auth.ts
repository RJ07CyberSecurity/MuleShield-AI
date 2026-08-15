import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { createRecaptchaVerifier, sendOtpToPhone } from "./firebase";
import { apiClient } from "./api-client";

export type PhoneOtpSession =
  | { provider: "firebase"; confirmation: ConfirmationResult }
  | { provider: "backend"; phoneNumber: string; sessionId: string; devCode?: string };

function isFirebasePhoneAuthDisabled(error: unknown): boolean {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: string }).code === "string"
      ? (error as { code: string }).code
      : "";

  return (
    code === "auth/operation-not-allowed" ||
    code === "auth/invalid-app-credential" ||
    code === "auth/billing-not-enabled"
  );
}

async function sendOtpViaBackend(phoneNumber: string): Promise<PhoneOtpSession> {
  const response = await apiClient.post<any>("/api/v1/auth/phone/send-otp", {
    phone_number: phoneNumber,
  });

  if (!response?.success) {
    throw new Error(response?.message || "Failed to trigger phone OTP.");
  }

  return {
    provider: "backend",
    phoneNumber,
    sessionId: response.data.session_id,
    devCode: response.data.dev_code,
  };
}

export async function sendPhoneOtp(phoneNumber: string): Promise<PhoneOtpSession> {
  const normalized = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

  try {
    const verifier = createRecaptchaVerifier("recaptcha-container");
    const confirmation = await sendOtpToPhone(normalized, verifier);
    return { provider: "firebase", confirmation };
  } catch (error) {
    if (!isFirebasePhoneAuthDisabled(error)) {
      throw error;
    }

    console.warn("Firebase Phone Auth unavailable — using backend OTP fallback.");
    return sendOtpViaBackend(normalized);
  }
}

export async function verifyPhoneOtp(
  session: PhoneOtpSession,
  code: string
): Promise<{ access_token: string; refresh_token: string }> {
  if (session.provider === "firebase") {
    const userCredential = await session.confirmation.confirm(code.trim());
    const idToken = await userCredential.user.getIdToken();
    const response = await apiClient.post<any>("/api/v1/auth/firebase-login", {
      id_token: idToken,
    });

    if (!response?.success || !response?.data?.access_token) {
      throw new Error(response?.message || "Firebase session registration failed.");
    }

    return response.data;
  }

  const response = await apiClient.post<any>("/api/v1/auth/phone/verify-otp", {
    phone_number: session.phoneNumber,
    session_id: session.sessionId,
    code: code.trim(),
  });

  if (!response?.success || !response?.data?.access_token) {
    throw new Error(response?.message || "Invalid or expired verification code.");
  }

  return response.data;
}

export function clearRecaptchaVerifier(): void {
  if (typeof window === "undefined") return;
  const verifier = (window as Window & { recaptchaVerifier?: RecaptchaVerifier })
    .recaptchaVerifier;
  if (verifier) {
    verifier.clear();
    delete (window as Window & { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
  }
}
