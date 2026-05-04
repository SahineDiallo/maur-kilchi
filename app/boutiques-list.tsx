import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, TextInput,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, MapPin, Search, X, ShoppingBag } from "react-native-feather";
import api from "@/lib/api";
import BoutiquePlaceholder from "@/components/BoutiquePlaceholder";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const TYPES = [
  { key: "",             label: "Tous",         emoji: "🏪" },
  { key: "supermarche",  label: "Supermarché",  emoji: "🛒" },
  { key: "arrivage",     label: "Arrivage",     emoji: "👗" },
  { key: "electronique", label: "Électronique", emoji: "📱" },
  { key: "autre",        label: "Autre",        emoji: "🏬" },
];

function TypeChip({ item, active, onPress }: {
  item: typeof TYPES[0]; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[tc.btn, active && tc.btnOn]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={tc.emoji}>{item.emoji}</Text>
      <Text style={[tc.label, active && tc.labelOn]}>{item.label}</Text>
    </TouchableOpacity>
  );
}
const tc = StyleSheet.create({
  btn:    { flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.full, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border },
  btnOn:  { backgroundColor: "#111", borderColor: "#111" },
  emoji:  { fontSize: 14 },
  label:  { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  labelOn:{ fontFamily: F.medium, color: "#fff" },
});

function BoutiqueCard({ item }: { item: any }) {
  const router = useRouter();
  const typeLabel = item.boutique_type
    ? item.boutique_type.charAt(0).toUpperCase() + item.boutique_type.slice(1)
    : null;
  return (
    <TouchableOpacity
      style={bc.card}
      onPress={() => router.push(`/boutique/${item.slug}`)}
      activeOpacity={0.88}
    >
      {/* Image — left */}
      <View style={bc.imgWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={bc.img} contentFit="cover" />
          : <BoutiquePlaceholder boutiqueType={item.boutique_type} name={item.name} size="compact" />}
      </View>

      {/* Details — right */}
      <View style={bc.info}>
        <Text style={bc.name} numberOfLines={2}>{item.name}</Text>
        {typeLabel && (
          <View style={bc.typePill}>
            <Text style={bc.typeText}>{typeLabel}</Text>
          </View>
        )}
        {item.ville ? (
          <View style={bc.locRow}>
            <MapPin color={C.textMuted} width={11} height={11} />
            <Text style={bc.loc} numberOfLines={1}>{item.ville}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
const bc = StyleSheet.create({
  card:     { backgroundColor: C.card, borderRadius: R.xl,
    flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingRight: 14, gap: 14 },
  imgWrap:  { width: 110, height: 110, borderRadius: R.xl, overflow: "hidden", flexShrink: 0 },
  img:      { width: "100%", height: "100%" },
  info:     { flex: 1, gap: 5 },
  name:     { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, lineHeight: 20 },
  typePill: { alignSelf: "flex-start", backgroundColor: "rgba(245,196,0,0.15)",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.full },
  typeText: { fontFamily: F.medium, fontSize: Sz.xs, color: C.goldDark },
  locRow:   { flexDirection: "row", alignItems: "center", gap: 3 },
  loc:      { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted },
});

export default function BoutiquesList() {
  const router = useRouter();

  const [boutiques, setBoutiques] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [typeFilter,setTypeFilter]= useState("");
  const [query,     setQuery]     = useState("");
  const [search,    setSearch]    = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchBoutiques = useCallback(() => {
    api.get("/boutiques/")
      .then((d: any) => {
        const all: any[] = d?.results ?? d ?? [];
        // Exclude restaurants — they have their own dedicated tab
        setBoutiques(all.filter((b) => b.boutique_type !== "restaurant"));
      })
      .catch(() => setBoutiques([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBoutiques(); }, []);

  useFocusEffect(useCallback(() => {
    api.get("/boutiques/").then((d: any) => {
      const all: any[] = d?.results ?? d ?? [];
      setBoutiques(all.filter((b) => b.boutique_type !== "restaurant"));
    }).catch(() => {});
  }, []));

  const filtered = boutiques.filter((b) => {
    const matchType   = typeFilter === "" || b.boutique_type === typeFilter;
    const matchSearch = search.trim() === "" ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.ville?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <View style={s.root}>

      {/* Lemon yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={s.gradientWash}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color={C.textPrimary} width={20} height={20} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.title}>Boutiques · المحلات</Text>
            <Text style={s.sub}>{filtered.length} boutique{filtered.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Search color={C.textMuted} width={16} height={16} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une boutique..."
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={C.textMuted} width={15} height={15} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8, paddingBottom: 14, paddingTop: 4 }}
        >
          {TYPES.map((t) => (
            <TypeChip
              key={t.key}
              item={t}
              active={typeFilter === t.key}
              onPress={() => setTypeFilter(t.key)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.grid}
      >
        {loading ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <ShoppingBag color={C.textMuted} width={40} height={40} strokeWidth={1.5} />
            <Text style={s.emptyText}>Aucune boutique trouvée</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map((item) => (
              <BoutiqueCard key={String(item.id)} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  gradientWash:{ position: "absolute", top: 0, left: 0, right: 0, height: 320, zIndex: 0 },
  header:      { zIndex: 5 },
  headerRow:  { flexDirection: "row", alignItems: "center",
    paddingHorizontal: S.screen, paddingVertical: 12, gap: 12 },
  back:       { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  title:      { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  sub:        { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 1 },

  searchBox:  { flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: S.screen, marginBottom: 12,
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 14,
    height: 44, borderWidth: 1, borderColor: C.border },
  searchInput:{ flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },

  grid:       { padding: S.screen, paddingBottom: 40 },
  list:       { gap: 4 },

  emptyWrap:  { flex: 1, alignItems: "center", justifyContent: "center",
    paddingTop: 64, gap: 10 },
  emptyText:  { fontFamily: F.medium, fontSize: Sz.base, color: C.textMuted },
});
