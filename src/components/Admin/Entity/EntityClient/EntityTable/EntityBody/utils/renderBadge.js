import React from "react";
import { Badge } from "@/components/ui/badge";
import { badgeStyles } from "./badgeStyles";

export function renderBadge(header, value) {
    const option = header.options?.[value] || header.options?.default;
    if (!option) return value;

    const className = badgeStyles[option.color] ?? badgeStyles.neutral;

    return (
        <Badge variant="outline" className={className}>
            {option.label}
        </Badge>
    );
}
