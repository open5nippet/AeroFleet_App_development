import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";

export default function Index() {
  const { driver, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator color={Colors.light.tint} size="large" />
      </View>
    );
  }

  if (driver) {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  return <Redirect href="/login" />;
}
