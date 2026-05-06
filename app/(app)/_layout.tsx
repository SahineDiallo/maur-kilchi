import { Tabs } from "expo-router";
import { Platform, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Home, Grid, Coffee, User, Truck } from "react-native-feather";
import { C, F, Sz } from "@/constants/theme";
import React, { useEffect } from "react";
import * as Location from "expo-location";

// ── Error boundary — catches render crashes in any tab screen ─────────────────
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    console.error("[TabErrorBoundary] caught render error:", error.message, error.stack);
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[TabErrorBoundary] componentDidCatch:", error.message, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "red", marginBottom: 12 }}>
            💥 Crash dans cet écran
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>
              {(error as Error).message}
            </Text>
            <Text style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
              {(error as Error).stack?.slice(0, 800)}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={() => this.setState({ error: null })}
            style={{ marginTop: 20, backgroundColor: "#F8AC12", padding: 12, borderRadius: 10, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "bold", color: "#000" }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const EXTRA = Platform.OS === "android" ? 8 : 0;
const TAB_H = 64;

export default function AppLayout() {
  // Ask for location permission as soon as the user enters the app —
  // before they ever tap Livraison, so the map is ready when they get there.
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  return (
    <TabErrorBoundary>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.gold,
        tabBarInactiveTintColor: "rgba(0,0,0,0.35)",
        tabBarStyle: {
          position: "absolute",
          bottom: 0 + EXTRA,
          left: 0,
          right: 0,
          height: TAB_H,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 10,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontFamily: F.medium,
          fontSize: Sz.xs,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} width={size} height={size} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="boutiques"
        options={{
          tabBarLabel: "Restaurants",
          tabBarIcon: ({ color, size }) => (
            <Coffee color={color} width={size} height={size} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="index.lemon"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="livraison"
        options={{
          tabBarLabel: "Livraison",
          tabBarIcon: ({ color, size }) => (
            <Truck color={color} width={size} height={size} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: "Explorer",
          tabBarIcon: ({ color, size }) => (
            <Grid color={color} width={size} height={size} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Compte",
          tabBarIcon: ({ color, size }) => (
            <User color={color} width={size} height={size} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
    </TabErrorBoundary>
  );
}
