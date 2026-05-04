/**
 * ProductCreationModal
 * Full-screen modal for creating a product:
 *  - Main image (required look)
 *  - Up to 3 additional images
 *  - Title, price, description, stock
 *
 * Usage:
 *   <ProductCreationModal
 *     visible={show}
 *     boutiqueId={id}
 *     onClose={() => setShow(false)}
 *     onCreated={(product) => setProducts(p => [product, ...p])}
 *   />
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, Dimensions, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Camera, Plus, Trash2 } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";
import { pickAndCheckImage } from "@/lib/pickAndCheckImage";
import { C, F, Sz, R, S, Border } from "@/constants/theme";
import CategoryPicker from "@/components/CategoryPicker";

const { width, height: SCREEN_H } = Dimensions.get("window");
const THUMB = (width - S.screen * 2 - 12 * 3) / 4;

interface Props {
  visible:     boolean;
  boutiqueId:  string | number;
  boutiqueType: string;
  onClose:     () => void;
  onCreated:   (product: any) => void;
}

export default function ProductCreationModal({ visible, boutiqueId, boutiqueType, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const [title,         setTitle]         = useState("");
  const [price,         setPrice]         = useState("");
  const [description,   setDescription]   = useState("");
  const [stock,         setStock]         = useState("1");
  const [mainImage,     setMainImage]     = useState<string | null>(null);
  const [extraImages,   setExtraImages]   = useState<string[]>([]);
  const [categoryId,    setCategoryId]    = useState<number | null>(null);
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);
  const [loading,     setLoading]    = useState(false);
  const [checking,    setChecking]   = useState<"idle" | "detecting">("idle");
  const [checkingFor, setCheckingFor] = useState<"main" | "extra" | null>(null);

  const slideAnim    = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,    { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,         duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const reset = () => {
    setTitle(""); setPrice(""); setDescription(""); setStock("1");
    setMainImage(null); setExtraImages([]);
    setCategoryId(null); setCategoryLabel(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const applyImage = (uri: string, isMain: boolean) => {
    if (isMain) setMainImage(uri);
    else if (extraImages.length < 3) setExtraImages(prev => [...prev, uri]);
  };

  const pickImage = useCallback(async (isMain: boolean) => {
    setCheckingFor(isMain ? "main" : "extra");
    setChecking("detecting");
    try {
      const result = await pickAndCheckImage();
      if (result.status === "cancelled") return;
      if (result.status === "ok") { applyImage(result.uri, isMain); return; }

      // Person detected — inform user and ask them to re-upload a clean image
      Alert.alert(
        "Personne détectée",
        "Cette image contient une personne.\n\nUtilisez un outil IA (Gemini, ChatGPT…) pour supprimer la personne, puis importez l'image corrigée.\n\nAstuce : « Supprime la personne de cette image, garde uniquement les vêtements »",
        [{ text: "Compris" }],
      );
    } finally {
      setChecking("idle");
      setCheckingFor(null);
    }
  }, [extraImages.length]);

  const removeExtra = (idx: number) => {
    setExtraImages(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImage = async (productId: number, uri: string, isPrimary: boolean) => {
    const form     = new FormData();
    const filename = uri.split("/").pop() ?? "image.jpg";
    const match    = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1]}` : "image/jpeg";
    form.append("image", { uri, name: filename, type: mimeType } as any);
    form.append("is_primary", String(isPrimary));
    await api.post(`/products/${productId}/images/`, form);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Champs requis", "Le nom du produit est obligatoire.");
      return;
    }
    const parsedPrice = parseFloat(price.replace(",", "."));
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Prix invalide", "Entrez un prix valide.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the product
      const body: Record<string, any> = {
        title:          title.trim(),
        price:          parsedPrice,
        description:    description.trim(),
        stock_quantity: parseInt(stock || "1", 10),
        boutique:       Number(boutiqueId),
        is_available:   true,
      };
      if (categoryId) body.category = categoryId;
      const product = await api.post<{ id: number }>("/products/", body);

      // 2. Upload main image (is_primary: true)
      if (mainImage) {
        await uploadImage(product.id, mainImage, true);
      }

      // 3. Upload extra images
      for (const uri of extraImages) {
        await uploadImage(product.id, uri, false);
      }

      // Re-fetch the full product (with images) before returning
      const full = await api.get(`/products/${(product as any).slug ?? product.id}/`);
      onCreated(full);
      handleClose();
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.detail ?? "Impossible de créer le produit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View style={[m.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[m.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom }]}>
        {/* Drag handle */}
        <View style={m.handle} />

        {/* Header */}
        <View style={m.header}>
          <Text style={m.title}>Nouveau produit</Text>
          <TouchableOpacity style={m.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <X color={C.textPrimary} width={20} height={20} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={m.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Main image ── */}
            <Text style={m.sectionLabel}>Photo principale</Text>
            <TouchableOpacity
              style={[m.mainImageZone, mainImage && m.mainImageZoneFilled]}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
              disabled={checking !== "idle"}
            >
              {checkingFor === "main" && checking === "detecting" ? (
                <View style={m.mainImagePlaceholder}>
                  <ActivityIndicator color={C.gold} />
                  <Text style={m.mainImageSub}>Vérification en cours…</Text>
                </View>
              ) : mainImage ? (
                <>
                  <Image source={{ uri: mainImage }} style={m.mainImagePreview} resizeMode="contain" />
                  <View style={m.mainImageOverlay}>
                    <Camera color="#fff" width={18} height={18} />
                    <Text style={m.mainImageOverlayText}>Changer</Text>
                  </View>
                </>
              ) : (
                <View style={m.mainImagePlaceholder}>
                  <View style={m.cameraCircle}>
                    <Camera color={C.gold} width={24} height={24} />
                  </View>
                  <Text style={m.mainImageLabel}>Ajouter une photo principale</Text>
                  <Text style={m.mainImageSub}>4:3 · JPG, PNG</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Extra images ── */}
            <Text style={m.sectionLabel}>
              Photos supplémentaires{" "}
              <Text style={m.sectionSub}>({extraImages.length}/3)</Text>
            </Text>
            <View style={m.thumbRow}>
              {extraImages.map((uri, i) => (
                <View key={i} style={m.thumbWrap}>
                  <Image source={{ uri }} style={m.thumb} />
                  <TouchableOpacity style={m.thumbDel} onPress={() => removeExtra(i)} activeOpacity={0.8}>
                    <Trash2 color="#fff" width={11} height={11} />
                  </TouchableOpacity>
                </View>
              ))}
              {extraImages.length < 3 && (
                <TouchableOpacity
                  style={m.thumbAdd}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.8}
                  disabled={checking !== "idle"}
                >
                  {checkingFor === "extra" && checking !== "idle"
                    ? <ActivityIndicator color={C.gold} size="small" />
                    : <Plus color={C.gold} width={20} height={20} />}
                </TouchableOpacity>
              )}
            </View>

            {/* ── Category ── */}
            <CategoryPicker
              boutiqueType={boutiqueType}
              value={categoryId}
              label={categoryLabel}
              onChange={(id, name) => { setCategoryId(id); setCategoryLabel(name); }}
              fieldLabel="Catégorie"
            />

            {/* ── Fields ── */}
            <Field label="Nom du produit *" value={title} onChangeText={setTitle}
              placeholder="Ex: Thiéboudiène" />

            <View style={m.row}>
              <View style={{ flex: 1 }}>
                <Field label="Prix (MRU) *" value={price} onChangeText={setPrice}
                  placeholder="0.00" keyboard="numeric" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Stock" value={stock} onChangeText={setStock}
                  placeholder="1" keyboard="numeric" />
              </View>
            </View>

            <Field label="Description" value={description} onChangeText={setDescription}
              placeholder="Décrivez le produit..." multiline />

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[m.btn, (!title || !price || loading) && m.btnOff]}
              onPress={handleSubmit}
              disabled={!title || !price || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={m.btnText}>Créer le produit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>

    </>
  );
}

// ── Reusable field ────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline = false, keyboard = "default" }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={m.fieldLabel}>{label}</Text>
      <TextInput
        style={[m.input, multiline && { height: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
        keyboardType={keyboard}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.50)" },
  sheet:    { position: "absolute", bottom: 0, left: 0, right: 0,
    height: SCREEN_H * 0.92,
    backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden" },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: "center", marginTop: 12, marginBottom: 2 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border },
  title:    { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center", ...Border.card },
  body:     { padding: S.screen, paddingBottom: 48 },

  sectionLabel: { fontFamily: F.bold, fontSize: Sz.sm, color: C.textPrimary, marginBottom: 10 },
  sectionSub:   { fontFamily: F.regular, color: C.textMuted },

  // Main image
  mainImageZone:       { height: 260, borderRadius: R.xl, borderWidth: 2,
    borderColor: C.border, borderStyle: "dashed", overflow: "hidden",
    backgroundColor: C.surface, marginBottom: 20 },
  mainImageZoneFilled: { borderStyle: "solid", borderColor: "transparent" },
  mainImagePreview:    { ...StyleSheet.absoluteFillObject },
  mainImageOverlay:    { position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9 },
  mainImageOverlayText: { fontFamily: F.bold, fontSize: Sz.sm, color: "#fff" },
  mainImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  cameraCircle:  { width: 52, height: 52, borderRadius: R.full,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center" },
  mainImageLabel:{ fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary },
  mainImageSub:  { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted },

  // Extra thumbnails
  thumbRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  thumbWrap:{ width: THUMB, height: THUMB, borderRadius: R.md, overflow: "visible", position: "relative" },
  thumb:    { width: THUMB, height: THUMB, borderRadius: R.md },
  thumbDel: { position: "absolute", top: -6, right: -6, width: 22, height: 22,
    borderRadius: R.full, backgroundColor: C.error,
    alignItems: "center", justifyContent: "center", zIndex: 10 },
  thumbAdd: { width: THUMB, height: THUMB, borderRadius: R.md,
    borderWidth: 2, borderColor: C.border, borderStyle: "dashed",
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },

  row:        { flexDirection: "row" },
  fieldLabel: { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary, marginBottom: 6 },
  input:      { fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 12, ...Border.card },

  btn:    { height: 54, backgroundColor: C.gold, borderRadius: R.full,
    alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnOff: { opacity: 0.45 },
  btnText:{ fontFamily: F.bold, fontSize: Sz.md, color: "#fff" },
});
