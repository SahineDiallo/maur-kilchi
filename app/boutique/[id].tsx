import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Alert, ActivityIndicator, TextInput, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft, Search, Heart, MapPin, Star,
  Plus, Edit2, Trash2, X, MoreVertical,
} from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, Sz, S } from "@/constants/theme";
import ProductCreationModal from "@/components/ProductCreationModal";
import BoutiquePlaceholder from "@/components/BoutiquePlaceholder";

const { width } = Dimensions.get("window");
const HERO_H = 234;

const Y    = C.gold;
const INK  = "#111111";
const INK2 = "#555555";
const INK3 = "#999999";
const SURF = "#F6F4EF";
const BDR  = "rgba(0,0,0,0.07)";

const BOUTIQUE_EMOJI: Record<string, string> = {
  restaurant:    "🍽️",
  arrivage:      "📦",
  supermarche:   "🛒",
  electronique:  "📱",
  quincaillerie: "🔩",
  autre:         "🏪",
};

// ─────────────────────────────────────────────────────────────────────────────
// Product row  (horizontal layout matching the mockup)
// ─────────────────────────────────────────────────────────────────────────────
function ProductRow({
  item, isOwner, onEdit, onDelete,
}: {
  item: any;
  isOwner: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const router = useRouter();
  const image  = item.primary_image_url ?? item.primary_image ?? null;
  const price  = parseFloat(item.price);
  const old    = item.old_price ? parseFloat(item.old_price) : null;

  const openOwnerMenu = () => {
    Alert.alert(item.title, undefined, [
      { text: "Modifier", onPress: onEdit },
      { text: "Supprimer", style: "destructive", onPress: onDelete },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity
      style={pr.row}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.88}
    >
      {/* Thumbnail */}
      <View style={pr.thumb}>
        {image
          ? <Image source={{ uri: image }} style={pr.thumbImg} resizeMode="cover" />
          : <View style={pr.thumbPh}><Text style={pr.thumbEmoji}>📦</Text></View>}
        <LinearGradient
          colors={["rgba(255,243,150,0.38)", "transparent"]}
          style={pr.thumbGlow}
          pointerEvents="none"
        />
        {!item.is_available && (
          <View style={pr.badge}><Text style={pr.badgeText}>Rupture</Text></View>
        )}
      </View>

      {/* Info */}
      <View style={pr.info}>
        {item.category_name ? (
          <Text style={pr.cat}>{item.category_name}</Text>
        ) : null}
        <Text style={pr.name} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={pr.desc} numberOfLines={2}>
            {item.description.slice(0, 70)}…
          </Text>
        ) : null}
        <View style={pr.priceRow}>
          <Text style={pr.price}>{price.toLocaleString("fr-FR")} MRU</Text>
          {old && <Text style={pr.oldPrice}>{old.toLocaleString("fr-FR")}</Text>}
        </View>
      </View>

      {/* Owner ellipsis */}
      {isOwner && (
        <TouchableOpacity
          style={pr.ellipsis}
          onPress={openOwnerMenu}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreVertical color={INK3} width={18} height={18} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const pr = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: BDR },
  thumb:     { width: 90, height: 82, borderRadius: 10, backgroundColor: SURF,
    flexShrink: 0, overflow: "hidden", position: "relative" },
  thumbImg:  { width: "100%", height: "100%" },
  thumbPh:   { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  thumbEmoji:{ fontSize: 38 },
  thumbGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 24, pointerEvents: "none" },
  badge:     { position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Y, paddingVertical: 3, alignItems: "center" },
  badgeText: { fontFamily: F.bold, fontSize: 8, color: INK },

  info:     { flex: 1, minWidth: 0 },
  cat:      { fontFamily: F.medium, fontSize: 10, color: Y, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.4 },
  name:     { fontFamily: F.bold, fontSize: 14, color: INK, marginBottom: 3, lineHeight: 18 },
  desc:     { fontFamily: F.regular, fontSize: 11.5, color: INK3, marginBottom: 8, lineHeight: 16 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  price:    { fontFamily: F.bold, fontSize: 14, color: INK },
  oldPrice: { fontFamily: F.regular, fontSize: 11, color: "#bbb", textDecorationLine: "line-through" },

  ellipsis: { padding: 4, marginLeft: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function BoutiqueDetail() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();

  const PAGE = 20;

  const [boutique,    setBoutique]    = useState<any>(null);
  const [products,    setProducts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [liked,       setLiked]       = useState(false);
  const [activeCat,   setActiveCat]   = useState("Tous");
  const [query,       setQuery]       = useState("");
  const [search,      setSearch]      = useState("");
  const [showCreate,  setShowCreate]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchProducts = useCallback((offset = 0) => {
    if (offset === 0) setLoading(true); else setLoadingMore(true);
    api.get(`/products/?boutique=${id}&limit=${PAGE}&offset=${offset}`)
      .then((p: any) => {
        const list: any[] = p?.results ?? (Array.isArray(p) ? p : []);
        setProducts(prev => offset === 0 ? list : [...prev, ...list]);
        setHasMore(list.length === PAGE);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [id]);

  const loadData = useCallback(() => {
    api.get(`/boutiques/${id}/`).then(setBoutique).catch(() => {});
    fetchProducts(0);
  }, [id, fetchProducts]);

  useEffect(() => { loadData(); }, [loadData]);

  useFocusEffect(useCallback(() => {
    api.get(`/boutiques/${id}/`).then((b: any) => setBoutique(b)).catch(() => {});
  }, [id]));

  // Category tabs derived from products
  const cats = useMemo(() => {
    const names = products.map(p => p.category_name).filter(Boolean);
    return ["Tous", ...Array.from(new Set<string>(names))];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCat === "Tous" || p.category_name === activeCat;
      const matchSearch = search.trim() === "" ||
        p.title?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCat, search]);

  const handleDelete = (slug: string) => {
    Alert.alert(
      "Supprimer le produit",
      "Êtes-vous sûr de vouloir supprimer ce produit ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/products/${slug}/`);
            setProducts(prev => prev.filter(p => p.slug !== slug));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer ce produit.");
          }
        }},
      ],
    );
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={Y} size="large" /></View>
  );
  if (!boutique) return (
    <View style={s.center}><Text style={s.noData}>Boutique introuvable</Text></View>
  );

  const heroUri  = boutique.image_url ?? boutique.image ?? null;
  const emoji    = BOUTIQUE_EMOJI[boutique.boutique_type] ?? "🏪";
  const isOwner  = !!user && String(user.id) === String(boutique.owner?.id);
  const typeLabel = boutique.boutique_type_display ?? boutique.boutique_type ?? "Boutique";
  const available = products.filter(p => p.is_available).length;

  return (
    <View style={s.root}>

      {/* ── Hero ── */}
      <View style={[s.hero, { paddingTop: insets.top }]}>
        {heroUri ? (
          <Image source={{ uri: heroUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            {/* Dark branded bg when no photo */}
            <LinearGradient
              colors={["#1a1000", "#0e0e0e", "#1a0800"]}
              start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.heroBgEmoji}>{emoji}</Text>
            <View style={s.heroHalo} pointerEvents="none" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.80)"]}
              style={s.heroScrim}
              pointerEvents="none"
            />
          </>
        )}

        {/* Action bar */}
        <View style={s.heroActions}>
          <TouchableOpacity style={s.heroBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft color="#fff" width={20} height={20} />
          </TouchableOpacity>
          <View style={s.heroRight}>
            <TouchableOpacity style={s.heroBtn} onPress={() => setLiked(v => !v)} activeOpacity={0.8}>
              <Heart
                color={liked ? "#ff4d6d" : "rgba(255,255,255,0.85)"}
                fill={liked ? "#ff4d6d" : "none"}
                width={19} height={19}
              />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={s.heroBtn}
                activeOpacity={0.8}
                onPress={() => Alert.alert(boutique.name, undefined, [
                  { text: "✏️  Éditer",    onPress: () => router.push(`/boutique/edit/${id}` as any) },
                  { text: "🗑️  Supprimer", style: "destructive", onPress: () =>
                    Alert.alert("Supprimer la boutique", "Cette action est irréversible.", [
                      { text: "Annuler", style: "cancel" },
                      { text: "Supprimer", style: "destructive", onPress: async () => {
                        try { await api.delete(`/boutiques/${id}/`); router.replace("/"); }
                        catch { Alert.alert("Erreur", "Impossible de supprimer."); }
                      }},
                    ])
                  },
                  { text: "Annuler", style: "cancel" },
                ])}
              >
                <MoreVertical color="rgba(255,255,255,0.85)" width={19} height={19} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Boutique name pinned to hero bottom */}
        <View style={s.heroBottom}>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>{typeLabel}</Text>
          </View>
          <Text style={s.heroName}>{boutique.name}</Text>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Location + stats */}
        <View style={s.infoSection}>
          {/* Location row + add product */}
          <View style={s.locRow}>
            {boutique.ville ? (
              <>
                <MapPin color={INK2} width={13} height={13} />
                <Text style={[s.locText, { flex: 1 }]}>{boutique.ville}</Text>
              </>
            ) : <View style={{ flex: 1 }} />}
            {isOwner && (
              <TouchableOpacity style={s.addProductBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
                <Plus color={INK} width={13} height={13} strokeWidth={2.5} />
                <Text style={s.addProductText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats 3-col */}
          <View style={s.statsRow}>
            {[
              { top: String(products.length), mid: "Produits", bot: "total" },
              { top: String(available),       mid: "En stock", bot: "disponibles" },
              { top: typeLabel,               mid: "Type",     bot: "boutique" },
            ].map((st, i) => (
              <View key={i} style={[s.statCell,
                i === 1 && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BDR }]}>
                <View style={s.statTopRow}>
                  {i === 1 && <Star color={Y} width={13} height={13} fill={Y} />}
                  <Text style={s.statTop}>{st.top}</Text>
                </View>
                <Text style={s.statMid}>{st.mid}</Text>
                <Text style={s.statBot}>{st.bot}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {boutique.description ? (
            <Text style={s.desc} numberOfLines={3}>{boutique.description}</Text>
          ) : null}

        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <Search color={INK3} width={15} height={15} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un produit..."
              placeholderTextColor={INK3}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X color={INK3} width={14} height={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Sticky category tabs ── */}
        <View style={s.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsScroll}
          >
            {cats.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCat(cat)}
                activeOpacity={0.8}
                style={s.tabBtn}
              >
                <Text style={[s.tabText, activeCat === cat && s.tabTextOn]}>{cat}</Text>
                {activeCat === cat && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Products ── */}
        <View style={s.productsSection}>
          <Text style={s.sectionTitle}>
            {activeCat === "Tous" ? "Nos produits" : activeCat}
          </Text>

          {filtered.length === 0 ? (
            <Text style={s.empty}>Aucun produit · لا منتجات</Text>
          ) : (
            <>
              {filtered.map((p) => (
                <ProductRow
                  key={p.id ?? p.slug}
                  item={p}
                  isOwner={isOwner}
                  onEdit={() => router.push(`/product/edit/${p.slug}` as any)}
                  onDelete={() => handleDelete(p.slug)}
                />
              ))}
              {hasMore && search.trim() === "" && activeCat === "Tous" && (
                <TouchableOpacity
                  style={s.loadMoreBtn}
                  onPress={() => fetchProducts(products.length)}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore
                    ? <ActivityIndicator color={Y} size="small" />
                    : <Text style={s.loadMoreText}>Voir plus</Text>}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Product creation modal */}
      <ProductCreationModal
        visible={showCreate}
        boutiqueId={id}
        boutiqueType={boutique?.boutique_type ?? "autre"}
        onClose={() => setShowCreate(false)}
        onCreated={(product) => setProducts(prev => [product, ...prev])}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  noData: { fontFamily: F.regular, fontSize: Sz.base, color: INK3 },

  // Hero
  hero:        { height: HERO_H, position: "relative", overflow: "hidden", backgroundColor: INK },
  heroBgEmoji: { position: "absolute", fontSize: 160, opacity: 0.14, alignSelf: "center",
    top: "50%", marginTop: -80, zIndex: 1 },
  heroHalo:    { position: "absolute", top: -60, alignSelf: "center", width: 320, height: 200,
    borderRadius: 160, backgroundColor: "rgba(255,228,77,0.12)", zIndex: 2 },
  heroScrim:   { position: "absolute", bottom: 0, left: 0, right: 0, height: 130, zIndex: 3 },
  heroActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, zIndex: 20 },
  heroRight:   { flexDirection: "row", gap: 9 },
  heroBtn:     { width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center" },
  heroBottom:  { position: "absolute", bottom: 18, left: 20, right: 20, zIndex: 10 },
  typeBadge:   { alignSelf: "flex-start", backgroundColor: Y, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 9 },
  typeBadgeText: { fontFamily: F.bold, fontSize: 11, color: INK },
  heroName:    { fontFamily: F.bold, fontSize: 30, color: "#fff", lineHeight: 34, letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },

  // Info section
  infoSection: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: BDR },
  locRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  locText:     { fontFamily: F.medium, fontSize: 13, color: INK2 },

  statsRow:    { flexDirection: "row", borderWidth: 1, borderColor: BDR, borderRadius: 14,
    marginBottom: 14, overflow: "hidden" },
  statCell:    { flex: 1, paddingVertical: 14, alignItems: "center" },
  statTopRow:  { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  statTop:     { fontFamily: F.bold, fontSize: 14, color: INK },
  statMid:     { fontFamily: F.bold, fontSize: 11, color: INK2 },
  statBot:     { fontFamily: F.regular, fontSize: 10, color: "#bbb", marginTop: 1 },

  desc:        { fontFamily: F.regular, fontSize: 13, color: INK2, lineHeight: 19, marginBottom: 14 },

  addProductBtn: { flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Y, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    shadowColor: Y, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8,
    elevation: 4 },
  addProductText:{ fontFamily: F.bold, fontSize: 12, color: INK },

  // Search
  searchWrap:  { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BDR },
  searchBox:   { flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: SURF, borderRadius: 12, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: INK },

  // Category tabs (sticky)
  tabsWrap:    { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: BDR,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 12, elevation: 2 },
  tabsScroll:  { paddingHorizontal: 8 },
  tabBtn:      { paddingHorizontal: 16, paddingVertical: 14, position: "relative" },
  tabText:     { fontFamily: F.regular, fontSize: 14, color: INK3 },
  tabTextOn:   { fontFamily: F.bold, color: INK },
  tabUnderline:{ position: "absolute", bottom: 0, left: 16, right: 16,
    height: 2.5, backgroundColor: Y, borderRadius: 2 },

  // Products
  productsSection: { paddingHorizontal: 20, paddingTop: 18 },
  sectionTitle:    { fontFamily: F.bold, fontSize: 17, color: INK, marginBottom: 4 },
  empty:           { fontFamily: F.regular, fontSize: 14, color: INK3,
    textAlign: "center", paddingVertical: 40 },
  loadMoreBtn:     { alignItems: "center", justifyContent: "center", height: 48,
    marginTop: 8, marginBottom: 12, borderRadius: 12,
    backgroundColor: SURF, borderWidth: 1, borderColor: BDR },
  loadMoreText:    { fontFamily: F.bold, fontSize: 14, color: INK2 },

});
