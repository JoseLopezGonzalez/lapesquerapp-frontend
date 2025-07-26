import React from "react";
import { badgeStyles } from "./badgeStyles";

export function renderBadge(header, value) {
    const option = header.options?.[value] || header.options?.default;
    if (!option) return value;

    const style = badgeStyles[option.color] || badgeStyles.neutral;
    const className = option.outline ? style.outline : style.base;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${className}`}>
            {option.label}
        </span>
    );
}
