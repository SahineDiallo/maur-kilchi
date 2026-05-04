import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Home, Grid, Coffee, User, Truck } from "react-native-feather";
import { C, F, Sz } from "@/constants/theme";

const EXTRA = Platform.OS === "android" ? 8 : 0;
const TAB_H = 64;

export default function AppLayout() {
  return (
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
  );
}
