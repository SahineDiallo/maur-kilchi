/**
 * PersonRemovalSheet
 * Bottom sheet shown when a person is detected in a picked image.
 * Shows a preview of the original, lets the user either remove the
 * person (rembg clean background) or pick a different image.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Image, ActivityIndicator, Animated, Dimensions,
} from "react-native";
import { X, RefreshCw, Check } from "react-native-feather";
import { removePersonFromImage } from "@/lib/pickAndCheckImage";
import { C, F, Sz, S } from "@/constants/theme";

const { width, height } = Dimensions.get("window");
const PREVIEW_H = width * 0.75;

interface Props {
  visible:   boolean;
  sourceUri: string;
  onAccept:  (uri: string) => void;   // cleaned or original
  onDiscard: () => void;              // pick another
}

export default function PersonRemovalSheet({ visible, sourceUri, onAccept, onDiscard }: Props) {
  const slideAnim    = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [stage,      setStage]      = useState<"preview" | "processing" | "done">("preview");
  const [cleanedUri, setCleanedUri] = useState<string | null>(null);
  const [error,      setError]      = useState(false);

  useEffect(() => {
    if (visible) {
      setStage("preview");
      setCleanedUri(null);
      setError(false);
      Animated.parallel([
        Animated.spring(slideAnim,    { toValue: 0,  tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1,  duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,    { toValue: height, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,      duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleRemove = async () => {
    setStage("processing");
    const result = await removePersonFromImage(sourceUri);
    if (result) {
      setCleanedUri(result);
      setStage("done");
    } else {
      setError(true);
      setStage("done");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <Animated.View style={[sh.backdrop, { opacity: backdropAnim }]} />

      {/* Sheet */}
      <Animated.View style={[sh.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Handle */}
        <View style={sh.handle} />

        {/* Header */}
        <View style={sh.header}>
          <View>
            <Text style={sh.title}>Personne détectée</Text>
            <Text style={sh.subtitle}>
              {stage === "done" && !error
                ? "Arrière-plan supprimé — vérifiez le résultat"
                : "Cette image contient une personne"}
            </Text>
          </View>
          <TouchableOpacity onPress={onDiscard} style={sh.closeBtn} activeOpacity={0.7}>
            <X color={C.textMuted} width={18} height={18} />
          </TouchableOpacity>
        </View>

        {/* Before / After previews */}
        <View style={sh.previews}>
          <View style={sh.previewCol}>
            <Text style={sh.previewLabel}>Avant</Text>
            <Image source={{ uri: sourceUri }} style={sh.previewImg} resizeMode="cover" />
          </View>

          <View style={sh.arrow}>
            <Text style={sh.arrowText}>→</Text>
          </View>

          <View style={sh.previewCol}>
            <Text style={sh.previewLabel}>Après</Text>
            {stage === "processing" ? (
              <View style={[sh.previewImg, sh.previewPlaceholder]}>
                <ActivityIndicator color={C.gold} />
                <Text style={sh.processingText}>Traitement...</Text>
              </View>
            ) : stage === "done" && cleanedUri ? (
              <Image source={{ uri: cleanedUri }} style={sh.previewImg} resizeMode="cover" />
            ) : (
              <View style={[sh.previewImg, sh.previewPlaceholder]}>
                <Text style={sh.placeholderEmoji}>✨</Text>
                <Text style={sh.placeholderText}>Résultat ici</Text>
              </View>
            )}
          </View>
        </View>

        {/* Error */}
        {error && (
          <Text style={sh.errorText}>Traitement impossible. Veuillez choisir une autre image.</Text>
        )}

        {/* Actions */}
        <View style={sh.actions}>
          {stage === "preview" && (
            <>
              <TouchableOpacity style={sh.btnSecondary} onPress={onDiscard} activeOpacity={0.8}>
                <RefreshCw color={C.textSecondary} width={16} height={16} />
                <Text style={sh.btnSecondaryText}>Autre image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sh.btnPrimary} onPress={handleRemove} activeOpacity={0.8}>
                <Text style={sh.btnPrimaryText}>Supprimer la personne</Text>
              </TouchableOpacity>
            </>
          )}

          {stage === "processing" && (
            <View style={[sh.btnPrimary, { opacity: 0.6 }]}>
              <ActivityIndicator color="#000" size="small" />
              <Text style={sh.btnPrimaryText}>Traitement en cours...</Text>
            </View>
          )}

          {stage === "done" && !error && cleanedUri && (
            <>
              <TouchableOpacity style={sh.btnSecondary} onPress={onDiscard} activeOpacity={0.8}>
                <RefreshCw color={C.textSecondary} width={16} height={16} />
                <Text style={sh.btnSecondaryText}>Autre image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sh.btnPrimary} onPress={() => onAccept(cleanedUri)} activeOpacity={0.8}>
                <Check color="#000" width={16} height={16} />
                <Text style={sh.btnPrimaryText}>Utiliser ce résultat</Text>
              </TouchableOpacity>
            </>
          )}

          {stage === "done" && error && (
            <TouchableOpacity style={sh.btnSecondary} onPress={onDiscard} activeOpacity={0.8}>
              <RefreshCw color={C.textSecondary} width={16} height={16} />
              <Text style={sh.btnSecondaryText}>Choisir une autre image</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const PREVIEW_W = (width - S.screen * 2 - 32 - 28) / 2;

const sh = StyleSheet.create({
  backdrop:         { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:            { position: "absolute", bottom: 0, left: 0, right: 0,
                      backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                      paddingBottom: 36 },
  handle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
                      alignSelf: "center", marginTop: 10, marginBottom: 4 },

  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
                      paddingHorizontal: S.screen, paddingVertical: 16 },
  title:            { fontFamily: F.bold, fontSize: Sz.md, color: C.textPrimary },
  subtitle:         { fontFamily: F.regular, fontSize: Sz.sm, color: C.textMuted, marginTop: 2 },
  closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface,
                      alignItems: "center", justifyContent: "center" },

  previews:         { flexDirection: "row", alignItems: "center",
                      paddingHorizontal: S.screen, gap: 8, marginBottom: 20 },
  previewCol:       { flex: 1, gap: 8 },
  previewLabel:     { fontFamily: F.medium, fontSize: Sz.xs, color: C.textMuted, textAlign: "center" },
  previewImg:       { width: "100%", height: PREVIEW_W, borderRadius: 14, backgroundColor: C.surface },
  previewPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1.5,
                        borderStyle: "dashed", borderColor: C.border },
  processingText:   { fontFamily: F.medium, fontSize: 11, color: C.textMuted, marginTop: 8 },
  placeholderEmoji: { fontSize: 28, marginBottom: 6 },
  placeholderText:  { fontFamily: F.regular, fontSize: 11, color: C.textMuted },

  arrow:            { width: 28, alignItems: "center" },
  arrowText:        { fontSize: 20, color: C.gold, fontFamily: F.bold },

  errorText:        { fontFamily: F.medium, fontSize: Sz.sm, color: "#EF4444",
                      textAlign: "center", paddingHorizontal: S.screen, marginBottom: 12 },

  actions:          { flexDirection: "row", gap: 12, paddingHorizontal: S.screen },
  btnPrimary:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 8, backgroundColor: C.gold, borderRadius: 14, height: 50 },
  btnPrimaryText:   { fontFamily: F.bold, fontSize: Sz.base, color: "#000" },
  btnSecondary:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 8, backgroundColor: C.surface, borderRadius: 14, height: 50,
                      borderWidth: 1.5, borderColor: C.border },
  btnSecondaryText: { fontFamily: F.semibold, fontSize: Sz.base, color: C.textSecondary },
});
