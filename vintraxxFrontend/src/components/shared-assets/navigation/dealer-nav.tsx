"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Settings, Menu, ChevronDown, User } from "lucide-react";

interface DealerNavProps {
    dealerLogo?: string | null;
    dealerName?: string;
    userEmail?: string;
}

export const DealerNav = ({ dealerLogo, dealerName, userEmail }: DealerNavProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Default logo SVG for dealers without logo
    const DefaultLogo = () => (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="8" fill="url(#gradient1)" />
            <path d="M12 20h4v8h-4v-8zm6 0h4v8h-4v-8zm6 0h4v8h-4v-8zm6 0h4v8h-4v-8z" fill="white" />
            <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1B3A5F" />
                    <stop offset="100%" stopColor="#8B2332" />
                </linearGradient>
            </defs>
        </svg>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Dealer Logo */}
                    <Link href="/dealer" className="flex items-center gap-3 group">
                        {dealerLogo ? (
                            <img 
                                src={dealerLogo} 
                                alt={dealerName || "Dealer"} 
                                className="h-12 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="h-12">
                                <DefaultLogo />
                            </div>
                        )}
                        <span className="hidden lg:block text-lg font-bold text-[#1B3A5F]">
                            {dealerName || "VinTraxx AutoMall"}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 gap-1" type="button">
                            Products <ChevronDown className="w-4 h-4" />
                        </button>
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 gap-1" type="button">
                            <Settings className="w-4 h-4" />
                            Admin <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Search (desktop only) */}
                        <div className="hidden md:flex items-center">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-9 w-9 text-slate-600 hover:text-slate-900">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User menu */}
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-9 px-4 py-2 gap-2 text-slate-700 hover:text-slate-900" type="button">
                            <div className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-sm">
                                    {userEmail?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <span className="hidden sm:inline text-sm">{userEmail?.split('@')[0] || 'user'}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Mobile menu toggle */}
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 lg:hidden text-slate-600">
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
