// ─── MAURIKILCHI DESIGN SYSTEM ────────────────────────────────────────────────
// Gold header · Light surfaces · Dark text

export const C = {
  // ── Brand ──
  gold:      "#F8AC12",
  goldLight: "#FFF5D6",
  goldDark:  "#C98A00",

  // ── Backgrounds ──
  bg:        "#FFFFFF",   // page background
  surface:   "#FFFFFF",   // elevated surface
  card:      "#FFFFFF",   // card
  cardHigh:  "#FAFAFA",   // highlighted card / pressed
  border:    "#E0E0E0",   // subtle card border
  borderMid: "#D8D8D8",   // visible

  // ── Text ──
  textPrimary:   "#111111",
  textSecondary: "#555555",
  textMuted:     "#999999",
  textDisabled:  "#CCCCCC",
  textGold:      "#C98A00",
  textInverse:   "#FFFFFF",

  // ── Status ──
  success:   "#16A34A",
  successBg: "#F0FDF4",
  error:     "#DC2626",
  errorBg:   "#FEF2F2",
  warning:   "#D97706",
  whatsapp:  "#25D366",

  // ── Overlays ──
  overlay:      "rgba(0,0,0,0.50)",
  overlayLight: "rgba(0,0,0,0.20)",
} as const;

// UI text — Manrope
export const F = {
  regular:  "Manrope-Regular",
  medium:   "Manrope-Medium",
  semibold: "Manrope-SemiBold",
  bold:     "Manrope-Bold",
} as const;

// Arabic text — AmazonEmber
export const FA = {
  regular: "AmazonEmber-Regular",
  medium:  "AmazonEmber-Medium",
  bold:    "AmazonEmber-Bold",
  mono:    "AmazonEmber-Mono",
} as const;

export const Sz = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  "2xl": 26,
  "3xl": 32,
} as const;

export const R = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 28,
  full: 999,
} as const;

export const S = {
  px4:  4,
  px8:  8,
  px12: 12,
  px16: 16,
  px20: 20,
  px24: 24,
  px32: 32,
  px40: 40,
  px48: 48,
  screen:  20,
  section: 28,
  card:    16,
  tabBar:  80,
} as const;

export const Shadow = {
  none: { boxShadow: "none" },
  sm:   { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  md:   { boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  lg:   { boxShadow: "0 4px 16px rgba(0,0,0,0.10)" },
  gold: { boxShadow: "0 4px 20px rgba(248,172,18,0.35)" },
  card: { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
} as const;

// Bordered card — use instead of shadows for flat UI style
export const Border = {
  card: { borderWidth: 1, borderColor: "#E0E0E0" },
} as const;
