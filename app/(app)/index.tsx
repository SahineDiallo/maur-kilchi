import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Animated,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  MapPin, ChevronRight, Search,
  ShoppingBag, Coffee, Smartphone, Package,
  Star, Grid, Heart, Menu, Tool,
} from "react-native-feather";
import * as Location from "expo-location";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocationStore } from "@/store/useLocationStore";
import BoutiquePlaceholder from "@/components/BoutiquePlaceholder";
import { C, F, FA, Sz, R, S, Shadow, Border } from "@/constants/theme";

const { width } = Dimensions.get("window");
const BOUT_W  = width * 0.74;
const PROD_W  = (width - S.screen * 2 - 8) / 2;
const SNAP_W  = width - S.screen * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonBox({ w, h, r = 10, style }: { w: number | string; h: number; r?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  return (
    <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: C.border, opacity }, style]} />
  );
}

function BoutiqueSkeletonCard() {
  return (
    <View style={{ width: BOUT_W, backgroundColor: C.card, borderRadius: 16, overflow: "hidden", marginRight: 14, ...Border.card }}>
      <SkeletonBox w="100%" h={120} r={0} />
      <View style={{ padding: 12, gap: 8 }}>
        <SkeletonBox w="70%" h={12} />
        <SkeletonBox w="45%" h={10} />
      </View>
    </View>
  );
}

function ProductSkeletonCard() {
  return (
    <View style={{ width: PROD_W, backgroundColor: C.card, borderRadius: 16, overflow: "hidden", ...Border.card }}>
      <SkeletonBox w="100%" h={120} r={0} />
      <View style={{ padding: 10, gap: 8 }}>
        <SkeletonBox w="90%" h={11} />
        <SkeletonBox w="60%" h={11} />
        <SkeletonBox w="40%" h={14} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Boutique type filter
// ─────────────────────────────────────────────────────────────────────────────
const BOUT_TYPES = [
  { key: "",             label: "Tous",         Icon: Grid },
  { key: "supermarche",  label: "Supermarché",  Icon: ShoppingBag },
  { key: "restaurant",   label: "Restaurant",   Icon: Coffee },
  { key: "electronique",  label: "Électronique",  Icon: Smartphone },
  { key: "arrivage",      label: "Arrivage",      Icon: Package },
  { key: "quincaillerie", label: "Quincaillerie", Icon: Tool },
  { key: "autre",         label: "Autre",         Icon: Star },
];

function BoutTypeChip({ item, active, onPress }: { item: typeof BOUT_TYPES[0]; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[cc.btn, active && cc.btnOn]} onPress={onPress} activeOpacity={0.75}>
      <item.Icon color={active ? "#fff" : C.textMuted} width={13} height={13} strokeWidth={2} />
      <Text style={[cc.label, active && cc.labelOn]} numberOfLines={1}>{item.label}</Text>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  btn:     { flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.full, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border },
  btnOn:   { backgroundColor: "#111", borderColor: "#111" },
  label:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  labelOn: { color: "#fff", fontFamily: F.medium },
});

const TYPE_LABELS: Record<string, string> = {
  restaurant:    "🍽️ Restaurant",
  arrivage:      "📦 Arrivage",
  supermarche:   "🛒 Supermarché",
  electronique:  "📱 Électronique",
  quincaillerie: "🔩 Quincaillerie",
  autre:         "🏪 Boutique",
};

// ─────────────────────────────────────────────────────────────────────────────
// Boutique card
// ─────────────────────────────────────────────────────────────────────────────
function BoutiqueCard({ item }: { item: any }) {
  const router = useRouter();
  const imgUri = item.image_url ?? null;
  const typeLabel = TYPE_LABELS[item.boutique_type] ?? "🏪 Boutique";
  return (
    <TouchableOpacity style={[boc.card, { width: BOUT_W }]}
      onPress={() => router.push(`/boutique/${item.slug}`)} activeOpacity={0.88}>
      <View style={boc.imgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={boc.img} contentFit="cover" />
          : <BoutiquePlaceholder boutiqueType={item.boutique_type} name={item.name} size="compact" />}
      </View>
      <View style={boc.info}>
        <Text style={boc.name} numberOfLines={1}>{item.name}</Text>
        <View style={boc.metaRow}>
          <View style={boc.typeBadge}>
            <Text style={boc.typeText}>{typeLabel}</Text>
          </View>
          {item.ville ? (
            <>
              <MapPin color={C.textMuted} width={11} height={11} />
              <Text style={boc.loc} numberOfLines={1}>{item.ville}</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const boc = StyleSheet.create({
  card:      { backgroundColor: "transparent", borderRadius: 0, overflow: "visible", marginRight: 14 },
  imgWrap:   { width: "100%", height: 192, borderRadius: 14, overflow: "hidden" },
  img:       { width: "100%", height: "100%" },
  info:      { paddingTop: 8, paddingBottom: 4 },
  name:      { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, marginBottom: 6 },
  metaRow:   { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBadge: { backgroundColor: C.goldLight, borderRadius: R.full,
    paddingHorizontal: 8, paddingVertical: 2 },
  typeText:  { fontFamily: F.medium, fontSize: 10, color: C.goldDark },
  loc:       { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, flexShrink: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Product card
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ item }: { item: any }) {
  const router = useRouter();
  const [hearted, setHearted] = useState(false);
  const image = item.primary_image_url ?? item.images?.[0]?.image_url ?? null;

  return (
    <TouchableOpacity style={[pc.card, { width: PROD_W }]}
      onPress={() => router.push(`/product/${item.slug}`)} activeOpacity={0.88}>
      <View style={pc.imgWrap}>
        {image
          ? <Image source={{ uri: image }} style={pc.img} contentFit="cover" />
          : <View style={pc.imgPh}><Text style={{ fontSize: 32 }}>📦</Text></View>}
        <TouchableOpacity
          style={pc.heartBtn}
          onPress={(e) => { e.stopPropagation?.(); setHearted(h => !h); }}
          activeOpacity={0.8}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Heart
            color={hearted ? "#ff4d6d" : "#ccc"}
            fill={hearted ? "#ff4d6d" : "none"}
            width={15} height={15}
          />
        </TouchableOpacity>
        {item.category_name
          ? <View style={pc.catBadge}><Text style={pc.catText}>{item.category_name}</Text></View>
          : null}
      </View>
      <View style={pc.info}>
        <Text style={pc.storeName} numberOfLines={1}>{item.boutique_name}</Text>
        <Text style={pc.name} numberOfLines={2}>{item.title}</Text>
        <View style={pc.priceRow}>
          <Text style={pc.price}>{parseFloat(item.price).toLocaleString("fr-FR")} <Text style={pc.currency}>MRU</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const pc = StyleSheet.create({
  card:     { backgroundColor: "transparent", borderRadius: 0, overflow: "visible" },
  imgWrap:  { width: "100%", height: 168, borderRadius: 14, overflow: "hidden", position: "relative" },
  img:      { width: "100%", height: "100%" },
  imgPh:    { width: "100%", height: "100%", backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center" },
  heartBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", ...Shadow.sm },
  catBadge: { position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: R.full },
  catText:  { fontFamily: F.medium, fontSize: 9, color: "#fff" },
  info:     { paddingTop: 8, paddingBottom: 6 },
  storeName:{ fontFamily: F.regular, fontSize: 10, color: "#555", marginBottom: 2 },
  name:     { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary,
    marginBottom: 4, lineHeight: 19 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price:    { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  currency: { fontFamily: F.medium, fontSize: Sz.xs, color: C.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Hero carousel
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    tag: "Livraison · توصيل",
    headline: "Livreurs\nprès de vous",
    sub: "Des livreurs disponibles 24h/24",
    cta: "Trouver →",
    route: "/(app)/boutiques",
  },
  {
    tag: "Offres · عروض",
    headline: "Économisez\njusqu'à 50%",
    sub: "Offres limitées, sélection du jour",
    cta: "Voir les offres →",
    route: "/(app)/boutiques",
  },
  {
    tag: "Nouveautés · جديد",
    headline: "Nouvelles\nboutiques",
    sub: "Des milliers de vendeurs locaux",
    cta: "Explorer →",
    route: "/(app)/boutiques",
  },
];

function HeroCarousel() {
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (active + 1) % SLIDES.length;
      scroll.current?.scrollTo({ x: next * (SNAP_W + 12), animated: true });
      setActive(next);
    }, 4200);
    return () => clearInterval(t);
  }, [active]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SNAP_W + 12));
    setActive(idx);
  };

  return (
    <View>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: S.screen, gap: 12, paddingVertical: 10 }}
        onMomentumScrollEnd={onScroll}
      >
        {SLIDES.map((slide, i) => (
          <TouchableOpacity
            key={i}
            style={[hero.card, { width: SNAP_W }]}
            onPress={() => router.push(slide.route as any)}
            activeOpacity={0.92}
          >
            <LinearGradient
              colors={["rgba(255,230,60,0.55)", "rgba(255,228,30,0.28)", "rgba(255,255,255,0.06)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={hero.circle} />
            <Text style={hero.moped}>🛵</Text>
            <View style={hero.tag}>
              <View style={hero.tagDot} />
              <Text style={hero.tagText}>{slide.tag}</Text>
            </View>
            <Text style={hero.headline}>{slide.headline}</Text>
            <Text style={hero.sub}>{slide.sub}</Text>
            <View style={hero.ctaBtn}>
              <Text style={hero.ctaText}>{slide.cta}</Text>
            </View>
            <View style={hero.dots}>
              {SLIDES.map((_, di) => (
                <View key={di} style={[hero.dot, di === active && hero.dotOn]} />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const hero = StyleSheet.create({
  card:     { borderRadius: 20, padding: 14, height: 145, overflow: "hidden",
    backgroundColor: "#FFFBEA",
    boxShadow: "0 6px 28px 8px rgba(255,225,50,0.45)" },
  circle:   { position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.gold, opacity: 0.08, top: -40, right: -30 },
  moped:    { position: "absolute", right: 8, top: 42, fontSize: 52 },
  tag:      { flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.07)", alignSelf: "flex-end",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: R.full, marginBottom: 5 },
  tagDot:   { width: 5, height: 5, borderRadius: R.full, backgroundColor: C.goldDark },
  tagText:  { fontFamily: F.medium, fontSize: Sz.xs, color: C.textSecondary },
  headline: { fontFamily: FA.bold, fontSize: 18, color: C.textPrimary,
    lineHeight: 20, marginBottom: 3, letterSpacing: -0.3, paddingRight: 64 },
  sub:      { fontFamily: F.regular, fontSize: 11, color: C.textSecondary,
    marginBottom: 8, lineHeight: 14, paddingRight: 64 },
  ctaBtn:   { backgroundColor: C.textPrimary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  ctaText:  { fontFamily: F.bold, fontSize: 11, color: C.gold },
  dots:     { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 6 },
  dot:      { width: 5, height: 5, borderRadius: R.full, backgroundColor: "rgba(0,0,0,0.18)" },
  dotOn:    { width: 16, borderRadius: R.full, backgroundColor: C.textPrimary },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [boutiques,       setBoutiques]       = useState<any[]>([]);
  const [boutType,        setBoutType]        = useState("");
  const [prods,           setProds]           = useState<any[]>([]);
  const [loadingBout,     setLoadingBout]     = useState(true);
  const [loadingProds,    setLoadingProds]    = useState(true);
  const [scrollY,         setScrollY]         = useState(0);
  const [bonnesAffairesY, setBonnesAffairesY] = useState(9999);

  const firstLoad = useRef(true);
  const { detectedCity, inMauritania: storedInMR, setLocation } = useLocationStore();

  // Detect city on every focus until we have a result — handles the case where
  // permission was granted AFTER the first mount (async permission dialog).
  useFocusEffect(useCallback(() => {
    if (storedInMR !== null) return; // already have a result, stop retrying
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        const inside = c.latitude >= 14.7 && c.latitude <= 27.3 && c.longitude >= -17.1 && c.longitude <= -4.8;
        const [place] = await Location.reverseGeocodeAsync(c);
        const label = place?.city ?? place?.subregion ?? place?.region ?? null;
        setLocation(c, inside, label);
      } catch {}
    })();
  }, [storedInMR]));

  useFocusEffect(useCallback(() => {
    // Show skeletons only on first mount, silent refresh on tab re-focus
    if (firstLoad.current) {
      firstLoad.current = false;
      setLoadingBout(true);
      setLoadingProds(true);
    }
    api.get("/boutiques/").then((d) => setBoutiques(d?.results ?? d ?? []))
      .catch(() => {}).finally(() => setLoadingBout(false));
    api.get("/products/?exclude_type=restaurant").then((d) => setProds(d?.results ?? d ?? []))
      .catch(() => {}).finally(() => setLoadingProds(false));
  }, []));

  const firstName = user?.first_name ?? null;
  const city = detectedCity ?? (user?.city && user.city.trim() !== "" ? user.city : "Mauritanie");
  const filteredBoutiques = boutiques.filter(b => boutType === "" || b.boutique_type === boutType);

  const bonnesAffairesSticky = scrollY >= bonnesAffairesY;

  return (
    <View style={s.root}>
      {/* Yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={s.gradientWash}
        pointerEvents="none"
      />

      {/* ── Fixed header ── */}
      <SafeAreaView edges={["top"]} style={s.safeHeader}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View>
              <Text style={s.locText}>{city}</Text>
              <Text style={s.greeting}>
                {firstName ? `مرحباً، ${firstName} 👋` : "مرحباً بك · Bienvenue 👋"}
              </Text>
            </View>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.iconBtn} activeOpacity={0.8}>
              <ShoppingBag color={C.textPrimary} width={20} height={20} />
              <View style={s.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} activeOpacity={0.8}>
              <Menu color={C.textPrimary} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={s.searchBar}
          onPress={() => router.push("/(app)/search" as any)}
          activeOpacity={0.85}
        >
          <Search color={C.textMuted} width={16} height={16} />
          <Text style={s.searchPlaceholder}>Rechercher produits, boutiques...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/*
       * ── Scrollable body ──
       * Exactly 5 direct children so stickyHeaderIndices=[1,3] works:
       *   [0] Hero carousel
       *   [1] Boutiques sticky header  ← yellow bg, sticks then gets pushed off by [3]
       *   [2] Boutiques content
       *   [3] Bonnes affaires sticky header  ← white bg, sticks after [1] is pushed off
       *   [4] Bonnes affaires content
       */}
      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[3]}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingBottom: S.tabBar + 20 }}
      >
        {/* [0] Hero */}
        <View style={{ paddingBottom: 8 }}>
          <HeroCarousel />
        </View>

        {/* [1] Boutiques header — normal scroll, no sticky */}
        <View style={s.stickyBase}>
          <View style={s.stickyRow}>
            <View>
              <Text style={s.stickyTitle}>Boutiques</Text>
              <Text style={s.stickySub}>محلات</Text>
            </View>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push("/boutiques-list" as any)} activeOpacity={0.7}>
              <Text style={s.seeAllText}>Tout voir</Text>
              <ChevronRight color={C.goldDark} width={13} height={13} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8, paddingBottom: 14 }}
          >
            {BOUT_TYPES.map((t) => (
              <BoutTypeChip key={t.key} item={t} active={boutType === t.key}
                onPress={() => setBoutType(t.key)} />
            ))}
          </ScrollView>
        </View>

        {/* [2] Boutiques content */}
        <View style={s.sectionContent}>
          {loadingBout ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: S.screen, gap: 14, paddingVertical: 12 }}>
              {[1, 2, 3].map(i => <BoutiqueSkeletonCard key={i} />)}
            </ScrollView>
          ) : filteredBoutiques.length === 0 ? (
            <Text style={s.empty}>Aucune boutique · لا محلات</Text>
          ) : (
            <FlatList
              data={filteredBoutiques}
              keyExtractor={(i) => String(i.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: S.screen, paddingVertical: 12 }}
              renderItem={({ item }) => <BoutiqueCard item={item} />}
            />
          )}
        </View>

        {/* [3] Bonnes affaires sticky header — warm cream when stuck, white when in-flow */}
        <View
          style={[s.stickyBase, bonnesAffairesSticky && s.stickyBonnesAffairesOn]}
          onLayout={(e) => setBonnesAffairesY(e.nativeEvent.layout.y)}
        >
          <View style={s.stickyRow}>
            <View>
              <Text style={s.stickyTitle}>Bonnes affaires</Text>
              <Text style={s.stickySub}>عروض</Text>
            </View>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push("/(app)/search" as any)} activeOpacity={0.7}>
              <Text style={s.seeAllText}>Tout voir</Text>
              <ChevronRight color={C.goldDark} width={13} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        {/* [4] Bonnes affaires content */}
        <View style={{ backgroundColor: C.bg, paddingTop: 8, paddingBottom: 8 }}>
          {loadingProds ? (
            <View style={s.prodGrid}>
              {[1, 2, 3, 4].map(i => <ProductSkeletonCard key={i} />)}
            </View>
          ) : prods.length === 0 ? (
            <Text style={s.empty}>Aucun produit · لا منتجات</Text>
          ) : (
            <View style={s.prodGrid}>
              {prods.map((p) => <ProductCard key={p.id} item={p} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  gradientWash:{ position: "absolute", top: 0, left: 0, right: 0, height: 400, zIndex: 0 },

  safeHeader:  { zIndex: 10 },
  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingTop: 4, paddingBottom: 14 },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  locText:     { fontFamily: F.medium, fontSize: Sz.xs, color: "rgba(0,0,0,0.55)", marginBottom: 2 },
  greeting:    { fontFamily: FA.bold, fontSize: Sz.lg, color: C.textPrimary, letterSpacing: -0.2 },

  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn:     { width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
    ...Shadow.sm, position: "relative" },
  notifDot:    { position: "absolute", top: 9, right: 9,
    width: 7, height: 7, borderRadius: R.full,
    backgroundColor: "#ff4d6d", borderWidth: 1.5, borderColor: "#fff" },

  searchBar:         { flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: S.screen, marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: R.full, paddingHorizontal: 16, height: 46,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.95)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  searchPlaceholder: { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted, flex: 1 },

  body: { flex: 1, zIndex: 5 },

  // Base: always white when in the scroll flow
  stickyBase: { backgroundColor: C.bg },

  // Applied when bonnes affaires is stuck at the top
  stickyBonnesAffairesOn: { backgroundColor: "#FFF9F0",
    borderBottomWidth: 1, borderBottomColor: C.border },

  // Shared sticky layout
  stickyRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: S.screen, paddingTop: 14, paddingBottom: 10 },
  stickyTitle: { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  stickySub:   { fontFamily: FA.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 1 },
  seeAllBtn:   { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText:  { fontFamily: F.bold, fontSize: Sz.sm, color: C.goldDark },

  sectionContent: { backgroundColor: C.bg },

  prodGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: S.screen, gap: 8 },
  empty:    { fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted,
    textAlign: "center", paddingVertical: 20, paddingHorizontal: S.screen },
});
