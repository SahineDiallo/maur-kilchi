import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight } from "react-native-feather";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, Sz, R, S } from "@/constants/theme";

const SURF = "#F7F5F0";
const BDR  = "rgba(0,0,0,0.08)";
const INK  = "#111111";
const INK3 = "#999999";
const Y    = "#F5C400";
const BOX  = 48;

const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const mask = (p: string) =>
  p.length > 6 ? `${p.slice(0, 4)} ••• ${p.slice(-2)}` : p;

export default function Verify() {
  const router = useRouter();
  const {
    pendingPhone, pendingFirst, pendingLast,
    pendingRole, pendingVehicle, pendingTrajetDepart, pendingTrajetDest, pendingWilaya,
    login, clearPending,
  } = useAuthStore();

  const [digits,    setDigits]    = useState(["", "", "", "", "", ""]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [timer,     setTimer]     = useState(120);
  const [canResend, setCanResend] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const onChange = (text: string, i: number) => {
    if (text.length === 6 && /^\d+$/.test(text)) {
      const d = text.split("") as string[];
      setDigits(d);
      refs.current[5]?.focus();
      return;
    }
    const d = text.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onBack = (key: string, i: number) => {
    if (key !== "Backspace") return;
    const next = [...digits];
    if (next[i] === "" && i > 0) {
      next[i - 1] = "";
      setDigits(next);
      refs.current[i - 1]?.focus();
    } else {
      next[i] = "";
      setDigits(next);
    }
  };

  const verify = async () => {
    const code = digits.join("");
    if (code.length < 6) return;
    setError(""); setLoading(true);
    try {
      const payload: any = { phone: pendingPhone, code };
      if (pendingFirst)        payload.first_name         = pendingFirst;
      if (pendingLast)         payload.last_name          = pendingLast;
      if (pendingRole)         payload.role               = pendingRole;
      if (pendingVehicle)      payload.vehicle_type       = pendingVehicle;
      if (pendingTrajetDepart) payload.trajet_depart      = pendingTrajetDepart;
      if (pendingTrajetDest)   payload.trajet_destination = pendingTrajetDest;
      if (pendingWilaya)       payload.wilaya             = pendingWilaya;
      const data = await api.post<{ access: string; refresh: string; user: any }>(
        "/auth/verify-otp/", payload,
      );
      await login(data.access, data.refresh, data.user);
      clearPending();

      setSuccess(true);
      setTimeout(() => router.replace("/(app)"), 900);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  const resend = () => {
    setTimer(120); setCanResend(false);
    setDigits(["", "", "", "", "", ""]); setError("");
    api.post("/auth/send-otp/", { phone: pendingPhone }).catch(() => {});
    refs.current[0]?.focus();
  };

  const filled = digits.every((d) => d !== "");

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
            {/* Headline */}
            <View style={s.hero}>
              <Text style={s.headline}>Vérifiez{"\n"}votre numéro</Text>
              <Text style={s.sub}>
                Code envoyé au{" "}
                <Text style={s.phone}>+222 {mask(pendingPhone)}</Text>
              </Text>
            </View>

            {/* OTP boxes */}
            <View style={s.boxes}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { refs.current[i] = r; }}
                  style={[
                    s.box,
                    d           && s.boxFilled,
                    error       && s.boxErr,
                    success     && s.boxSuccess,
                  ]}
                  value={success ? "✓" : d}
                  onChangeText={(t) => onChange(t, i)}
                  onKeyPress={({ nativeEvent }) => onBack(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={i === 0}
                  selectTextOnFocus
                  editable={!success}
                />
              ))}
            </View>

            {/* Error */}
            {error ? <Text style={s.errText}>{error}</Text> : null}

            {/* Resend */}
            <View style={s.resendRow}>
              {canResend ? (
                <TouchableOpacity onPress={resend}>
                  <Text style={s.resendActive}>Renvoyer le code · إعادة الإرسال</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.resendTimer}>
                  Renvoyer dans{" "}
                  <Text style={{ fontFamily: F.bold, color: INK }}>{fmt(timer)}</Text>
                </Text>
              )}
            </View>

            <View style={{ flex: 1, minHeight: 32 }} />

            {/* CTA */}
            <TouchableOpacity
              style={[
                s.btn,
                success               ? s.btnSuccess  :
                filled && !loading    ? s.btnActive    :
                                        s.btnInactive,
              ]}
              onPress={verify}
              disabled={!filled || loading || success}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Y} />
              ) : success ? (
                <Text style={[s.btnText, s.btnTextSuccess]}>Vérifié !</Text>
              ) : (
                <View style={s.btnInner}>
                  <Text style={[s.btnText, filled ? s.btnTextActive : s.btnTextInactive]}>
                    Vérifier
                  </Text>
                  {filled && <ArrowRight color={Y} width={18} height={18} />}
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#fff" },
  wash:  { position: "absolute", top: 0, left: 0, right: 0, height: 360, zIndex: 0 },
  scroll:{ flexGrow: 1, paddingHorizontal: S.screen, paddingBottom: 48 },

  backBtn:    { paddingTop: S.px16, paddingLeft: S.screen, zIndex: 10 },
  backCircle: { width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },

  hero:     { paddingTop: 12, marginBottom: 36 },
  headline: { fontSize: 32, fontFamily: F.bold, color: INK,
    lineHeight: 36, letterSpacing: -0.7, marginBottom: 12 },
  sub:      { fontFamily: F.regular, fontSize: Sz.base, color: "#555", lineHeight: 22 },
  phone:    { fontFamily: F.bold, color: INK },

  boxes: { flexDirection: "row", gap: 10, marginBottom: 12 },
  box:   { flex: 1, height: BOX + 8, borderRadius: 14, borderWidth: 1.5,
    borderColor: BDR, backgroundColor: SURF, textAlign: "center",
    fontFamily: F.bold, fontSize: Sz.xl, color: INK },
  boxFilled:  { borderColor: INK, backgroundColor: "rgba(245,196,0,0.08)",
    transform: [{ scale: 1.04 }] },
  boxErr:     { borderColor: C.error, backgroundColor: C.errorBg },
  boxSuccess: { borderColor: C.success, backgroundColor: C.successBg, color: C.success },

  errText: { fontFamily: F.regular, fontSize: Sz.sm, color: C.error,
    marginBottom: 8, textAlign: "center" },

  resendRow:    { alignItems: "center", marginTop: 8, marginBottom: 24 },
  resendActive: { fontFamily: F.bold, fontSize: Sz.base, color: INK,
    textDecorationLine: "underline", textDecorationColor: Y },
  resendTimer:  { fontFamily: F.regular, fontSize: Sz.sm, color: INK3 },

  btn:        { height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnActive:  { backgroundColor: INK, boxShadow: "0 8px 28px rgba(0,0,0,0.18)" },
  btnInactive:{ backgroundColor: SURF },
  btnSuccess: { backgroundColor: C.success, boxShadow: "0 8px 28px rgba(34,197,94,0.30)" },
  btnInner:   { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText:    { fontFamily: F.bold, fontSize: Sz.md },
  btnTextActive:  { color: Y },
  btnTextInactive:{ color: INK3 },
  btnTextSuccess: { color: "#fff" },
});
