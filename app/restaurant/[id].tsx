import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Linking, Animated,
  Alert, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft, Phone, MessageCircle, MapPin,
  Heart, Plus, Edit2, Trash2, Search, X, Star, Clock,
} from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, Sz, S, Shadow, Border } from "@/constants/theme";

const { width } = Dimensions.get("window");
const HERO_H     = 270;
const MENU_ITEM_W = (width - S.screen * 2 - 8) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Product = {
  id: number | string;
  slug: string;
  title: string;
  description?: string;
  price: string | number;
  is_available: boolean;
  stock_quantity?: number;
  category_name?: string;
  category_slug?: string;
  primary_image_url?: string;
  images?: any[];
};

const ALL_TAB = "__all__";

// ─────────────────────────────────────────────────────────────────────────────
// Food emoji map
// ─────────────────────────────────────────────────────────────────────────────
const FOOD_EMOJI: Record<string, string> = {
  burger: "🍔", burgers: "🍔",
  pizza: "🍕", pizzas: "🍕",
  poulet: "🍗", chicken: "🍗", grillé: "🍗",
  sandwich: "🥪", sandwichs: "🥪", sandwiches: "🥪",
  dessert: "🍰", desserts: "🍰", gâteau: "🎂",
  boisson: "🥤", boissons: "🥤", drinks: "🥤", jus: "🥤",
  salade: "🥗", salades: "🥗",
  pasta: "🍝", pâtes: "🍝", pates: "🍝",
  sushi: "🍱", tacos: "🌮", shawarma: "🌯", wrap: "🌯",
  poisson: "🐟", fish: "🐟",
  viande: "🥩", meat: "🥩", steak: "🥩",
  soupe: "🍲", soup: "🍲",
  "plat du jour": "🍽️", "petit-déjeuner": "🍳", "entrée": "🥗",
  frites: "🍟", "fast food": "🍟",
  café: "☕", thé: "🍵", glace: "🍦", crêpe: "🥞",
  tout: "🍴",
};

function getFoodEmoji(label: string): string {
  const key = label.toLowerCase().replace(/\s*\(\d+\)/, "").trim();
  return FOOD_EMOJI[key] ?? "🍴";
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu item card — image right, text left
// ─────────────────────────────────────────────────────────────────────────────
type MenuItemProps = {
  item: Product;
  isOwner: boolean;
  onDelete: (slug: string) => void;
};

function MenuItem({ item, isOwner, onDelete }: MenuItemProps) {
  const router = useRouter();
  const imgUri = item.primary_image_url ?? null;

  return (
    <View style={[mi.wrapper, { width: MENU_ITEM_W }]}>
      <TouchableOpacity
        style={mi.card}
        onPress={() => router.push(`/product/${item.slug}`)}
        activeOpacity={0.88}
      >
        {/* Image on top */}
        <View style={mi.imgWrap}>
          {imgUri
            ? <Image source={{ uri: imgUri }} style={mi.img} resizeMode="cover" />
            : <View style={mi.imgPh}><Text style={{ fontSize: 28 }}>🍽️</Text></View>}
          {item.is_available && (
            <View style={mi.addBtn}>
              <Text style={mi.addBtnText}>+</Text>
            </View>
          )}
          {!item.is_available && (
            <View style={mi.unavailableBadge}>
              <Text style={mi.unavailableText}>Indisponible</Text>
            </View>
          )}
        </View>

        {/* Info below */}
        <View style={mi.info}>
          <Text style={mi.name} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={mi.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={mi.priceRow}>
            <Text style={mi.price}>{parseFloat(String(item.price)).toLocaleString("fr-FR")}</Text>
            <Text style={mi.currency}> MRU</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Owner actions */}
      {isOwner && (
        <View style={mi.ownerBar}>
          <TouchableOpacity
            style={mi.ownerBtn}
            onPress={() => router.push(`/product/edit/${item.slug}` as any)}
            activeOpacity={0.7}
          >
            <Edit2 color={C.gold} width={12} height={12} />
            <Text style={mi.ownerBtnText}>Modifier</Text>
          </TouchableOpacity>
          <View style={mi.ownerDivider} />
          <TouchableOpacity
            style={mi.ownerBtn}
            onPress={() => onDelete(item.slug)}
            activeOpacity={0.7}
          >
            <Trash2 color={C.error} width={12} height={12} />
            <Text style={[mi.ownerBtnText, { color: C.error }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const mi = StyleSheet.create({
  wrapper:          { backgroundColor: "transparent" },
  card:             { backgroundColor: "transparent" },

  imgWrap:  { width: "100%", height: 168, borderRadius: 14, overflow: "hidden", position: "relative" },
  img:      { width: "100%", height: "100%" },
  imgPh:    {
    width: "100%", height: "100%", backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center",
  },
  addBtn:   {
    position: "absolute", bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
  },
  addBtnText: { fontFamily: F.bold, fontSize: 16, color: "#000", lineHeight: 20, marginTop: -1 },
  unavailableBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#FEE2E2", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  unavailableText:  { fontFamily: F.medium, fontSize: 10, color: "#DC2626" },

  info:     { paddingTop: 8, paddingBottom: 6 },
  name:     { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, lineHeight: 19, marginBottom: 4 },
  desc:     { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, lineHeight: 16, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  price:    { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  currency: { fontFamily: F.medium, fontSize: Sz.xs, color: C.textMuted },

  ownerBar:     {
    flexDirection: "row", backgroundColor: "#FAFAFA",
    borderTopWidth: 1, borderTopColor: C.border,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    overflow: "hidden",
  },
  ownerBtn:     {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8,
  },
  ownerBtnText: { fontFamily: F.medium, fontSize: Sz.xs, color: C.gold },
  ownerDivider: { width: 1, backgroundColor: C.border, marginVertical: 6 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Category tab — horizontal pill (emoji + label)
// ─────────────────────────────────────────────────────────────────────────────
function CategoryTab({
  label, icon, active, onPress,
}: { label: string; icon?: string; active: boolean; onPress: () => void }) {
  const emoji = icon || getFoodEmoji(label.replace(/\s*\(\d+\)/, ""));
  return (
    <TouchableOpacity style={[tab.pill, active && tab.pillOn]} onPress={onPress} activeOpacity={0.78}>
      <Text style={tab.emoji}>{emoji}</Text>
      <Text style={[tab.label, active && tab.labelOn]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}
const tab = StyleSheet.create({
  pill:    {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  pillOn:  { backgroundColor: "#111", borderColor: "#111" },
  emoji:   { fontSize: 16 },
  label:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  labelOn: { fontFamily: F.bold, color: "#fff" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Build tabs / filter helpers — use seeded restaurant categories from DB
// ─────────────────────────────────────────────────────────────────────────────
type RestaurantCat = { id: number; name: string; slug: string; icon?: string; subcategories?: { slug: string }[] };

function buildTabs(cats: RestaurantCat[], products: Product[]) {
  // Only show categories that actually have products in this restaurant
  return cats.filter((cat) => {
    const allSlugs = new Set([cat.slug, ...(cat.subcategories ?? []).map(s => s.slug)]);
    return products.some(p => allSlugs.has(p.category_slug ?? "") || p.category_name === cat.name);
  });
}

function filterProductsByTab(products: Product[], activeTab: string, cats: RestaurantCat[]): Product[] {
  if (activeTab === ALL_TAB) return products;
  const cat = cats.find(c => c.slug === activeTab);
  if (!cat) return products.filter(p => (p.category_slug ?? p.category_name) === activeTab);
  const allSlugs = new Set([cat.slug, ...(cat.subcategories ?? []).map(s => s.slug)]);
  return products.filter(p => allSlugs.has(p.category_slug ?? "") || p.category_name === cat.name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton primitives
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonBox({ w, h, r = 10, style }: { w: number | string; h: number; r?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.72] });
  return (
    <Animated.View
      style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: C.border, opacity }, style]}
    />
  );
}

function MenuItemSkeleton() {
  return (
    <View style={{ width: MENU_ITEM_W }}>
      <SkeletonBox w="100%" h={168} r={14} />
      <View style={{ paddingTop: 8, gap: 6 }}>
        <SkeletonBox w="85%" h={12} r={6} />
        <SkeletonBox w="55%" h={10} r={6} />
        <SkeletonBox w="40%" h={16} r={6} />
      </View>
    </View>
  );
}

function RestaurantPageSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Hero shimmer */}
      <View style={{ height: HERO_H, overflow: "hidden" }}>
        <SkeletonBox w="100%" h={HERO_H} r={0} />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
          <SafeAreaView>
            <View style={{ paddingHorizontal: S.screen, paddingTop: 10 }}>
              <TouchableOpacity
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.88)",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.14)",
                }}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <ArrowLeft color="#111" width={20} height={20} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      {/* Info card shimmer */}
      <View style={{
        backgroundColor: C.surface, paddingHorizontal: S.screen,
        paddingTop: 18, paddingBottom: 18, gap: 10,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <SkeletonBox w="55%" h={18} r={8} />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
          <SkeletonBox w={80} h={28} r={6} />
          <SkeletonBox w={80} h={28} r={6} />
          <SkeletonBox w={64} h={28} r={6} />
        </View>
        <SkeletonBox w="100%" h={11} r={6} />
        <SkeletonBox w="72%" h={11} r={6} />
      </View>

      {/* Product grid shimmer */}
      <View style={{
        flexDirection: "row", flexWrap: "wrap",
        paddingHorizontal: S.screen, gap: 8, paddingTop: 16,
      }}>
        {[1, 2, 3, 4].map((i) => <MenuItemSkeleton key={i} />)}
      </View>
    </View>
  );
}

// Categories are the same for all restaurants — cache after first fetch
let _cachedRestaurantCats: RestaurantCat[] | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [restaurant,      setRestaurant]      = useState<any>(null);
  const [restaurantCats,  setRestaurantCats]  = useState<RestaurantCat[]>([]);
  const [products,        setProducts]        = useState<Product[]>([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [loadingProducts,   setLoadingProducts]   = useState(true);
  const [liked,           setLiked]           = useState(false);
  const [activeTab,       setActiveTab]       = useState<string>(ALL_TAB);
  const [menuSearch,      setMenuSearch]      = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingRestaurant(true);
    setLoadingProducts(true);

    // Restaurant info — unblocks the UI as soon as it arrives
    api.get(`/boutiques/${id}/`)
      .then(setRestaurant)
      .catch(() => {})
      .finally(() => setLoadingRestaurant(false));

    // Products — independent; drives skeleton in the grid
    api.get(`/products/?boutique=${id}`)
      .then((p) => setProducts(p?.results ?? (Array.isArray(p) ? p : [])))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    // Categories — use module-level cache after first fetch
    if (_cachedRestaurantCats) {
      setRestaurantCats(_cachedRestaurantCats);
    } else {
      api.get(`/categories/?boutique_type=restaurant`)
        .then((cats) => {
          const data = Array.isArray(cats) ? cats : [];
          _cachedRestaurantCats = data;
          setRestaurantCats(data);
        })
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Delete product ─────────────────────────────────────────────────────────
  const handleDelete = useCallback((slug: string) => {
    Alert.alert("Supprimer le plat", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/products/${slug}/`);
            setProducts((prev) => prev.filter((p) => p.slug !== slug));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer ce plat.");
          }
        },
      },
    ]);
  }, []);

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loadingRestaurant) {
    return <RestaurantPageSkeleton onBack={() => router.back()} />;
  }
  if (!restaurant) {
    return (
      <View style={s.center}>
        <Text style={s.noData}>Restaurant introuvable</Text>
      </View>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const heroUri    = restaurant.image_url ?? restaurant.image ?? null;
  const isOwner    = !!user && String(user.id) === String(restaurant.owner?.id);
  const typeLabel  = restaurant.boutique_type_display ?? restaurant.boutique_type ?? "Restaurant";
  const rating     = restaurant.rating ?? 4.3;
  const reviewCount = restaurant.review_count ?? 0;

  const tabs            = buildTabs(restaurantCats, products);
  const tabProducts     = filterProductsByTab(products, activeTab, restaurantCats);
  const displayedProducts = menuSearch.trim()
    ? tabProducts.filter((p) => p.title?.toLowerCase().includes(menuSearch.toLowerCase()))
    : tabProducts;

  const barBg = scrollY.interpolate({
    inputRange:  [HERO_H - 80, HERO_H],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"],
    extrapolate: "clamp",
  });

  const nameOpacity = scrollY.interpolate({
    inputRange:  [HERO_H * 0.55, HERO_H * 0.82],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyTabsOpacity = scrollY.interpolate({
    inputRange:  [HERO_H - 40, HERO_H + 10],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyTabsTranslateY = scrollY.interpolate({
    inputRange:  [HERO_H - 40, HERO_H + 10],
    outputRange: [-10, 0],
    extrapolate: "clamp",
  });

  const openWhatsApp = () => {
    const num = restaurant.whatsapp_number?.replace(/\D/g, "");
    if (num) Linking.openURL(`https://wa.me/${num}`);
  };
  const openPhone = () => {
    if (restaurant.phone_number) Linking.openURL(`tel:${restaurant.phone_number}`);
  };

  return (
    <View style={s.root}>

      {/* Same yellow gradient wash as home page */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={s.gradientWash}
        pointerEvents="none"
      />

      {/* ── Floating top bar ── */}
      <Animated.View style={[s.floatBar, { backgroundColor: barBg }]}>
        <SafeAreaView>
          <View style={s.floatRow}>
            <TouchableOpacity style={s.floatBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ArrowLeft color="#111" width={20} height={20} />
            </TouchableOpacity>
            <Animated.Text style={[s.floatTitle, { opacity: nameOpacity }]} numberOfLines={1}>
              {restaurant.name}
            </Animated.Text>
            <View style={s.floatRight}>
              {isOwner && (
                <TouchableOpacity
                  style={s.floatBtn}
                  onPress={() => router.push(`/product/create?boutique=${id}` as any)}
                  activeOpacity={0.8}
                >
                  <Plus color={C.gold} width={19} height={19} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.floatBtn} onPress={() => setLiked((v) => !v)} activeOpacity={0.8}>
                <Heart color={liked ? C.gold : "#111"} fill={liked ? C.gold : "none"} width={19} height={19} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Sticky category tabs — slide in once hero is scrolled away */}
        <Animated.View style={[s.stickyTabsFixed, {
          opacity: stickyTabsOpacity,
          transform: [{ translateY: stickyTabsTranslateY }],
        }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: S.screen, gap: 10, paddingVertical: 12 }}
          >
            <CategoryTab
              label={`Tout (${products.length})`}
              active={activeTab === ALL_TAB}
              onPress={() => setActiveTab(ALL_TAB)}
            />
            {tabs.map((t) => (
              <CategoryTab
                key={t.slug}
                label={t.name}
                icon={t.icon}
                active={activeTab === t.slug}
                onPress={() => setActiveTab(t.slug)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >

        {/* ── Hero ── */}
        <View style={{ height: HERO_H }}>
          {heroUri
            ? <Image source={{ uri: heroUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : (
              <LinearGradient
                colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
                locations={[0, 0.38, 0.65, 1]}
                style={StyleSheet.absoluteFill}
              />
            )}

          {/* Dark gradient scrim so text and tabs are readable */}
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "transparent", "rgba(0,0,0,0.72)"]}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Cuisine badge + restaurant name pinned to hero bottom */}
          <View style={s.heroCaption}>
            <View style={s.cuisineBadge}>
              <Text style={s.cuisineText}>{typeLabel}</Text>
            </View>
            <Text style={s.heroName}>{restaurant.name}</Text>
          </View>

        </View>

        {/* ── Info card ── */}
        <View style={s.infoCard}>
          {/* Rating + meta row */}
          <View style={s.heroMeta}>
            <View style={s.heroMetaChip}>
              <Star color={C.gold} fill={C.gold} width={11} height={11} />
              <Text style={s.heroMetaText}>{rating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ""}</Text>
            </View>
            <View style={s.heroMetaChip}>
              <Clock color={C.textMuted} width={11} height={11} />
              <Text style={s.heroMetaText}>20–35 min</Text>
            </View>
            {restaurant.ville ? (
              <View style={s.heroMetaChip}>
                <MapPin color={C.textMuted} width={11} height={11} />
                <Text style={s.heroMetaText}>{restaurant.ville}</Text>
              </View>
            ) : null}
            <View style={s.openBadge}>
              <View style={s.openDot} />
              <Text style={s.openText}>Ouvert</Text>
            </View>
          </View>

          {/* Description */}
          {restaurant.description ? (
            <Text style={s.desc} numberOfLines={3}>{restaurant.description}</Text>
          ) : null}
        </View>

        {/* ── Menu section ── */}
        <View style={s.menuSection}>
          {/* Search + controls — hidden while products are loading */}
          {!loadingProducts && (
            <>
              <View style={s.searchBox}>
                <Search color={C.textMuted} width={15} height={15} />
                <TextInput
                  style={s.searchInput}
                  value={menuSearch}
                  onChangeText={setMenuSearch}
                  placeholder="Rechercher un plat..."
                  placeholderTextColor={C.textMuted}
                  returnKeyType="search"
                />
                {menuSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setMenuSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X color={C.textMuted} width={14} height={14} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Owner add button */}
              {isOwner && (
                <TouchableOpacity
                  style={s.addPlatBtn}
                  onPress={() => router.push(`/product/create?boutique=${id}` as any)}
                  activeOpacity={0.82}
                >
                  <Plus color="#000" width={16} height={16} strokeWidth={2.5} />
                  <Text style={s.addPlatText}>Ajouter un plat</Text>
                </TouchableOpacity>
              )}

              {/* Section label */}
              {activeTab !== ALL_TAB && (
                <Text style={s.sectionLabel}>
                  {tabs.find((t) => t.slug === activeTab)?.name ?? ""}
                  {" "}· {displayedProducts.length} plat{displayedProducts.length !== 1 ? "s" : ""}
                </Text>
              )}
            </>
          )}
        </View>

        {/* ── Menu items (2-column card grid) ── */}
        <View style={s.menuList}>
          {loadingProducts ? (
            [1, 2, 3, 4].map((i) => <MenuItemSkeleton key={i} />)
          ) : displayedProducts.length === 0 ? (
            <Text style={s.empty}>Aucun plat trouvé</Text>
          ) : (
            displayedProducts.map((p) => (
              <MenuItem key={p.id ?? p.slug} item={p} isOwner={isOwner} onDelete={handleDelete} />
            ))
          )}
        </View>

      </Animated.ScrollView>

      {/* ── Sticky footer ── */}
      {(restaurant.whatsapp_number || restaurant.phone_number) && (
        <View style={s.footer}>
          <SafeAreaView edges={["bottom"]}>
            <View style={s.footerRow}>
              {restaurant.whatsapp_number ? (
                <TouchableOpacity style={s.footerWaBtn} onPress={openWhatsApp} activeOpacity={0.88}>
                  <MessageCircle color="#fff" width={18} height={18} />
                  <Text style={s.footerWaText}>Commander sur WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
              {restaurant.phone_number ? (
                <TouchableOpacity style={s.footerCallBtn} onPress={openPhone} activeOpacity={0.88}>
                  <Phone color="#000" width={18} height={18} />
                  <Text style={s.footerCallText}>Appeler</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  gradientWash:{ position: "absolute", top: 0, left: 0, right: 0, height: 400, zIndex: 0 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  noData: { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted },

  // ── Float bar ────────────────────────────────────────────────────────────
  floatBar:  { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  floatRow:  {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: S.screen, paddingTop: 10, paddingBottom: 0,
  },
  floatRight:{ flexDirection: "row", gap: 8 },
  floatBtn:  {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 6px rgba(0,0,0,0.14)",
  },
  floatTitle: {
    flex: 1, textAlign: "center",
    fontFamily: F.bold, fontSize: Sz.base, color: "#111",
    letterSpacing: -0.3, marginHorizontal: 4,
  },
  stickyTabsFixed: {
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: C.border,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  // Cuisine badge + name pinned to bottom of image
  heroCaption:  { position: "absolute", bottom: 20, left: S.screen, right: S.screen },
  cuisineBadge: { alignSelf: "flex-start", backgroundColor: C.gold, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  cuisineText:  { fontFamily: F.bold, fontSize: 10, color: "#000", textTransform: "capitalize" },
  heroName:     { fontFamily: F.bold, fontSize: 26, color: "#fff", letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },

  heroMeta:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  heroMetaChip: { flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.surface, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border },
  heroMetaText: { fontFamily: F.medium, fontSize: Sz.xs, color: C.textSecondary },

  // ── Info card ────────────────────────────────────────────────────────────
  infoCard:     {
    backgroundColor: C.surface,
    paddingTop: 16, paddingHorizontal: S.screen, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  openBadge:    { flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  openDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22C55E" },
  openText:     { fontFamily: F.bold, fontSize: Sz.xs, color: "#16A34A" },

  desc:         { fontFamily: F.regular, fontSize: Sz.sm, color: C.textSecondary,
    lineHeight: 20, marginTop: 8 },

  // ── Menu section ─────────────────────────────────────────────────────────
  menuSection: { backgroundColor: C.surface, paddingHorizontal: S.screen, paddingTop: 14, paddingBottom: 8 },
  searchBox:   {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12,
    height: 42, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: Sz.sm, color: C.textPrimary },
  addPlatBtn:  {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 44, backgroundColor: C.gold, borderRadius: 10,
    marginBottom: 10, ...Shadow.gold,
  },
  addPlatText: { fontFamily: F.bold, fontSize: Sz.base, color: "#000" },
  sectionLabel:{ fontFamily: F.bold, fontSize: Sz.sm, color: C.textSecondary, paddingBottom: 8 },

  // ── Menu list ─────────────────────────────────────────────────────────────
  menuList:    {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: S.screen, gap: 8,
    paddingTop: 8, paddingBottom: 16,
  },
  empty:       {
    fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted,
    textAlign: "center", paddingVertical: 48,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer:       {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 10, paddingHorizontal: S.screen,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
  },
  footerRow:    { flexDirection: "row", gap: 10, paddingBottom: 8 },
  footerWaBtn:  {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, backgroundColor: C.whatsapp, borderRadius: 14,
  },
  footerWaText: { fontFamily: F.bold, fontSize: Sz.base, color: "#fff" },
  footerCallBtn:{
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, backgroundColor: C.gold, borderRadius: 14,
  },
  footerCallText:{ fontFamily: F.bold, fontSize: Sz.base, color: "#000" },
});
