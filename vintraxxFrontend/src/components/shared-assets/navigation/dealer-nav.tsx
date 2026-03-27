"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Settings, Menu, ChevronDown, User } from "lucide-react";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { ProductsDropdownMenu } from "@/components/marketing/header-navigation/products-dropdown-menu";
import { cx } from "@/utils/cx";

interface DealerNavProps {
    dealerLogo?: string | null;
    dealerName?: string;
    userEmail?: string;
}

export const DealerNav = ({ dealerLogo, dealerName, userEmail }: DealerNavProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

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
                        <AriaDialogTrigger>
                            <AriaButton className="flex cursor-pointer items-center gap-0.5 rounded-lg px-1.5 py-1 text-md font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2">
                                <span className="px-0.5">Products</span>
                                <ChevronDown className="size-4 rotate-0 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear in-aria-expanded:-rotate-180" />
                            </AriaButton>

                            <AriaPopover
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "hidden origin-top will-change-transform md:block",
                                        isEntering && "duration-200 ease-out animate-in fade-in slide-in-from-top-1",
                                        isExiting && "duration-150 ease-in animate-out fade-out slide-out-to-top-1",
                                    )
                                }
                                offset={8}
                                containerPadding={0}
                            >
                                {({ isEntering, isExiting }) => (
                                    <AriaDialog
                                        className={cx(
                                            "mx-auto origin-top outline-hidden",
                                            // Have to use the scale animation inside the popover to avoid
                                            // miscalculating the popover's position when opening.
                                            isEntering && "duration-200 ease-out animate-in zoom-in-95",
                                            isExiting && "duration-150 ease-in animate-out zoom-out-95",
                                        )}
                                    >
                                        <ProductsDropdownMenu />
                                    </AriaDialog>
                                )}
                            </AriaPopover>
                        </AriaDialogTrigger>
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
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 lg:hidden text-slate-600"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {/* Products Dropdown */}
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-md font-semibold text-primary hover:bg-primary_hover rounded-lg"
                                >
                                    Products
                                    <ChevronDown
                                        className={cx("size-4 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear", isProductsDropdownOpen ? "-rotate-180" : "rotate-0")}
                                    />
                                </button>
                                {isProductsDropdownOpen && <div className="mt-1"><ProductsDropdownMenu /></div>}
                            </div>
                            
                            {/* Admin */}
                            <button className="flex w-full items-center justify-between px-3 py-2 text-md font-semibold text-primary hover:bg-primary_hover rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Admin
                                </div>
                                <ChevronDown className="size-4 stroke-[2.625px] text-fg-quaternary" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};
