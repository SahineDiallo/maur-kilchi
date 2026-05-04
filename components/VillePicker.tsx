import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, Animated, Dimensions, TextInput,
} from "react-native";
import { MapPin, X, Search, Check } from "react-native-feather";
import { MAURITANIA_CITIES } from "@/constants/countries";
import { C, F, Sz, R, S, Border } from "@/constants/theme";

const { height } = Dimensions.get("window");
const SHEET_H = height * 0.65;

interface Props {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
  containerStyle?: any;
}

export default function VillePicker({ value, onChange, label = "Ville", placeholder = "Sélectionner une ville", containerStyle }: Props) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");

  const slideAnim   = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const show = () => {
    setOpen(true);
    setQuery("");
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 0,   tension: 68, friction: 11, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1,   duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: SHEET_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,        duration: 220, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const select = (city: string) => {
    onChange(city);
    hide();
  };

  const filtered = query.trim()
    ? MAURITANIA_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : MAURITANIA_CITIES;

  return (
    <>
      <View style={[{ marginBottom: 16 }, containerStyle]}>
        {!!label && <Text style={s.label}>{label}</Text>}
        <TouchableOpacity style={s.trigger} onPress={show} activeOpacity={0.8}>
          <MapPin color={value ? C.gold : C.textMuted} width={16} height={16} />
          <Text style={[s.triggerText, !value && s.placeholder]} numberOfLines={1} ellipsizeMode="tail">
            {value || placeholder}
          </Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={hide}>
        {/* Backdrop */}
        <Animated.View
          style={[s.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-only"
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={hide} activeOpacity={1} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Choisir une ville</Text>
            <TouchableOpacity style={s.closeBtn} onPress={hide} activeOpacity={0.7}>
              <X color={C.textPrimary} width={18} height={18} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchRow}>
            <Search color={C.textMuted} width={15} height={15} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher..."
              placeholderTextColor={C.textMuted}
              autoCorrect={false}
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.row}
                onPress={() => select(item)}
                activeOpacity={0.7}
              >
                <Text style={[s.cityText, item === value && s.cityTextActive]}>
                  {item}
                </Text>
                {item === value && (
                  <Check color={C.gold} width={16} height={16} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.sep} />}
          />
        </Animated.View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  label:       { fontFamily: F.medium, fontSize: Sz.sm, color: C.textSecondary, marginBottom: 6 },
  trigger:     { flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 10, ...Border.card },
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

  searchRow:   { flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: S.screen, marginBottom: 8,
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 14, height: 42, ...Border.card },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },

  row:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.screen, paddingVertical: 14 },
  cityText:     { fontFamily: F.regular, fontSize: Sz.base, color: C.textPrimary },
  cityTextActive:{ fontFamily: F.bold, color: C.gold },
  sep:          { height: 1, backgroundColor: C.border, marginHorizontal: S.screen },
});
