import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, ScrollView,
  Animated, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, MapPin, ChevronRight, Sliders } from "react-native-feather";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/lib/api";
import { C, F, Sz, S, R } from "@/constants/theme";

const { width, height: SCREEN_H } = Dimensions.get("window");
const INK  = "#111";
const INK2 = "#555";
const INK3 = "#999";
const Y    = C.gold;
const SURF = "#F6F4EF";
const CARD_W = width * 0.42;
const GRID_W = (width - S.screen * 2 - 8) / 2;

type FilterCat = {
  id: number; name: string; slug: string; icon?: string;
  subcategories?: { id: number; name: string; slug: string; icon?: string }[];
};

// ─── Compact product card (horizontal explorer 2-row rows) ───────────────────
function CompactCard({ item }: { item: any }) {
  const router = useRouter();
  const image  = item.primary_image_url ?? item.primary_image ?? null;
  return (
    <TouchableOpacity
      style={[cp.card, { width: CARD_W }]}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.85}
    >
      <View style={cp.img}>
        {image
          ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={cp.ph}><Text style={{ fontSize: 26 }}>📦</Text></View>}
      </View>
      <View style={cp.info}>
        {item.boutique_name
          ? <Text style={cp.store} numberOfLines={1}>{item.boutique_name}</Text>
          : null}
        <Text style={cp.name} numberOfLines={2}>{item.title}</Text>
        <Text style={cp.price}>{parseFloat(item.price).toLocaleString("fr-FR")} <Text style={cp.cur}>MRU</Text></Text>
      </View>
    </TouchableOpacity>
  );
}
const cp = StyleSheet.create({
  card:  { backgroundColor: "transparent", overflow: "visible", marginRight: 10 },
  img:   { width: "100%", height: 148, borderRadius: 12, overflow: "hidden", backgroundColor: SURF },
  ph:    { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  info:  { paddingTop: 8, paddingBottom: 4 },
  store: { fontFamily: F.regular, fontSize: 10, color: INK2, marginBottom: 2 },
  name:  { fontFamily: F.bold, fontSize: Sz.base, color: INK, lineHeight: 19, marginBottom: 4 },
  price: { fontFamily: F.bold, fontSize: 14, color: INK },
  cur:   { fontFamily: F.regular, fontSize: 10, color: INK3 },
});

// ─── Grid card (search results + filtered catalogue) ────────────────────────
function GridCard({ item }: { item: any }) {
  const router = useRouter();
  const image  = item.primary_image_url ?? item.primary_image ?? null;
  return (
    <TouchableOpacity
      style={[gc.card, { width: GRID_W }]}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.85}
    >
      <View style={gc.img}>
        {image
          ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={gc.ph}><Text style={{ fontSize: 26 }}>📦</Text></View>}
      </View>
      <View style={gc.info}>
        {item.category_name
          ? <Text style={gc.cat} numberOfLines={1}>{item.category_name}</Text>
          : null}
        <Text style={gc.name} numberOfLines={2}>{item.title}</Text>
        <Text style={gc.price}>{parseFloat(item.price).toLocaleString("fr-FR")} <Text style={gc.cur}>MRU</Text></Text>
        {item.boutique_name
          ? <Text style={gc.shop} numberOfLines={1}>{item.boutique_name}</Text>
          : null}
      </View>
    </TouchableOpacity>
  );
}
const gc = StyleSheet.create({
  card:  { backgroundColor: "transparent", overflow: "visible" },
  img:   { width: "100%", height: 148, borderRadius: 12, overflow: "hidden", backgroundColor: SURF },
  ph:    { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  info:  { paddingTop: 8, paddingBottom: 4 },
  cat:   { fontFamily: F.medium, fontSize: 9, color: Y, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  name:  { fontFamily: F.bold, fontSize: Sz.base, color: INK, lineHeight: 19, marginBottom: 4 },
  price: { fontFamily: F.bold, fontSize: 14, color: INK, marginBottom: 2 },
  cur:   { fontFamily: F.regular, fontSize: 9, color: INK3 },
  shop:  { fontFamily: F.regular, fontSize: 10, color: INK2 },
});

// ─── Search result: boutique row ─────────────────────────────────────────────
function BoutiqueRow({ item }: { item: any }) {
  const router = useRouter();
  const imgUri = item.image_url ?? null;
  return (
    <TouchableOpacity style={br.card} onPress={() => router.push(`/boutique/${item.slug}`)} activeOpacity={0.85}>
      <View style={br.imgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={br.img} resizeMode="cover" />
          : <View style={br.ph}><Text style={{ fontSize: 24 }}>🏪</Text></View>}
      </View>
      <View style={br.info}>
        <Text style={br.name} numberOfLines={1}>{item.name}</Text>
        {item.description ? <Text style={br.desc} numberOfLines={2}>{item.description}</Text> : null}
        {item.ville
          ? <View style={br.loc}><MapPin color={INK3} width={10} height={10} /><Text style={br.locText}>{item.ville}</Text></View>
          : null}
      </View>
      <ChevronRight color={INK3} width={16} height={16} />
    </TouchableOpacity>
  );
}
const br = StyleSheet.create({
  card:    { flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.07)" },
  imgWrap: { width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0 },
  img:     { width: "100%", height: "100%" },
  ph:      { width: "100%", height: "100%", backgroundColor: SURF, alignItems: "center", justifyContent: "center" },
  info:    { flex: 1 },
  name:    { fontFamily: F.bold, fontSize: Sz.base, color: INK, marginBottom: 3 },
  desc:    { fontFamily: F.regular, fontSize: 11, color: INK2, lineHeight: 15, marginBottom: 4 },
  loc:     { flexDirection: "row", alignItems: "center", gap: 3 },
  locText: { fontFamily: F.regular, fontSize: 10, color: INK3 },
});

// ─── Skeleton section ─────────────────────────────────────────────────────────
function SkeletonSection() {
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
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: S.screen, marginBottom: 12 }}>
        <Animated.View style={{ width: 130, height: 14, borderRadius: 7, backgroundColor: SURF, opacity }} />
        <Animated.View style={{ width: 56, height: 12, borderRadius: 6, backgroundColor: SURF, opacity }} />
      </View>
      <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: S.screen, gap: 10 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ width: CARD_W, borderRadius: 14, overflow: "hidden" }}>
            <Animated.View style={{ width: CARD_W, height: 148, backgroundColor: SURF, opacity }} />
            <View style={{ paddingTop: 8, gap: 7 }}>
              <Animated.View style={{ width: "80%", height: 10, borderRadius: 5, backgroundColor: SURF, opacity }} />
              <Animated.View style={{ width: "50%", height: 10, borderRadius: 5, backgroundColor: SURF, opacity }} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Explorer section (2-row horizontal grid) ────────────────────────────────
function ExplorerSection({ cat }: { cat: any }) {
  const router = useRouter();
  const prods: any[] = cat.products ?? [];
  const mid  = Math.ceil(prods.length / 2);
  const row1 = prods.slice(0, mid);
  const row2 = prods.slice(mid);

  return (
    <View style={{ marginBottom: 28 }}>
      <TouchableOpacity style={es.head} onPress={() => router.push(`/categories/${cat.slug}`)} activeOpacity={0.7}>
        <Text style={es.title}>{cat.icon ? `${cat.icon}  ` : ""}{cat.name}</Text>
        <View style={es.viewAll}>
          <Text style={es.viewAllText}>Voir tout</Text>
          <ChevronRight color={Y} width={13} height={13} />
        </View>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {row1.map((p: any) => <CompactCard key={p.id ?? p.slug} item={p} />)}
          </View>
          {row2.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {row2.map((p: any) => <CompactCard key={p.id ?? p.slug} item={p} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
const es = StyleSheet.create({
  head:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, marginBottom: 12 },
  title:       { fontFamily: F.bold, fontSize: 16, color: INK },
  viewAll:     { flexDirection: "row", alignItems: "center", gap: 3 },
  viewAllText: { fontFamily: F.bold, fontSize: 12, color: Y },
});

// ─── Result section header ────────────────────────────────────────────────────
function ResultSection({ title, count }: { title: string; count: number }) {
  return (
    <View style={rs.row}>
      <Text style={rs.title}>{title}</Text>
      <View style={rs.badge}><Text style={rs.badgeText}>{count}</Text></View>
    </View>
  );
}
const rs = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: S.screen, marginBottom: 12, marginTop: 6 },
  title:     { fontFamily: F.bold, fontSize: 15, color: INK },
  badge:     { backgroundColor: "rgba(245,196,0,0.18)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontFamily: F.bold, fontSize: 11, color: C.goldDark },
});

// ─── Filter bottom-sheet modal ────────────────────────────────────────────────
function FilterModal({
  visible, headerH, loading, categories, activeCat, onSelect, onClose,
}: {
  visible: boolean;
  headerH: number;
  loading: boolean;
  categories: FilterCat[];
  activeCat: FilterCat | null;
  onSelect: (cat: FilterCat | null) => void;
  onClose: () => void;
}) {
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const [sidebarCat, setSidebarCat] = useState<FilterCat | null>(null);

  // Animate open/close when visibility changes
  useEffect(() => {
    if (visible) {
      slideY.setValue(SCREEN_H);
      Animated.timing(slideY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  // Populate sidebar default when categories arrive
  useEffect(() => {
    if (!sidebarCat && categories.length > 0) setSidebarCat(categories[0]);
  }, [categories]);

  const close = () =>
    Animated.timing(slideY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(onClose);

  const select = (cat: FilterCat | null) =>
    Animated.timing(slideY, { toValue: SCREEN_H, duration: 180, useNativeDriver: true }).start(() => {
      onSelect(cat);
      onClose();
    });

  // Always mounted — Modal handles its own visibility, no unmount overhead
  const subs = sidebarCat?.subcategories ?? [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Transparent full-screen tap-to-close backdrop — no dark overlay on header */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={close} activeOpacity={1} />

      {/* Sheet — absolutely pinned from headerH to bottom, header stays clean */}
      <Animated.View style={[fm.sheet, { top: headerH, transform: [{ translateY: slideY }] }]}>
          <View style={fm.handle} />

          <View style={fm.body}>
            {/* ── Left sidebar: parent categories ── */}
            <ScrollView style={fm.sidebar} showsVerticalScrollIndicator={false}>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <View key={i} style={fm.sideItem}>
                    <View style={[fm.skeletonLine, { width: "70%", marginBottom: 4 }]} />
                    <View style={[fm.skeletonLine, { width: "50%" }]} />
                  </View>
                ))
              ) : (
                <>
                  <TouchableOpacity
                    style={[fm.sideItem, !activeCat && !sidebarCat && fm.sideItemOn]}
                    onPress={() => select(null)}
                  >
                    <Text style={[fm.sideLabel, !activeCat && !sidebarCat && fm.sideLabelOn]}>
                      🍴{"\n"}Tous
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.slug}
                      style={[fm.sideItem, sidebarCat?.slug === cat.slug && fm.sideItemOn]}
                      onPress={() => setSidebarCat(cat)}
                    >
                      <Text style={[fm.sideLabel, sidebarCat?.slug === cat.slug && fm.sideLabelOn]} numberOfLines={3}>
                        {cat.icon ? `${cat.icon}\n` : ""}{cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            {/* ── Right panel: subcategories of selected parent ── */}
            <ScrollView style={fm.panel} showsVerticalScrollIndicator={false}
              contentContainerStyle={fm.panelContent}>
              {loading ? (
                [1,2,3].map(i => (
                  <View key={i} style={[fm.chip, { opacity: 0.3 }]}>
                    <View style={[fm.skeletonLine, { width: "60%" }]} />
                  </View>
                ))
              ) : sidebarCat ? (
                <>
                  {/* "All of this parent" chip */}
                  <TouchableOpacity
                    style={[fm.chip, activeCat?.slug === sidebarCat.slug && fm.chipOn]}
                    onPress={() => select(sidebarCat)}
                  >
                    <Text style={[fm.chipText, activeCat?.slug === sidebarCat.slug && fm.chipTextOn]}>
                      Tous · {sidebarCat.name}
                    </Text>
                  </TouchableOpacity>

                  {subs.map(sub => (
                    <TouchableOpacity
                      key={sub.slug}
                      style={[fm.chip, activeCat?.slug === sub.slug && fm.chipOn]}
                      onPress={() => select(sub)}
                    >
                      <Text style={[fm.chipText, activeCat?.slug === sub.slug && fm.chipTextOn]}>
                        {sub.icon ? `${sub.icon}  ` : ""}{sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <Text style={fm.hint}>← Choisissez une catégorie</Text>
              )
              }
            </ScrollView>
          </View>
        </Animated.View>
    </Modal>
  );
}
const fm = StyleSheet.create({
  sheet:       {
    position: "absolute", left: 0, right: 0, bottom: 0,
    // top is set inline via headerH prop
    backgroundColor: "#fff",
    borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10, shadowRadius: 14, elevation: 14,
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0",
    alignSelf: "center", marginTop: 10, marginBottom: 4 },
  body:        { flex: 1, flexDirection: "row" },

  sidebar:     { flex: 2, backgroundColor: "#F7F7F7",
    borderRightWidth: 1, borderRightColor: "#EBEBEB" },
  sideItem:    { paddingHorizontal: 12, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sideItemOn:  { backgroundColor: "#fff", borderLeftWidth: 3, borderLeftColor: C.gold },
  sideLabel:   { fontFamily: F.medium, fontSize: 11, color: INK2, lineHeight: 15, textAlign: "center" },
  sideLabelOn: { fontFamily: F.bold, color: C.goldDark },

  panel:       { flex: 3 },
  panelContent:{ padding: 14, gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10,
    backgroundColor: "#F5F5F5" },
  chipOn:      { backgroundColor: C.goldLight },
  chipText:    { fontFamily: F.medium, fontSize: 13, color: INK },
  chipTextOn:  { fontFamily: F.bold, color: C.goldDark },
  hint:         { fontFamily: F.regular, fontSize: 13, color: INK3,
    textAlign: "center", marginTop: 48 },
  skeletonLine: { height: 9, borderRadius: 5, backgroundColor: "#E0E0E0" },
});

// Two independent module-level caches — each resolves at its own pace
let _filterCatsCache: FilterCat[] | null = null;   // fast: no products
let _explorerCatsCache: any[]    | null = null;    // slow: includes products

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Explorer() {
  const router  = useRouter();
  const { q }   = useLocalSearchParams<{ q?: string }>();

  const scrollY      = useRef(new Animated.Value(0)).current;
  const inputRef     = useRef<TextInput>(null);
  const searchWrapRef = useRef<View>(null);

  const [query,          setQuery]          = useState(q ?? "");
  const [categories,     setCategories]     = useState<any[]>(_explorerCatsCache ?? []);
  const [filterModalCats,setFilterModalCats]= useState<FilterCat[]>(_filterCatsCache ?? []);
  const [loadingCats,    setLoadingCats]    = useState(_explorerCatsCache === null);
  const [products,       setProducts]       = useState<any[]>([]);
  const [boutiques,      setBoutiques]      = useState<any[]>([]);
  const [loadingSearch,  setLoadingSearch]  = useState(false);
  const [searched,       setSearched]       = useState(false);
  const [filterCat,      setFilterCat]      = useState<FilterCat | null>(null);
  const [filterProducts, setFilterProducts] = useState<any[]>([]);
  const [loadingFilter,  setLoadingFilter]  = useState(false);
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [headerH,        setHeaderH]        = useState(0);

  // ── Load filter categories first (fast — no products) ──────────────────────
  useEffect(() => {
    if (_filterCatsCache !== null) return;
    api.get("/categories/")
      .then((d: any) => {
        _filterCatsCache = Array.isArray(d)
          ? d.filter((c: any) => !c.boutique_types?.includes("restaurant"))
          : [];
        setFilterModalCats(_filterCatsCache);
      })
      .catch(() => { _filterCatsCache = []; });
  }, []);

  // ── Load explorer sections separately (slower — includes products) ──────────
  useEffect(() => {
    if (_explorerCatsCache !== null) return;
    setLoadingCats(true);
    api.get("/categories/explorer/")
      .then((d: any) => {
        _explorerCatsCache = Array.isArray(d) ? d : [];
        setCategories(_explorerCatsCache);
      })
      .catch(() => { _explorerCatsCache = []; })
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Fetch products when filter category changes ─────────────────────────────
  useEffect(() => {
    if (!filterCat) { setFilterProducts([]); return; }
    setLoadingFilter(true);
    api.get(`/products/?category=${filterCat.slug}&exclude_type=restaurant`)
      .then(d => setFilterProducts(d?.results ?? d ?? []))
      .catch(() => setFilterProducts([]))
      .finally(() => setLoadingFilter(false));
  }, [filterCat]);

  // ── Search (debounced 350 ms, min 3 chars) ─────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setProducts([]); setBoutiques([]); setSearched(false); setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    const t = setTimeout(async () => {
      try {
        const enc = encodeURIComponent(trimmed);
        const [pd, bd] = await Promise.all([
          api.get(`/products/?search=${enc}`),
          api.get(`/boutiques/?search=${enc}`),
        ]);
        setProducts(pd?.results ?? pd ?? []);
        setBoutiques(bd?.results ?? bd ?? []);
        setSearched(true);
      } catch {
        setProducts([]); setBoutiques([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // ── Animated values ────────────────────────────────────────────────────────
  const bigTitleOpacity   = scrollY.interpolate({ inputRange: [0, 55],  outputRange: [1, 0], extrapolate: "clamp" });
  const bigTitleTranslate = scrollY.interpolate({ inputRange: [0, 55],  outputRange: [0, -18], extrapolate: "clamp" });
  const smallTitleOpacity = scrollY.interpolate({ inputRange: [40, 80], outputRange: [0, 1],  extrapolate: "clamp" });
  const yellowOpacity     = scrollY.interpolate({ inputRange: [0, 80],  outputRange: [1, 0],  extrapolate: "clamp" });

  const isSearching  = query.trim().length >= 3;
  const isFiltered   = !isSearching && filterCat !== null;
  const showExplorer = !isSearching && filterCat === null;
  const noResults    = searched && products.length === 0 && boutiques.length === 0;

  return (
    <View style={s.root}>

      {/* Yellow gradient */}
      <Animated.View style={[s.gradientLayer, { opacity: yellowOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={["#FFE14D", "#FFF8A0", "rgba(255,255,255,0)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── Sticky header ── */}
      <SafeAreaView style={s.headerSafe}>
        <View style={s.titleRow}>
          <Animated.Text style={[s.bigTitle, { opacity: bigTitleOpacity, transform: [{ translateY: bigTitleTranslate }] }]}>
            Explorer · استكشاف
          </Animated.Text>
          <Animated.Text style={[s.smallTitle, { opacity: smallTitleOpacity }]}>
            Explorer
          </Animated.Text>
        </View>

        {/* Search bar row with filter button */}
        <View
          ref={searchWrapRef}
          style={s.searchWrap}
          onLayout={() => {
            searchWrapRef.current?.measureInWindow((_x, y, _w, h) => {
              setHeaderH(y + h);
            });
          }}
        >
          <View style={s.searchRow}>
            {/* Filter icon */}
            <TouchableOpacity
              style={[s.filterBtn, filterCat && s.filterBtnOn]}
              onPress={() => setFilterOpen(true)}
              activeOpacity={0.8}
            >
              <Sliders color={filterCat ? C.goldDark : INK2} width={18} height={18} />
              {filterCat ? <View style={s.filterDot} /> : null}
            </TouchableOpacity>

            {/* Search input */}
            <TouchableOpacity
              style={s.searchBox}
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
            >
              <Search color={INK3} width={16} height={16} />
              <TextInput
                ref={inputRef}
                style={s.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher produits, boutiques..."
                placeholderTextColor={INK3}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={INK3} width={15} height={15} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Char hint */}
          {query.length > 0 && query.trim().length < 3 && (
            <Text style={s.charHint}>
              {3 - query.trim().length} lettre{3 - query.trim().length > 1 ? "s" : ""} de plus...
            </Text>
          )}

          {/* Active filter chip */}
          {filterCat && !isSearching && (
            <View style={s.filterChipRow}>
              <View style={s.filterChip}>
                {filterCat.icon ? <Text style={{ fontSize: 12 }}>{filterCat.icon}</Text> : null}
                <Text style={s.filterChipText}>{filterCat.name}</Text>
                <TouchableOpacity
                  onPress={() => setFilterCat(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X color={C.goldDark} width={12} height={12} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      {loadingSearch ? (
        <ActivityIndicator color={Y} style={{ marginTop: 40 }} />
      ) : (
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: S.tabBar + 24 }}
        >
          {showExplorer ? (
            /* ── Explorer catalogue ── */
            <View style={{ paddingTop: 8 }}>
              {loadingCats
                ? [1, 2, 3].map(i => <SkeletonSection key={i} />)
                : categories.map(cat => <ExplorerSection key={cat.slug} cat={cat} />)}
            </View>

          ) : isFiltered ? (
            /* ── Filtered catalogue ── */
            loadingFilter ? (
              <ActivityIndicator color={Y} style={{ marginTop: 40 }} />
            ) : (
              <View style={{ paddingTop: 4 }}>
                <ResultSection title={filterCat!.name} count={filterProducts.length} />
                {filterProducts.length === 0 ? (
                  <Text style={s.emptyInline}>Aucun produit dans cette catégorie</Text>
                ) : (
                  <View style={s.grid}>
                    {filterProducts.map(p => <GridCard key={p.id ?? p.slug} item={p} />)}
                  </View>
                )}
              </View>
            )

          ) : noResults ? (
            /* ── No results ── */
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 52 }}>🔍</Text>
              <Text style={s.emptyTitle}>Aucun résultat pour "{query}"</Text>
              <Text style={s.emptySub}>Essayez un autre mot · جرب كلمة أخرى</Text>
            </View>

          ) : (
            /* ── Search results ── */
            <View style={{ paddingTop: 4 }}>
              {products.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <ResultSection title="Produits · منتجات" count={products.length} />
                  <View style={s.grid}>
                    {products.map(p => <GridCard key={p.id ?? p.slug} item={p} />)}
                  </View>
                </View>
              )}
              {boutiques.length > 0 && (
                <View>
                  <ResultSection title="Boutiques · محلات" count={boutiques.length} />
                  <View style={s.list}>
                    {boutiques.map(b => <BoutiqueRow key={b.id} item={b} />)}
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.ScrollView>
      )}

      {/* ── Filter modal ── */}
      <FilterModal
        visible={filterOpen}
        headerH={headerH}
        loading={loadingCats}
        categories={filterModalCats}
        activeCat={filterCat}
        onSelect={setFilterCat}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#fff" },
  gradientLayer:{ position: "absolute", top: 0, left: 0, right: 0, height: 320, zIndex: 0 },
  headerSafe:   { zIndex: 10 },

  titleRow:     { height: 42, justifyContent: "flex-end", paddingHorizontal: S.screen, marginBottom: 8 },
  bigTitle:     { position: "absolute", bottom: 0, left: S.screen, right: S.screen,
    fontFamily: F.bold, fontSize: 26, color: INK, letterSpacing: -0.4 },
  smallTitle:   { position: "absolute", bottom: 0, left: S.screen, right: S.screen,
    fontFamily: F.bold, fontSize: 17, color: INK, letterSpacing: -0.2 },

  searchWrap:   { paddingHorizontal: S.screen, paddingBottom: 10 },
  searchRow:    { flexDirection: "row", alignItems: "center", gap: 10 },

  filterBtn:    { width: 46, height: 46, borderRadius: 14,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  filterBtnOn:  { borderColor: C.gold, backgroundColor: C.goldLight },
  filterDot:    { position: "absolute", top: 9, right: 9,
    width: 7, height: 7, borderRadius: R.full, backgroundColor: C.gold },

  searchBox:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  input:        { flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: INK },
  charHint:     { fontFamily: F.regular, fontSize: Sz.xs, color: INK3, marginTop: 5 },

  filterChipRow:{ flexDirection: "row", marginTop: 8 },
  filterChip:   { flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.goldLight, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: R.full, borderWidth: 1, borderColor: "rgba(248,172,18,0.3)" },
  filterChipText:{ fontFamily: F.medium, fontSize: Sz.xs, color: C.goldDark },

  grid:         { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: S.screen, gap: 8 },
  list:         { paddingHorizontal: S.screen, gap: 10 },

  emptyWrap:    { alignItems: "center", justifyContent: "center", paddingTop: 80,
    paddingHorizontal: S.screen, gap: 10 },
  emptyTitle:   { fontFamily: F.bold, fontSize: Sz.md, color: INK, textAlign: "center" },
  emptySub:     { fontFamily: F.regular, fontSize: Sz.sm, color: INK3, textAlign: "center" },
  emptyInline:  { fontFamily: F.regular, fontSize: Sz.sm, color: INK3,
    textAlign: "center", paddingVertical: 48, paddingHorizontal: S.screen },
});
