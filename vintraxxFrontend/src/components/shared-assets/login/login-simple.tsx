"use client";

import { useState } from "react";
import { Lock01, Mail01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NODE_ENV === 'production' 
  ? "https://api.vintraxx.com/api/v1" 
  : "http://localhost:3000/api/v1";

type Mode = "login" | "register";
type RegisterStep = 1 | 2 | 3;

export const LoginSimple = () => {
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("login");
    const [registerStep, setRegisterStep] = useState<RegisterStep>(1);

    // Login fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Register fields
    const [regEmail, setRegEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
    const [pricePerLaborHour, setPricePerLaborHour] = useState("");


    // UI state
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

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
            router.push("/dealer");
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
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: regEmail.trim(),
                    password: regPassword,
                    isDealer: true,
                    pricePerLaborHour: price,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Registration failed. Please try again.");
                return;
            }
            localStorage.setItem("dealer_token", data.token);
            localStorage.setItem("dealer_user", JSON.stringify(data.user));
            router.push("/dealer");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
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
                        {mode === "login" ? "Dealer Portal" : "New Dealer"}
                    </h2>
                    <p className="text-base text-gray-600 text-center max-w-xs">
                        {mode === "login"
                            ? "Sing in to access your VinTraxx dealer account and manage your smart scanning solutions."
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
                                {mode === "login" ? "Welcome to VinTraxx.com" : "Dealer Registration"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {mode === "login"
                                    ? "Sign in with your dealer credentials"
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
                        <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3 w-full" noValidate>
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

                            {/* Sign Up Link */}
                            <div className="flex items-center justify-center text-xs sm:text-sm">
                                <span className="text-gray-500">New dealer?</span>
                                <button
                                    type="button"
                                    onClick={switchToRegister}
                                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                                >
                                    Register here
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

                            {/* Step 3: Password + password confirm + price per labor hour */}
                            {registerStep === 3 && (
                                <form onSubmit={handleRegister} className="flex flex-col gap-3" noValidate>
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

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Creating account…" : "Create Dealer Account"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Mode toggle - only show for register mode */}
                    {mode === "register" && (
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
                    )}
                </div>
            </div>
        </section>
    );
};
