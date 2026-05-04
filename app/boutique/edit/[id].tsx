import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Camera, Image as ImageIcon } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";
import { pickAndCheckImage } from "@/lib/pickAndCheckImage";
import VillePicker from "@/components/VillePicker";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const TYPES = [
  { key: "restaurant",    label: "🍽️ Restaurant" },
  { key: "arrivage",      label: "📦 Arrivage" },
  { key: "supermarche",   label: "🛒 Supermarché" },
  { key: "electronique",  label: "📱 Électronique" },
  { key: "quincaillerie", label: "🔩 Quincaillerie" },
  { key: "autre",         label: "🏪 Autre" },
];

export default function EditBoutique() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name,        setName]        = useState("");
  const [type,        setType]        = useState("");
  const [description, setDescription] = useState("");
  const [ville,       setVille]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [whatsapp,    setWhatsapp]    = useState("");
  const [imageUri,    setImageUri]    = useState<string | null>(null);
  const [existingImg, setExistingImg] = useState<string | null>(null);
  const [fetching,    setFetching]    = useState(true);
  const [loading,   setLoading]  = useState(false);
  const [checking,  setChecking] = useState<"idle" | "detecting">("idle");

  useEffect(() => {
    api.get(`/boutiques/${id}/`)
      .then((b: any) => {
        setName(b.name ?? "");
        setType(b.boutique_type ?? "");
        setDescription(b.description ?? "");
        setVille(b.ville ?? "");
        setPhone(b.phone_number ?? "");
        setWhatsapp(b.whatsap_number ?? "");
        setExistingImg(b.image_url ?? null);
      })
      .catch(() => Alert.alert("Erreur", "Impossible de charger la boutique."))
      .finally(() => setFetching(false));
  }, [id]);

  const pickImage = async () => {
    setChecking("detecting");
    try {
      const result = await pickAndCheckImage();
      if (result.status === "cancelled") return;
      if (result.status === "ok") { setImageUri(result.uri); return; }

      Alert.alert(
        "Personne détectée",
        "Cette image contient une personne.\n\nUtilisez un outil IA (Gemini, ChatGPT…) pour supprimer la personne, puis importez l'image corrigée.\n\nAstuce : « Supprime la personne de cette image, garde uniquement les vêtements »",
        [{ text: "Compris" }],
      );
    } finally {
      setChecking("idle");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !type) {
      Alert.alert("Champs requis", "Le nom et le type de boutique sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/boutiques/${id}/`, {
        name, boutique_type: type, description, ville,
        phone_number: phone.trim(), whatsap_number: whatsapp.trim(),
      });

      if (imageUri) {
        const form     = new FormData();
        const filename = imageUri.split("/").pop() ?? "image.jpg";
        const match    = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : "image/jpeg";
        form.append("image", { uri: imageUri, name: filename, type: mimeType } as any);
        await api.post(`/boutiques/${id}/image/`, form);
      }

      Alert.alert("Succès", "Boutique mise à jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.detail || "Impossible de mettre à jour la boutique.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  const displayImg = imageUri ?? existingImg;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={C.textPrimary} width={20} height={20} />
        </TouchableOpacity>
        <Text style={s.title}>Modifier la boutique</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* Image picker */}
        <TouchableOpacity
          style={[s.imagePicker, displayImg && s.imagePickerFilled]}
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={checking !== "idle"}
        >
          {checking === "detecting" ? (
            <>
              <ActivityIndicator color={C.gold} />
              <Text style={s.imageSub}>Vérification en cours…</Text>
            </>
          ) : displayImg ? (
            <>
              <Image source={{ uri: displayImg }} style={s.imagePreview} resizeMode="contain" />
              <View style={s.imageOverlay}>
                <Camera color="#fff" width={20} height={20} />
                <Text style={s.imageOverlayText}>Changer la photo</Text>
              </View>
            </>
          ) : (
            <>
              <View style={s.imageIconWrap}>
                <ImageIcon color={C.gold} width={28} height={28} />
              </View>
              <Text style={s.imageLabel}>Ajouter une photo</Text>
              <Text style={s.imageSub}>16:9 recommandé · JPG, PNG</Text>
            </>
          )}
        </TouchableOpacity>

        <Field label="Nom de la boutique *" value={name} onChangeText={setName}
          placeholder="Ex: Chez Ahmed" />

        <Text style={s.label}>Type de boutique *</Text>
        <View style={s.chips}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.chip, type === t.key && s.chipOn]}
              onPress={() => setType(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, type === t.key && s.chipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <VillePicker value={ville} onChange={setVille} />

        {/* Contact */}
        <Text style={s.sectionLabel}>Contact</Text>
        <Field label="Téléphone" value={phone} onChangeText={setPhone}
          placeholder="+222…" keyboardType="phone-pad" />
        <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp}
          placeholder="+222… (laisser vide = même que téléphone)" keyboardType="phone-pad" />

        <Field label="Description" value={description} onChangeText={setDescription}
          placeholder="Décrivez votre boutique..." multiline />

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Enregistrer les modifications</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border },
  back:   { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center" },
  title:  { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  body:   { padding: S.screen, paddingBottom: 48 },
  label:  { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary, marginBottom: 6 },
  input:  { fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 14,
    paddingVertical: 12, ...Border.card },

  imagePicker:      { height: 170, borderRadius: R.xl, borderWidth: 2, borderColor: C.border,
    borderStyle: "dashed", backgroundColor: C.surface, alignItems: "center",
    justifyContent: "center", marginBottom: 20, overflow: "hidden" },
  imagePickerFilled:{ borderStyle: "solid", borderColor: "transparent", padding: 0 },
  imagePreview:     { ...StyleSheet.absoluteFillObject },
  imageOverlay:     { position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  imageOverlayText: { fontFamily: F.bold, fontSize: Sz.sm, color: "#fff" },
  imageIconWrap:    { width: 56, height: 56, borderRadius: R.full,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
    marginBottom: 10 },
  imageLabel:       { fontFamily: F.bold, fontSize: Sz.base, color: C.textPrimary, marginBottom: 4 },
  imageSub:         { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted },

  sectionLabel: { fontFamily: F.bold, fontSize: Sz.sm, color: C.textSecondary,
    marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  chips:      { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full,
    backgroundColor: C.surface, ...Border.card },
  chipOn:     { backgroundColor: C.gold, borderColor: C.gold },
  chipText:   { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  chipTextOn: { color: "#fff", fontFamily: F.bold },

  btn:     { height: 54, backgroundColor: C.gold, borderRadius: R.full,
    alignItems: "center", justifyContent: "center", marginTop: 24 },
  btnText: { fontFamily: F.bold, fontSize: Sz.md, color: "#fff" },
});
