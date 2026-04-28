import React, { useState, createContext, useContext, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import HomeScreen from "./screens/HomeScreen";
import UploadScreen from "./screens/UploadScreen";
import GoalTrackerScreen from "./screens/GoalTrackerScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen";

const API_URL = "http://localhost:5000/api";
export const AuthContext = createContext(null);

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export { api };

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
        }
      } catch {
        await AsyncStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    await AsyncStorage.setItem("access_token", res.data.access_token);
    await AsyncStorage.setItem("refresh_token", res.data.refresh_token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
  };

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const icons = {
                Home: focused ? "home" : "home-outline",
                Upload: focused ? "camera" : "camera-outline",
                Goals: focused ? "flag" : "flag-outline",
                Chat: focused ? "chatbubble" : "chatbubble-outline",
                Profile: focused ? "person" : "person-outline",
              };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: "#22c55e",
            tabBarInactiveTintColor: "#9ca3af",
            headerShown: false,
            tabBarStyle: { paddingBottom: 4 },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Upload" component={UploadScreen} />
          <Tab.Screen name="Goals" component={GoalTrackerScreen} />
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
