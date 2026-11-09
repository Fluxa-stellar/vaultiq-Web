export type AlertSeverity = "info" | "warning" | "critical" | "success";

export interface TelegramChannelInfo {
  configured: boolean;
  targetChat?: string;
  botUsername?: string;
}

export interface InAppChannelInfo {
  active: boolean;
}

export interface NotificationStatusData {
  telegram: TelegramChannelInfo;
  inApp: InAppChannelInfo;
}

export interface NotificationStatusResponse {
  message: string;
  data: NotificationStatusData;
}

export interface TestTelegramResponse {
  success: boolean;
  message: string;
}

export interface SendCustomAlertDto {
  title: string;
  message: string;
  severity?: AlertSeverity;
  treasuryId?: string;
}

export interface SendCustomAlertResponse {
  success: boolean;
  message: string;
}

export interface AlertFlowConfig {
  key: "disbursement" | "security" | "threshold" | "approval";
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  severity: AlertSeverity;
  badge: string;
}

