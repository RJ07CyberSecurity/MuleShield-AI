import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "muleshield-ai-fe604.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "muleshield-ai-fe604",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "muleshield-ai-fe604.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "967045850546",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:967045850546:web:aec30f0d84fcd9df27f0ab"
};

// Initialize Firebase App (Server-Side Safe Check)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable English language for Phone OTP verification widgets
auth.useDeviceLanguage();

// Google SSO Authentication helper
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.error("Google login failed", error);
    throw error;
  }
}

// GitHub SSO Authentication helper (retained for backward compatibility)
export async function signInWithGithub() {
  const provider = new GithubAuthProvider();
  provider.addScope("user:email");

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.error("GitHub login failed", error);
    throw error;
  }
}

// Phone Authentication OTP dispatch helpers
export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved, direct verification follows
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Reset required.");
    }
  });
}

export async function sendOtpToPhone(
  phoneNumber: string, 
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    console.error("Phone OTP dispatch failed", error);
    throw error;
  }
}
