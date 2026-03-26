"use client";

import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cx } from "@/utils/cx";
import miniLogo from "@/assets/logo/mini.png";

export const UntitledLogoMinimal = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("size-24 transition-shadow duration-200 shadow-md shadow-gray-300 hover:shadow-xl hover:shadow-gray-400 rounded-full", props.className)}>
            <Image src={miniLogo} alt="Logo" className="h-full w-full object-contain" />
        </div>
    );
};