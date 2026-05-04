import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus, ShoppingBag, MapPin, ChevronRight } from "react-native-feather";
import api from "@/lib/api";
import BoutiquePlaceholder from "@/components/BoutiquePlaceholder";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const CARD_W = Dimensions.get("window").width - S.screen * 2;

const TYPE_LABELS: Record<string, string> = {
  restaurant:   "🍽️ Restaurant",
  arrivage:     "📦 Arrivage",
  supermarche:  "🛒 Supermarché",
  electronique: "📱 Électronique",
  autre:        "🏪 Boutique",
};

type Boutique = {
  id: string;
  name: string;
  boutique_type: string;
  ville: string | null;
  image_url: string | null;
};

export default function MyBoutiques() {
  const router = useRouter();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoutiques = useCallback(() => {
    api.get<{ results?: Boutique[] } | Boutique[]>("/boutiques/mine/")
      .then((data: any) => setBoutiques(data.results ?? data))
      .catch(() => setBoutiques([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBoutiques(); }, []);

  // Refresh list when returning from edit or create screens
  useFocusEffect(useCallback(() => {
    api.get<{ results?: Boutique[] } | Boutique[]>("/boutiques/mine/")
      .then((data: any) => setBoutiques(data.results ?? data))
      .catch(() => {});
  }, []));

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={C.textPrimary} width={20} height={20} />
        </TouchableOpacity>
        <Text style={s.title}>Mes boutiques</Text>
        {boutiques.length === 0 && (
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => router.push("/boutique/create-boutique")}
            activeOpacity={0.7}
          >
            <Plus color={C.gold} width={20} height={20} />
          </TouchableOpacity>
        )}
        {boutiques.length > 0 && <View style={{ width: 40 }} />}
      </View>

      {/* Hide add button once limit reached */}
      {!loading && boutiques.length >= 1 && (
        <View style={s.limitBanner}>
          <Text style={s.limitText}>Vous avez atteint la limite d'une boutique par compte.</Text>
        </View>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.gold} />
        </View>
      ) : boutiques.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <ShoppingBag color={C.textMuted} width={36} height={36} strokeWidth={1.5} />
          </View>
          <Text style={s.emptyTitle}>Aucune boutique</Text>
          <Text style={s.emptyText}>Créez votre première boutique pour commencer à vendre.</Text>
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => router.push("/boutique/create-boutique")}
            activeOpacity={0.85}
          >
            <Text style={s.createBtnText}>Créer une boutique</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={boutiques}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: S.screen, gap: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => router.push(`/boutique/${item.slug}`)}
              activeOpacity={0.88}
            >
              {/* Image zone — full width */}
              <View style={s.imgWrap}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }} style={s.img} resizeMode="cover" />
                  : <BoutiquePlaceholder boutiqueType={item.boutique_type} name={item.name} size="full" />}
                {/* Type badge overlaid bottom-left */}
                {item.image_url && (
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>
                      {TYPE_LABELS[item.boutique_type] ?? "🏪 Boutique"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info row below */}
              <View style={s.info}>
                <View style={s.infoLeft}>
                  <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                  {item.ville ? (
                    <View style={s.locRow}>
                      <MapPin color={C.textMuted} width={12} height={12} />
                      <Text style={s.locText}>{item.ville}</Text>
                    </View>
                  ) : (
                    <Text style={s.locText}>Aucune ville renseignée</Text>
                  )}
                </View>
                <View style={s.chevronWrap}>
                  <ChevronRight color={C.gold} width={18} height={18} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border },
  back:    { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center" },
  addBtn:  { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center" },
  title:   { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", padding: S.screen },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary, marginBottom: 8 },
  emptyText:  { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted,
    textAlign: "center", lineHeight: 22, marginBottom: 24 },
  createBtn:  { backgroundColor: C.gold, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: R.full },
  createBtnText: { fontFamily: F.bold, fontSize: Sz.md, color: "#fff" },
  card:      { width: CARD_W, backgroundColor: C.card, borderRadius: R.xl,
    overflow: "hidden", ...Border.card },

  imgWrap:    { width: "100%", height: 160, backgroundColor: C.goldLight, overflow: "hidden" },
  img:        { width: "100%", height: "100%" },

  typeBadge: { position: "absolute", bottom: 10, left: 12,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: R.full,
    paddingHorizontal: 10, paddingVertical: 4 },
  typeText:  { fontFamily: F.medium, fontSize: Sz.xs, color: "#fff" },

  info:        { flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14 },
  infoLeft:    { flex: 1 },
  name:        { fontFamily: F.bold, fontSize: Sz.md, color: C.textPrimary, marginBottom: 4 },
  locRow:      { flexDirection: "row", alignItems: "center", gap: 4 },
  locText:     { fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted },
  chevronWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center" },
  limitBanner: { marginHorizontal: S.screen, marginTop: 12, marginBottom: 4,
    backgroundColor: C.goldLight, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10 },
  limitText:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.goldDark, textAlign: "center" },
});
