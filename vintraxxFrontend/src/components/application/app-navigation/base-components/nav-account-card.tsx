"use client";

import type { FC, HTMLAttributes } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { Placement } from "@react-types/overlays";
import { BookOpen01, ChevronSelectorVertical, LogOut01, Mail01, Plus, Settings01, User01 } from "@untitledui/icons";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cx } from "@/utils/cx";
import johnImage from "@/assets/images/team/john.jpg";
import paulImage from "@/assets/images/team/paul.jpg";

type NavAccountType = {
    /** Unique identifier for the nav item. */
    id: string;
    /** Name of the account holder. */
    name: string;
    /** Email address of the account holder. */
    email: string;
    /** Avatar image URL. */
    avatar: string;
    /** Online status of the account holder. This is used to display the online status indicator. */
    status: "online" | "offline";
};

const placeholderAccounts: NavAccountType[] = [
    {
        id: "john",
        name: "John Canales",
        email: "john@vintraxx.com",
        avatar: johnImage.src,
        status: "online",
    },
    {
        id: "paul",
        name: "Paul Machin",
        email: "paul@vintraxx.com",
        avatar: paulImage.src,
        status: "online",
    },
];

export const NavAccountMenu = ({
    className,
    selectedAccountId = "john",
    ...dialogProps
}: AriaDialogProps & { className?: string; accounts?: NavAccountType[]; selectedAccountId?: string }) => {
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);

    const selectedAccount = placeholderAccounts.find((account) => account.id === selectedAccountId);

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx("w-64 rounded-xl bg-white shadow-lg ring ring-gray-200 outline-hidden", className)}
        >
            <div className="rounded-xl bg-white ring-1 ring-gray-200">
                {/* Email address at the top */}
                {selectedAccount && (
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Mail01 className="size-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{selectedAccount.email}</span>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col gap-0.5 py-1.5">
                    <NavAccountCardMenuItem label="Profile" icon={User01} onClick={() => console.log('Profile clicked')} />
                    <NavAccountCardMenuItem label="Settings" icon={Settings01} onClick={() => console.log('Settings clicked')} />
                </div>
                
                <div className="pt-1 pb-1.5 border-t border-gray-200">
                    <NavAccountCardMenuItem label="Sign out" icon={LogOut01} onClick={() => console.log('Sign out clicked')} />
                </div>
            </div>
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    onClick,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    onClick?: () => void;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button 
            {...buttonProps} 
            className="w-full cursor-pointer focus:outline-hidden"
            onClick={onClick}
        >
            <div className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                {Icon && <Icon className="size-4 text-gray-500" />}
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
        </button>
    );
};

export const NavAccountCard = ({
    popoverPlacement,
    selectedAccountId = "john",
    items = placeholderAccounts,
}: {
    popoverPlacement?: Placement;
    selectedAccountId?: string;
    items?: NavAccountType[];
}) => {
    const isDesktop = useBreakpoint("lg");

    const selectedAccount = items.find((account) => account.id === selectedAccountId);

    if (!selectedAccount) {
        console.warn(`Account with ID ${selectedAccountId} not found in <NavAccountCard />`);
        return null;
    }

    return (
        <AriaDialogTrigger>
            <AriaButton
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 h-9 px-4 py-2 gap-2 text-slate-700 hover:text-slate-900"
                type="button"
            >
                <div className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-sm">
                        {selectedAccount.name.charAt(0).toUpperCase()}
                    </div>
                </div>
                <span className="hidden sm:inline text-sm">{selectedAccount.name.toLowerCase()}</span>
                <ChevronSelectorVertical className="w-4 h-4" aria-hidden="true" />
            </AriaButton>
            <AriaPopover
                placement={popoverPlacement ?? "bottom right"}
                offset={8}
                className="z-50 w-64 rounded-xl bg-white shadow-lg ring ring-gray-200"
            >
                <NavAccountMenu selectedAccountId={selectedAccountId} accounts={items} />
            </AriaPopover>
        </AriaDialogTrigger>
    );
};
