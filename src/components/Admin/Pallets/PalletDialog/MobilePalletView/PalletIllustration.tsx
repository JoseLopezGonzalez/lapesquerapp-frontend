export function PalletIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Drop shadow */}
      <ellipse cx="120" cy="152" rx="88" ry="7" fill="currentColor" opacity="0.08" />

      {/* === BOTTOM DECK (3 planks visible from front) === */}
      {/* Plank 1 left */}
      <rect x="18" y="118" width="44" height="14" rx="2" fill="#C8923A" />
      <rect x="18" y="118" width="44" height="2.5" rx="1" fill="#E8B060" opacity="0.6" />
      <line x1="26" y1="118" x2="26" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="34" y1="118" x2="34" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="42" y1="118" x2="42" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="50" y1="118" x2="50" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />

      {/* Plank 2 center */}
      <rect x="98" y="118" width="44" height="14" rx="2" fill="#C8923A" />
      <rect x="98" y="118" width="44" height="2.5" rx="1" fill="#E8B060" opacity="0.6" />
      <line x1="106" y1="118" x2="106" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="114" y1="118" x2="114" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="122" y1="118" x2="122" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="130" y1="118" x2="130" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />

      {/* Plank 3 right */}
      <rect x="178" y="118" width="44" height="14" rx="2" fill="#C8923A" />
      <rect x="178" y="118" width="44" height="2.5" rx="1" fill="#E8B060" opacity="0.6" />
      <line x1="186" y1="118" x2="186" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="194" y1="118" x2="194" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="202" y1="118" x2="202" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />
      <line x1="210" y1="118" x2="210" y2="132" stroke="#A0701A" strokeWidth="0.8" opacity="0.4" />

      {/* === SUPPORT BLOCKS (3 columns × 2 rows) === */}
      {/* Left column */}
      <rect x="22" y="96" width="36" height="22" rx="2" fill="#B07828" />
      <rect x="22" y="96" width="36" height="3" rx="1" fill="#D4A050" opacity="0.5" />

      {/* Center column */}
      <rect x="102" y="96" width="36" height="22" rx="2" fill="#B07828" />
      <rect x="102" y="96" width="36" height="3" rx="1" fill="#D4A050" opacity="0.5" />

      {/* Right column */}
      <rect x="182" y="96" width="36" height="22" rx="2" fill="#B07828" />
      <rect x="182" y="96" width="36" height="3" rx="1" fill="#D4A050" opacity="0.5" />

      {/* === TOP DECK (5 horizontal planks) === */}
      {/* Plank 1 */}
      <rect x="14" y="20" width="212" height="14" rx="2" fill="#DFA042" />
      <rect x="14" y="20" width="212" height="2.5" rx="1" fill="#F0C060" opacity="0.7" />
      {[34, 62, 90, 118, 146, 174, 202].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="34" stroke="#9E6C1A" strokeWidth="0.8" opacity="0.35" />
      ))}

      {/* Plank 2 */}
      <rect x="14" y="38" width="212" height="14" rx="2" fill="#E0A845" />
      <rect x="14" y="38" width="212" height="2.5" rx="1" fill="#F2C868" opacity="0.6" />
      {[34, 62, 90, 118, 146, 174, 202].map((x) => (
        <line key={x} x1={x} y1="38" x2={x} y2="52" stroke="#9E6C1A" strokeWidth="0.8" opacity="0.35" />
      ))}

      {/* Plank 3 (center — slightly darker for depth) */}
      <rect x="14" y="56" width="212" height="14" rx="2" fill="#D49838" />
      <rect x="14" y="56" width="212" height="2.5" rx="1" fill="#EEB858" opacity="0.6" />
      {[34, 62, 90, 118, 146, 174, 202].map((x) => (
        <line key={x} x1={x} y1="56" x2={x} y2="70" stroke="#9E6C1A" strokeWidth="0.8" opacity="0.35" />
      ))}

      {/* Plank 4 */}
      <rect x="14" y="74" width="212" height="14" rx="2" fill="#E0A845" />
      <rect x="14" y="74" width="212" height="2.5" rx="1" fill="#F2C868" opacity="0.6" />
      {[34, 62, 90, 118, 146, 174, 202].map((x) => (
        <line key={x} x1={x} y1="74" x2={x} y2="88" stroke="#9E6C1A" strokeWidth="0.8" opacity="0.35" />
      ))}

      {/* Top rail (front edge highlight) */}
      <rect x="14" y="88" width="212" height="8" rx="2" fill="#DFA042" />
      <rect x="14" y="88" width="212" height="2" rx="1" fill="#F0C060" opacity="0.5" />

      {/* === OUTER BORDER (frame) === */}
      <rect x="14" y="20" width="212" height="78" rx="2" fill="none" stroke="#9E6C1A" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
