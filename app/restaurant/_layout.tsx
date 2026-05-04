import { Stack } from "expo-router";

export default function RestaurantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F4F4F4" },
      }}
    />
  );
}
