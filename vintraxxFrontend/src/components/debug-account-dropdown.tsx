"use client";

import { useState } from "react";
import { Button as AriaButton, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { ChevronSelectorVertical, Mail01, User01, Settings01, LogOut01 } from "@untitledui/icons";

export const DebugAccountDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Account Dropdown</h1>
            
            <AriaDialogTrigger onOpenChange={(open) => setIsOpen(open)}>
                <AriaButton
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-9 px-4 py-2 gap-2 text-slate-700 hover:text-slate-900"
                    type="button"
                >
                    <div className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-sm">
                            J
                        </div>
                    </div>
                    <span className="hidden sm:inline text-sm">john</span>
                    <ChevronSelectorVertical className="w-4 h-4" aria-hidden="true" />
                </AriaButton>
                
                <AriaPopover
                    placement="bottom right"
                    offset={8}
                    className="z-50 w-64 rounded-xl bg-white shadow-lg ring ring-gray-200"
                >
                    <div className="rounded-xl bg-white ring-1 ring-gray-200">
                        {/* Email address at the top */}
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <Mail01 className="size-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">john@vintraxx.com</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-0.5 py-1.5">
                            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-100">
                                <User01 className="size-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Profile</span>
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-100">
                                <Settings01 className="size-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Settings</span>
                            </button>
                        </div>
                        
                        <div className="pt-1 pb-1.5 border-t border-gray-200">
                            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-100">
                                <LogOut01 className="size-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Sign out</span>
                            </button>
                        </div>
                    </div>
                </AriaPopover>
            </AriaDialogTrigger>
            
            <div className="mt-4 text-sm text-gray-600">
                Dropdown is {isOpen ? 'OPEN' : 'CLOSED'}
            </div>
        </div>
    );
};
