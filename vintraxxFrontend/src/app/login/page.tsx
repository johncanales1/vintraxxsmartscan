"use client";

import { LoginSimple } from "@/components/shared-assets/login/login-simple";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const resetToken = searchParams.get('token');
    
    return <LoginSimple resetToken={resetToken} />;
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
