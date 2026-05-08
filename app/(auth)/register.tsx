import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ChevronDown, Check, ArrowRight as Arrow } from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, FA, Sz, R, S } from "@/constants/theme";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/constants/countries";
import VillePicker from "@/components/VillePicker";

const SURF = "#F7F5F0";
const BDR  = "rgba(0,0,0,0.08)";
const INK  = "#111111";
const INK3 = "#999999";
const Y    = "#F5C400";

type Role = "vendeur" | "livreur" | "voyageur" | "maurigo";

// ── Role definitions ───────────────────────────────────────────────────────────
const ROLES: { key: Role; emoji: string; label: string; labelAr: string; desc: string }[] = [
  {
    key: "vendeur",
    emoji: "🏪",
    label: "Vendeur",
    labelAr: "بائع",
    desc: "Créez et gérez votre boutique en ligne. Vendez vos produits à toute la Mauritanie.",
  },
  {
    key: "livreur",
    emoji: "🏍️",
    label: "Livreur",
    labelAr: "موصّل",
    desc: "Devenez livreur indépendant. Recevez des commandes de livraison dans votre zone.",
  },
  {
    key: "voyageur",
    emoji: "🚌",
    label: "Long Voyage",
    labelAr: "سفر طويل",
    desc: "Proposez vos trajets longue distance entre villes et transportez des colis ou passagers.",
  },
  {
    key: "maurigo",
    emoji: "🚕",
    label: "Car Rapide",
    labelAr: "كار رابيد",
    desc: "Proposez vos courses en Car Rapide dans votre wilaya. Les clients vous trouvent et vous contactent directement.",
  },
];

// ── Schemas ────────────────────────────────────────────────────────────────────
const nameSchema  = z.object({
  firstName: z.string().min(2, "Requis"),
  lastName:  z.string().min(2, "Requis"),
});
const phoneSchema = z.object({ phone: z.string().min(6, "Numéro invalide") });
type NameForm  = z.infer<typeof nameSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;

// ── Vehicle options ────────────────────────────────────────────────────────────
const VEHICLES = [
  { key: "moto",          emoji: "🏍️", label: "Moto",          labelAr: "دراجة نارية" },
  { key: "thiouk_thiouk", emoji: "🛺",  label: "Thiouk Thiouk", labelAr: "ثيوك ثيوك"  },
  { key: "auto",          emoji: "🚗",  label: "Auto",          labelAr: "سيارة"       },
];

// ── Animated float-label input ─────────────────────────────────────────────────
function FloatInput({ labelFr, labelAr, value, onChange, onBlur, error, autoFocus, keyboard = "default" }: any) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || value ? 1 : 0,
      duration: 160, useNativeDriver: false,
    }).start();
  }, [focused, value]);

  const top  = anim.interpolate({ inputRange: [0, 1], outputRange: [18, -8] });
  const size = anim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const col  = error ? C.error : focused ? C.goldDark : INK3;

  return (
    <View style={fl.wrap}>
      <Animated.Text style={[fl.labelFr, { top, fontSize: size, color: col }]}>{labelFr}</Animated.Text>
      <Animated.Text style={[fl.labelAr, { top, fontSize: size, color: col, fontFamily: FA.medium }]}>{labelAr}</Animated.Text>
      <TextInput
        style={fl.input}
        value={value || ""}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        autoFocus={autoFocus}
        keyboardType={keyboard}
        autoCapitalize={keyboard === "default" ? "words" : "none"}
      />
      <View style={[fl.line, { backgroundColor: col }]} />
      {error && <Text style={fl.err}>{error}</Text>}
    </View>
  );
}
const fl = StyleSheet.create({
  wrap:    { marginBottom: S.px24, paddingTop: 22 },
  labelFr: { position: "absolute", left: 0, backgroundColor: "transparent", fontFamily: F.medium },
  labelAr: { position: "absolute", right: 0, backgroundColor: "transparent" },
  input:   { fontFamily: F.regular, fontSize: Sz.md, color: INK, paddingVertical: 8 },
  line:    { height: 1.5 },
  err:     { fontFamily: F.regular, fontSize: Sz.xs, color: C.error, marginTop: 3 },
});

// ── Phone input ────────────────────────────────────────────────────────────────
function PhoneInput({ country, onCountryPress, control, focused, setFocused }: any) {
  return (
    <View style={[pi.box, focused && pi.boxFocused]}>
      <TouchableOpacity style={pi.pill} onPress={onCountryPress} activeOpacity={0.7}>
        <Text style={pi.flag}>{country.flag}</Text>
        <Text style={pi.dial}>{country.dialCode}</Text>
        <ChevronDown color={INK3} width={12} height={12} />
      </TouchableOpacity>
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextInput
            style={pi.input}
            value={field.value || ""}
            keyboardType="phone-pad"
            onChangeText={(t) => field.onChange(t.replace(/\D/g, "").slice(0, 9))}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); field.onBlur(); }}
            placeholder="XX XX XX XX"
            placeholderTextColor={INK3}
            returnKeyType="done"
            autoFocus
          />
        )}
      />
    </View>
  );
}
const pi = StyleSheet.create({
  box:       { flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: BDR, borderRadius: 14,
    backgroundColor: SURF, overflow: Platform.OS === "android" ? "visible" : "hidden", marginBottom: 8 },
  boxFocused:{ borderWidth: 2, borderColor: INK, backgroundColor: "#fff",
    boxShadow: "0 0 0 4px rgba(245,196,0,0.15)" },
  pill:      { flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 16, height: 58,
    borderRightWidth: 1.5, borderRightColor: BDR },
  flag:  { fontSize: 22 },
  dial:  { fontFamily: F.bold, fontSize: Sz.base, color: INK },
  input: { flex: 1, height: 58, paddingHorizontal: 18,
    fontFamily: F.bold, fontSize: 20, color: INK, letterSpacing: 2 },
});

// ── Role pick screen ───────────────────────────────────────────────────────────
function RolePickScreen({ onSelect, onSignIn }: { onSelect: (r: Role) => void; onSignIn: () => void }) {
  const router = useRouter();
  return (
    <View style={rp.root}>
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.62, 1]}
        style={rp.wash}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={rp.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={rp.backCircle}>
            <ArrowLeft color={INK} width={20} height={20} />
          </View>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={rp.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={rp.title}>Créer un compte</Text>
          <Text style={rp.sub}>Choisissez votre type de compte pour commencer.</Text>

          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={rp.card}
              onPress={() => onSelect(r.key)}
              activeOpacity={0.85}
            >
              <View style={rp.cardLeft}>
                <Text style={rp.emoji}>{r.emoji}</Text>
              </View>
              <View style={rp.cardBody}>
                <View style={rp.labelRow}>
                  <Text style={rp.label}>{r.label}</Text>
                  <Text style={rp.labelAr}>{r.labelAr}</Text>
                </View>
                <Text style={rp.desc}>{r.desc}</Text>
              </View>
              <Arrow color={INK3} width={16} height={16} />
            </TouchableOpacity>
          ))}

          <View style={rp.loginRow}>
            <Text style={rp.loginText}>Déjà un compte ?  </Text>
            <TouchableOpacity onPress={onSignIn}>
              <Text style={rp.link}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
const rp = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#fff" },
  wash:       { position: "absolute", top: 0, left: 0, right: 0, height: 380, zIndex: 0 },
  backBtn:    { paddingTop: S.px16, paddingLeft: S.screen, zIndex: 10 },
  backCircle: { width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  scroll:     { paddingHorizontal: S.screen, paddingBottom: 48, paddingTop: 12 },
  title:      { fontFamily: F.bold, fontSize: Sz["2xl"], color: INK, marginBottom: 6 },
  sub:        { fontFamily: F.regular, fontSize: Sz.base, color: INK3, marginBottom: 24 },
  card:       { flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: BDR,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  cardLeft:   { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(245,196,0,0.12)",
    alignItems: "center", justifyContent: "center" },
  emoji:      { fontSize: 26 },
  cardBody:   { flex: 1, gap: 4 },
  labelRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label:      { fontFamily: F.bold, fontSize: Sz.base, color: INK },
  labelAr:    { fontFamily: FA.regular, fontSize: Sz.sm, color: C.goldDark },
  desc:       { fontFamily: F.regular, fontSize: Sz.xs, color: INK3, lineHeight: 17 },
  loginRow:   { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  loginText:  { fontFamily: F.regular, fontSize: Sz.base, color: INK3 },
  link:       { fontFamily: F.bold, fontSize: Sz.base, color: INK,
    textDecorationLine: "underline", textDecorationColor: Y },
});

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Register() {
  const router = useRouter();
  const { setPending } = useAuthStore();

  const [phase,        setPhase]        = useState<"role-pick" | "form">("role-pick");
  const [role,         setRole]         = useState<Role>("vendeur");
  const [country,      setCountry]      = useState(DEFAULT_COUNTRY);
  const [sheet,        setSheet]        = useState(false);
  const [step,         setStep]         = useState<1 | 2 | 3>(1);
  const [vehicle,      setVehicle]      = useState("");
  const [trajetDepart, setTrajetDepart] = useState("");
  const [trajetDest,   setTrajetDest]   = useState("");
  const [wilaya,       setWilaya]       = useState("");
  const [err,          setErr]          = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const nameForm  = useForm<NameForm>({ resolver: zodResolver(nameSchema) });
  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });

  const selectRole = (r: Role) => {
    setRole(r);
    setStep(1);
    setVehicle("");
    setTrajetDepart("");
    setTrajetDest("");
    setWilaya("");
    setErr("");
    nameForm.reset();
    phoneForm.reset();
    setPhase("form");
  };

  const handleBack = () => {
    if (phase === "role-pick") { router.back(); return; }
    if (step === 1) { setPhase("role-pick"); return; }
    setStep((p) => (p - 1) as any);
  };

  const goStep2 = async () => {
    const ok = await nameForm.trigger(["firstName", "lastName"]);
    if (ok) setStep(2);
  };

  const goStep3 = async () => {
    const ok = await phoneForm.trigger(["phone"]);
    if (ok) setStep(3);
  };

  const needsStep3 = role === "livreur" || role === "voyageur" || role === "maurigo";
  const totalSteps = needsStep3 ? 3 : 2;

  const onSubmit = async () => {
    const phoneValid = await phoneForm.trigger(["phone"]);
    if (!phoneValid) return;
    if (role === "livreur" && !vehicle) return;
    if (role === "voyageur" && (!trajetDepart || !trajetDest)) return;
    if (role === "maurigo" && !wilaya) return;

    setErr("");
    const { firstName, lastName } = nameForm.getValues();
    const { phone } = phoneForm.getValues();
    const full = `${country.dialCode}${phone}`;
    try {
      await api.post("/auth/send-otp/", { phone: full });
      setPending(
        full,
        firstName.trim(),
        lastName.trim(),
        role,
        role === "livreur"   ? vehicle      : "",
        role === "voyageur"  ? trajetDepart : "",
        role === "voyageur"  ? trajetDest   : "",
        role === "maurigo"   ? wilaya       : "",
      );
      router.push("/(auth)/verify");
    } catch (e: any) {
      setErr(e.response?.data?.detail ?? "Erreur d'envoi du code.");
    }
  };

  const submitting = phoneForm.formState.isSubmitting;

  // ── Role pick phase ─────────────────────────────────────────────────────────
  if (phase === "role-pick") {
    return (
      <RolePickScreen
        onSelect={selectRole}
        onSignIn={() => router.push("/(auth)/sign-in")}
      />
    );
  }

  // ── Form phase ──────────────────────────────────────────────────────────────
  const roleInfo = ROLES.find(r => r.key === role)!;

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.62, 1]}
        style={s.wash}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <View style={s.backCircle}>
            <ArrowLeft color={INK} width={20} height={20} />
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step dots */}
            <View style={s.dotsRow}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[s.dot, i + 1 <= step && s.dotOn]} />
              ))}
              <Text style={s.stepText}>{step} / {totalSteps}</Text>
            </View>

            <View style={s.card}>
              {/* Role badge */}
              <View style={s.roleBadge}>
                <Text style={s.roleBadgeEmoji}>{roleInfo.emoji}</Text>
                <Text style={s.roleBadgeLabel}>{roleInfo.label}</Text>
              </View>

              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <>
                  <Text style={s.cardTitle}>Comment vous appelez-vous ?</Text>
                  <Text style={s.cardSub}>Entrez votre nom complet</Text>

                  <Controller control={nameForm.control} name="firstName" render={({ field, fieldState }) => (
                    <FloatInput labelFr="Prénom" labelAr="الاسم الأول"
                      value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                      error={fieldState.error?.message} autoFocus />
                  )} />
                  <Controller control={nameForm.control} name="lastName" render={({ field, fieldState }) => (
                    <FloatInput labelFr="Nom de famille" labelAr="اسم العائلة"
                      value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                      error={fieldState.error?.message} />
                  )} />

                  <TouchableOpacity style={s.btn} onPress={goStep2} activeOpacity={0.85}>
                    <View style={s.btnInner}>
                      <Text style={s.btnText}>Continuer</Text>
                      <ArrowRight color={Y} width={18} height={18} />
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* ── Step 2: Phone ── */}
              {step === 2 && (
                <>
                  <Text style={s.cardTitle}>Votre numéro</Text>
                  <Text style={s.cardSub}>Vous recevrez un code de vérification via SMS</Text>

                  <Text style={s.label}>NUMÉRO DE TÉLÉPHONE</Text>

                  <PhoneInput
                    country={country}
                    onCountryPress={() => setSheet(true)}
                    control={phoneForm.control}
                    focused={phoneFocused}
                    setFocused={setPhoneFocused}
                  />

                  {err ? <Text style={s.errText}>{err}</Text> : null}

                  {needsStep3 ? (
                    <TouchableOpacity style={s.btn} onPress={goStep3} activeOpacity={0.85}>
                      <View style={s.btnInner}>
                        <Text style={s.btnText}>Continuer</Text>
                        <ArrowRight color={Y} width={18} height={18} />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[s.btn, submitting && s.btnOff]}
                      onPress={onSubmit}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting
                        ? <ActivityIndicator color={Y} />
                        : <View style={s.btnInner}>
                            <Text style={s.btnText}>Recevoir le code</Text>
                            <ArrowRight color={Y} width={18} height={18} />
                          </View>}
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* ── Step 3: Vehicle (livreur) ── */}
              {step === 3 && role === "livreur" && (
                <>
                  <Text style={s.cardTitle}>Votre véhicule</Text>
                  <Text style={s.cardSub}>Choisissez votre moyen de livraison</Text>

                  <View style={s.vehicleGrid}>
                    {VEHICLES.map((v) => {
                      const on = vehicle === v.key;
                      return (
                        <TouchableOpacity
                          key={v.key}
                          style={[s.vehicleCard, on && s.vehicleCardOn]}
                          onPress={() => setVehicle(v.key)}
                          activeOpacity={0.85}
                        >
                          {on && (
                            <View style={s.vehicleCheck}>
                              <Check color="#fff" width={11} height={11} strokeWidth={3} />
                            </View>
                          )}
                          <Text style={s.vehicleEmoji}>{v.emoji}</Text>
                          <Text style={[s.vehicleLabel, on && s.vehicleLabelOn]}>{v.label}</Text>
                          <Text style={[s.vehicleSub, on && s.vehicleSubOn]}>{v.labelAr}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {err ? <Text style={s.errText}>{err}</Text> : null}

                  <TouchableOpacity
                    style={[s.btn, (!vehicle || submitting) && s.btnOff]}
                    onPress={onSubmit}
                    disabled={!vehicle || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color={Y} />
                      : <View style={s.btnInner}>
                          <Text style={s.btnText}>Recevoir le code</Text>
                          <ArrowRight color={Y} width={18} height={18} />
                        </View>}
                  </TouchableOpacity>
                </>
              )}

              {/* ── Step 3: Trajet (voyageur / Long Voyage) ── */}
              {step === 3 && role === "voyageur" && (
                <>
                  <Text style={s.cardTitle}>Votre trajet habituel</Text>
                  <Text style={s.cardSub}>
                    Si vous faites Nouakchott → Kaédi, le trajet retour est inclus automatiquement.
                  </Text>

                  <VillePicker
                    label="Ville de départ"
                    placeholder="Sélectionner le départ"
                    value={trajetDepart}
                    onChange={setTrajetDepart}
                  />

                  <View style={s.trajetArrow}>
                    <Text style={s.trajetArrowText}>↓</Text>
                  </View>

                  <VillePicker
                    label="Ville d'arrivée"
                    placeholder="Sélectionner la destination"
                    value={trajetDest}
                    onChange={setTrajetDest}
                  />

                  {trajetDepart && trajetDest && (
                    <View style={s.trajetPreview}>
                      <Text style={s.trajetPreviewText}>
                        {trajetDepart}  ⇄  {trajetDest}
                      </Text>
                    </View>
                  )}

                  {err ? <Text style={s.errText}>{err}</Text> : null}

                  <TouchableOpacity
                    style={[s.btn, (!trajetDepart || !trajetDest || submitting) && s.btnOff]}
                    onPress={onSubmit}
                    disabled={!trajetDepart || !trajetDest || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color={Y} />
                      : <View style={s.btnInner}>
                          <Text style={s.btnText}>Recevoir le code</Text>
                          <ArrowRight color={Y} width={18} height={18} />
                        </View>}
                  </TouchableOpacity>
                </>
              )}

              {/* ── Step 3: Wilaya (maurigo / Car Rapide) ── */}
              {step === 3 && role === "maurigo" && (
                <>
                  <Text style={s.cardTitle}>Votre wilaya</Text>
                  <Text style={s.cardSub}>
                    Choisissez la wilaya où vous exercez votre activité de Car Rapide.
                  </Text>

                  <VillePicker
                    label="Wilaya de base"
                    placeholder="Sélectionner votre wilaya"
                    value={wilaya}
                    onChange={setWilaya}
                  />

                  {err ? <Text style={s.errText}>{err}</Text> : null}

                  <TouchableOpacity
                    style={[s.btn, (!wilaya || submitting) && s.btnOff]}
                    onPress={onSubmit}
                    disabled={!wilaya || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color={Y} />
                      : <View style={s.btnInner}>
                          <Text style={s.btnText}>Recevoir le code</Text>
                          <ArrowRight color={Y} width={18} height={18} />
                        </View>}
                  </TouchableOpacity>
                </>
              )}

              {/* Sign-in link */}
              <View style={s.loginRow}>
                <Text style={s.loginText}>Déjà un compte ?  </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                  <Text style={s.link}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Country sheet */}
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSheet(false)} />
        <View style={s.sheetWrap}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Sélectionner un pays</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(i) => i.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.countryRow}
                onPress={() => { setCountry(item); setSheet(false); }}
              >
                <Text style={s.countryFlag}>{item.flag}</Text>
                <Text style={s.countryName}>{item.name}</Text>
                <Text style={s.countryDial}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#fff" },
  wash:  { position: "absolute", top: 0, left: 0, right: 0, height: 400, zIndex: 0 },
  scroll:{ flexGrow: 1, paddingHorizontal: S.screen, paddingBottom: 48 },

  backBtn:    { paddingTop: S.px16, paddingLeft: S.screen, zIndex: 10 },
  backCircle: { width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },

  dotsRow:  { flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginBottom: 20 },
  dot:      { width: 24, height: 4, borderRadius: R.full, backgroundColor: "rgba(0,0,0,0.12)" },
  dotOn:    { width: 36, backgroundColor: INK },
  stepText: { fontFamily: F.medium, fontSize: Sz.sm, color: "rgba(0,0,0,0.40)", marginLeft: 8 },

  card:      { backgroundColor: "#fff", borderRadius: 24, padding: S.px24,
    borderWidth: 1, borderColor: BDR, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" },

  roleBadge:      { flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(245,196,0,0.10)", borderRadius: R.md,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start", marginBottom: 16 },
  roleBadgeEmoji: { fontSize: 16 },
  roleBadgeLabel: { fontFamily: F.bold, fontSize: Sz.sm, color: C.goldDark },

  cardTitle: { fontFamily: F.bold, fontSize: Sz.xl, color: INK, marginBottom: 4 },
  cardSub:   { fontFamily: F.regular, fontSize: Sz.sm, color: INK3, marginBottom: S.px24 },

  label: { fontFamily: F.bold, fontSize: Sz.xs, color: INK3, letterSpacing: 0.5,
    textTransform: "uppercase", marginBottom: 10 },
  errText: { fontFamily: F.regular, fontSize: Sz.sm, color: C.error, marginBottom: 8 },

  trajetArrow:       { alignItems: "center", marginVertical: 4 },
  trajetArrowText:   { fontSize: 22, color: INK3 },
  trajetPreview:     { backgroundColor: "rgba(245,196,0,0.12)", borderRadius: R.md,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: S.px16, alignItems: "center" },
  trajetPreviewText: { fontFamily: F.bold, fontSize: Sz.base, color: C.goldDark },

  vehicleGrid:    { flexDirection: "row", gap: 10, marginBottom: S.px24 },
  vehicleCard:    { flex: 1, backgroundColor: SURF, borderRadius: R.lg,
    paddingVertical: 16, alignItems: "center", borderWidth: 2, borderColor: BDR,
    position: "relative" },
  vehicleCardOn:  { borderColor: Y, backgroundColor: "rgba(245,196,0,0.10)" },
  vehicleCheck:   { position: "absolute", top: 6, right: 6, width: 20, height: 20,
    borderRadius: R.full, backgroundColor: Y, alignItems: "center", justifyContent: "center" },
  vehicleEmoji:   { fontSize: 28, marginBottom: 6 },
  vehicleLabel:   { fontFamily: F.bold, fontSize: Sz.xs, color: INK, textAlign: "center" },
  vehicleLabelOn: { color: C.goldDark },
  vehicleSub:     { fontFamily: F.regular, fontSize: 9, color: INK3, marginTop: 2, textAlign: "center" },
  vehicleSubOn:   { color: C.goldDark },

  btn:    { height: 56, backgroundColor: INK, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginTop: S.px16,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)" },
  btnOff: { opacity: 0.4 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText:  { fontFamily: F.bold, fontSize: Sz.md, color: Y, letterSpacing: 0.2 },

  loginRow:  { flexDirection: "row", justifyContent: "center", marginTop: S.px20 },
  loginText: { fontFamily: F.regular, fontSize: Sz.base, color: INK3 },
  link:      { fontFamily: F.bold, fontSize: Sz.base, color: INK,
    textDecorationLine: "underline", textDecorationColor: Y },

  overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheetWrap: { backgroundColor: "#fff", borderTopLeftRadius: R["2xl"],
    borderTopRightRadius: R["2xl"], paddingHorizontal: S.screen,
    paddingBottom: 48, maxHeight: "72%" },
  handle:    { width: 40, height: 4, borderRadius: R.full, backgroundColor: C.border,
    alignSelf: "center", marginVertical: 12 },
  sheetTitle:  { fontFamily: F.bold, fontSize: Sz.lg, color: INK,
    textAlign: "center", marginBottom: 16 },
  countryRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: INK },
  countryDial: { fontFamily: F.medium, fontSize: Sz.base, color: INK3 },
});
