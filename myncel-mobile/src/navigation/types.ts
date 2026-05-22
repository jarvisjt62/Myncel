/**
 * Strongly-typed navigation parameter lists for each navigator.
 * Use these in screen components for type-safe navigation.
 */

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type EquipmentStackParamList = {
  EquipmentList: undefined;
  EquipmentDetail: { id: string; name: string };
};

export type WorkOrdersStackParamList = {
  WorkOrdersList: undefined;
  WorkOrderDetail: { id: string; number: string };
};

export type AlertsStackParamList = {
  AlertsList: undefined;
  AlertDetail: { id: string };
};

export type HandbookStackParamList = {
  HandbookList: undefined;
  HandbookChapter: { slug: string; title: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Handbook: undefined;
  HandbookList: undefined;
  HandbookChapter: { slug: string; title: string };
};

export type AppTabsParamList = {
  Dashboard: undefined;
  Equipment: undefined;
  WorkOrders: undefined;
  Schedules: undefined;
  Alerts: undefined;
  Profile: undefined;
};
