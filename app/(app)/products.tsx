import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ShoppingBag, Coffee, Smartphone, Package, Shirt,
  Home as HomeIcon, Star, Grid,
} from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const { width } = Dimensions.get("window");
const PROD_W  = (width - S.screen * 2 - 12) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Category filter chip
// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICON_MAP: Record<string, any> = {
  supermarche: ShoppingBag, restaurant: Coffee, electronique: Smartphone,
  arrivage: Package, mode: Shirt, beaute: Star, maison: HomeIcon, autre: Grid,
};

function CatChip({ item, active, onPress }: { item: any; active: boolean; onPress: () => void }) {
  const Icon = CAT_ICON_MAP[item.slug] ?? Grid;
  return (
    <TouchableOpacity style={[cc.btn, active && cc.btnOn]} onPress={onPress} activeOpacity={0.75}>
      <Icon color={active ? "#fff" : C.textMuted} width={14} height={14} strokeWidth={2} />
      <Text style={[cc.label, active && cc.labelOn]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  btn:     { flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  btnOn:   { backgroundColor: "#111", borderColor: "#111" },
  label:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary, lineHeight: 14 },
  labelOn: { color: "#fff", fontFamily: F.medium },
});

// ─────────────────────────────────────────────────────────────────────────────
// Product card — column layout, 2 per row
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ item }: { item: any }) {
  const router = useRouter();
  const image = item.primary_image_url ?? item.primary_image ?? item.images?.[0]?.image_url ?? null;
  return (
    <TouchableOpacity
      style={[pc.card, { width: PROD_W }]}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.88}
    >
      {/* Image */}
      <View style={pc.imgWrap}>
        {image
          ? <Image source={{ uri: image }} style={pc.img} contentFit="cover" />
          : <View style={pc.imgPh}><Text style={{ fontSize: 32 }}>📦</Text></View>}
        {item.category_name ? (
          <View style={pc.catBadge}>
            <Text style={pc.catText}>{item.category_name}</Text>
          </View>
        ) : null}
      </View>

      {/* Text */}
      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={2}>{item.title}</Text>
        <View style={pc.priceRow}>
          <Text style={pc.price}>{parseFloat(item.price).toLocaleString("fr-FR")}</Text>
          <Text style={pc.currency}> MRU</Text>
        </View>
        {item.boutique_name && (
          <Text style={pc.shop} numberOfLines={1}>📍 {item.boutique_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
const pc = StyleSheet.create({
  card:     { backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    flexDirection: "column", ...Border.card },
  imgWrap:  { width: "100%", height: 126, padding: 8 },
  img:      { width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" },
  imgPh:    { width: "100%", height: "100%", borderRadius: 10, backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center" },
  catBadge: { position: "absolute", top: 14, left: 14,
    backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5 },
  catText:  { fontFamily: F.medium, fontSize: 9, color: "#fff" },
  info:     { paddingHorizontal: 10, paddingBottom: 12, paddingTop: 2 },
  name:     { fontFamily: F.semibold, fontSize: Sz.base, color: C.textPrimary,
    marginBottom: 6, lineHeight: 19 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  price:    { fontFamily: F.bold, fontSize: Sz.md, color: C.textPrimary },
  currency: { fontFamily: F.medium, fontSize: Sz.xs, color: C.textMuted },
  shop:     { fontFamily: F.regular, fontSize: 10, color: C.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Products() {
  const router  = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [cats,      setCats]      = useState<any[]>([{ id: "__all__", name: "Tous · الكل", slug: "__all__" }]);
  const [activeCat, setActiveCat] = useState(category ?? "__all__");

  // Sync when the URL param changes (tab stays mounted between navigations)
  useEffect(() => {
    setActiveCat(category ?? "__all__");
  }, [category]);
  const [prods,   setProds]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories/").then((d) => {
      const list: any[] = d?.results ?? d ?? [];
      const roots = list.filter((c: any) => !c.parent).slice(0, 10);
      setCats([{ id: "__all__", name: "Tous · الكل", slug: "__all__" }, ...roots]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const ep = activeCat !== "__all__" ? `/products/?category=${activeCat}` : "/products/";
    api.get(ep)
      .then((d) => setProds(d?.results ?? d ?? []))
      .catch(() => setProds([]))
      .finally(() => setLoading(false));
  }, [activeCat]);

  return (
    <View style={s.root}>
      {/* Lemon yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={s.gradientWash}
        pointerEvents="none"
      />
      <View style={s.headerWrap}>
        <SafeAreaView>
          <Text style={s.title}>Produits · المنتجات</Text>
          <Text style={s.sub}>{prods.length} produit{prods.length !== 1 ? "s" : ""} disponible{prods.length !== 1 ? "s" : ""}</Text>
        </SafeAreaView>
      </View>

      {/* Category chips — outside scroll, solid bg covers gradient tail */}
      <View style={s.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8 }}
        >
          {cats.map((c) => (
            <CatChip
              key={String(c.id)}
              item={c}
              active={activeCat === c.slug}
              onPress={() => setActiveCat(c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: S.tabBar + 20, paddingTop: 8 }}
      >
        {/* Product grid */}
        {loading ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 32 }} />
        ) : prods.length === 0 ? (
          <Text style={s.empty}>Aucun produit · لا منتجات</Text>
        ) : (
          <View style={s.grid}>
            {prods.map((p) => <ProductCard key={p.id ?? p.slug} item={p} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  gradientWash:{ position: "absolute", top: 0, left: 0, right: 0, height: 300, zIndex: 0 },
  headerWrap:  { paddingBottom: 16, zIndex: 5 },
  catSection:  { paddingVertical: 12, paddingBottom: 14, zIndex: 5 },
  title:       { fontFamily: F.bold, fontSize: Sz.xl, color: "#000",
    paddingHorizontal: S.screen, paddingTop: S.px16 },
  sub:         { fontFamily: F.regular, fontSize: Sz.sm, color: "rgba(0,0,0,0.55)",
    paddingHorizontal: S.screen, marginTop: 2, marginBottom: 4 },
  body:        { flex: 1, zIndex: 5 },
  grid:        { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: S.screen, gap: 12 },
  empty:       { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted,
    textAlign: "center", marginTop: 48 },
});
