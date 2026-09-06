import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2c7a4b" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Новини",
          headerTitle: "Новини за Поликраище",
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Общност",
          headerTitle: "Общността",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
