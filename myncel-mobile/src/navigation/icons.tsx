/**
 * Tab bar icons rendered with vector primitives so we don't depend on
 * an icon library and don't have to ship icon fonts.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = { color: string; size?: number };

const Icon: React.FC<{ d: string; color: string; size: number; strokeWidth?: number }> = ({
  d,
  color,
  size,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DashboardIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
  />
);

export const EquipmentIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
);

export const WorkOrdersIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  />
);

export const SchedulesIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);

export const AlertsIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
  />
);

export const ProfileIcon: React.FC<Props> = ({ color, size = 24 }) => (
  <Icon
    color={color}
    size={size}
    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  />
);

export const Spacer = () => <View style={styles.spacer} />;
const styles = StyleSheet.create({ spacer: { height: 1 } });
