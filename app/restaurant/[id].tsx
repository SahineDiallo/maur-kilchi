import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Linking, ActivityIndicator, Animated,
  Alert, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft, Phone, MessageCircle, MapPin,
  Heart, Share2, Plus, Edit2, Trash2, Search, X, Star, Clock,
} from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, Sz, S, Shadow, Border } from "@/constants/theme";

const { width, height } = Dimensions.get("window");
const HERO_H     = Math.round(height * 0.45);
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
// Category tab — vertical icon card (emoji box + label below)
// ─────────────────────────────────────────────────────────────────────────────
function CategoryTab({
  label, icon, active, onPress,
}: { label: string; icon?: string; active: boolean; onPress: () => void }) {
  const emoji = icon || getFoodEmoji(label.replace(/\s*\(\d+\)/, ""));
  return (
    <TouchableOpacity style={tab.wrap} onPress={onPress} activeOpacity={0.78}>
      <View style={[tab.box, active && tab.boxOn]}>
        <Text style={tab.emoji}>{emoji}</Text>
      </View>
      <Text style={[tab.label, active && tab.labelOn]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}
const tab = StyleSheet.create({
  wrap:    { alignItems: "center", gap: 5, width: 64 },
  box:     {
    width: 56, height: 56, borderRadius: 3,
    backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(248,172,18,0.22)",
  },
  boxOn:   { backgroundColor: C.gold, borderColor: C.gold },
  emoji:   { fontSize: 24 },
  label:   { fontFamily: F.medium, fontSize: 10, color: "#333", textAlign: "center" },
  labelOn: { fontFamily: F.medium, fontSize: 10, color: C.goldDark, textAlign: "center" },
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
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [restaurant,     setRestaurant]     = useState<any>(null);
  const [restaurantCats, setRestaurantCats] = useState<RestaurantCat[]>([]);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [liked,          setLiked]          = useState(false);
  const [activeTab,      setActiveTab]      = useState<string>(ALL_TAB);
  const [menuSearch,     setMenuSearch]     = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/boutiques/${id}/`),
      api.get(`/products/?boutique=${id}`),
      api.get(`/categories/?boutique_type=restaurant`),
    ])
      .then(([b, p, cats]) => {
        setRestaurant(b);
        setProducts(p?.results ?? (Array.isArray(p) ? p : []));
        setRestaurantCats(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
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

  const floatBg = scrollY.interpolate({
    inputRange:  [0, HERO_H - 100],
    outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.50)"],
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
      <View style={s.floatBar}>
        <SafeAreaView>
          <Animated.View style={[s.floatRow, { backgroundColor: floatBg }]}>
            <TouchableOpacity style={s.floatBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ArrowLeft color="#fff" width={20} height={20} />
            </TouchableOpacity>
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
                <Heart color={liked ? C.gold : "#fff"} fill={liked ? C.gold : "none"} width={19} height={19} />
              </TouchableOpacity>
              <TouchableOpacity style={s.floatBtn} activeOpacity={0.8}>
                <Share2 color="#fff" width={19} height={19} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]}
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

          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "transparent", "rgba(0,0,0,0.70)"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={s.heroCaption}>
            <View style={s.cuisineBadge}>
              <Text style={s.cuisineText}>{typeLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Info card ── */}
        <View style={s.infoCard}>
          {/* Name */}
          <Text style={s.infoName}>{restaurant.name}</Text>

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

          {/* Former name row spacer */}
          <View style={{ height: 12 }} />

          {/* Category chips with emoji */}
          {restaurantCats.length > 0 && (
            <View style={s.chipRow}>
              {restaurantCats.slice(0, 6).map((cat) => (
                <View key={cat.id} style={s.infoChip}>
                  <Text style={{ fontSize: 12 }}>{cat.icon ?? getFoodEmoji(cat.name)}</Text>
                  <Text style={s.infoChipText}>{cat.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {restaurant.description ? (
            <Text style={s.desc} numberOfLines={3}>{restaurant.description}</Text>
          ) : null}

          {/* Contact buttons */}
          <View style={s.ctaRow}>
            {restaurant.whatsapp_number ? (
              <TouchableOpacity style={s.waBtn} onPress={openWhatsApp} activeOpacity={0.88}>
                <MessageCircle color="#fff" width={17} height={17} />
                <Text style={s.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
            {restaurant.phone_number ? (
              <TouchableOpacity style={s.callBtn} onPress={openPhone} activeOpacity={0.88}>
                <Phone color="#000" width={17} height={17} />
                <Text style={s.callBtnText}>Appeler</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── Sticky category tabs ── */}
        <View style={s.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: S.screen, gap: 12 }}
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
        </View>

        {/* ── Menu section ── */}
        <View style={s.menuSection}>
          {/* Search */}
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
        </View>

        {/* ── Menu items (2-column card grid) ── */}
        <View style={s.menuList}>
          {displayedProducts.length === 0 ? (
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
    paddingHorizontal: S.screen, paddingVertical: 8, paddingTop: 10,
  },
  floatRight:{ flexDirection: "row", gap: 8 },
  floatBtn:  {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroCaption: { position: "absolute", bottom: 16, left: S.screen, right: S.screen },
  cuisineBadge:{ alignSelf: "flex-start", backgroundColor: C.gold, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 3 },
  cuisineText: { fontFamily: F.bold, fontSize: 10, color: "#000", textTransform: "capitalize" },
  heroMeta:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  heroMetaChip:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.surface, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  heroMetaText:{ fontFamily: F.medium, fontSize: Sz.xs, color: C.textSecondary },

  // ── Info card ────────────────────────────────────────────────────────────
  infoCard:    {
    backgroundColor: C.surface,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    marginTop: -4, paddingTop: 20,
    paddingHorizontal: S.screen, paddingBottom: 20,
  },
  infoName:    { fontFamily: F.bold, fontSize: 24, color: C.textPrimary, marginBottom: 10 },
  openBadge:   { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  openDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22C55E" },
  openText:    { fontFamily: F.bold, fontSize: Sz.xs, color: "#16A34A" },

  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  infoChip:    {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.goldLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  infoChipText:{ fontFamily: F.medium, fontSize: Sz.xs, color: C.goldDark },

  desc:        { fontFamily: F.regular, fontSize: Sz.sm, color: C.textSecondary, lineHeight: 20, marginBottom: 16 },

  ctaRow:      { flexDirection: "row", gap: 10 },
  waBtn:       {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 48, backgroundColor: C.whatsapp, borderRadius: 12,
  },
  waBtnText:   { fontFamily: F.bold, fontSize: Sz.base, color: "#fff" },
  callBtn:     {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 48, backgroundColor: C.gold, borderRadius: 12,
  },
  callBtnText: { fontFamily: F.bold, fontSize: Sz.base, color: "#000" },

  // ── Sticky tabs ──────────────────────────────────────────────────────────
  tabsWrap:    {
    backgroundColor: C.surface, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },

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
