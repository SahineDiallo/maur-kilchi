import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Linking, ActivityIndicator, NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft, Heart, Phone, MessageCircle,
  MapPin, ChevronRight, ShoppingBag,
} from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, S, R } from "@/constants/theme";

const { width } = Dimensions.get("window");
const IMG_H   = 340;
const MINI_W  = (width - S.screen * 2 - 12) / 2.4;

const INK  = "#111";
const INK2 = "#555";
const INK3 = "#999";
const Y    = C.gold;
const SURF = "#F6F4EF";
const BDR  = "rgba(0,0,0,0.07)";

// ─────────────────────────────────────────────────────────────────────────────
// Mini product card  (similar products — horizontal)
// ─────────────────────────────────────────────────────────────────────────────
function MiniCard({ item }: { item: any }) {
  const router = useRouter();
  const image  = item.primary_image_url ?? item.primary_image ?? null;
  return (
    <TouchableOpacity
      style={mc.card}
      onPress={() => router.push(`/product/${item.slug}`)}
      activeOpacity={0.85}
    >
      <View style={mc.img}>
        {image
          ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={mc.ph}><Text style={{ fontSize: 28 }}>📦</Text></View>}
        {!item.is_available && (
          <View style={mc.badge}><Text style={mc.badgeText}>Rupture</Text></View>
        )}
      </View>
      <View style={mc.info}>
        {item.category_name ? <Text style={mc.cat} numberOfLines={1}>{item.category_name}</Text> : null}
        <Text style={mc.name} numberOfLines={2}>{item.title}</Text>
        <Text style={mc.price}>{parseFloat(item.price).toLocaleString("fr-FR")} MRU</Text>
      </View>
    </TouchableOpacity>
  );
}
const mc = StyleSheet.create({
  card:      { width: MINI_W, marginRight: 12, backgroundColor: "#fff",
    borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  img:       { width: "100%", height: 120, backgroundColor: SURF, position: "relative" },
  ph:        { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  badge:     { position: "absolute", top: 8, right: 8, backgroundColor: C.error,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontFamily: F.bold, fontSize: 9, color: "#fff" },
  info:      { padding: 10 },
  cat:       { fontFamily: F.medium, fontSize: 10, color: Y, textTransform: "uppercase",
    letterSpacing: 0.4, marginBottom: 3 },
  name:      { fontFamily: F.bold, fontSize: 12.5, color: INK, lineHeight: 17, marginBottom: 5 },
  price:     { fontFamily: F.bold, fontSize: 13, color: INK },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug }  = useLocalSearchParams<{ slug: string }>();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const imgRef    = useRef<ScrollView>(null);

  const [product,  setProduct]  = useState<any>(null);
  const [similar,  setSimilar]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [liked,    setLiked]    = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}/`)
      .then((d) => {
        setProduct(d);
        const catSlug = d.category_slug ?? d.category;
        if (catSlug) {
          api.get(`/products/?category=${catSlug}`)
            .then((r) => {
              const list: any[] = r?.results ?? r ?? [];
              setSimilar(list.filter((p: any) => p.slug !== slug).slice(0, 8));
            }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={Y} size="large" /></View>
  );
  if (!product) return (
    <View style={s.center}><Text style={s.noData}>Produit introuvable</Text></View>
  );

  // Build image list
  const images: string[] = [];
  if (product.primary_image_url) images.push(product.primary_image_url);
  else if (product.primary_image)  images.push(product.primary_image);
  (product.images ?? []).forEach((i: any) => {
    const url = i.image_url ?? i.image;
    if (url && !images.includes(url)) images.push(url);
  });
  const displayImgs = images.length > 0 ? images : [null];

  const hasWhatsApp = !!product.boutique_whatsapp;
  const hasPhone    = !!product.boutique_phone;

  return (
    <View style={s.root}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Image carousel ── */}
        <View style={{ height: IMG_H, backgroundColor: SURF }}>
          <ScrollView
            ref={imgRef}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={{ height: IMG_H }}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {displayImgs.map((uri, i) => (
              <View key={i} style={{ width, height: IMG_H, backgroundColor: SURF }}>
                {uri
                  ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
                  : <View style={s.imgPh}><Text style={{ fontSize: 80 }}>📦</Text></View>}
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          {displayImgs.length > 1 && (
            <View style={s.dotsRow}>
              {displayImgs.map((_, i) => (
                <View key={i} style={[s.dot, i === imgIdx && s.dotOn]} />
              ))}
            </View>
          )}

          {/* Thumbnail strip */}
          {displayImgs.length > 1 && (
            <View style={s.thumbStrip}>
              {displayImgs.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.thumb, i === imgIdx && s.thumbOn]}
                  onPress={() => {
                    setImgIdx(i);
                    imgRef.current?.scrollTo({ x: i * width, animated: true });
                  }}
                  activeOpacity={0.75}
                >
                  {uri
                    ? <Image source={{ uri }} style={s.thumbImg} resizeMode="cover" />
                    : <View style={s.thumbPh}><Text style={{ fontSize: 14 }}>📦</Text></View>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Content sheet ── */}
        <View style={s.sheet}>

          {/* Tags row */}
          <View style={s.tagsRow}>
            {product.category_name ? (
              <View style={s.catBadge}>
                <Text style={s.catText}>{product.category_name}</Text>
              </View>
            ) : null}
            <View style={[s.stockBadge, !product.is_available && s.stockBadgeOut]}>
              <View style={[s.stockDot, !product.is_available && s.stockDotOut]} />
              <Text style={[s.stockText, !product.is_available && s.stockTextOut]}>
                {product.is_available ? "En stock" : "Rupture"}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={s.title}>{product.title}</Text>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>
              {parseFloat(product.price).toLocaleString("fr-FR")}
              <Text style={s.priceCur}> MRU</Text>
            </Text>
            {product.stock_quantity != null && (
              <Text style={s.stock}>
                {product.stock_quantity} unité{product.stock_quantity !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {/* Boutique card */}
          {product.boutique_name && (
            <TouchableOpacity
              style={s.boutiqueCard}
              onPress={() => router.push(`/boutique/${product.boutique_slug ?? product.boutique}`)}
              activeOpacity={0.85}
            >
              <View style={s.boutiqueIcon}>
                <ShoppingBag color={Y} width={18} height={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.boutiqueName}>{product.boutique_name}</Text>
                {product.boutique_ville ? (
                  <View style={s.boutiqueLocRow}>
                    <MapPin color={INK3} width={11} height={11} />
                    <Text style={s.boutiqueLoc}>{product.boutique_ville}</Text>
                  </View>
                ) : null}
              </View>
              <ChevronRight color={INK3} width={16} height={16} />
            </TouchableOpacity>
          )}

          {/* Description */}
          {product.description ? (
            <View style={s.descBlock}>
              <Text style={s.descLabel}>Description</Text>
              <Text style={s.desc} numberOfLines={expanded ? undefined : 4}>
                {product.description}
              </Text>
              <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
                <Text style={s.readMore}>{expanded ? "Réduire ↑" : "Lire plus ↓"}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ── Similar products ── */}
        {similar.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Produits similaires</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: S.screen }}
            >
              {similar.map(p => <MiniCard key={p.id ?? p.slug} item={p} />)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Floating top bar ── */}
      <View style={[s.floatBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.floatBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft color="#fff" width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity style={s.floatBtn} onPress={() => setLiked(v => !v)} activeOpacity={0.8}>
          <Heart
            color={liked ? "#ff4d6d" : "#fff"}
            fill={liked ? "#ff4d6d" : "none"}
            width={19} height={19}
          />
        </TouchableOpacity>
      </View>

      {/* ── Sticky CTA footer — always visible ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
        {hasWhatsApp && (
          <TouchableOpacity
            style={s.waBtn}
            onPress={() => Linking.openURL(`https://wa.me/${product.boutique_whatsapp.replace(/\D/g, "")}`)}
            activeOpacity={0.88}
          >
            <MessageCircle color="#fff" width={19} height={19} />
            <Text style={s.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        {hasPhone && (
          <TouchableOpacity
            style={[s.callBtn, !hasWhatsApp && { flex: 1 }]}
            onPress={() => Linking.openURL(`tel:${product.boutique_phone}`)}
            activeOpacity={0.88}
          >
            <Phone color={INK} width={19} height={19} />
            <Text style={s.callBtnText}>Appeler</Text>
          </TouchableOpacity>
        )}
        {!hasWhatsApp && !hasPhone && (
          <TouchableOpacity
            style={[s.callBtn, { flex: 1, backgroundColor: INK }]}
            onPress={() => router.push(`/boutique/${product.boutique_slug ?? product.boutique}`)}
            activeOpacity={0.88}
          >
            <ShoppingBag color="#fff" width={19} height={19} />
            <Text style={[s.callBtnText, { color: "#fff" }]}>Voir la boutique</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  noData: { fontFamily: F.regular, fontSize: Sz.base, color: INK3 },

  // Image
  imgPh: { flex: 1, alignItems: "center", justifyContent: "center" },

  dotsRow: { position: "absolute", bottom: 48, alignSelf: "center",
    flexDirection: "row", gap: 5 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.18)" },
  dotOn:   { width: 18, backgroundColor: INK, borderRadius: 3 },

  thumbStrip: { position: "absolute", bottom: 10, alignSelf: "center",
    flexDirection: "row", gap: 6 },
  thumb:      { width: 40, height: 40, borderRadius: 8, overflow: "hidden",
    borderWidth: 2, borderColor: "rgba(0,0,0,0.10)", backgroundColor: SURF },
  thumbOn:    { borderColor: INK, borderWidth: 2 },
  thumbImg:   { width: "100%", height: "100%" },
  thumbPh:    { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },

  // Floating bar
  floatBar: { position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 20, zIndex: 20 },
  floatBtn: { width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center", justifyContent: "center" },

  // Sheet
  sheet: { paddingHorizontal: S.screen, paddingTop: 22, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: BDR },

  tagsRow:       { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 12 },
  catBadge:      { backgroundColor: "rgba(245,196,0,0.15)", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6 },
  catText:       { fontFamily: F.bold, fontSize: 11, color: C.goldDark, textTransform: "uppercase",
    letterSpacing: 0.5 },
  stockBadge:    { flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(34,197,94,0.10)", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6 },
  stockBadgeOut: { backgroundColor: "rgba(248,113,113,0.10)" },
  stockDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  stockDotOut:   { backgroundColor: C.error },
  stockText:     { fontFamily: F.bold, fontSize: 11, color: C.success },
  stockTextOut:  { color: C.error },

  title: { fontFamily: F.bold, fontSize: 22, color: INK, lineHeight: 28,
    marginBottom: 14, letterSpacing: -0.3 },

  priceRow: { flexDirection: "row", alignItems: "baseline",
    justifyContent: "space-between", marginBottom: 20 },
  price:    { fontFamily: F.bold, fontSize: 30, color: INK, lineHeight: 34 },
  priceCur: { fontFamily: F.medium, fontSize: 14, color: INK3 },
  stock:    { fontFamily: F.regular, fontSize: 12, color: INK3 },

  boutiqueCard: { flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: SURF, borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: BDR },
  boutiqueIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(245,196,0,0.15)",
    alignItems: "center", justifyContent: "center" },
  boutiqueName: { fontFamily: F.bold, fontSize: 14, color: INK, marginBottom: 3 },
  boutiqueLocRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  boutiqueLoc:  { fontFamily: F.regular, fontSize: 12, color: INK3 },

  descBlock: { paddingTop: 4, paddingBottom: 8 },
  descLabel: { fontFamily: F.bold, fontSize: 13, color: INK, marginBottom: 8 },
  desc:      { fontFamily: F.regular, fontSize: 14, color: INK2, lineHeight: 22 },
  readMore:  { fontFamily: F.bold, fontSize: 13, color: Y, marginTop: 8 },

  section:     { marginTop: 24, marginBottom: 8 },
  sectionHead: { paddingHorizontal: S.screen, marginBottom: 14 },
  sectionTitle:{ fontFamily: F.bold, fontSize: 17, color: INK },

  // Footer
  footer:      { position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10, paddingHorizontal: S.screen, paddingTop: 12,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: BDR },
  waBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, backgroundColor: "#25D366", borderRadius: 14 },
  waBtnText:   { fontFamily: F.bold, fontSize: 15, color: "#fff" },
  callBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, backgroundColor: Y, borderRadius: 14, paddingHorizontal: 20,
    shadowColor: Y, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 4 },
  callBtnText: { fontFamily: F.bold, fontSize: 15, color: INK },
});
