import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icons from 'react-native-vector-icons/Ionicons';
import { useAuth } from './AuthContext';
import { Colors } from './components/UI';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import NoteViewScreen from './screens/NoteViewScreen';
import NoteCreateScreen from './screens/NoteCreateScreen';
import NoteEditScreen from './screens/NoteEditScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
  headerTitleAlign: 'center' as const,
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const icons: Record<string, string> = {
          Home: focused ? 'home' : 'home-outline',
          Calendar: focused ? 'calendar' : 'calendar-outline',
        };
        return <Icons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      headerShown: false,
      tabBarStyle: {
        borderTopColor: Colors.border,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
  </Tab.Navigator>
);

const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      drawerActiveTintColor: Colors.primary,
      drawerActiveBackgroundColor: Colors.primaryLight,
      drawerItemStyle: { borderRadius: 10 },
      drawerLabelStyle: { fontWeight: '600', fontSize: 18 },
    }}
  >
    <Drawer.Screen
      name="My Notes"
      component={TabNavigator}
      options={{
        drawerIcon: ({ color, size }) => <Icons name="document-text-outline" size={30} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icons name="person-outline" size={30} color={color} />,
      }}
    />
  </Drawer.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="NoteView" component={NoteViewScreen} options={{ title: 'Note' }} />
          <Stack.Screen name="NoteCreate" component={NoteCreateScreen} options={{ title: 'New Note' }} />
          <Stack.Screen name="NoteEdit" component={NoteEditScreen} options={{ title: 'Edit Note' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
