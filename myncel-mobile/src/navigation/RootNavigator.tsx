/**
 * Root navigator — switches between Auth (login) and App (tab navigator)
 * based on auth state.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '@/auth/AuthContext';
import { syncPushTokenWithBackend } from '@/utils/push';
import { colors, typography } from '@/theme';

import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import EquipmentListScreen from '@/screens/EquipmentListScreen';
import EquipmentDetailScreen from '@/screens/EquipmentDetailScreen';
import WorkOrdersListScreen from '@/screens/WorkOrdersListScreen';
import WorkOrderDetailScreen from '@/screens/WorkOrderDetailScreen';
import SchedulesScreen from '@/screens/SchedulesScreen';
import AlertsListScreen from '@/screens/AlertsListScreen';
import AlertDetailScreen from '@/screens/AlertDetailScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import HandbookListScreen from '@/screens/HandbookListScreen';
import HandbookChapterScreen from '@/screens/HandbookChapterScreen';

import {
  DashboardIcon,
  EquipmentIcon,
  WorkOrdersIcon,
  SchedulesIcon,
  AlertsIcon,
  ProfileIcon,
} from './icons';

import type {
  AppTabsParamList,
  EquipmentStackParamList,
  WorkOrdersStackParamList,
  AlertsStackParamList,
  ProfileStackParamList,
} from './types';

const Tabs = createBottomTabNavigator<AppTabsParamList>();
const EquipmentStack = createNativeStackNavigator<EquipmentStackParamList>();
const WorkOrdersStack = createNativeStackNavigator<WorkOrdersStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackHeader = {
  headerStyle: { backgroundColor: colors.bg },
  headerTitleStyle: {
    fontSize: typography.lg,
    fontWeight: typography.bold as '700',
    color: colors.text,
  },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
} as const;

function EquipmentNavigator() {
  return (
    <EquipmentStack.Navigator screenOptions={stackHeader}>
      <EquipmentStack.Screen
        name="EquipmentList"
        component={EquipmentListScreen}
        options={{ headerShown: false }}
      />
      <EquipmentStack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
    </EquipmentStack.Navigator>
  );
}

function WorkOrdersNavigator() {
  return (
    <WorkOrdersStack.Navigator screenOptions={stackHeader}>
      <WorkOrdersStack.Screen
        name="WorkOrdersList"
        component={WorkOrdersListScreen}
        options={{ headerShown: false }}
      />
      <WorkOrdersStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={({ route }) => ({ title: `WO #${route.params.number}` })}
      />
    </WorkOrdersStack.Navigator>
  );
}

function AlertsNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={stackHeader}>
      <AlertsStack.Screen
        name="AlertsList"
        component={AlertsListScreen}
        options={{ headerShown: false }}
      />
      <AlertsStack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ title: 'Alert' }}
      />
    </AlertsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackHeader}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="HandbookList"
        component={HandbookListScreen}
        options={{ title: 'Handbook' }}
      />
      <ProfileStack.Screen
        name="HandbookChapter"
        component={HandbookChapterScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </ProfileStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <DashboardIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Equipment"
        component={EquipmentNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <EquipmentIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="WorkOrders"
        component={WorkOrdersNavigator}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <WorkOrdersIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Schedules"
        component={SchedulesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <SchedulesIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Alerts"
        component={AlertsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <AlertsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Once authenticated, register push token with backend.
  useEffect(() => {
    if (isAuthenticated) {
      syncPushTokenWithBackend();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
