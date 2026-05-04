import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Camera, Plus, Trash2 } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";
import CategoryPicker from "@/components/CategoryPicker";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

export default function EditProduct() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [title,         setTitle]         = useState("");
  const [price,         setPrice]         = useState("");
  const [description,   setDescription]   = useState("");
  const [stock,         setStock]         = useState("1");
  const [isAvailable,   setIsAvailable]   = useState(true);
  const [categoryId,    setCategoryId]    = useState<number | null>(null);
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);
  const [boutiqueType,  setBoutiqueType]  = useState("autre");
  const [existingImages,setExistingImages]= useState<{ id: number; url: string; is_primary: boolean }[]>([]);
  const [newImages,     setNewImages]     = useState<{ uri: string; isPrimary: boolean }[]>([]);
  const [fetching,      setFetching]      = useState(true);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    api.get(`/products/${slug}/`)
      .then((p: any) => {
        setTitle(p.title ?? "");
        setPrice(String(p.price ?? ""));
        setDescription(p.description ?? "");
        setStock(String(p.stock_quantity ?? 1));
        setIsAvailable(p.is_available ?? true);
        if (p.category) {
          setCategoryId(p.category);
          setCategoryLabel(p.category_name ?? null);
        }
        setBoutiqueType(p.boutique_type ?? "autre");
        const imgs = (p.images ?? []).map((i: any) => ({
          id: i.id,
          url: i.image_url ?? i.image,
          is_primary: i.is_primary,
        }));
        setExistingImages(imgs);
      })
      .catch(() => Alert.alert("Erreur", "Impossible de charger le produit."))
      .finally(() => setFetching(false));
  }, [slug]);

  const pickNewImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission refusée", "Activez l'accès aux photos dans vos réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const isFirst = existingImages.length === 0 && newImages.length === 0;
      setNewImages(prev => [...prev, { uri: result.assets[0].uri, isPrimary: isFirst }]);
    }
  };

  const removeExistingImage = (id: number) => {
    Alert.alert("Supprimer la photo", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            const productId = (await api.get(`/products/${slug}/`)).id;
            await api.delete(`/products/${productId}/images/${id}/`);
            setExistingImages(prev => prev.filter(i => i.id !== id));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer cette photo.");
          }
        },
      },
    ]);
  };

  const removeNewImage = (idx: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
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
      const body: Record<string, any> = {
        title:          title.trim(),
        price:          parsedPrice,
        description:    description.trim(),
        stock_quantity: parseInt(stock || "1", 10),
        is_available:   isAvailable,
      };
      if (categoryId) body.category = categoryId;

      await api.patch(`/products/${slug}/`, body);

      // Upload new images
      if (newImages.length > 0) {
        const product = await api.get(`/products/${slug}/`);
        for (const img of newImages) {
          const form     = new FormData();
          const filename = img.uri.split("/").pop() ?? "image.jpg";
          const match    = /\.(\w+)$/.exec(filename);
          const mimeType = match ? `image/${match[1]}` : "image/jpeg";
          form.append("image",      { uri: img.uri, name: filename, type: mimeType } as any);
          form.append("is_primary", String(img.isPrimary));
          await api.post(`/products/${product.id}/images/`, form);
        }
      }

      Alert.alert("Succès", "Produit mis à jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.detail || "Impossible de mettre à jour le produit.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <View style={s.center}><ActivityIndicator color={C.gold} size="large" /></View>
  );

  const totalImages = existingImages.length + newImages.length;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={C.textPrimary} width={20} height={20} />
        </TouchableOpacity>
        <Text style={s.title}>Modifier le produit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* Images */}
        <Text style={s.label}>Photos</Text>
        <View style={s.thumbRow}>
          {existingImages.map((img) => (
            <View key={`e-${img.id}`} style={s.thumbWrap}>
              <Image source={{ uri: img.url }} style={s.thumb} resizeMode="cover" />
              {img.is_primary && <View style={s.primaryDot} />}
              <TouchableOpacity style={s.thumbDel} onPress={() => removeExistingImage(img.id)} activeOpacity={0.8}>
                <Trash2 color="#fff" width={10} height={10} />
              </TouchableOpacity>
            </View>
          ))}
          {newImages.map((img, i) => (
            <View key={`n-${i}`} style={s.thumbWrap}>
              <Image source={{ uri: img.uri }} style={s.thumb} resizeMode="cover" />
              <View style={s.newBadge}><Text style={s.newBadgeText}>Nouveau</Text></View>
              <TouchableOpacity style={s.thumbDel} onPress={() => removeNewImage(i)} activeOpacity={0.8}>
                <Trash2 color="#fff" width={10} height={10} />
              </TouchableOpacity>
            </View>
          ))}
          {totalImages < 4 && (
            <TouchableOpacity style={s.thumbAdd} onPress={pickNewImage} activeOpacity={0.8}>
              <Plus color={C.gold} width={20} height={20} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category */}
        <CategoryPicker
          boutiqueType={boutiqueType}
          value={categoryId}
          label={categoryLabel}
          onChange={(id, name) => { setCategoryId(id); setCategoryLabel(name); }}
          fieldLabel="Catégorie"
        />

        {/* Fields */}
        <Field label="Nom du produit *" value={title} onChangeText={setTitle} placeholder="Ex: Thiéboudiène" />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field label="Prix (MRU) *" value={price} onChangeText={setPrice} placeholder="0.00" keyboard="numeric" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field label="Stock" value={stock} onChangeText={setStock} placeholder="1" keyboard="numeric" />
          </View>
        </View>

        <Field label="Description" value={description} onChangeText={setDescription}
          placeholder="Décrivez le produit..." multiline />

        {/* Availability toggle */}
        <View style={s.availRow}>
          <Text style={s.availLabel}>En stock · متوفر</Text>
          <TouchableOpacity
            style={[s.availBtn, isAvailable && s.availBtnOn]}
            onPress={() => setIsAvailable(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[s.availThumb, isAvailable && s.availThumbOn]} />
          </TouchableOpacity>
        </View>

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

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboard = "default" }: any) {
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
        keyboardType={keyboard}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );
}

const THUMB_SIZE = 76;

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
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 12, ...Border.card },

  thumbRow:   { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  thumbWrap:  { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: R.md,
    overflow: "visible", position: "relative" },
  thumb:      { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: R.md },
  primaryDot: { position: "absolute", top: 4, left: 4, width: 10, height: 10,
    borderRadius: 5, backgroundColor: C.gold, borderWidth: 1.5, borderColor: "#fff" },
  newBadge:   { position: "absolute", bottom: 4, left: 4,
    backgroundColor: C.gold, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  newBadgeText:{ fontFamily: F.bold, fontSize: 8, color: "#000" },
  thumbDel:   { position: "absolute", top: -6, right: -6, width: 22, height: 22,
    borderRadius: R.full, backgroundColor: C.error,
    alignItems: "center", justifyContent: "center", zIndex: 10 },
  thumbAdd:   { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: R.md,
    borderWidth: 2, borderColor: C.border, borderStyle: "dashed",
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },

  row:        { flexDirection: "row" },

  availRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 14,
    paddingVertical: 14, marginBottom: 16, ...Border.card },
  availLabel: { fontFamily: F.medium, fontSize: Sz.base, color: C.textPrimary },
  availBtn:   { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border,
    justifyContent: "center", paddingHorizontal: 3 },
  availBtnOn: { backgroundColor: C.gold },
  availThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff",
    alignSelf: "flex-start" },
  availThumbOn:{ alignSelf: "flex-end" },

  btn:     { height: 54, backgroundColor: C.gold, borderRadius: R.full,
    alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: F.bold, fontSize: Sz.md, color: "#fff" },
});
