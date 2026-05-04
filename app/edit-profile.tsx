import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, User, MessageCircle } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [firstName,    setFirstName]    = useState(user?.first_name ?? "");
  const [lastName,     setLastName]     = useState(user?.last_name ?? "");
  const [whatsapp,     setWhatsapp]     = useState(user?.whatsapp ?? "");
  const [avatarUri,    setAvatarUri]    = useState<string | null>(null);
  const [avatarLoading,setAvatarLoading]= useState(false);
  const [loading,      setLoading]      = useState(false);

  // ── Pick & upload avatar immediately ──────────────────────────────────────
  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission refusée", "Activez l'accès aux photos dans vos réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    setAvatarLoading(true);

    try {
      const form     = new FormData();
      const filename = uri.split("/").pop() ?? "avatar.jpg";
      const match    = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";
      form.append("avatar", { uri, name: filename, type: mimeType } as any);

      const updated = await api.post<any>("/auth/me/avatar/", form);
      setUser({ ...user!, avatar: updated.avatar_url ?? updated.avatar ?? uri });
      Alert.alert("Photo mise à jour ✓", "Votre photo de profil a été enregistrée.");
    } catch {
      setAvatarUri(null);
      Alert.alert("Erreur", "Impossible de télécharger la photo.");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Save name ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Le prénom et le nom sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const updated = await api.patch<any>("/auth/me/", {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        whatsapp:   whatsapp.trim(),
      });
      setUser({ ...user!, first_name: updated.first_name, last_name: updated.last_name, whatsapp: updated.whatsapp ?? "" });
      Alert.alert("Succès", "Profil mis à jour.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.detail || "Impossible de mettre à jour le profil.");
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar = avatarUri ?? user?.avatar ?? null;

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={C.textPrimary} width={20} height={20} />
        </TouchableOpacity>
        <Text style={s.title}>Modifier le profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* ── Tappable avatar ── */}
        <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
          {displayAvatar
            ? <Image source={{ uri: displayAvatar }} style={s.avatar} />
            : <View style={s.avatarPh}>
                <User color={C.textMuted} width={36} height={36} />
              </View>}

          {/* Camera badge */}
          <View style={s.cameraBadge}>
            {avatarLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Camera color="#fff" width={14} height={14} />}
          </View>
        </TouchableOpacity>

        <Text style={s.avatarHint}>Appuyez pour changer la photo</Text>

        {/* Name fields */}
        <View style={s.field}>
          <Text style={s.label}>Prénom</Text>
          <TextInput
            style={s.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Votre prénom"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Nom</Text>
          <TextInput
            style={s.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Votre nom"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Téléphone</Text>
          <View style={[s.input, s.inputDisabled]}>
            <Text style={s.disabledText}>{user?.phone}</Text>
          </View>
          <Text style={s.hint}>Le numéro de téléphone ne peut pas être modifié.</Text>
        </View>

        <View style={s.field}>
          <View style={s.labelRow}>
            <MessageCircle color="#25D366" width={14} height={14} />
            <Text style={s.label}>WhatsApp</Text>
          </View>
          <TextInput
            style={s.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder={user?.phone ?? "+222…"}
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
          />
          <Text style={s.hint}>Laisser vide pour utiliser votre numéro d'inscription.</Text>
        </View>

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Enregistrer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border },
  back:   { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center" },
  title:  { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  body:   { padding: S.screen, paddingBottom: 48, alignItems: "stretch" },

  // Avatar
  avatarWrap:  { alignSelf: "center", marginBottom: 8, position: "relative" },
  avatar:      { width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: C.gold },
  avatarPh:    { width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: C.border },
  cameraBadge: { position: "absolute", bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.gold, borderWidth: 2, borderColor: C.bg,
    alignItems: "center", justifyContent: "center" },
  avatarHint:  { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted,
    textAlign: "center", marginBottom: 28 },

  field:         { marginBottom: 16 },
  labelRow:      { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  label:         { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary },
  input:         { fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 14,
    paddingVertical: 12, ...Border.card },
  inputDisabled: { justifyContent: "center" },
  disabledText:  { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted },
  hint:          { fontFamily: F.regular, fontSize: Sz.xs, color: C.textMuted, marginTop: 4 },

  btn:    { height: 54, backgroundColor: C.gold, borderRadius: R.full,
    alignItems: "center", justifyContent: "center", marginTop: 24 },
  btnText:{ fontFamily: F.bold, fontSize: Sz.md, color: "#fff" },
});
