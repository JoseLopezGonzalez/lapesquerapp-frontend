"use client";

import React from "react";

/**
 * Tabs de filtro reutilizables para listas superadmin.
 * @param {Array<{ key: string, label: string }>} tabs
 * @param {string} activeKey
 * @param {(key: string) => void} onChange
 */
export default function FilterTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeKey === tab.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
