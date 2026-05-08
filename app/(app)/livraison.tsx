import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Linking, Alert, Dimensions, RefreshControl, Animated,
} from "react-native";
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, X, Phone, MessageCircle, MapPin, Star,
  Navigation, Zap, Truck, ArrowRight, Users,
} from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, S, R } from "@/constants/theme";
import VillePicker from "@/components/VillePicker";
import { useLocationStore } from "@/store/useLocationStore";

const { width } = Dimensions.get("window");
const POLL_MS = 10_000;
const INK  = "#111";
const INK2 = "#555";
const INK3 = "#999";
const Y    = C.gold;
const SURF = "#F6F4EF";
const BDR  = "rgba(0,0,0,0.07)";

const VEHICLE_EMOJI: Record<string, string> = {
  moto: "🏍️", thiouk_thiouk: "🛺", auto: "🚗",
};
const NKC = { latitude: 18.090, longitude: -15.970, latitudeDelta: 0.06, longitudeDelta: 0.06 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isInMauritania(lat: number, lng: number) {
  return lat >= 14.7 && lat <= 27.3 && lng >= -17.1 && lng <= -4.8;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ uri, name, size = 52 }: { uri?: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden",
      borderWidth: 2, borderColor: BDR, backgroundColor: "rgba(245,196,0,0.15)",
      alignItems: "center", justifyContent: "center" }}>
      {uri
        ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
        : <Text style={{ fontFamily: F.bold, fontSize: size * 0.38, color: Y }}>
            {name?.[0]?.toUpperCase() ?? "?"}
          </Text>}
    </View>
  );
}

// ─── Livreur card ─────────────────────────────────────────────────────────────
function LivreurCard({ item, recommended }: { item: any; recommended?: boolean }) {
  const phone = item.phone ?? item.phone_number ?? "";
  const call  = () => phone && Alert.alert(`Appeler ${item.name}`, undefined, [
    { text: "Annuler", style: "cancel" },
    { text: "Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
  ]);
  const wa = () => phone && Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() => {});

  return (
    <View style={lc.card}>
      {recommended && (
        <View style={lc.recBadge}>
          <Zap color={C.goldDark} width={9} height={9} fill={C.goldDark} />
          <Text style={lc.recText}>Recommandé</Text>
        </View>
      )}
      <Avatar uri={item.avatar_url} name={item.name} size={52} />
      <View style={lc.info}>
        <Text style={lc.name} numberOfLines={1}>{item.name}</Text>
        <View style={lc.metaRow}>
          <Star color="#F59E0B" fill="#F59E0B" width={11} height={11} />
          <Text style={lc.rating}>{item.rating?.toFixed(1) ?? "5.0"}</Text>
          <Text style={lc.sep}>·</Text>
          <Text style={lc.meta}>{item.deliveries_count ?? 0} livraisons</Text>
          <Text style={lc.sep}>·</Text>
          <Text style={lc.meta}>{VEHICLE_EMOJI[item.vehicle_type] ?? "🚗"}</Text>
        </View>
        {item.zone ? (
          <View style={lc.zoneRow}>
            <MapPin color={INK3} width={10} height={10} />
            <Text style={lc.zone}>{item.zone}</Text>
          </View>
        ) : null}
      </View>
      <View style={lc.btns}>
        <TouchableOpacity style={lc.waBtn} onPress={wa} activeOpacity={0.8}>
          <MessageCircle color="#fff" width={15} height={15} />
        </TouchableOpacity>
        <TouchableOpacity style={lc.callBtn} onPress={call} activeOpacity={0.8}>
          <Phone color="#fff" width={15} height={15} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const lc = StyleSheet.create({
  card:        { flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: BDR },
  recBadge:    { position: "absolute", top: -8, left: 14, flexDirection: "row",
    alignItems: "center", gap: 3, backgroundColor: C.goldLight,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: R.full,
    borderWidth: 1, borderColor: C.gold, zIndex: 2 },
  recText:     { fontFamily: F.bold, fontSize: 9, color: C.goldDark },
  info:        { flex: 1, gap: 4 },
  name:        { fontFamily: F.bold, fontSize: 14, color: INK },
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  rating:      { fontFamily: F.bold, fontSize: 11, color: "#D97706" },
  sep:         { color: INK3, fontSize: 11 },
  meta:        { fontFamily: F.regular, fontSize: 11, color: INK3 },
  zoneRow:     { flexDirection: "row", alignItems: "center", gap: 3 },
  zone:        { fontFamily: F.medium, fontSize: 11, color: INK3 },
  btns:        { flexDirection: "column", gap: 7 },
  waBtn:       { width: 36, height: 36, borderRadius: R.full,
    backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" },
  callBtn:     { width: 36, height: 36, borderRadius: R.full,
    backgroundColor: INK, alignItems: "center", justifyContent: "center" },
});

// ─── Voyageur card ────────────────────────────────────────────────────────────
function VoyageurCard({ item }: { item: any }) {
  const phone = item.phone ?? "";
  const call  = () => phone && Alert.alert(`Appeler ${item.name}`, undefined, [
    { text: "Annuler", style: "cancel" },
    { text: "Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
  ]);
  const wa = () => phone && Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() => {});

  return (
    <View style={vc.row}>
      <Avatar uri={item.avatar_url} name={item.name} size={46} />
      <View style={vc.info}>
        <Text style={vc.name}>{item.name}</Text>
        <View style={vc.trajet}>
          <Text style={vc.city} numberOfLines={1}>{item.trajet_depart || "—"}</Text>
          <ArrowRight color={Y} width={11} height={11} />
          <Text style={vc.city} numberOfLines={1}>{item.trajet_destination || "—"}</Text>
        </View>
      </View>
      <View style={vc.btns}>
        <TouchableOpacity style={vc.waBtn} onPress={wa} activeOpacity={0.8}>
          <MessageCircle color="#fff" width={14} height={14} />
        </TouchableOpacity>
        <TouchableOpacity style={vc.callBtn} onPress={call} activeOpacity={0.8}>
          <Phone color="#fff" width={14} height={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const vc = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BDR },
  info:   { flex: 1, gap: 5 },
  name:   { fontFamily: F.bold, fontSize: 14, color: INK },
  trajet: { flexDirection: "row", alignItems: "center", gap: 5 },
  city:   { fontFamily: F.medium, fontSize: 12, color: INK2, flex: 1 },
  btns:   { flexDirection: "row", gap: 7 },
  waBtn:  { width: 34, height: 34, borderRadius: R.full,
    backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" },
  callBtn:{ width: 34, height: 34, borderRadius: R.full,
    backgroundColor: INK, alignItems: "center", justifyContent: "center" },
});

// ─── Outside Mauritania empty state ───────────────────────────────────────────
function OutsideMR() {
  return (
    <View style={os.wrap}>
      <View style={os.iconWrap}>
        <MapPin color={INK3} width={32} height={32} />
      </View>
      <Text style={os.title}>Service non disponible</Text>
      <Text style={os.sub}>
        La livraison est réservée à la Mauritanie.{"\n"}
        Revenez lorsque vous êtes sur le territoire.
      </Text>
    </View>
  );
}
const os = StyleSheet.create({
  wrap:     { flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: S.screen, paddingBottom: 60 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: SURF,
    alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:    { fontFamily: F.bold, fontSize: 18, color: INK, marginBottom: 10 },
  sub:      { fontFamily: F.regular, fontSize: 14, color: INK3,
    textAlign: "center", lineHeight: 22 },
});

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  return (
    <View style={sk.row}>
      <Animated.View style={[sk.avatar, { opacity }]} />
      <View style={sk.info}>
        <Animated.View style={[sk.line, { width: "55%", opacity }]} />
        <Animated.View style={[sk.line, { width: "38%", opacity }]} />
      </View>
      <View style={sk.btns}>
        <Animated.View style={[sk.btn, { opacity }]} />
        <Animated.View style={[sk.btn, { opacity }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BDR },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: SURF },
  info:   { flex: 1, gap: 8 },
  line:   { height: 11, borderRadius: 6, backgroundColor: SURF },
  btns:   { flexDirection: "row", gap: 7 },
  btn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: SURF },
});

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: S.screen }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

// ─── Car Rapide card ──────────────────────────────────────────────────────────
function CarRapideCard({ item }: { item: any }) {
  const phone = item.phone ?? item.phone_number ?? "";
  const call  = () => phone && Alert.alert(`Appeler ${item.name}`, undefined, [
    { text: "Annuler", style: "cancel" },
    { text: "Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
  ]);
  const wa = () => phone && Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() => {});

  return (
    <View style={cr.card}>
      <Avatar uri={item.avatar_url} name={item.name} size={50} />
      <View style={cr.info}>
        <Text style={cr.name} numberOfLines={1}>{item.name}</Text>
        <View style={cr.metaRow}>
          <Star color="#F59E0B" fill="#F59E0B" width={11} height={11} />
          <Text style={cr.rating}>{item.rating?.toFixed(1) ?? "5.0"}</Text>
          <Text style={cr.sep}>·</Text>
          <Text style={cr.meta}>Car Rapide</Text>
        </View>
        {item.wilaya ? (
          <View style={cr.zoneRow}>
            <MapPin color={INK3} width={10} height={10} />
            <Text style={cr.zone}>{item.wilaya}</Text>
          </View>
        ) : null}
      </View>
      <View style={cr.btns}>
        <TouchableOpacity style={cr.waBtn} onPress={wa} activeOpacity={0.8}>
          <MessageCircle color="#fff" width={15} height={15} />
        </TouchableOpacity>
        <TouchableOpacity style={cr.callBtn} onPress={call} activeOpacity={0.8}>
          <Phone color="#fff" width={15} height={15} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const cr = StyleSheet.create({
  card:    { flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: BDR },
  info:    { flex: 1, gap: 4 },
  name:    { fontFamily: F.bold, fontSize: 14, color: INK },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating:  { fontFamily: F.bold, fontSize: 11, color: "#D97706" },
  sep:     { color: INK3, fontSize: 11 },
  meta:    { fontFamily: F.regular, fontSize: 11, color: INK3 },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  zone:    { fontFamily: F.medium, fontSize: 11, color: INK3 },
  btns:    { flexDirection: "column", gap: 7 },
  waBtn:   { width: 36, height: 36, borderRadius: R.full,
    backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" },
  callBtn: { width: 36, height: 36, borderRadius: R.full,
    backgroundColor: INK, alignItems: "center", justifyContent: "center" },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Livraison() {
  const [tab,         setTab]         = useState<"livreurs" | "voyage" | "carrapide">("livreurs");

  // Livraison state
  const [livreurs,    setLivreurs]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [isNearby,    setIsNearby]    = useState(false);
  const [query,       setQuery]       = useState("");
  const [vehicle,     setVehicle]     = useState("tous");

  // Location store (populated by home screen on first mount)
  const { coords: storedCoords, inMauritania: storedInMR, detectedCity: storedCity,
          setLocation: storeSetLocation } = useLocationStore();

  // Voyage state — pre-fill origin if we already know the user is in MR
  const [origin,         setOrigin]         = useState(storedInMR === true && storedCity ? storedCity : "");
  const [destination,    setDestination]    = useState("");
  const [voyageurs,      setVoyageurs]      = useState<any[]>([]);
  const [voyageLoad,     setVoyageLoad]     = useState(false);
  const [voyageSearched, setVoyageSearched] = useState(false);

  // Car Rapide state
  const [carrapides,    setCarrapides]    = useState<any[]>([]);
  const [carrapideLoad, setCarrapideLoad] = useState(false);
  const [carrapideNearby, setCarrapideNearby] = useState(false);

  // Location — initialise from store so livraison doesn't wait for GPS again
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(storedCoords);
  const [inMR,       setInMR]       = useState<boolean | null>(storedInMR);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(storedCoords);
  const [mapReady,   setMapReady]   = useState(false);
  const [mapReadyCR, setMapReadyCR] = useState(false);
  const mapRef   = useRef<MapView>(null);
  const mapRefCR = useRef<MapView>(null);

  // ── Livreurs fetch ──────────────────────────────────────────────────────────
  const fetchLivreurs = useCallback(async () => {
    try {
      const c = coordsRef.current;
      let data: any[] = [];
      let nearby = false;
      if (c) {
        try {
          console.log(`[Livraison] 🌐 GET /livreurs/ with coords lat=${c.latitude} lng=${c.longitude}`);
          data = await api.get<any[]>(`/livreurs/?lat=${c.latitude}&lng=${c.longitude}&radius=15`);
          console.log("[Livraison] /livreurs/ (nearby) ✅ count:", data.length);
          nearby = data.length > 0;
        } catch (e: any) {
          console.warn("[Livraison] nearby search failed (", e?.message, "), falling back to all livreurs");
        }
      }
      if (data.length === 0) {
        console.log("[Livraison] 🌐 GET /livreurs/ (fallback)");
        data = await api.get<any[]>("/livreurs/");
        console.log("[Livraison] /livreurs/ (fallback) ✅ count:", data.length);
      }
      setLivreurs(data);
      setIsNearby(nearby);
    } catch (e: any) {
      console.error("[Livraison] /livreurs/ ❌", e?.message, e?.response?.status);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Car Rapide fetch ────────────────────────────────────────────────────────
  const fetchCarrapides = useCallback(async () => {
    setCarrapideLoad(true);
    try {
      const c = coordsRef.current;
      let data: any[] = [];
      let nearby = false;
      if (c) {
        try {
          data = await api.get<any[]>(`/maurigos/?lat=${c.latitude}&lng=${c.longitude}&radius=15`);
          nearby = data.length > 0;
        } catch {}
      }
      if (data.length === 0) {
        data = await api.get<any[]>("/maurigos/");
      }
      setCarrapides(data);
      setCarrapideNearby(nearby);
    } catch {
      setCarrapides([]);
    } finally {
      setCarrapideLoad(false);
    }
  }, []);

  // ── Location on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Livraison] 📍 mount — storedCoords:", storedCoords ? `${storedCoords.latitude},${storedCoords.longitude}` : "null", "| storedInMR:", storedInMR);
    // If home screen already detected location, skip GPS entirely
    if (storedInMR !== null && storedCoords) {
      console.log("[Livraison] using cached location, skipping GPS");
      if (storedInMR !== false) fetchLivreurs();
      return;
    }
    let mounted = true;
    (async () => {
      let insideMR = true; // default: fetch unless we confirm outside
      try {
        console.log("[Livraison] checking location permission…");
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === "undetermined") {
          const result = await Location.requestForegroundPermissionsAsync();
          status = result.status;
        }
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          console.log("[Livraison] GPS ✅", c.latitude, c.longitude);
          coordsRef.current = c;
          const inside = isInMauritania(c.latitude, c.longitude);
          insideMR = inside;
          console.log("[Livraison] inMauritania:", inside);
          if (mounted) {
            setUserCoords(c);
            setInMR(inside);
            if (!inside) {
              storeSetLocation(c, false, null);
            } else {
              try {
                const [place] = await Location.reverseGeocodeAsync(c);
                const city = place?.city ?? place?.subregion ?? place?.region ?? "";
                if (city && mounted) setOrigin(city);
                storeSetLocation(c, true, city || null);
              } catch (e: any) {
                console.warn("[Livraison] reverseGeocode failed:", e?.message);
                storeSetLocation(c, true, null);
              }
            }
          }
        } else {
          console.warn("[Livraison] location permission denied:", status);
          if (mounted) setInMR(true);
        }
      } catch (e: any) {
        console.error("[Livraison] location error ❌", e?.message);
        if (mounted) setInMR(null);
      }
      if (insideMR) fetchLivreurs();
    })();
    return () => { mounted = false; };
  }, [fetchLivreurs]);

  // ── Poll only while this screen is focused AND user is in Mauritania ─────────
  useFocusEffect(
    useCallback(() => {
      // No polling outside Mauritania — service is MR-only
      if (inMR === false) return () => {};
      if (tab === "livreurs") {
        const id = setInterval(fetchLivreurs, POLL_MS);
        return () => clearInterval(id);
      }
      if (tab === "carrapide") {
        fetchCarrapides();
        const id = setInterval(fetchCarrapides, POLL_MS);
        return () => clearInterval(id);
      }
      return () => {};
    }, [tab, inMR, fetchLivreurs, fetchCarrapides])
  );

  // ── Voyageurs search ────────────────────────────────────────────────────────
  // Synchronously reset to loading before paint so old results don't flash
  useLayoutEffect(() => {
    if (origin && destination) {
      setVoyageLoad(true);
      setVoyageSearched(false);
      setVoyageurs([]);
    }
  }, [origin, destination]);

  useEffect(() => {
    if (!origin || !destination) return;
    let cancelled = false;
    (async () => {
      try {
        // Fetch both directions — long voyage A→B also covers B→A
        const [fwd, rev] = await Promise.allSettled([
          api.get<any[]>(`/auth/voyageurs/?depart=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`),
          api.get<any[]>(`/auth/voyageurs/?depart=${encodeURIComponent(destination)}&destination=${encodeURIComponent(origin)}`),
        ]);
        if (cancelled) return;
        const fwdData = fwd.status === "fulfilled" && Array.isArray(fwd.value) ? fwd.value : [];
        const revData = rev.status === "fulfilled" && Array.isArray(rev.value) ? rev.value : [];
        // Merge, deduplicate by id
        const seen = new Set<string | number>();
        const merged: any[] = [];
        for (const item of [...fwdData, ...revData]) {
          if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
        }
        setVoyageurs(merged);
      } catch {
        if (!cancelled) setVoyageurs([]);
      } finally {
        if (!cancelled) { setVoyageLoad(false); setVoyageSearched(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [origin, destination]);


  const centerOnUser = async () => {
    if (userCoords) {
      mapRef.current?.animateToRegion({ ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600);
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      coordsRef.current = c;
      setUserCoords(c);
      const inside = isInMauritania(c.latitude, c.longitude);
      setInMR(inside);
      mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600);
      fetchLivreurs();
    }
  };

  const filtered = useMemo(() => {
    let list = [...livreurs];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(l => l.name?.toLowerCase().includes(q) || l.zone?.toLowerCase().includes(q));
    }
    if (vehicle !== "tous") list = list.filter(l => l.vehicle_type === vehicle);
    return list.sort((a, b) => b.rating - a.rating);
  }, [livreurs, query, vehicle]);

  const mapRegion = userCoords
    ? { ...userCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : NKC;

  const outsideMR = inMR === false;

  console.log("[Livraison] render — tab:", tab, "| inMR:", inMR, "| loading:", loading, "| livreurs:", livreurs.length, "| userCoords:", userCoords ? "yes" : "no");

  return (
    <View style={s.root}>

      {/* ── Header ── */}
      <View style={s.headerWrap}>
        <LinearGradient
          colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
          locations={[0, 0.38, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView>
          <View style={s.titleRow}>
            <Text style={s.title}>Livraisons & Voyages</Text>
          </View>

          {/* Segmented tab */}
          <View style={s.tabBar}>
            {([
              { key: "livreurs",   label: "Livreurs",    Icon: Truck      },
              { key: "voyage",     label: "Long Voyage",  Icon: Navigation },
              { key: "carrapide",  label: "Car Rapide",   Icon: Users      },
            ] as const).map(({ key, label, Icon }) => (
              <TouchableOpacity
                key={key}
                style={[s.tabBtn, tab === key && s.tabBtnOn]}
                onPress={() => setTab(key)}
                activeOpacity={0.85}
              >
                <Icon color={tab === key ? "#fff" : INK2} width={12} height={12} />
                <Text style={[s.tabText, tab === key && s.tabTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search — livreurs only */}
          {tab === "livreurs" && (
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <Search color={INK3} width={16} height={16} />
                <TextInput
                  style={s.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Nom ou zone..."
                  placeholderTextColor={INK3}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <X color={INK3} width={14} height={14} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={s.onlineCount}>
                <Text style={s.onlineNum}>{livreurs.length}</Text>
                {" "}en ligne
              </Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* ── Livreurs tab ── */}
      {tab === "livreurs" && (
        outsideMR
          ? <OutsideMR />
          : (
            <ScrollView
              style={s.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: S.tabBar + 20 }}
              refreshControl={<RefreshControl refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchLivreurs(); }}
                tintColor={Y} />}
            >
              {/* Map (reduced height) */}
              <View style={s.mapSection}>
                <View style={s.mapHeader}>
                  <Navigation color={Y} width={14} height={14} />
                  <Text style={s.mapTitle}>
                    {isNearby ? "Près de vous" : "Disponibles"}
                  </Text>
                  {userCoords && (
                    <TouchableOpacity style={s.locateBtn} onPress={centerOnUser} activeOpacity={0.8}>
                      <Navigation color={C.goldDark} width={11} height={11} />
                      <Text style={s.locateBtnText}>Ma position</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.mapWrap}>
                  <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={mapRegion}
                    showsUserLocation={!!userCoords}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    onMapReady={() => setMapReady(true)}
                  >
                    {mapReady && userCoords && (
                      <Circle center={userCoords} radius={2000}
                        fillColor="rgba(248,172,18,0.08)"
                        strokeColor="rgba(248,172,18,0.35)" strokeWidth={1.5} />
                    )}
                    {mapReady && filtered.map(l =>
                      l.latitude && l.longitude ? (
                        <Marker key={l.id}
                          coordinate={{ latitude: l.latitude, longitude: l.longitude }}
                          anchor={{ x: 0.5, y: 0.5 }}>
                          <View style={mk.pin}>
                            <Text style={mk.emoji}>{VEHICLE_EMOJI[l.vehicle_type] ?? "🚗"}</Text>
                          </View>
                        </Marker>
                      ) : null,
                    )}
                  </MapView>
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveText}>EN DIRECT</Text>
                  </View>
                </View>
              </View>

              {/* Vehicle filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: S.screen, gap: 8, paddingBottom: 14 }}>
                {[
                  { key: "tous", label: "🚀 Tous" },
                  { key: "moto", label: "🏍️ Moto" },
                  { key: "thiouk_thiouk", label: "🛺 Thiouk" },
                  { key: "auto", label: "🚗 Auto" },
                ].map(v => (
                  <TouchableOpacity
                    key={v.key}
                    style={[s.chip, vehicle === v.key && s.chipOn]}
                    onPress={() => setVehicle(v.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, vehicle === v.key && s.chipTextOn]}>{v.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Result hint */}
              {!loading && (
                <View style={s.resultRow}>
                  {isNearby
                    ? <Text style={s.resultText}>{filtered.length} livreur{filtered.length !== 1 ? "s" : ""} proche{filtered.length !== 1 ? "s" : ""}</Text>
                    : <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Zap color={Y} width={12} height={12} fill={Y} />
                        <Text style={s.suggestText}>Suggestions disponibles</Text>
                      </View>}
                </View>
              )}

              {/* Cards — show skeleton until livreurs are loaded */}
              {loading
                ? <SkeletonList />
                : filtered.length === 0
                  ? <Text style={s.empty}>Aucun livreur disponible</Text>
                  : <View style={{ paddingHorizontal: S.screen }}>
                      {filtered.map((l, i) => (
                        <LivreurCard key={l.id} item={l} recommended={!isNearby && i < 3} />
                      ))}
                    </View>}
            </ScrollView>
          )
      )}

      {/* ── Voyage tab ── */}
      {tab === "voyage" && (
        <ScrollView
          style={s.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: S.tabBar + 20 }}
        >
          {/* Route selector — horizontal */}
          <View style={s.routeCard}>
            <View style={s.routeRow}>
              <View style={s.routeHalf}>
                <Text style={s.routeLabel}>Départ</Text>
                <VillePicker
                  value={origin}
                  onChange={setOrigin}
                  label=""
                  placeholder={inMR === false ? "Choisir" : "Auto-détecté"}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={s.routeArrow}>
                <ArrowRight color={Y} width={18} height={18} />
              </View>
              <View style={s.routeHalf}>
                <Text style={s.routeLabel}>Destination</Text>
                <VillePicker
                  value={destination}
                  onChange={setDestination}
                  label=""
                  placeholder="Choisir"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Prompt if not both selected */}
          {(!origin || !destination) && (
            <View style={s.promptWrap}>
              <Text style={{ fontSize: 32 }}>🚌</Text>
              <Text style={s.promptTitle}>Choisissez votre trajet</Text>
              <Text style={s.promptSub}>
                Sélectionnez un départ et une destination pour trouver des voyageurs disponibles.
              </Text>
            </View>
          )}

          {/* Voyageurs list */}
          {origin && destination && (
            (voyageLoad || !voyageSearched)
              ? <SkeletonList count={3} />
              : voyageurs.length === 0
                ? (
                  <View style={s.promptWrap}>
                    <Text style={{ fontSize: 32 }}>😔</Text>
                    <Text style={s.promptTitle}>Aucun voyageur trouvé</Text>
                    <Text style={s.promptSub}>
                      Personne ne fait ce trajet pour le moment.{"\n"}Réessayez plus tard.
                    </Text>
                  </View>
                )
                : (
                  <View style={s.voyageurList}>
                    <Text style={s.voyageurCount}>
                      {voyageurs.length} voyageur{voyageurs.length !== 1 ? "s" : ""}
                    </Text>
                    {voyageurs.map(v => <VoyageurCard key={v.id} item={v} />)}
                  </View>
                )
          )}
        </ScrollView>
      )}

      {/* ── Car Rapide tab ── */}
      {tab === "carrapide" && (
        outsideMR
          ? <OutsideMR />
          : (
            <ScrollView
              style={s.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: S.tabBar + 20 }}
              refreshControl={
                <RefreshControl refreshing={carrapideLoad}
                  onRefresh={fetchCarrapides} tintColor={Y} />
              }
            >
              {/* Map */}
              <View style={s.mapSection}>
                <View style={s.mapHeader}>
                  <Navigation color={Y} width={14} height={14} />
                  <Text style={s.mapTitle}>
                    {carrapideNearby ? "Près de vous" : "Disponibles"}
                  </Text>
                  {userCoords && (
                    <TouchableOpacity style={s.locateBtn} onPress={centerOnUser} activeOpacity={0.8}>
                      <Navigation color={C.goldDark} width={11} height={11} />
                      <Text style={s.locateBtnText}>Ma position</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.mapWrap}>
                  <MapView
                    ref={mapRefCR}
                    style={StyleSheet.absoluteFill}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={mapRegion}
                    showsUserLocation={!!userCoords}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    onMapReady={() => setMapReadyCR(true)}
                  >
                    {mapReadyCR && userCoords && (
                      <Circle center={userCoords} radius={2000}
                        fillColor="rgba(248,172,18,0.08)"
                        strokeColor="rgba(248,172,18,0.35)" strokeWidth={1.5} />
                    )}
                    {mapReadyCR && carrapides.map(c =>
                      c.latitude && c.longitude ? (
                        <Marker key={c.id}
                          coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                          anchor={{ x: 0.5, y: 0.5 }}>
                          <View style={mk.pin}>
                            <Text style={mk.emoji}>🚕</Text>
                          </View>
                        </Marker>
                      ) : null,
                    )}
                  </MapView>
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveText}>EN DIRECT</Text>
                  </View>
                </View>
              </View>

              {/* Result hint */}
              {!carrapideLoad && (
                <View style={s.resultRow}>
                  {carrapideNearby
                    ? <Text style={s.resultText}>{carrapides.length} car{carrapides.length !== 1 ? "s" : ""} rapide{carrapides.length !== 1 ? "s" : ""} proche{carrapides.length !== 1 ? "s" : ""}</Text>
                    : <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Zap color={Y} width={12} height={12} fill={Y} />
                        <Text style={s.suggestText}>Suggestions disponibles</Text>
                      </View>}
                </View>
              )}

              {/* Cards */}
              {carrapideLoad
                ? <SkeletonList />
                : carrapides.length === 0
                  ? <Text style={s.empty}>Aucun Car Rapide disponible</Text>
                  : <View style={{ paddingHorizontal: S.screen }}>
                      {carrapides.map(c => <CarRapideCard key={c.id} item={c} />)}
                    </View>}
            </ScrollView>
          )
      )}
    </View>
  );
}

const mk = StyleSheet.create({
  pin:   { width: 32, height: 32, borderRadius: 16, alignItems: "center",
    justifyContent: "center", borderWidth: 2.5, borderColor: "#fff",
    backgroundColor: Y, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  emoji: { fontSize: 13 },
});

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#f8f7f5" },

  // Header
  headerWrap: { paddingBottom: 8 },
  titleRow:   { paddingHorizontal: S.screen, paddingTop: S.px16, marginBottom: 14 },
  title:      { fontFamily: F.bold, fontSize: 22, color: INK, letterSpacing: -0.3 },

  // Segmented tab
  tabBar:     { flexDirection: "row", backgroundColor: SURF, borderRadius: 11,
    padding: 3, marginHorizontal: S.screen, marginBottom: 8 },
  tabBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, borderRadius: 9 },
  tabBtnOn:   { backgroundColor: INK },
  tabText:    { fontFamily: F.bold, fontSize: 13, color: INK2 },
  tabTextOn:  { color: "#fff" },

  // Search
  searchRow:   { paddingHorizontal: S.screen, flexDirection: "row",
    alignItems: "center", gap: 10 },
  searchBox:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 14, color: INK },
  onlineCount: { fontFamily: F.regular, fontSize: 11, color: INK3 },
  onlineNum:   { fontFamily: F.bold, color: C.goldDark },

  body:        { flex: 1 },

  // Map
  mapSection:  { paddingHorizontal: S.screen, marginVertical: 14 },
  mapHeader:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  mapTitle:    { fontFamily: F.bold, fontSize: 13, color: INK, flex: 1 },
  locateBtn:   { flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.goldLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: R.full },
  locateBtnText: { fontFamily: F.medium, fontSize: 10, color: C.goldDark },
  mapWrap:     { width: width - S.screen * 2, height: 180, borderRadius: 18,
    overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 },
  liveBadge:   { position: "absolute", top: 10, right: 12, flexDirection: "row",
    alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText:    { fontFamily: F.bold, fontSize: 9, color: "#fff", letterSpacing: 0.5 },

  // Filter chips
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.full,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: BDR },
  chipOn:      { backgroundColor: INK, borderColor: INK },
  chipText:    { fontFamily: F.medium, fontSize: 12, color: INK },
  chipTextOn:  { color: "#fff", fontFamily: F.bold },

  resultRow:   { paddingHorizontal: S.screen, marginBottom: 12 },
  resultText:  { fontFamily: F.medium, fontSize: 12, color: INK3 },
  suggestText: { fontFamily: F.bold, fontSize: 12, color: C.goldDark },

  empty:       { fontFamily: F.regular, fontSize: 14, color: INK3,
    textAlign: "center", marginTop: 40 },

  // Route card (voyage) — horizontal, flat
  routeCard:   { marginHorizontal: S.screen, marginTop: 2, marginBottom: 10,
    backgroundColor: "#fff", borderRadius: 14, padding: 12 },
  routeRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  routeHalf:   { flex: 1, gap: 4 },
  routeLabel:  { fontFamily: F.bold, fontSize: 10, color: INK3,
    textTransform: "uppercase", letterSpacing: 0.5 },
  routeArrow:  { paddingTop: 16 },

  // Voyage prompt
  promptWrap:  { alignItems: "center", paddingHorizontal: S.screen,
    paddingTop: 16, paddingBottom: 32, gap: 8 },
  promptTitle: { fontFamily: F.bold, fontSize: 16, color: INK },
  promptSub:   { fontFamily: F.regular, fontSize: 13, color: INK3,
    textAlign: "center", lineHeight: 20 },

  voyageurList:  { paddingHorizontal: S.screen },
  voyageurCount: { fontFamily: F.medium, fontSize: 12, color: INK3, marginBottom: 8 },
});
