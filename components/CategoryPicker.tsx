import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, ScrollView, Animated, Dimensions, ActivityIndicator,
} from "react-native";
import { Tag, X, ChevronLeft } from "react-native-feather";
import api from "@/lib/api";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const { height } = Dimensions.get("window");
const SHEET_H = height * 0.70;

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  product_count: number;
}

interface ParentCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  boutique_types: string[];
  subcategories: SubCategory[];
}

interface Props {
  boutiqueType: string;
  value: number | null;
  label: string | null;
  onChange: (id: number, name: string) => void;
  fieldLabel?: string;
}

export default function CategoryPicker({
  boutiqueType,
  value,
  label,
  onChange,
  fieldLabel = "Catégorie",
}: Props) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<ParentCategory | null>(null);

  const slideAnim    = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ParentCategory[]>(
        `/categories/?boutique_type=${encodeURIComponent(boutiqueType)}`
      );
      setCategories(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }, [boutiqueType]);

  const show = () => {
    setOpen(true);
    setSelectedParent(null);
    fetchCategories();
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 0, tension: 68, friction: 11, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: SHEET_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,        duration: 220, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const selectParent = (cat: ParentCategory) => {
    if (!cat.subcategories || cat.subcategories.length === 0) {
      onChange(cat.id, cat.name);
      hide();
    } else {
      setSelectedParent(cat);
    }
  };

  const selectSub = (sub: SubCategory) => {
    onChange(sub.id, sub.name);
    hide();
  };

  const placeholder = "Sélectionner une catégorie";

  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <Text style={s.label}>{fieldLabel}</Text>
        <TouchableOpacity style={s.trigger} onPress={show} activeOpacity={0.8}>
          <Tag color={value ? C.gold : C.textMuted} width={16} height={16} />
          <Text style={[s.triggerText, !value && s.placeholder]}>
            {label || placeholder}
          </Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={hide}>
        {/* Backdrop */}
        <Animated.View style={[s.backdrop, { opacity: backdropAnim }]} pointerEvents="box-only">
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={hide} activeOpacity={1} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            {selectedParent ? (
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => setSelectedParent(null)}
                activeOpacity={0.7}
              >
                <ChevronLeft color={C.textPrimary} width={18} height={18} />
                <Text style={s.backText}>Retour</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.headerTitle}>Choisir une catégorie</Text>
            )}
            <TouchableOpacity style={s.closeBtn} onPress={hide} activeOpacity={0.7}>
              <X color={C.textPrimary} width={18} height={18} />
            </TouchableOpacity>
          </View>

          {/* Sub-header when drilling in */}
          {selectedParent && (
            <View style={s.parentLabel}>
              <Text style={s.parentLabelText}>
                {selectedParent.icon}{"  "}{selectedParent.name}
              </Text>
            </View>
          )}

          {/* Content */}
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator color={C.gold} size="large" />
              <Text style={s.loadingText}>Chargement...</Text>
            </View>
          ) : error ? (
            <View style={s.center}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={fetchCategories} activeOpacity={0.8}>
                <Text style={s.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : selectedParent ? (
            /* Level 2: subcategory list */
            <FlatList
              data={selectedParent.subcategories}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = value === item.id;
                return (
                  <TouchableOpacity
                    style={[s.subRow, isSelected && s.subRowSelected]}
                    onPress={() => selectSub(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.subName, isSelected && s.subNameSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <View style={s.selectedDot} />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={s.sep} />}
            />
          ) : (
            /* Level 1: parent grid — manual 2-col to avoid numColumns FlatList error */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
              {Array.from({ length: Math.ceil(categories.length / 2) }).map((_, rowIdx) => {
                const left  = categories[rowIdx * 2];
                const right = categories[rowIdx * 2 + 1];
                return (
                  <View key={rowIdx} style={s.gridRow}>
                    {[left, right].map((item, colIdx) => {
                      if (!item) return <View key={colIdx} style={s.gridCell} />;
                      const isSelected = value === item.id ||
                        item.subcategories?.some((sub: any) => sub.id === value);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[s.gridCell, isSelected && s.gridCellSelected]}
                          onPress={() => selectParent(item)}
                          activeOpacity={0.75}
                        >
                          <Text style={s.cellIcon}>{item.icon}</Text>
                          <Text style={[s.cellName, isSelected && s.cellNameSelected]} numberOfLines={2}>
                            {item.name}
                          </Text>
                          {item.subcategories?.length > 0 && (
                            <Text style={s.cellChevron}>›</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  label:       { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary, marginBottom: 6 },
  trigger:     { flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 13, ...Border.card },
  triggerText: { flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },
  placeholder: { color: C.textMuted },
  chevron:     { fontSize: 20, color: C.textMuted, lineHeight: 22 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden",
  },

  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14 },
  headerTitle: { fontFamily: F.bold, fontSize: Sz.lg, color: C.textPrimary },
  closeBtn:    { width: 32, height: 32, borderRadius: R.full, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center" },
  backBtn:     { flexDirection: "row", alignItems: "center", gap: 4 },
  backText:    { fontFamily: F.medium, fontSize: Sz.base, color: C.textPrimary },

  parentLabel:    { paddingHorizontal: S.screen, paddingBottom: 12 },
  parentLabelText:{ fontFamily: F.bold, fontSize: Sz.md, color: C.textPrimary },

  center:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: S.screen },
  loadingText: { fontFamily: F.regular, fontSize: Sz.base, color: C.textMuted, marginTop: 8 },
  errorText:   { fontFamily: F.regular, fontSize: Sz.base, color: C.error, textAlign: "center" },
  retryBtn:    { backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: R.full },
  retryText:   { fontFamily: F.bold, fontSize: Sz.sm, color: "#fff" },

  // Grid (level 1)
  grid:        { padding: S.screen, gap: 10 },
  gridRow:     { flexDirection: "row", gap: 10, marginBottom: 0 },
  gridCell:    { flex: 1, alignItems: "center", backgroundColor: C.surface,
    borderRadius: R.lg, padding: 14, gap: 6, ...Border.card, minHeight: 90 },
  gridCellSelected: { borderColor: C.gold, backgroundColor: C.goldLight },
  cellIcon:    { fontSize: 26 },
  cellName:    { fontFamily: F.medium, fontSize: Sz.sm, color: C.textPrimary,
    textAlign: "center", lineHeight: 16 },
  cellNameSelected: { fontFamily: F.bold, color: C.goldDark },
  cellChevron: { fontSize: 14, color: C.textMuted, marginTop: 2 },

  // List (level 2)
  subRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 15 },
  subRowSelected: { backgroundColor: C.goldLight },
  subName:        { fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },
  subNameSelected:{ fontFamily: F.bold, color: C.goldDark },
  selectedDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  sep:            { height: 1, backgroundColor: C.border, marginHorizontal: S.screen },
});
