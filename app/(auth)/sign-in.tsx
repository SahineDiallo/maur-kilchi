import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, FlatList, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ChevronDown } from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, FA, Sz, R, S } from "@/constants/theme";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/constants/countries";

const SURF = "#F7F5F0";
const BDR  = "rgba(0,0,0,0.08)";
const INK  = "#111111";
const INK3 = "#999999";
const Y    = "#F5C400";

const schema = z.object({ phone: z.string().min(6, "Numéro invalide") });
type Form = z.infer<typeof schema>;

export default function SignIn() {
  const router = useRouter();
  const { setPending } = useAuthStore();
  const [country,      setCountry]      = useState(DEFAULT_COUNTRY);
  const [sheet,        setSheet]        = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [err,          setErr]          = useState("");

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const phoneVal = useWatch({ control, name: "phone" }) ?? "";
  const isValid  = phoneVal.replace(/\s/g, "").length >= 6;

  const onSubmit = async ({ phone }: Form) => {
    setErr("");
    const full = `${country.dialCode}${phone}`;
    try {
      await api.post("/auth/send-otp/", { phone: full });
      setPending(full);
      router.push("/(auth)/verify");
    } catch (e: any) {
      setErr(e.response?.data?.detail ?? "Erreur d'envoi du code.");
    }
  };

  return (
    <View style={s.root}>
      {/* Yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.62, 1]}
        style={s.wash}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={s.backCircle}>
            <ArrowLeft color={INK} width={20} height={20} />
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + headline */}
            <View style={s.hero}>
              <Image
                source={require("@/assets/images/main_logo.png")}
                style={s.logo}
                resizeMode="contain"
              />
              <Text style={s.headline}>
                Bienvenue sur{"\n"}
                <View style={s.hlWrap}>
                  <View style={s.hlBar} />
                  <Text style={s.headlineWord}>maurikilchi</Text>
                </View>
              </Text>
              <Text style={s.sub}>
                Entrez votre numéro pour vous{"\n"}connecter ou créer un compte.
              </Text>
            </View>

            {/* Label */}
            <Text style={s.label}>NUMÉRO DE TÉLÉPHONE</Text>

            {/* Phone input */}
            <View style={[s.phoneBox, phoneFocused && s.phoneBoxFocused]}>
              <TouchableOpacity style={s.countryPill} onPress={() => setSheet(true)} activeOpacity={0.7}>
                <Text style={s.flag}>{country.flag}</Text>
                <Text style={s.dial}>{country.dialCode}</Text>
                <ChevronDown color={INK3} width={12} height={12} />
              </TouchableOpacity>

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={s.phoneInput}
                    value={value || ""}
                    onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 9))}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => { setPhoneFocused(false); onBlur(); }}
                    keyboardType="phone-pad"
                    placeholder="XX XX XX XX"
                    placeholderTextColor={INK3}
                    returnKeyType="done"
                    autoFocus
                  />
                )}
              />
            </View>

            <Text style={s.hint}>Un code de vérification sera envoyé par SMS.</Text>

            {err ? <Text style={s.errText}>{err}</Text> : null}

            {/* Spacer */}
            <View style={{ height: 32 }} />

            {/* CTA */}
            <TouchableOpacity
              style={[s.btn, isValid ? s.btnActive : s.btnInactive]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Y} />
              ) : (
                <View style={s.btnInner}>
                  <Text style={[s.btnText, isValid ? s.btnTextActive : s.btnTextInactive]}>
                    Continuer
                  </Text>
                  {isValid && <ArrowRight color={Y} width={18} height={18} />}
                </View>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={s.terms}>
              En continuant, vous acceptez nos{" "}
              <Text style={s.termsLink}>Conditions d'utilisation</Text>
              {" "}et notre{" "}
              <Text style={s.termsLink}>Politique de confidentialité</Text>.
            </Text>

            {/* Register link */}
            <View style={s.registerRow}>
              <Text style={s.registerText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={s.registerLink}>Créer un compte</Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={s.countryRow} onPress={() => { setCountry(item); setSheet(false); }}>
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

  hero:        { paddingTop: 28, marginBottom: 36 },
  logo:        { width: 64, height: 64, marginBottom: 24 },
  headline:    { fontSize: Sz["3xl"], fontFamily: F.bold, color: INK,
    lineHeight: 38, letterSpacing: -0.8, marginBottom: 12 },
  hlWrap:      { position: "relative" },
  hlBar:       { position: "absolute", bottom: 2, left: 0, right: 0,
    height: 8, backgroundColor: Y, borderRadius: 2, opacity: 0.6 },
  headlineWord:{ fontSize: Sz["3xl"], fontFamily: F.bold, color: INK, letterSpacing: -0.8 },
  sub:         { fontFamily: F.regular, fontSize: Sz.base, color: "#555",
    lineHeight: 22 },

  label: { fontFamily: F.bold, fontSize: Sz.xs, color: INK3, letterSpacing: 0.5,
    textTransform: "uppercase", marginBottom: 10 },

  phoneBox: { flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: BDR, borderRadius: 14,
    backgroundColor: SURF, overflow: "hidden", marginBottom: 8 },
  phoneBoxFocused: { borderWidth: 2, borderColor: INK, backgroundColor: "#fff",
    boxShadow: "0 0 0 4px rgba(245,196,0,0.15)" },

  countryPill: { flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 16, height: 58,
    borderRightWidth: 1.5, borderRightColor: BDR },
  flag: { fontSize: 22 },
  dial: { fontFamily: F.bold, fontSize: Sz.base, color: INK },

  phoneInput: { flex: 1, height: 58, paddingHorizontal: 18,
    fontFamily: F.bold, fontSize: 20, color: INK, letterSpacing: 2 },

  hint:    { fontFamily: F.regular, fontSize: Sz.xs, color: INK3, paddingLeft: 2 },
  errText: { fontFamily: F.regular, fontSize: Sz.sm, color: C.error, marginTop: 8 },

  btn:       { height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnActive: { backgroundColor: INK, boxShadow: "0 8px 28px rgba(0,0,0,0.18)" },
  btnInactive:{ backgroundColor: SURF },
  btnInner:  { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText:   { fontFamily: F.bold, fontSize: Sz.md },
  btnTextActive:  { color: Y },
  btnTextInactive:{ color: INK3 },

  terms:     { fontFamily: F.regular, fontSize: Sz.xs, color: INK3,
    textAlign: "center", lineHeight: 18, marginTop: 20, paddingHorizontal: 8 },
  termsLink: { color: INK, fontFamily: F.bold,
    textDecorationLine: "underline", textDecorationColor: Y },

  registerRow:  { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  registerText: { fontFamily: F.regular, fontSize: Sz.base, color: INK3 },
  registerLink: { fontFamily: F.bold, fontSize: Sz.base, color: INK,
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
