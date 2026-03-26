"use client";

import { Lock01, Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const LoginSimple = () => {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.checkValidity()) return;

        // Validation passed — redirect to dashboard
        router.push("/app");
    };

    return (
        <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12">
            <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl bg-white shadow-lg overflow-hidden">
                {/* Left illustration/info panel (desktop only) */}
                <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-100 to-blue-300 p-8">
                    <UntitledLogoMinimal className="size-32 mb-6" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
                    <p className="text-base text-gray-600 text-center max-w-xs">Sign in to access your VinTraxx account and manage your smart scanning solutions.</p>
                </div>
                {/* Right login form panel */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 md:gap-6 text-center">
                    <Link href="/">
                        <UntitledLogoMinimal className="size-10 sm:size-14 md:size-16 lg:size-20 xl:size-24" />
                    </Link>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black leading-tight">Welcome to VinTraxx.com</h1>
                        <p className="text-xs sm:text-sm text-gray-500">Sign in to continue</p>
                    </div>
                </div>

                <div className="mt-2 sm:mt-4 md:mt-6 flex flex-col gap-2 sm:gap-3">
                    <SocialButton social="google" theme="color" size="sm" className="w-full text-xs sm:text-sm md:text-base">
                        Continue with Google
                    </SocialButton>
                    <SocialButton social="microsoft" theme="color" size="sm" className="w-full text-xs sm:text-sm md:text-base">
                        Continue with Microsoft
                    </SocialButton>
                </div>

                <div className="my-2 sm:my-4 md:my-6 flex items-center gap-2 sm:gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-medium uppercase text-gray-400">or</span>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>

                <Form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="text-center">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Email</span>
                        </div>
                        <Input
                            isRequired
                            hideRequiredIndicator
                            label=""
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            size="sm"
                            icon={Mail01}
                            className="w-full"
                            inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="text-center">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Password</span>
                        </div>
                        <Input
                            isRequired
                            hideRequiredIndicator
                            label=""
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            size="sm"
                            icon={Lock01}
                            className="w-full"
                            inputClassName="bg-blue-50 text-xs sm:text-sm md:text-base"
                        />
                    </div>

                    <Button type="submit" size="sm" className="mt-2 w-full bg-gray-900 hover:bg-gray-800 text-xs sm:text-sm md:text-base py-2 sm:py-2.5 md:py-3">
                        Sign in
                    </Button>
                </Form>

                <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
                    <Button color="link-color" size="sm" href="#" className="text-xs sm:text-sm">
                        Forgot password?
                    </Button>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500">Need an account?</span>
                        <Button color="link-color" size="sm" href="#" className="text-xs sm:text-sm">
                            Sign up
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
};
