"use client";

import { useState, useEffect } from "react";
import { DealerNav } from "@/components/shared-assets/navigation/dealer-nav";

export default function CapitalDealerPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [dealer, setDealer] = useState<any>(null);

    useEffect(() => {
        // Fetch dealer data similar to dealer page
        const token = localStorage.getItem("token");
        if (token) {
            fetchDealerData(token);
        }
    }, []);

    const fetchDealerData = async (token: string) => {
        try {
            const response = await fetch("https://api.vintraxx.com/api/v1/dealer/profile", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const dealerData = await response.json();
                setDealer(dealerData);
            }
        } catch (error) {
            console.error("Failed to fetch dealer data:", error);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <DealerNav 
                dealerLogo={dealer?.logoUrl}
                dealerName={dealer?.companyName}
                userEmail={dealer?.email}
            />
            <main className="pt-16">
                {children}
            </main>
        </div>
    );
}
