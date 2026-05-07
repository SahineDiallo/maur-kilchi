import React from "react";
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { F, FA, Sz, S } from "@/constants/theme";

const { height } = Dimensions.get("window");
const SURF = "#F7F5F0";
const INK  = "#111111";
const INK3 = "#999999";
const Y    = "#F5C400";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={s.root}>
      {/* Yellow gradient wash */}
      <LinearGradient
        colors={["#FFE14D", "#FFF5B0", "rgba(255,248,160,0.15)", "rgba(255,255,255,0)"]}
        locations={[0, 0.38, 0.62, 1]}
        style={s.wash}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe}>
        {/* Skip */}
        <TouchableOpacity style={s.skipBtn} onPress={() => router.replace("/(app)")} activeOpacity={0.7}>
          <Text style={s.skipText}>Continuer sans compte →</Text>
        </TouchableOpacity>

        {/* Logo + headline */}
        <View style={s.hero}>
          <Image
            source={require("@/assets/images/main_logo.png")}
            style={s.logo}
            resizeMode="contain"
          />

          <Text style={s.headline}>Bienvenue sur</Text>
          <View style={s.hlWrap}>
            <View style={s.hlBar} />
            <Text style={s.headlineGold}>maurikilchi</Text>
          </View>

          <Text style={s.taglineAr}>سوقك الإلكتروني في موريتانيا</Text>
          <Text style={s.taglineFr}>Votre marché en ligne en Mauritanie</Text>
        </View>

        {/* Feature pills */}
        <View style={s.pills}>
          {["🛍️  Boutiques locales", "🚀  Livraison rapide", "🔒  Paiement sécurisé"].map((f) => (
            <View key={f} style={s.pill}>
              <Text style={s.pillText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.bottom}>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.85}
          >
            <Text style={s.btnPrimaryText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.8}
          >
            <Text style={s.btnSecondaryText}>Créer un compte · إنشاء حساب</Text>
          </TouchableOpacity>

          <Text style={s.legal}>
            En continuant, vous acceptez nos{" "}
            <Text style={s.legalLink}>Conditions d'utilisation</Text>
            {" "}et notre{" "}
            <Text style={s.legalLink}>Politique de confidentialité</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  wash: { position: "absolute", top: 0, left: 0, right: 0, height: 420, zIndex: 0 },
  safe: { flex: 1, justifyContent: "space-between", paddingHorizontal: S.screen, zIndex: 5 },

  skipBtn:  { alignSelf: "flex-end", paddingTop: S.px16, paddingBottom: 4 },
  skipText: { fontFamily: F.medium, fontSize: Sz.sm, color: "rgba(0,0,0,0.40)" },

  hero:         { flex: 1, justifyContent: "center", paddingTop: height * 0.02 },
  logo:         { width: 80, height: 80, marginBottom: 24 },
  headline:     { fontSize: Sz["3xl"], fontFamily: F.bold, color: INK,
    lineHeight: 38, letterSpacing: -0.8, marginBottom: 4 },
  hlWrap:       { marginBottom: 14 },
  hlBar:        { position: "absolute", bottom: 2, left: 0, right: 0,
    height: 8, backgroundColor: Y, borderRadius: 2, opacity: 0.6 },
  headlineGold: { fontSize: Sz["3xl"], fontFamily: F.bold, color: INK, letterSpacing: -0.8 },
  taglineAr:    { fontFamily: FA.regular, fontSize: Sz.base, color: "rgba(0,0,0,0.55)",
    marginBottom: 4 },
  taglineFr:    { fontFamily: F.regular, fontSize: Sz.sm, color: INK3 },

  pills:    { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 24 },
  pill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: SURF, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  pillText: { fontFamily: F.medium, fontSize: Sz.sm, color: "rgba(0,0,0,0.65)" },

  bottom:         { paddingBottom: S.px32, gap: 12 },
  btnPrimary:     { height: 56, backgroundColor: INK, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)" },
  btnPrimaryText: { fontFamily: F.bold, fontSize: Sz.md, color: Y, letterSpacing: 0.2 },

  btnSecondary:     { height: 54, borderRadius: 16, borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)", backgroundColor: SURF,
    alignItems: "center", justifyContent: "center" },
  btnSecondaryText: { fontFamily: F.medium, fontSize: Sz.md, color: INK },

  legal:     { fontFamily: F.regular, fontSize: Sz.xs, color: INK3,
    textAlign: "center", lineHeight: 18, marginTop: 4 },
  legalLink: { color: INK, fontFamily: F.bold,
    textDecorationLine: "underline", textDecorationColor: Y },
});
