import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Dimensions, TextInput,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MapPin, Coffee, Search, X, Star, Clock } from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, S } from "@/constants/theme";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Category filter icons (emoji card + label below)
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "__all__",  label: "Tous",      emoji: "🍽️" },
  { key: "burger",   label: "Burgers",   emoji: "🍔" },
  { key: "pizza",    label: "Pizzas",    emoji: "🍕" },
  { key: "poulet",   label: "Poulet",    emoji: "🍗" },
  { key: "sandwich", label: "Sandwichs", emoji: "🥪" },
  { key: "dessert",  label: "Desserts",  emoji: "🍰" },
  { key: "tacos",    label: "Tacos",     emoji: "🌮" },
  { key: "boisson",  label: "Boissons",  emoji: "🥤" },
];

function FilterIcon({
  label, emoji, active, onPress,
}: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[fi.pill, active && fi.pillOn]} onPress={onPress} activeOpacity={0.78}>
      <Text style={fi.emoji}>{emoji}</Text>
      <Text style={[fi.label, active && fi.labelOn]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}
const fi = StyleSheet.create({
  pill:    {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.50)",
  },
  pillOn:  { backgroundColor: "#111", borderColor: "#111" },
  emoji:   { fontSize: 18 },
  label:   { fontFamily: F.medium, fontSize: Sz.sm, color: "rgba(0,0,0,0.68)" },
  labelOn: { fontFamily: F.bold, color: "#fff" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Star rating row
// ─────────────────────────────────────────────────────────────────────────────
function RatingRow({ rating = 4.3, reviews = 0 }: { rating?: number; reviews?: number }) {
  const stars = Math.round(rating);
  return (
    <View style={rr.wrap}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={11} height={11}
          color={i <= stars ? C.gold : C.border}
          fill={i <= stars ? C.gold : "none"}
          strokeWidth={1.5}
        />
      ))}
      <Text style={rr.val}>{rating.toFixed(1)}</Text>
      {reviews > 0 && <Text style={rr.reviews}>({reviews})</Text>}
    </View>
  );
}
const rr = StyleSheet.create({
  wrap:    { flexDirection: "row", alignItems: "center", gap: 2 },
  val:     { fontFamily: F.bold, fontSize: Sz.xs, color: C.textPrimary, marginLeft: 3 },
  reviews: { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Cuisine tag pills
// ─────────────────────────────────────────────────────────────────────────────
function CuisineTags({ categories }: { categories: any[] }) {
  const tags = (categories ?? []).slice(0, 3);
  if (tags.length === 0) return null;
  return (
    <View style={ct.wrap}>
      {tags.map((cat: any) => (
        <View key={cat.id ?? cat.name} style={ct.tag}>
          <Text style={ct.text}>{cat.name}</Text>
        </View>
      ))}
    </View>
  );
}
const ct = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag:  {
    backgroundColor: "#F0F0F0", paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
  },
  text: { fontFamily: F.medium, fontSize: 10, color: C.textSecondary },
});

// ─────────────────────────────────────────────────────────────────────────────
// Restaurant card — premium food app style
// ─────────────────────────────────────────────────────────────────────────────
function RestaurantCard({ item }: { item: any }) {
  const router = useRouter();
  const imgUri    = item.image_url ?? item.image ?? null;
  const typeLabel = item.boutique_type_display ?? item.boutique_type ?? "Restaurant";

  return (
    <TouchableOpacity
      style={rc.card}
      onPress={() => router.push(`/restaurant/${item.slug ?? item.id}`)}
      activeOpacity={0.92}
    >
      {/* ── Cover image — all 4 corners rounded, no overflow clip on card ── */}
      <View style={rc.imgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <LinearGradient colors={["#FFD060", C.gold, "#C98A00"]} style={StyleSheet.absoluteFill} />}

        {/* Type badge — top left */}
        <View style={rc.badge}>
          <Text style={rc.badgeText}>{typeLabel}</Text>
        </View>

        {/* Delivery time — top right */}
        <View style={rc.timeBadge}>
          <Clock color="#fff" width={10} height={10} strokeWidth={2} />
          <Text style={rc.timeText}>20–35 min</Text>
        </View>
      </View>

      {/* ── Info — transparent, name + rating + city below the image ── */}
      <View style={rc.info}>
        <Text style={rc.name} numberOfLines={1}>{item.name}</Text>
        <View style={rc.metaRow}>
          <RatingRow rating={item.rating ?? 4.3} reviews={item.review_count ?? 0} />
          {item.ville ? (
            <>
              <Text style={rc.dot}>·</Text>
              <MapPin color={C.textMuted} width={11} height={11} />
              <Text style={rc.loc} numberOfLines={1}>{item.ville}</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  card:      { backgroundColor: "transparent", overflow: "visible" },
  imgWrap:   { height: 170, width: "100%", borderRadius: 14, overflow: "hidden" },
  badge:     {
    position: "absolute", top: 12, left: 12,
    backgroundColor: C.gold, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontFamily: F.bold, fontSize: 10, color: "#000", textTransform: "capitalize" },
  timeBadge: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  timeText:  { fontFamily: F.medium, fontSize: 10, color: "#fff" },
  info:      { paddingTop: 8, paddingBottom: 4 },
  name:      { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, marginBottom: 5 },
  metaRow:   { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  dot:       { fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted },
  loc:       { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, flexShrink: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeChip,  setActiveChip]  = useState("__all__");
  const [query,       setQuery]       = useState("");
  const [search,      setSearch]      = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 380);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    api.get("/boutiques/?type=restaurant")
      .then((d) => setRestaurants(d?.results ?? d ?? []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) => {
    const matchesSearch = search.trim() === "" || r.name?.toLowerCase().includes(search.toLowerCase());
    const matchesChip   = activeChip === "__all__" || (r.menu_categories ?? []).some(
      (cat: any) => cat.name?.toLowerCase().includes(activeChip.toLowerCase()),
    );
    return matchesSearch && matchesChip;
  });

  return (
    <View style={s.root}>

      {/* ── Gradient header — includes category icons so they blend with gradient ── */}
      <View style={s.headerWrap}>
        <LinearGradient
          colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
          locations={[0, 0.38, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView>
          <Text style={s.title}>Restaurants · المطاعم</Text>
          <Text style={s.sub}>
            {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
          </Text>
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Search color={C.textMuted} width={16} height={16} />
              <TextInput
                style={s.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher un restaurant..."
                placeholderTextColor={C.textMuted}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={C.textMuted} width={15} height={15} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>

        {/* Category icons inside the header — float over the fading gradient */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: S.screen, gap: 10, paddingTop: 14, paddingBottom: 20 }}
        >
          {FILTERS.map((f) => (
            <FilterIcon
              key={f.key}
              label={f.label}
              emoji={f.emoji}
              active={activeChip === f.key}
              onPress={() => setActiveChip(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Restaurant list ── */}
      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: S.screen, paddingTop: 8, paddingBottom: S.tabBar + 24 }}
      >
        {loading ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Coffee color={C.textMuted} width={40} height={40} strokeWidth={1.5} />
            <Text style={s.emptyText}>Aucun restaurant trouvé</Text>
            <Text style={s.emptySubtext}>لا توجد مطاعم متاحة</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map((item) => (
              <RestaurantCard key={String(item.id)} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },

  headerWrap: {
    backgroundColor: "transparent",
  },
  title:      {
    fontFamily: F.bold, fontSize: Sz.xl, color: "#000",
    paddingHorizontal: S.screen, paddingTop: S.px16,
  },
  sub:        {
    fontFamily: F.regular, fontSize: Sz.sm, color: "rgba(0,0,0,0.52)",
    paddingHorizontal: S.screen, marginTop: 2, marginBottom: 12,
  },
  searchRow:  { paddingHorizontal: S.screen },
  searchBox:  {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14,
    height: 48, boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
  },
  searchInput:{ flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },

  body:       { flex: 1 },
  list:       { gap: 16 },
  emptyWrap:  { alignItems: "center", justifyContent: "center", paddingTop: 64, gap: 10 },
  emptyText:  { fontFamily: F.semibold, fontSize: Sz.base, color: C.textSecondary, marginTop: 4 },
  emptySubtext:{ fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted },
});
