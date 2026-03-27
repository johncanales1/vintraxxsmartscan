"use client";

import { Car, Scan, Zap } from "lucide-react";
import { cx } from "@/utils/cx";

const products = [
    {
        title: "VinLane IMS",
        subtitle: "Inventory Management",
        href: "/VinLaneIMS",
        icon: Car,
        iconColor: "text-slate-400",
        bgColor: "bg-slate-100",
    },
    {
        title: "VinTraxx SmartScan Dashboard",
        subtitle: "OBD-II Diagnostics",
        href: "/dealer",
        icon: Scan,
        iconColor: "text-cyan-400",
        bgColor: "bg-slate-100",
    },
    {
        title: "VinTraxx Capital Portal",
        subtitle: "Financing Solutions",
        href: "/CapitalDealerPortal",
        icon: Zap,
        iconColor: "text-red-500",
        bgColor: "bg-slate-100",
    },
];

interface ProductsDropdownMenuProps {
    className?: string;
}

export const ProductsDropdownMenu = ({ className }: ProductsDropdownMenuProps) => {
    return (
        <div className={cx(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-80 bg-white border-slate-200 p-2",
            className
        )}>
            <div className="px-2 py-1.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                VinTraxx Automotive Suite
            </div>
            
            <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-slate-200" />
            
            <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto">
                {products.map((product) => {
                    const IconComponent = product.icon;
                    return (
                        <a
                            key={product.title}
                            href={product.href}
                            className={cx(
                                "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            )}
                            role="menuitem"
                            tabIndex={-1}
                            data-orientation="vertical"
                        >
                            <div className={cx("w-9 h-9 rounded-lg flex items-center justify-center", product.bgColor)}>
                                <IconComponent className={cx("w-5 h-5", product.iconColor)} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{product.title}</p>
                                <p className="text-xs text-slate-500">{product.subtitle}</p>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
