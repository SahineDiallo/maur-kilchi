import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions, Animated,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  MapPin, ChevronRight, ChevronDown,
  ShoppingBag, Coffee, Smartphone, Package,
  Shirt, Home as HomeIcon, Star, Grid, Heart, Menu,
} from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import BoutiquePlaceholder from "@/components/BoutiquePlaceholder";
import { C, F, FA, Sz, R, S, Shadow, Border } from "@/constants/theme";

const { width } = Dimensions.get("window");
const BOUT_W  = width * 0.60;
const PROD_W  = (width - S.screen * 2 - 12) / 2;
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
    <View style={{ width: BOUT_W, backgroundColor: C.card, borderRadius: 3, overflow: "hidden", marginRight: 14, ...Border.card }}>
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
    <View style={{ width: PROD_W, backgroundColor: C.card, borderRadius: 3, overflow: "hidden", ...Border.card }}>
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
// Category chip
// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICON_MAP: Record<string, any> = {
  supermarche: ShoppingBag, restaurant: Coffee, electronique: Smartphone,
  arrivage: Package, mode: Shirt, beaute: Star, maison: HomeIcon, autre: Grid,
};

function CatChip({ item, active, onPress }: { item: any; active: boolean; onPress: () => void }) {
  const Icon = CAT_ICON_MAP[item.slug] ?? Grid;
  return (
    <TouchableOpacity style={[cc.btn, active && cc.btnOn]} onPress={onPress} activeOpacity={0.75}>
      <Icon color={active ? "#000" : C.textMuted} width={13} height={13} strokeWidth={2} />
      <Text style={[cc.label, active && cc.labelOn]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  btn:     { flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 3, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border },
  btnOn:   { backgroundColor: C.gold, borderColor: C.gold },
  label:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  labelOn: { color: "#000", fontFamily: F.bold },
});

// ─────────────────────────────────────────────────────────────────────────────
// Boutique type filter
// ─────────────────────────────────────────────────────────────────────────────
const BOUT_TYPES = [
  { key: "",             label: "Tous",         Icon: Grid },
  { key: "supermarche",  label: "Supermarché",  Icon: ShoppingBag },
  { key: "restaurant",   label: "Restaurant",   Icon: Coffee },
  { key: "electronique", label: "Électronique", Icon: Smartphone },
  { key: "arrivage",     label: "Arrivage",     Icon: Package },
  { key: "autre",        label: "Autre",        Icon: Star },
];

function BoutTypeChip({ item, active, onPress }: { item: typeof BOUT_TYPES[0]; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[cc.btn, active && cc.btnOn]} onPress={onPress} activeOpacity={0.75}>
      <item.Icon color={active ? "#000" : C.textMuted} width={13} height={13} strokeWidth={2} />
      <Text style={[cc.label, active && cc.labelOn]} numberOfLines={1}>{item.label}</Text>
    </TouchableOpacity>
  );
}

const TYPE_LABELS: Record<string, string> = {
  restaurant:   "🍽️ Restaurant",
  arrivage:     "📦 Arrivage",
  supermarche:  "🛒 Supermarché",
  electronique: "📱 Électronique",
  autre:        "🏪 Boutique",
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
      onPress={() => router.push(`/boutique/${item.id}`)} activeOpacity={0.88}>
      <View style={boc.imgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={boc.img} resizeMode="cover" />
          : <BoutiquePlaceholder boutiqueType={item.boutique_type} name={item.name} size="compact" />}
        <View style={boc.typeBadge}>
          <Text style={boc.typeText}>{typeLabel}</Text>
        </View>
      </View>
      <View style={boc.info}>
        <Text style={boc.name} numberOfLines={1}>{item.name}</Text>
        {item.ville
          ? <View style={boc.locRow}>
              <MapPin color={C.textMuted} width={11} height={11} />
              <Text style={boc.loc} numberOfLines={1}>{item.ville}</Text>
            </View>
          : null}
      </View>
    </TouchableOpacity>
  );
}
const boc = StyleSheet.create({
  card:      { backgroundColor: C.card, borderRadius: 3, overflow: "hidden",
    ...Border.card, marginRight: 14, ...Shadow.md },
  imgWrap:   { width: "100%", height: 120, overflow: "hidden" },
  img:       { width: "100%", height: "100%" },
  typeBadge: { position: "absolute", bottom: 8, left: 10,
    backgroundColor: "rgba(0,0,0,0.52)", borderRadius: R.full,
    paddingHorizontal: 9, paddingVertical: 3 },
  typeText:  { fontFamily: F.medium, fontSize: 10, color: "#fff" },
  info:      { paddingHorizontal: 12, paddingVertical: 10 },
  name:      { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, marginBottom: 4 },
  locRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  loc:       { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Product card — v4 style with heart + yellow add button
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
          ? <Image source={{ uri: image }} style={pc.img} resizeMode="cover" />
          : <View style={pc.imgPh}><Text style={{ fontSize: 32 }}>📦</Text></View>}
        {/* Heart button */}
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
          <View>
            <Text style={pc.price}>{parseFloat(item.price).toLocaleString("fr-FR")} <Text style={pc.currency}>MRU</Text></Text>
          </View>
          <View style={pc.addBtn}>
            <Text style={pc.addText}>+</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const pc = StyleSheet.create({
  card:     { backgroundColor: C.card, borderRadius: 3, overflow: "hidden",
    ...Border.card, ...Shadow.md },
  imgWrap:  { width: "100%", height: 120, overflow: "hidden", position: "relative" },
  img:      { width: "100%", height: "100%" },
  imgPh:    { width: "100%", height: "100%", backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center" },
  heartBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28,
    borderRadius: 3, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", ...Shadow.sm },
  catBadge: { position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 3 },
  catText:  { fontFamily: F.medium, fontSize: 9, color: "#fff" },
  info:     { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  storeName:{ fontFamily: F.regular, fontSize: 10, color: C.textMuted, marginBottom: 2 },
  name:     { fontFamily: F.bold, fontSize: Sz.sm, color: C.textPrimary,
    marginBottom: 8, lineHeight: 17 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price:    { fontFamily: F.bold, fontSize: Sz.md, color: C.textPrimary },
  currency: { fontFamily: F.medium, fontSize: Sz.xs, color: C.textMuted },
  addBtn:   { width: 28, height: 28, borderRadius: 3, backgroundColor: C.gold,
    alignItems: "center", justifyContent: "center", ...Shadow.gold },
  addText:  { fontSize: 20, color: "#000", lineHeight: 24, fontFamily: F.bold },
});

// ─────────────────────────────────────────────────────────────────────────────
// Hero carousel — v4 style (yellow card + moped emoji)
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
        contentContainerStyle={{ paddingHorizontal: S.screen, gap: 12 }}
        onMomentumScrollEnd={onScroll}
      >
        {SLIDES.map((slide, i) => (
          <TouchableOpacity
            key={i}
            style={[hero.card, { width: SNAP_W }]}
            onPress={() => router.push(slide.route as any)}
            activeOpacity={0.92}
          >
            {/* Light yellow gradient background */}
            <LinearGradient
              colors={["rgba(255,230,60,0.55)", "rgba(255,228,30,0.28)", "rgba(255,255,255,0.06)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Decorative circle */}
            <View style={hero.circle} />

            {/* Tag pill */}
            <View style={hero.tag}>
              <View style={hero.tagDot} />
              <Text style={hero.tagText}>{slide.tag}</Text>
            </View>

            {/* Content row */}
            <View style={hero.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={hero.headline}>{slide.headline}</Text>
                <Text style={hero.sub}>{slide.sub}</Text>
                <View style={hero.ctaBtn}>
                  <Text style={hero.ctaText}>{slide.cta}</Text>
                </View>
              </View>
              {/* Moped illustration */}
              <Text style={hero.moped}>🛵</Text>
            </View>

            {/* Dots inside card */}
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
  card:     { borderRadius: 3, padding: 20, minHeight: 170, overflow: "hidden",
    backgroundColor: "#FFFBEA",
    boxShadow: "0 6px 28px 8px rgba(255,225,50,0.45)" },
  circle:   { position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.gold, opacity: 0.08, top: -60, right: -40 },
  tag:      { flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.07)", alignSelf: "flex-start",
    paddingHorizontal: 11, paddingVertical: 4, borderRadius: R.full, marginBottom: 14 },
  tagDot:   { width: 5, height: 5, borderRadius: R.full, backgroundColor: C.goldDark },
  tagText:  { fontFamily: F.medium, fontSize: Sz.xs, color: C.textSecondary },
  row:      { flexDirection: "row", alignItems: "flex-end" },
  headline: { fontFamily: FA.bold, fontSize: 24, color: C.textPrimary,
    lineHeight: 28, marginBottom: 6, letterSpacing: -0.3 },
  sub:      { fontFamily: F.regular, fontSize: Sz.sm, color: C.textSecondary,
    marginBottom: 16, lineHeight: 17 },
  ctaBtn:   { backgroundColor: C.textPrimary, borderRadius: 3,
    paddingHorizontal: 16, paddingVertical: 10, alignSelf: "flex-start" },
  ctaText:  { fontFamily: F.bold, fontSize: Sz.sm, color: C.gold },
  moped:    { fontSize: 72, marginBottom: -8, marginRight: -4 },
  dots:     { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 16 },
  dot:      { width: 5, height: 5, borderRadius: R.full, backgroundColor: "rgba(0,0,0,0.18)" },
  dotOn:    { width: 16, borderRadius: R.full, backgroundColor: C.textPrimary },
});

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ title, sub, onSeeAll }: { title: string; sub?: string; onSeeAll: () => void }) {
  return (
    <View style={sh.row}>
      <View>
        <Text style={sh.title}>{title}</Text>
        {sub ? <Text style={sh.sub}>{sub}</Text> : null}
      </View>
      <TouchableOpacity style={sh.btn} onPress={onSeeAll} activeOpacity={0.7}>
        <Text style={sh.all}>Tout voir</Text>
        <ChevronRight color={C.goldDark} width={13} height={13} />
      </TouchableOpacity>
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: S.screen, marginBottom: S.px12 },
  title: { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  sub:   { fontFamily: FA.regular, fontSize: Sz.sm, color: C.textMuted, marginTop: 1 },
  btn:   { flexDirection: "row", alignItems: "center", gap: 2 },
  all:   { fontFamily: F.bold, fontSize: Sz.sm, color: C.goldDark },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cats,         setCats]         = useState<any[]>([]);
  const [activeCat,    setActiveCat]    = useState<string | null>(null);
  const [boutiques,    setBoutiques]    = useState<any[]>([]);
  const [boutType,     setBoutType]     = useState("");
  const [prods,        setProds]        = useState<any[]>([]);
  const [loadingBout,  setLoadingBout]  = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);
  const [heroHeight,   setHeroHeight]   = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    api.get("/categories/").then((d) => {
      const list: any[] = d?.results ?? d ?? [];
      setCats(list.filter((c: any) => !c.parent).slice(0, 10));
    }).catch(() => {});

    api.get("/boutiques/").then((d) => {
      setBoutiques(d?.results ?? d ?? []);
    }).catch(() => {}).finally(() => setLoadingBout(false));

    api.get("/products/").then((d) => {
      setProds(d?.results ?? d ?? []);
    }).catch(() => {}).finally(() => setLoadingProds(false));
  }, []);

  useFocusEffect(useCallback(() => {
    api.get("/boutiques/").then((d) => setBoutiques(d?.results ?? d ?? [])).catch(() => {});
    api.get("/products/").then((d) => setProds(d?.results ?? d ?? [])).catch(() => {});
  }, []));

  const onCatPress = (cat: any) => {
    setActiveCat(activeCat === cat.slug ? null : cat.slug);
  };

  const firstName = user?.first_name ?? null;
  const city = user?.city && user.city.trim() !== "" ? user.city : "Mauritanie";

  return (
    <View style={s.root}>
      {/* Yellow gradient wash behind header */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={s.gradientWash}
        pointerEvents="none"
      />

      {/* ── Fixed header ── */}
      <SafeAreaView edges={["top"]} style={s.safeHeader}>
        <View style={s.headerRow}>
          {/* Left: avatar + greeting */}
          <View style={s.headerLeft}>
            <LinearGradient
              colors={[C.goldDark, C.gold]}
              style={s.avatar}
            >
              <Text style={s.avatarEmoji}>🧡</Text>
            </LinearGradient>
            <View>
              <View style={s.locRow}>
                <MapPin color="rgba(0,0,0,0.55)" width={12} height={12} />
                <Text style={s.locText}>{city}</Text>
                <ChevronDown color="rgba(0,0,0,0.45)" width={11} height={11} />
              </View>
              <Text style={s.greeting}>
                {firstName ? `مرحباً، ${firstName} 👋` : "مرحباً بك · Bienvenue 👋"}
              </Text>
            </View>
          </View>

          {/* Right: bag + menu */}
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
      </SafeAreaView>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={cats.length > 0 ? [1] : []}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const sticky = heroHeight > 0 && y >= heroHeight;
          if (sticky !== isSticky) setIsSticky(sticky);
        }}
        contentContainerStyle={{ paddingBottom: S.tabBar + 20 }}
      >
        {/* index 0 — Hero carousel */}
        <View onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)} style={{ paddingBottom: 16 }}>
          <HeroCarousel />
        </View>

        {/* index 1 — Categories (sticky) */}
        <View style={[s.stickyBar, isSticky && s.stickyBarActive]}>
          {isSticky && (
            <LinearGradient
              colors={["#FFEE80", "#FFF4A8", "#FFF8C4", "#FFF6C0"]}
              locations={[0, 0.35, 0.7, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {cats.length > 0 && <>
            <View style={s.stickyBarInner}>
              <Text style={s.stickyTitle}>Catégories</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/boutiques" as any)}
                style={sh.btn} activeOpacity={0.7}>
                <Text style={sh.all}>Tout voir</Text>
                <ChevronRight color={C.goldDark} width={13} height={13} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8, paddingBottom: 12 }}>
              {cats.map((item) => (
                <CatChip key={String(item.id)} item={item}
                  active={activeCat === item.slug} onPress={() => onCatPress(item)} />
              ))}
            </ScrollView>
          </>}
        </View>

        {/* Boutiques */}
        <View style={{ marginBottom: S.section, backgroundColor: C.bg }}>
          <SectionHead
            title="Boutiques"
            sub="محلات"
            onSeeAll={() => router.push("/boutiques-list" as any)}
          />
          {/* Type filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8, marginBottom: 12 }}>
            {BOUT_TYPES.map((t) => (
              <BoutTypeChip key={t.key} item={t} active={boutType === t.key}
                onPress={() => setBoutType(t.key)} />
            ))}
          </ScrollView>
          {loadingBout
            ? <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: S.screen, gap: 14 }}>
                {[1,2,3].map(i => <BoutiqueSkeletonCard key={i} />)}
              </ScrollView>
            : boutiques.filter(b => boutType === "" || b.boutique_type === boutType).length === 0
              ? <Text style={s.empty}>Aucune boutique · لا محلات</Text>
              : <FlatList
                  data={boutiques.filter(b => boutType === "" || b.boutique_type === boutType)}
                  keyExtractor={(i) => String(i.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: S.screen }}
                  renderItem={({ item }) => <BoutiqueCard item={item} />}
                />}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Products — Bonnes affaires */}
        <View style={{ marginTop: S.section }}>
          <SectionHead
            title="Bonnes affaires"
            sub="عروض"
            onSeeAll={() => router.push("/(app)/products" as any)}
          />
          {loadingProds
            ? <View style={s.prodGrid}>
                {[1,2,3,4].map(i => <ProductSkeletonCard key={i} />)}
              </View>
            : prods.length === 0
              ? <Text style={s.empty}>Aucun produit · لا منتجات</Text>
              : <View style={s.prodGrid}>
                  {prods.map((p) => <ProductCard key={p.id} item={p} />)}
                </View>}
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
  avatar:      { width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    boxShadow: `0 3px 12px ${C.gold}88` },
  avatarEmoji: { fontSize: 22 },
  locRow:      { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  locText:     { fontFamily: F.medium, fontSize: Sz.xs, color: "rgba(0,0,0,0.55)" },
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

  body:        { flex: 1, zIndex: 5 },

  stickyBar:      { backgroundColor: "transparent" },
  stickyBarActive:{ },
  stickyBarInner: { flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: S.screen, marginBottom: 10 },
  stickyTitle:    { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  prodGrid:    { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: S.screen, gap: 12 },
  empty:       { fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted,
    textAlign: "center", paddingVertical: 20, paddingHorizontal: S.screen },
  divider:     { height: 1, backgroundColor: C.border, marginHorizontal: S.screen },
});
