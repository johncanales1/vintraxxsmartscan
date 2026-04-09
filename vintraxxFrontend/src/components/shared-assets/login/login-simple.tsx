"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import React from "react";
import { Lock01, Mail01, Upload01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

// OAuth imports
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { PublicClientApplication } from "@azure/msal-browser";
import { loginRequest, msalConfig } from "@/config/msal-config";

// Google login button component that uses the hook inside the provider
const GoogleLoginButton = ({ onError, setLoading, onSuccess }: { 
    onError: (error: string) => void; 
    setLoading: (loading: boolean) => void;
    onSuccess: () => void;
}) => {
    const router = useRouter();
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const API_BASE = process.env.NODE_ENV === 'production' 
                    ? "https://api.vintraxx.com/api/v1" 
                    : "http://localhost:3000/api/v1";
                
                const res = await fetch(`${API_BASE}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (!res.ok) {
                    onError(data.error || "Google login failed.");
                    return;
                }
                localStorage.setItem("dealer_token", data.token);
                localStorage.setItem("dealer_user", JSON.stringify(data.user));
                onSuccess();
            } catch {
                onError("Network error during Google login.");
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            onError("Google login failed. Please try again.");
            setLoading(false);
        },
        flow: 'implicit',
        scope: 'email profile'
    });

    return (
        <button
            type="button"
            onClick={() => googleLogin()}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
        </button>
    );
};

const API_BASE = process.env.NODE_ENV === 'production' 
  ? "https://api.vintraxx.com/api/v1" 
  : "http://localhost:3000/api/v1";

type Mode = "login" | "register" | "forgot" | "reset";
type RegisterStep = 1 | 2 | 3;

export const LoginSimple = ({ resetToken }: { resetToken: string | null }) => {
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("login");
    const [registerStep, setRegisterStep] = useState<RegisterStep>(1);

    // Set mode to reset if token is present
    useEffect(() => {
        if (resetToken) {
            setMode("reset");
        }
    }, [resetToken]);

    // Login fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Register fields
    const [regEmail, setRegEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
    const [fullName, setFullName] = useState("");
    const [pricePerLaborHour, setPricePerLaborHour] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [qrCodePreview, setQrCodePreview] = useState<string>("");

    // Reset password fields
    const [resetPassword, setResetPassword] = useState("");
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

    // UI state
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // OAuth state
    const [googleLoading, setGoogleLoading] = useState(false);
    const [microsoftLoading, setMicrosoftLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeInputRef = useRef<HTMLInputElement>(null);

    // Microsoft OAuth
    const handleMicrosoftLogin = async () => {
        setMicrosoftLoading(true);
        try {
            const msalInstance = new PublicClientApplication(msalConfig);
            const response = await msalInstance.loginPopup(loginRequest);
            
            const res = await fetch(`${API_BASE}/auth/microsoft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: response.accessToken }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Microsoft login failed.");
                return;
            }
            localStorage.setItem("dealer_token", data.token);
            localStorage.setItem("dealer_user", JSON.stringify(data.user));
            router.push("/VinTraxxSmartScanDashboard");
        } catch {
            setError("Microsoft login failed. Please try again.");
        } finally {
            setMicrosoftLoading(false);
        }
    };

    // --- LOGIN ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password before signing in.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/dealer/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login failed. Please check your credentials.");
                return;
            }
            localStorage.setItem("dealer_token", data.token);
            localStorage.setItem("dealer_user", JSON.stringify(data.user));
            router.push("/VinTraxxSmartScanDashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- FORGOT PASSWORD ---
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to send reset link.");
                return;
            }
            setSuccessMsg("If an account exists with that email, a reset link has been sent.");
            setEmail("");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- RESET PASSWORD ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!resetPassword.trim()) {
            setError("Please enter a new password.");
            return;
        }
        if (resetPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (resetPassword !== resetPasswordConfirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, password: resetPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to reset password.");
                return;
            }
            setSuccessMsg("Password has been reset successfully. You can now sign in.");
            setTimeout(() => {
                setMode("login");
                setSuccessMsg("");
            }, 2000);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTER STEP 1: Send OTP ---
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!regEmail.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: regEmail.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to send verification code.");
                return;
            }
            setSuccessMsg(`Verification code sent to ${regEmail}.`);
            setRegisterStep(2);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTER STEP 2: Verify OTP ---
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!otp.trim()) {
            setError("Please enter the verification code.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: regEmail.trim(), otp: otp.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid or expired verification code.");
                return;
            }
            setSuccessMsg("");
            setRegisterStep(3);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTER STEP 3: Create account ---
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }
        if (!regPassword.trim()) {
            setError("Please enter a password.");
            return;
        }
        if (regPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (regPassword !== regPasswordConfirm) {
            setError("Passwords do not match.");
            return;
        }
        const price = parseFloat(pricePerLaborHour);
        if (!pricePerLaborHour.trim() || isNaN(price) || price <= 0) {
            setError("Please enter a valid price per labor hour (e.g. 150).");
            return;
        }

        setLoading(true);
        try {
            let logoUrl = "";
            if (logoFile) {
                // Convert file to base64 for now (in production, upload to S3/cloud storage)
                logoUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(logoFile);
                });
            }

            let qrCodeUrl = "";
            if (qrCodeFile) {
                // Convert QR code file to base64
                qrCodeUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(qrCodeFile);
                });
            }

            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: regEmail.trim(),
                    password: regPassword,
                    fullName: fullName.trim(),
                    isDealer: true,
                    pricePerLaborHour: price,
                    logoUrl: logoUrl || undefined,
                    qrCodeUrl: qrCodeUrl || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Registration failed. Please try again.");
                return;
            }
            localStorage.setItem("dealer_token", data.token);
            localStorage.setItem("dealer_user", JSON.stringify(data.user));
            router.push("/VinTraxxSmartScanDashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- FILE HANDLING ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Please select an image file.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError("Logo file must be less than 5MB.");
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleQrCodeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Please select an image file for QR code.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError("QR code file must be less than 5MB.");
                return;
            }

            // Validate that the image contains a real QR code
            try {
                const isValidQr = await validateQrCodeImage(file);
                if (!isValidQr) {
                    setError("The selected image does not contain a valid QR code. Please upload an image with a readable QR code.");
                    // Clear the file input
                    if (qrCodeInputRef.current) {
                        qrCodeInputRef.current.value = '';
                    }
                    return;
                }
            } catch (err) {
                setError("Failed to validate QR code image. Please try again.");
                return;
            }

            setQrCodeFile(file);
            const reader = new FileReader();
            reader.onload = () => setQrCodePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Validate that an image file contains a real QR code
    const validateQrCodeImage = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.onload = () => {
                    // Create a canvas to extract image data
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(false);
                        return;
                    }
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Use jsQR to detect QR code
                    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    // QR code is valid if jsQR found it and returned data
                    resolve(qrCode !== null && qrCode.data.length > 0);
                };
                
                img.onerror = () => resolve(false);
                img.src = e.target?.result as string;
            };
            
            reader.onerror = () => resolve(false);
            reader.readAsDataURL(file);
        });
    };

    const switchToRegister = () => {
        setMode("register");
        setError("");
        setSuccessMsg("");
        setRegisterStep(1);
    };

    const switchToLogin = () => {
        setMode("login");
        setError("");
        setSuccessMsg("");
    };

    const switchToForgot = () => {
        setMode("forgot");
        setError("");
        setSuccessMsg("");
    };

    const resendOtp = () => {
        setError("");
        setSuccessMsg("");
        setOtp("");
        setRegisterStep(1);
    };

    return (
        <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12">
                <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl bg-white shadow-lg overflow-hidden">
                    {/* Left illustration/info panel (desktop only) */}
                    <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-100 to-blue-300 p-8">
                        <UntitledLogoMinimal className="size-32 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                            {mode === "login" ? "Dealer Portal" : 
                             mode === "forgot" ? "Reset Password" :
                             mode === "reset" ? "Reset Password" :
                             "New Dealer"}
                        </h2>
                        <p className="text-base text-gray-600 text-center max-w-xs">
                            {mode === "login"
                                ? "Sign in to access your VinTraxx dealer account and manage your smart scanning solutions."
                                : mode === "forgot" || mode === "reset"
                                ? "Reset your password to regain access to your dealer account."
                                : "Create your dealer account to get started with VinTraxx smart scanning."}
                        </p>
                    </div>

                    {/* Right login/register form panel */}
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                            <Link href="/">
                                <UntitledLogoMinimal className="size-10 sm:size-14 md:size-16 lg:size-20 xl:size-24" />
                            </Link>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black leading-tight">
                                    {mode === "login" ? "Welcome to VinTraxx.com" : 
                                     mode === "forgot" ? "Forgot Password" :
                                     mode === "reset" ? "Reset Password" :
                                     "Dealer Registration"}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {mode === "login"
                                        ? "Sign in with your dealer credentials"
                                        : mode === "forgot"
                                        ? "Enter your email to receive a reset link"
                                        : mode === "reset"
                                        ? "Enter your new password"
                                        : registerStep === 1
                                        ? "Step 1 of 3 — Verify your email"
                                        : registerStep === 2
                                        ? "Step 2 of 3 — Enter verification code"
                                        : "Step 3 of 3 — Set password & labor rate"}
                                </p>
                            </div>
                        </div>

                        {/* Error banner */}
                        {error && (
                            <div className="mt-3 w-full rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs sm:text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Success banner */}
                        {successMsg && (
                            <div className="mt-3 w-full rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs sm:text-sm text-green-700">
                                {successMsg}
                            </div>
                        )}

                        {/* ---- LOGIN FORM ---- */}
                        {mode === "login" && (
                            <div className="mt-4 flex flex-col gap-3 w-full">
                                {/* OAuth buttons */}
                                <div className="flex flex-col gap-2">
                                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                                        <GoogleLoginButton 
                                            onError={setError}
                                            setLoading={setGoogleLoading}
                                            onSuccess={() => router.push("/VinTraxxSmartScanDashboard")}
                                        />
                                    </GoogleOAuthProvider>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">OR</span>
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="flex flex-col gap-3" noValidate>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Email</span>
                                        <Input
                                            hideRequiredIndicator
                                            label=""
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            size="sm"
                                            icon={Mail01}
                                            className="w-full"
                                            inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                            value={email}
                                            onChange={(val: string) => setEmail(val)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Password</span>
                                        <Input
                                            hideRequiredIndicator
                                            label=""
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            size="sm"
                                            icon={Lock01}
                                            className="w-full"
                                            inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                            value={password}
                                            onChange={(val: string) => setPassword(val)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Signing in…" : "Sign in"}
                                    </button>

                                    {/* Forgot password and sign up links */}
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <button
                                            type="button"
                                            onClick={switchToForgot}
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Forgot password?
                                        </button>
                                        <button
                                            type="button"
                                            onClick={switchToRegister}
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Register here
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ---- FORGOT PASSWORD FORM ---- */}
                        {mode === "forgot" && (
                            <form onSubmit={handleForgotPassword} className="mt-4 flex flex-col gap-3 w-full" noValidate>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">Email</span>
                                    <Input
                                        hideRequiredIndicator
                                        label=""
                                        type="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        size="sm"
                                        icon={Mail01}
                                        className="w-full"
                                        inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                        value={email}
                                        onChange={(val: string) => setEmail(val)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Sending…" : "Send Reset Link"}
                                </button>
                                <div className="flex items-center justify-center text-xs sm:text-sm">
                                    <button
                                        type="button"
                                        onClick={switchToLogin}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Back to Sign in
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ---- RESET PASSWORD FORM ---- */}
                        {mode === "reset" && (
                            <form onSubmit={handleResetPassword} className="mt-4 flex flex-col gap-3 w-full" noValidate>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">New Password</span>
                                    <Input
                                        hideRequiredIndicator
                                        label=""
                                        type="password"
                                        name="password"
                                        placeholder="Minimum 8 characters"
                                        size="sm"
                                        icon={Lock01}
                                        className="w-full"
                                        inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                        value={resetPassword}
                                        onChange={(val: string) => setResetPassword(val)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">Confirm New Password</span>
                                    <Input
                                        hideRequiredIndicator
                                        label=""
                                        type="password"
                                        name="passwordConfirm"
                                        placeholder="Re-enter your password"
                                        size="sm"
                                        icon={Lock01}
                                        className="w-full"
                                        inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                        value={resetPasswordConfirm}
                                        onChange={(val: string) => setResetPasswordConfirm(val)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Resetting…" : "Reset Password"}
                                </button>
                                <div className="flex items-center justify-center text-xs sm:text-sm">
                                    <button
                                        type="button"
                                        onClick={switchToLogin}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Back to Sign in
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ---- REGISTER FORM ---- */}
                        {mode === "register" && (
                            <div className="mt-4 flex flex-col gap-3 w-full">
                                {/* Step 1: Email + send OTP */}
                                {registerStep === 1 && (
                                    <form onSubmit={handleSendOtp} className="flex flex-col gap-3" noValidate>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Email</span>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="email"
                                                name="email"
                                                placeholder="you@example.com"
                                                size="sm"
                                                icon={Mail01}
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                                value={regEmail}
                                                onChange={(val: string) => setRegEmail(val)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {loading ? "Sending…" : "Send Verification Code"}
                                        </button>
                                    </form>
                                )}

                                {/* Step 2: Verify OTP */}
                                {registerStep === 2 && (
                                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3" noValidate>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Verification Code</span>
                                            <p className="text-xs text-gray-500">Enter the 6-digit code sent to <strong>{regEmail}</strong></p>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="text"
                                                name="otp"
                                                placeholder="000000"
                                                size="sm"
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base tracking-widest text-center"
                                                value={otp}
                                                onChange={(val: string) => setOtp(val)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {loading ? "Verifying…" : "Verify Code"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resendOtp}
                                            className="text-xs text-gray-500 hover:text-gray-700 underline self-center"
                                        >
                                            Didn't receive it? Resend code
                                        </button>
                                    </form>
                                )}

                                {/* Step 3: Password + password confirm + price per labor hour + logo */}
                                {registerStep === 3 && (
                                    <form onSubmit={handleRegister} className="flex flex-col gap-3" noValidate>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Full Name</span>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="text"
                                                name="fullName"
                                                placeholder="Enter your full name"
                                                size="sm"
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                                value={fullName}
                                                onChange={(val: string) => setFullName(val)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Password</span>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="password"
                                                name="password"
                                                placeholder="Minimum 8 characters"
                                                size="sm"
                                                icon={Lock01}
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                                value={regPassword}
                                                onChange={(val: string) => setRegPassword(val)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Confirm Password</span>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="password"
                                                name="passwordConfirm"
                                                placeholder="Re-enter your password"
                                                size="sm"
                                                icon={Lock01}
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                                value={regPasswordConfirm}
                                                onChange={(val: string) => setRegPasswordConfirm(val)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Price Per Labor Hour ($)</span>
                                            <Input
                                                hideRequiredIndicator
                                                label=""
                                                type="text"
                                                name="pricePerLaborHour"
                                                placeholder="e.g. 150"
                                                size="sm"
                                                className="w-full"
                                                inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                                                value={pricePerLaborHour}
                                                onChange={(val: string) => setPricePerLaborHour(val)}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">Dealer Logo (Optional)</span>
                                            <div className="flex items-center gap-3">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <Upload01 className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileSelect}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        {logoFile ? "Change logo" : "Upload logo"}
                                                    </button>
                                                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">QR Code Image (Optional)</span>
                                            <div className="flex items-center gap-3">
                                                {qrCodePreview ? (
                                                    <img src={qrCodePreview} alt="QR Code preview" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <Upload01 className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <input
                                                        ref={qrCodeInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleQrCodeSelect}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => qrCodeInputRef.current?.click()}
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        {qrCodeFile ? "Change QR code" : "Upload QR code"}
                                                    </button>
                                                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {loading ? "Creating account…" : "Create Dealer Account"}
                                        </button>
                                    </form>
                                )}

                                {/* Mode toggle - only show for register mode */}
                                <div className="mt-4 flex items-center justify-center gap-1 text-xs sm:text-sm">
                                    <span className="text-gray-500">Already registered?</span>
                                    <button
                                        type="button"
                                        onClick={switchToLogin}
                                        className="font-medium text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Sign in
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
    );
};