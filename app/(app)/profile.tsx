import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import {
  ChevronRight, ShoppingBag, User, LogOut,
  Settings, Shield, Star, Package, MapPin, Truck,
} from "react-native-feather";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { C, F, Sz, R, S } from "@/constants/theme";

// ─── Shared menu row ──────────────────────────────────────────────────────────
function MenuItem({ icon: Icon, label, sub, onPress, danger, right }: any) {
  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[mi.iconWrap, danger && mi.iconDanger]}>
        <Icon color={danger ? C.error : C.gold} width={18} height={18} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mi.label, danger && { color: C.error }]}>{label}</Text>
        {sub && <Text style={mi.sub}>{sub}</Text>}
      </View>
      {right ?? <ChevronRight color={C.textMuted} width={16} height={16} />}
    </TouchableOpacity>
  );
}
const mi = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", paddingVertical: 14,
    paddingHorizontal: S.card, borderBottomWidth: 1, borderBottomColor: C.border },
  iconWrap:   { width: 36, height: 36, borderRadius: R.md, backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center", marginRight: 12 },
  iconDanger: { backgroundColor: C.errorBg },
  label:      { fontFamily: F.medium, fontSize: Sz.base, color: C.textPrimary },
  sub:        { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 1 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={sc.wrap}>
      {title && <Text style={sc.label}>{title}</Text>}
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:  { backgroundColor: C.card, borderRadius: 15, marginHorizontal: S.screen,
    marginBottom: 12, overflow: Platform.OS === "android" ? "visible" : "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  label: { fontFamily: F.bold, fontSize: Sz.xs, color: C.textMuted,
    paddingHorizontal: S.card, paddingTop: 12, paddingBottom: 4,
    textTransform: "uppercase", letterSpacing: 0.8 },
});

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <View style={st.wrap}>
      <View style={st.iconCircle}>
        <Icon color={C.gold} width={16} height={16} strokeWidth={2} />
      </View>
      <Text style={st.value}>{value}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  wrap:       { flex: 1, alignItems: "center", paddingVertical: 16 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center", marginBottom: 6 },
  value:      { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  label:      { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 2 },
});

const VEHICLE_LABEL: Record<string, string> = {
  moto: "🏍️ Moto", thiouk_thiouk: "🛺 Thiouk Thiouk", auto: "🚗 Auto",
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIVREUR PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function LivreurProfile({ user, livreur, onToggleOnline, onLogout, router }: any) {
  return (
    <ScrollView style={p.body} contentContainerStyle={{ paddingBottom: S.tabBar + 16 }}>

      {/* Stats row */}
      <View style={[p.statsCard, { marginTop: 0 }]}>
        <StatPill icon={Star} value={livreur.rating?.toFixed(1) ?? "5.0"} label="Note" />
        <View style={p.statsDivider} />
        <StatPill icon={Package} value={livreur.deliveries_count ?? 0} label="Livraisons" />
        <View style={p.statsDivider} />
        <StatPill icon={Truck} value={VEHICLE_LABEL[livreur.vehicle_type] ?? "—"} label="Véhicule" />
      </View>

      {/* Online toggle */}
      <Section>
        <View style={p.onlineRow}>
          <View style={p.onlineLeft}>
            <View style={[p.onlineDot, livreur.is_online ? p.onlineDotOn : p.onlineDotOff]} />
            <View>
              <Text style={p.onlineLabel}>
                {livreur.is_online ? "En ligne · متصل" : "Hors ligne · غير متصل"}
              </Text>
              <Text style={p.onlineSub}>
                {livreur.is_online
                  ? "Vous êtes visible par les clients"
                  : "Vous n'apparaissez pas dans la liste"}
              </Text>
            </View>
          </View>
          <Switch
            value={livreur.is_online}
            onValueChange={onToggleOnline}
            trackColor={{ false: C.border, true: C.gold }}
            thumbColor="#fff"
          />
        </View>
      </Section>

      {/* Zone */}
      {livreur.zone ? (
        <Section title="Zone de livraison">
          <View style={mi.row}>
            <View style={mi.iconWrap}>
              <MapPin color={C.gold} width={18} height={18} strokeWidth={2} />
            </View>
            <Text style={[mi.label, { flex: 1 }]}>{livreur.zone}</Text>
          </View>
        </Section>
      ) : null}

      {/* Account */}
      <Section title="Compte · الحساب">
        <MenuItem icon={User} label="Modifier le profil" sub="Nom, photo"
          onPress={() => router.push("/edit-profile")} />
        <MenuItem icon={Settings} label="Paramètres" onPress={() => {}} />
      </Section>

      {/* Logout */}
      <Section>
        <MenuItem icon={LogOut} label="Déconnexion · خروج" danger onPress={onLogout} />
      </Section>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENDEUR PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function VendeurProfile({ user, boutique, onLogout, router }: any) {
  const handleBoutiquePress = () => {
    if (boutique) {
      router.push(`/boutique/${boutique.slug}`);
    } else {
      router.push("/boutique/create-boutique");
    }
  };

  return (
    <ScrollView style={p.body} contentContainerStyle={{ paddingBottom: S.tabBar + 16 }}>
      <Section title="Ma boutique · محلي">
        <MenuItem
          icon={ShoppingBag}
          label={boutique ? boutique.name : "Créer ma boutique"}
          sub={boutique ? "Voir et gérer ma boutique" : "Vous n'avez pas encore de boutique"}
          onPress={handleBoutiquePress}
        />
      </Section>

      <Section title="Compte · الحساب">
        <MenuItem icon={User} label="Modifier le profil" sub="Nom, photo, coordonnées"
          onPress={() => router.push("/edit-profile")} />
        <MenuItem icon={Settings} label="Paramètres" onPress={() => {}} />
        {user?.is_staff && (
          <MenuItem icon={Shield} label="Administration" sub="Dashboard admin"
            onPress={() => router.push("/admin")} />
        )}
      </Section>

      <Section>
        <MenuItem icon={LogOut} label="Déconnexion · خروج" danger onPress={onLogout} />
      </Section>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Profile() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  const [livreur,      setLivreur]      = useState<any>(null);
  const [boutique,     setBoutique]     = useState<any>(null);
  const [roleLoading,  setRoleLoading]  = useState(true);

  useEffect(() => {
    console.log("[Profile] useEffect — isAuthenticated:", isAuthenticated, "| user.role:", user?.role ?? "null");
    if (!isAuthenticated) {
      console.log("[Profile] not authenticated → skipping fetch");
      return;
    }
    if (user?.role === "livreur") {
      console.log("[Profile] 🚚 fetching /livreurs/me/…");
      api.get("/livreurs/me/")
        .then((d) => { console.log("[Profile] /livreurs/me/ ✅", JSON.stringify(d).slice(0, 120)); setLivreur(d); })
        .catch((e) => { console.error("[Profile] /livreurs/me/ ❌", e?.message); setLivreur(null); })
        .finally(() => setRoleLoading(false));
    } else {
      console.log("[Profile] role is not livreur → roleLoading = false");
      setRoleLoading(false);
    }
    console.log("[Profile] 🏪 fetching /boutiques/mine/…");
    api.get("/boutiques/mine/")
      .then((d) => { console.log("[Profile] /boutiques/mine/ ✅", JSON.stringify(d).slice(0, 120)); setBoutique(Array.isArray(d) ? (d[0] ?? null) : (d ?? null)); })
      .catch((e) => { console.error("[Profile] /boutiques/mine/ ❌", e?.message); setBoutique(null); });
  }, [user?.role, isAuthenticated]);

  console.log("[Profile] render — isAuthenticated:", isAuthenticated, "| roleLoading:", roleLoading, "| isLivreur:", !roleLoading && livreur !== null);

  if (!isAuthenticated) return <Redirect href="/(auth)" />;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive",
        onPress: () => { logout(); router.replace("/(auth)/sign-in"); } },
    ]);
  };

  const handleToggleOnline = useCallback(async (val: boolean) => {
    if (!livreur) return;
    const prev = livreur.is_online;
    setLivreur((l: any) => ({ ...l, is_online: val }));
    try {
      // If going online but no coords yet, just use PATCH me
      await api.patch("/livreurs/me/", {});
      // Push is_online via location endpoint
      const coords = livreur.latitude && livreur.longitude
        ? { latitude: livreur.latitude, longitude: livreur.longitude, is_online: val }
        : { latitude: 18.090, longitude: -15.970, is_online: val };
      await api.patch("/livreurs/me/location/", coords);
    } catch {
      setLivreur((l: any) => ({ ...l, is_online: prev }));
    }
  }, [livreur]);

  const isLivreur = !roleLoading && livreur !== null;

  return (
    <View style={p.root}>
      {/* Lemon yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={p.gradientWash}
        pointerEvents="none"
      />
      {/* ── Header ── */}
      <View style={p.headerWrap}>
        <SafeAreaView>
          {/* Role badge */}
          <View style={p.roleBadgeRow}>
            <View style={[p.roleBadge, isLivreur ? p.roleBadgeLivreur : p.roleBadgeVendeur]}>
              <Text style={p.roleBadgeText}>
                {roleLoading ? "…" : isLivreur ? "🏍️  Livreur" : "🏪  Vendeur"}
              </Text>
            </View>
          </View>

          {/* Avatar + name */}
          <View style={p.headerInner}>
            <TouchableOpacity
              style={p.avatarWrap}
              onPress={() => router.push("/edit-profile")}
              activeOpacity={0.8}
            >
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={p.avatar} contentFit="cover" />
                : <View style={p.avatarPlaceholder}>
                    <User color={C.textMuted} width={28} height={28} />
                  </View>}
              {isLivreur && (
                <View style={[p.onlinePip, livreur.is_online ? p.onlinePipOn : p.onlinePipOff]} />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={p.name}>{user?.first_name} {user?.last_name}</Text>
              <Text style={p.phone}>{user?.phone}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Role-specific body ── */}
      {!roleLoading && (
        isLivreur
          ? <LivreurProfile
              user={user}
              livreur={livreur}
              onToggleOnline={handleToggleOnline}
              onLogout={handleLogout}
              router={router}
            />
          : <VendeurProfile
              user={user}
              boutique={boutique}
              onLogout={handleLogout}
              router={router}
            />
      )}
    </View>
  );
}

const p = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  gradientWash: { position: "absolute", top: 0, left: 0, right: 0, height: 320, zIndex: 0 },
  headerWrap:   { paddingBottom: 20, zIndex: 5 },

  roleBadgeRow:    { alignItems: "flex-start", paddingHorizontal: S.screen, paddingTop: S.px16 },
  roleBadge:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.full },
  roleBadgeVendeur:{ backgroundColor: "rgba(0,0,0,0.10)" },
  roleBadgeLivreur:{ backgroundColor: "rgba(0,0,0,0.10)" },
  roleBadgeText:   { fontFamily: F.bold, fontSize: Sz.xs, color: "#000" },

  headerInner: { flexDirection: "row", alignItems: "center",
    paddingHorizontal: S.screen, paddingTop: 10, paddingBottom: 8, gap: 14 },
  avatarWrap:  { width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: "rgba(0,0,0,0.12)", overflow: "visible" },
  avatar:      { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  onlinePip:   { position: "absolute", bottom: 1, right: 1, width: 14, height: 14,
    borderRadius: 7, borderWidth: 2, borderColor: "#fff" },
  onlinePipOn: { backgroundColor: C.success },
  onlinePipOff:{ backgroundColor: C.textDisabled },
  name:        { fontFamily: F.bold, fontSize: Sz.lg, color: "#000" },
  phone:       { fontFamily: F.regular, fontSize: Sz.sm, color: "rgba(0,0,0,0.55)", marginTop: 2 },

  body: { flex: 1 },

  // Livreur stats
  statsCard:    { flexDirection: "row", backgroundColor: C.card, borderRadius: 15,
    marginHorizontal: S.screen, marginBottom: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  statsDivider: { width: 1, backgroundColor: C.border, marginVertical: 12 },

  // Online toggle row
  onlineRow:  { flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: S.card },
  onlineLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  onlineDot:  { width: 12, height: 12, borderRadius: 6 },
  onlineDotOn: { backgroundColor: C.success },
  onlineDotOff:{ backgroundColor: C.textDisabled },
  onlineLabel: { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary },
  onlineSub:   { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 1 },
});
