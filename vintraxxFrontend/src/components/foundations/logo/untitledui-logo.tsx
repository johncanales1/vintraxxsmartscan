"use client";

import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cx } from "@/utils/cx";
import miniLogo from "@/assets/logo/mini.png";
import labelLogo from "@/assets/logo/label.png";

export const UntitledLogo = (props: HTMLAttributes<HTMLOrSVGElement>) => {
    return (
        <div {...props} className={cx("flex w-max items-center justify-start gap-1 overflow-visible", props.className)}>
            {/* Minimal logo */}
            <Image src={miniLogo} alt="Logo" className="h-full w-auto shrink-0 -translate-y-0.5" />

            {/* Label */}
            <Image src={labelLogo} alt="Vintraxx" className="h-3/5 w-auto shrink-0 dark:brightness-0 dark:invert" />
        </div>
    );
};
