import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, Image, ActivityIndicator, Dimensions, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search } from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, S, R } from "@/constants/theme";

const { width } = Dimensions.get("window");
const INK  = "#111";
const INK2 = "#555";
const INK3 = "#999";
const Y    = C.gold;
const SURF = "#F6F4EF";
const BDR  = "rgba(0,0,0,0.07)";
const PROD_W = (width - S.screen * 2 - 12) / 2;

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ item }: { item: any }) {
  const router = useRouter();
  const image  = item.primary_image_url ?? item.primary_image ?? null;
  return (
    <TouchableOpacity
      style={[pc.card, { width: PROD_W }]}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.85}
    >
      <View style={pc.img}>
        {image
          ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={pc.ph}><Text style={{ fontSize: 28 }}>📦</Text></View>}
        {!item.is_available && (
          <View style={pc.badge}><Text style={pc.badgeText}>Rupture</Text></View>
        )}
      </View>
      <View style={pc.info}>
        {item.boutique_name
          ? <Text style={pc.shop} numberOfLines={1}>{item.boutique_name}</Text>
          : null}
        <Text style={pc.name} numberOfLines={2}>{item.title}</Text>
        <Text style={pc.price}>
          {parseFloat(item.price).toLocaleString("fr-FR")} <Text style={pc.cur}>MRU</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const pc = StyleSheet.create({
  card:      { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: BDR },
  img:       { width: "100%", height: 120, backgroundColor: SURF, position: "relative" },
  ph:        { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  badge:     { position: "absolute", top: 8, right: 8, backgroundColor: C.error,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontFamily: F.bold, fontSize: 9, color: "#fff" },
  info:      { padding: 10 },
  shop:      { fontFamily: F.regular, fontSize: 10, color: INK3, marginBottom: 2 },
  name:      { fontFamily: F.bold, fontSize: 12.5, color: INK, lineHeight: 17, marginBottom: 5 },
  price:     { fontFamily: F.bold, fontSize: 14, color: INK },
  cur:       { fontFamily: F.regular, fontSize: 10, color: INK3 },
});

// ─── Skeleton grid ────────────────────────────────────────────────────────────
function SkeletonGrid() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, padding: S.screen }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ width: PROD_W, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: BDR, backgroundColor: "#fff" }}>
          <Animated.View style={{ width: "100%", height: 120, backgroundColor: SURF, opacity }} />
          <View style={{ padding: 10, gap: 7 }}>
            <Animated.View style={{ width: "80%", height: 10, borderRadius: 5, backgroundColor: SURF, opacity }} />
            <Animated.View style={{ width: "60%", height: 10, borderRadius: 5, backgroundColor: SURF, opacity }} />
            <Animated.View style={{ width: "40%", height: 12, borderRadius: 6, backgroundColor: SURF, opacity }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Subcategory chip ─────────────────────────────────────────────────────────
function Chip({ label, count, active, onPress }: { label: string; count?: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[ch.chip, active && ch.chipOn]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[ch.label, active && ch.labelOn]} numberOfLines={1}>
        {label}
        {count != null && count > 0 ? ` · ${count}` : ""}
      </Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  chip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)" },
  chipOn:  { backgroundColor: INK, borderColor: INK },
  label:   { fontFamily: F.medium, fontSize: 13, color: INK2 },
  labelOn: { color: "#fff", fontFamily: F.bold },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function CategoryPage() {
  const { slug }  = useLocalSearchParams<{ slug: string }>();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();

  const [category,    setCategory]    = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [products,    setProducts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  // Load category (and its subcategories)
  useEffect(() => {
    api.get(`/categories/${slug}/`).then(setCategory).catch(() => {});
  }, [slug]);

  // Load products whenever slug or selected sub changes
  useEffect(() => {
    setLoading(true);
    const filter = selectedSub ?? slug;
    api.get(`/products/?category=${filter}`)
      .then(d => setProducts(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, selectedSub]);

  const subcategories: any[] = category?.subcategories ?? [];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Fixed header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={INK} width={20} height={20} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {category?.icon ? `${category.icon}  ` : ""}{category?.name ?? "Catégorie"}
        </Text>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.push("/(app)/search")}
          activeOpacity={0.7}
        >
          <Search color={INK} width={18} height={18} />
        </TouchableOpacity>
      </View>

      {/* ── Sticky subcategory chips ── */}
      {subcategories.length > 0 && (
        <View style={s.chipsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8 }}
          >
            <Chip
              label="Tous"
              count={category?.product_count}
              active={selectedSub === null}
              onPress={() => setSelectedSub(null)}
            />
            {subcategories.map((sub: any) => (
              <Chip
                key={sub.slug}
                label={sub.name}
                count={sub.product_count}
                active={selectedSub === sub.slug}
                onPress={() => setSelectedSub(sub.slug)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Product grid ── */}
      {loading ? (
        <SkeletonGrid />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={item => String(item.id ?? item.slug)}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            products.length > 0 ? (
              <Text style={s.count}>
                {products.length} produit{products.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
              <Text style={s.emptyTitle}>Aucun produit</Text>
              <Text style={s.emptySub}>
                {selectedSub
                  ? "Essayez une autre sous-catégorie."
                  : "Aucun produit dans cette catégorie pour l'instant."}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard item={item} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f8f7f5" },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: BDR },
  backBtn:     { width: 38, height: 38, borderRadius: R.full, backgroundColor: SURF,
    alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: F.bold, fontSize: 17, color: INK,
    textAlign: "center", marginHorizontal: 10 },

  chipsBar:    { backgroundColor: "#fff", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BDR },

  grid:        { padding: S.screen, paddingBottom: S.tabBar + 24, gap: 12 },
  count:       { fontFamily: F.medium, fontSize: 12, color: INK3,
    marginBottom: 14, paddingHorizontal: 2 },

  empty:       { alignItems: "center", paddingTop: 60, paddingHorizontal: S.screen },
  emptyTitle:  { fontFamily: F.bold, fontSize: 17, color: INK, marginBottom: 8 },
  emptySub:    { fontFamily: F.regular, fontSize: 14, color: INK3, textAlign: "center", lineHeight: 21 },
});
