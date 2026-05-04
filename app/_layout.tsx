import { SplashScreen, Stack } from "expo-router";
import "./global.css";
import { useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  View, StyleSheet, Animated, Text, Easing, Dimensions,
} from "react-native";
import Svg, { Path, Rect, Defs, Pattern as SvgPattern } from "react-native-svg";
import { C, F, FA } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

SplashScreen.preventAutoHideAsync();

const { height: SH } = Dimensions.get("window");

// ── Product cards that float in and blur out ──────────────────────────────────
const CARDS: {
  emoji: string; label: string; price: string; rotate: string;
  top: number; delay: number; left?: number; right?: number;
}[] = [
  { emoji: "👗", label: "Mode",     price: "4 500",  rotate: "-5deg", top: Math.round(SH * 0.125), left: 24,   delay: 50  },
  { emoji: "📱", label: "Tech",     price: "18 000", rotate: "4deg",  top: Math.round(SH * 0.099), right: 28,  delay: 130 },
  { emoji: "🍔", label: "Repas",    price: "300",    rotate: "3deg",  top: Math.round(SH * 0.256), left: 10,   delay: 90  },
  { emoji: "🏺", label: "Artisan",  price: "1 800",  rotate: "-4deg", top: Math.round(SH * 0.244), right: 14,  delay: 170 },
  { emoji: "🎧", label: "Audio",    price: "2 200",  rotate: "-3deg", top: Math.round(SH * 0.667), left: 18,   delay: 70  },
  { emoji: "💎", label: "Bijoux",   price: "6 500",  rotate: "5deg",  top: Math.round(SH * 0.653), right: 22,  delay: 150 },
  { emoji: "🧣", label: "Mode",     price: "1 200",  rotate: "2deg",  top: Math.round(SH * 0.796), left: 32,   delay: 110 },
  { emoji: "🥑", label: "Épicerie", price: "850",    rotate: "-3deg", top: Math.round(SH * 0.784), right: 26,  delay: 190 },
];

const WORD = "maurikilchi";

// ─────────────────────────────────────────────────────────────────────────────
const SPLASH_DURATION_MS = 3200; // total animation length

function GoldSplash({ onDone }: { onDone?: () => void }) {
  const ease = Easing.bezier(0.22, 1, 0.36, 1);

  // ── Card animations ────────────────────────────────────────────────────────
  const cardOpacity   = useRef(CARDS.map(() => new Animated.Value(0))).current;
  const cardTranslate = useRef(CARDS.map(() => new Animated.Value(22))).current;
  const priceOpacity  = useRef(CARDS.map(() => new Animated.Value(0))).current;
  const cardWrapOp    = useRef(new Animated.Value(1)).current;

  // ── Logo zone ──────────────────────────────────────────────────────────────
  const logoOp        = useRef(new Animated.Value(0)).current;
  const logoTY        = useRef(new Animated.Value(12)).current;
  const iconOp        = useRef(new Animated.Value(0)).current;
  const iconScale     = useRef(new Animated.Value(0.6)).current;

  // ── Wordmark letters ───────────────────────────────────────────────────────
  const lOp  = useRef(WORD.split("").map(() => new Animated.Value(0))).current;
  const lTY  = useRef(WORD.split("").map(() => new Animated.Value(-16))).current;
  const lRot = useRef(WORD.split("").map(() => new Animated.Value(-3))).current;

  // ── Divider + taglines + progress ──────────────────────────────────────────
  const divW    = useRef(new Animated.Value(0)).current;   // layout prop → no native driver
  const tagFrOp = useRef(new Animated.Value(0)).current;
  const tagFrTY = useRef(new Animated.Value(7)).current;
  const tagArOp = useRef(new Animated.Value(0)).current;
  const tagArTY = useRef(new Animated.Value(7)).current;
  const progOp  = useRef(new Animated.Value(0)).current;
  const progW   = useRef(new Animated.Value(0)).current;   // layout prop → no native driver

  useEffect(() => {
    // Cards float in
    CARDS.forEach((card, i) => {
      Animated.parallel([
        Animated.timing(cardOpacity[i],   { toValue: 1, duration: 800, delay: card.delay, easing: ease, useNativeDriver: true }),
        Animated.timing(cardTranslate[i], { toValue: 0, duration: 800, delay: card.delay, easing: ease, useNativeDriver: true }),
      ]).start();
      Animated.timing(priceOpacity[i], {
        toValue: 1, duration: 300, delay: card.delay + 330, useNativeDriver: true,
      }).start();
    });

    // Cards fade out at 750 ms
    setTimeout(() => {
      Animated.timing(cardWrapOp, { toValue: 0.12, duration: 600, useNativeDriver: true }).start();
    }, 750);

    // Logo zone in at 1 000 ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOp,    { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(logoTY,    { toValue: 0, duration: 550, useNativeDriver: true }),
        Animated.timing(iconOp,    { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1, duration: 600, easing: Easing.bezier(0.34, 1.5, 0.64, 1), useNativeDriver: true }),
      ]).start();
    }, 1000);

    // Letters drop in one by one
    WORD.split("").forEach((_, i) => {
      const delay = 1120 + i * 48;
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(lOp[i],  { toValue: 1, duration: 380, easing: Easing.bezier(0.34, 1.4, 0.64, 1), useNativeDriver: true }),
          Animated.timing(lTY[i],  { toValue: 0, duration: 380, easing: Easing.bezier(0.34, 1.4, 0.64, 1), useNativeDriver: true }),
          Animated.timing(lRot[i], { toValue: 0, duration: 380, easing: Easing.bezier(0.34, 1.4, 0.64, 1), useNativeDriver: true }),
        ]).start();
      }, delay);
    });

    // Divider grows at 1 850 ms
    setTimeout(() => {
      Animated.timing(divW, { toValue: 130, duration: 450, useNativeDriver: false }).start();
    }, 1850);

    // Taglines
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(tagFrOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagFrTY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2000);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(tagArOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagArTY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2150);

    // Progress bar
    setTimeout(() => {
      Animated.timing(progOp, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, 2250);
    Animated.timing(progW, { toValue: 48, duration: 2500, delay: 300, useNativeDriver: false }).start();

    // Signal parent when the full sequence has played
    const t = setTimeout(() => onDone?.(), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={sp.root}>

      {/* Subtle gold grid */}
      <Svg style={StyleSheet.absoluteFill as any} viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgPattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M40 0H0V40" fill="none" stroke="#C8A000" strokeWidth="0.6" />
          </SvgPattern>
        </Defs>
        <Rect width="393" height="852" fill="url(#grid)" opacity="0.04" />
      </Svg>

      {/* ── Product cards ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardWrapOp }]}>
        {CARDS.map((card, i) => {
          const rotStr = lRot[0].interpolate({ inputRange: [-3, 0], outputRange: ["-3deg", "0deg"] });
          // Each card uses separate rotate; just apply static rotate on outer View
          return (
            <View
              key={i}
              style={[
                sp.cardOuter,
                { top: card.top },
                card.left !== undefined ? { left: card.left } : { right: card.right },
                { transform: [{ rotate: card.rotate }] },
              ]}
            >
              <Animated.View style={[sp.card, { opacity: cardOpacity[i], transform: [{ translateY: cardTranslate[i] }] }]}>
                <Text style={sp.cardEmoji}>{card.emoji}</Text>
                <Text style={sp.cardLabel}>{card.label}</Text>
                <Animated.View style={[sp.priceOuter, { opacity: priceOpacity[i] }]}>
                  <View style={sp.priceTag}>
                    <Text style={sp.priceText}>{card.price} MRU</Text>
                  </View>
                </Animated.View>
              </Animated.View>
            </View>
          );
        })}
      </Animated.View>

      {/* ── Logo zone ── */}
      <Animated.View style={[sp.logoZone, { opacity: logoOp, transform: [{ translateY: logoTY }] }]}>

        {/* Icon mark — black rounded rect + gold M path */}
        <Animated.View style={[sp.iconMark, { opacity: iconOp, transform: [{ scale: iconScale }] }]}>
          <Svg width={52} height={36} viewBox="0 0 54 38">
            <Path
              d="M2 36V2L14 22L27 4L40 22L52 2V36"
              stroke="#F5C400"
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {/* Subtle gloss overlay */}
          <View style={sp.iconGloss} />
        </Animated.View>

        {/* Wordmark — letters drop in */}
        <View style={sp.wordmark}>
          {WORD.split("").map((ch, i) => {
            const rot = lRot[i].interpolate({ inputRange: [-3, 0], outputRange: ["-3deg", "0deg"] });
            return (
              <Animated.Text
                key={i}
                style={[sp.letter, { opacity: lOp[i], transform: [{ translateY: lTY[i] }, { rotate: rot }] }]}
              >
                {ch}
              </Animated.Text>
            );
          })}
        </View>

        {/* Gold divider */}
        <Animated.View style={[sp.divider, { width: divW }]} />

        {/* Taglines */}
        <Animated.Text style={[sp.tagFr, { opacity: tagFrOp, transform: [{ translateY: tagFrTY }] }]}>
          Marketplace
        </Animated.Text>
        <Animated.Text style={[sp.tagAr, { opacity: tagArOp, transform: [{ translateY: tagArTY }] }]}>
          سوق موريتانيا الرقمي
        </Animated.Text>
      </Animated.View>

      {/* ── Progress bar ── */}
      <Animated.View style={[sp.progressWrap, { opacity: progOp }]}>
        <View style={sp.progressTrack}>
          <Animated.View style={[sp.progressFill, { width: progW }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const sp = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFDF5", alignItems: "center", justifyContent: "center" },

  // Cards
  cardOuter: { position: "absolute" },
  card: {
    width: 78, height: 88,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 18, elevation: 3,
  },
  cardEmoji:  { fontSize: 32, marginBottom: 3 },
  cardLabel:  { fontSize: 9, fontWeight: "700", color: "#555", marginBottom: 16 },
  priceOuter: { position: "absolute", bottom: 7, left: 0, right: 0, alignItems: "center" },
  priceTag:   {
    backgroundColor: "#F5C400", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    shadowColor: "#F5C400", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 2,
  },
  priceText:  { fontSize: 9, fontWeight: "800", color: "#111" },

  // Logo zone
  logoZone: { alignItems: "center" },
  iconMark: {
    width: 94, height: 94, borderRadius: 28, backgroundColor: "#111",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    marginBottom: 22,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 40, elevation: 10,
  },
  iconGloss: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  // Wordmark
  wordmark: { flexDirection: "row", marginBottom: 14 },
  letter:   { fontSize: 40, fontFamily: FA.bold, color: "#111", letterSpacing: -1 },

  // Divider
  divider: {
    height: 1.5, borderRadius: 1, marginBottom: 14,
    backgroundColor: "#F5C400",
  },

  // Taglines
  tagFr: {
    fontFamily: F.semibold, fontSize: 11, color: "#aaa",
    letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 6,
  },
  tagAr: { fontFamily: FA.regular, fontSize: 15, color: "#C8A000" },

  // Progress
  progressWrap:  { position: "absolute", bottom: 52, left: 0, right: 0, alignItems: "center" },
  progressTrack: { width: 48, height: 2.5, backgroundColor: "rgba(0,0,0,0.07)", borderRadius: 2, overflow: "hidden" },
  progressFill:  { height: "100%", backgroundColor: "#F5C400", borderRadius: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  const [fontsLoaded] = useFonts({
    "AmazonEmber-Regular": require("../assets/fonts/Amazon-Ember-Regular.ttf"),
    "AmazonEmber-Medium":  require("../assets/fonts/Amazon-Ember-Medium.ttf"),
    "AmazonEmber-Bold":    require("../assets/fonts/Amazon-Ember-Bold.ttf"),
    "AmazonEmber-Mono":    require("../assets/fonts/Amazon-Ember-Mono.ttf"),
    "Manrope-Regular":     Manrope_400Regular,
    "Manrope-Medium":      Manrope_500Medium,
    "Manrope-SemiBold":    Manrope_600SemiBold,
    "Manrope-Bold":        Manrope_700Bold,
  });

  const [appReady,   setAppReady]   = useState(false);
  const [animDone,   setAnimDone]   = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const overlayOp = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
    bootstrap().finally(() => setAppReady(true));
  }, [fontsLoaded]);

  // Once both signals arrive, fade the splash overlay out over the already-
  // rendered home screen — no white gap, no hard cut.
  useEffect(() => {
    if (!appReady || !animDone) return;
    Animated.timing(overlayOp, { toValue: 0, duration: 380, useNativeDriver: true })
      .start(() => setShowSplash(false));
  }, [appReady, animDone]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" backgroundColor="transparent" translucent />

      {/* Stack renders immediately in the background — home screen loads its
          data while the splash is still playing, so it's ready when the
          overlay fades away. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="boutique" />
        <Stack.Screen name="restaurant" />
        <Stack.Screen name="product" />
        <Stack.Screen name="my-boutiques" />
        <Stack.Screen name="edit-profile" />
      </Stack>

      {/* Splash overlay — sits on top until the animation + bootstrap finish,
          then fades to transparent and unmounts. */}
      {showSplash && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOp, zIndex: 999 }]}>
          <GoldSplash onDone={() => setAnimDone(true)} />
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}
