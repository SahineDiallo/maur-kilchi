import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { F, Sz } from "@/constants/theme";

// ─── Per-type visual identity ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  colors: readonly [string, string, string];
  emoji: string;
  label: string;
  accentA: string; // decorative circle A
  accentB: string; // decorative circle B
}> = {
  restaurant: {
    colors:  ["#C95D0A", "#E8821A", "#F5AE48"] as const,
    emoji:   "🍽️",
    label:   "Restaurant",
    accentA: "rgba(255,255,255,0.12)",
    accentB: "rgba(255,255,255,0.07)",
  },
  supermarche: {
    colors:  ["#1B6B3A", "#2E9B5A", "#4FC87E"] as const,
    emoji:   "🛒",
    label:   "Supermarché",
    accentA: "rgba(255,255,255,0.12)",
    accentB: "rgba(255,255,255,0.07)",
  },
  arrivage: {
    colors:  ["#5B2D9E", "#7B4EC8", "#A07AE0"] as const,
    emoji:   "👗",
    label:   "Arrivage",
    accentA: "rgba(255,255,255,0.12)",
    accentB: "rgba(255,255,255,0.07)",
  },
  electronique: {
    colors:  ["#0F2A4A", "#1A4F8A", "#2C78C8"] as const,
    emoji:   "📱",
    label:   "Électronique",
    accentA: "rgba(255,255,255,0.10)",
    accentB: "rgba(255,255,255,0.06)",
  },
  autre: {
    colors:  ["#B07800", "#D4A017", "#F5C842"] as const,
    emoji:   "🏪",
    label:   "Boutique",
    accentA: "rgba(255,255,255,0.14)",
    accentB: "rgba(255,255,255,0.08)",
  },
};

const FALLBACK = TYPE_CONFIG.autre;

interface Props {
  boutiqueType: string;
  name?: string;
  /** compact = small card (horizontal scroll), full = my-boutiques full-width card */
  size?: "compact" | "full";
}

export default function BoutiquePlaceholder({ boutiqueType, name, size = "compact" }: Props) {
  const cfg = TYPE_CONFIG[boutiqueType] ?? FALLBACK;
  const isCompact = size === "compact";

  return (
    <LinearGradient
      colors={cfg.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {/* Decorative circles for depth */}
      <View style={[
        s.circleA,
        { backgroundColor: cfg.accentA },
        isCompact ? s.circleACompact : s.circleAFull,
      ]} />
      <View style={[
        s.circleB,
        { backgroundColor: cfg.accentB },
        isCompact ? s.circleBCompact : s.circleBFull,
      ]} />
      <View style={[
        s.circleC,
        { backgroundColor: cfg.accentB },
        isCompact ? s.circleCCompact : s.circleCFull,
      ]} />

      {/* Central content */}
      <View style={s.center}>
        <View style={[s.emojiCircle, isCompact ? s.emojiCircleCompact : s.emojiCircleFull,
          { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Text style={isCompact ? s.emojiCompact : s.emojiFull}>{cfg.emoji}</Text>
        </View>
        {name ? (
          <Text
            style={[s.name, isCompact ? s.nameCompact : s.nameFull]}
            numberOfLines={2}
          >
            {name}
          </Text>
        ) : null}
        <View style={[s.typePill, { backgroundColor: "rgba(0,0,0,0.20)" }]}>
          <Text style={s.typeText}>{cfg.label}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  // Decorative circles
  circleA: { position: "absolute", borderRadius: 9999 },
  circleACompact: { width: 110, height: 110, top: -30, right: -20 },
  circleAFull:    { width: 200, height: 200, top: -60, right: -40 },

  circleB: { position: "absolute", borderRadius: 9999 },
  circleBCompact: { width: 70, height: 70, bottom: -20, left: -10 },
  circleBFull:    { width: 140, height: 140, bottom: -40, left: -20 },

  circleC: { position: "absolute", borderRadius: 9999 },
  circleCCompact: { width: 44, height: 44, top: 12, left: 12 },
  circleCFull:    { width: 80, height: 80, top: 20, left: 20 },

  // Content
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },

  emojiCircle: { alignItems: "center", justifyContent: "center", borderRadius: 9999 },
  emojiCircleCompact: { width: 46, height: 46 },
  emojiCircleFull:    { width: 64, height: 64 },

  emojiCompact: { fontSize: 22 },
  emojiFull:    { fontSize: 30 },

  name: { color: "#fff", textAlign: "center" },
  nameCompact: { fontFamily: F.bold, fontSize: Sz.sm, lineHeight: 16 },
  nameFull:    { fontFamily: F.bold, fontSize: Sz.lg, lineHeight: 22 },

  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  typeText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
  },
});
