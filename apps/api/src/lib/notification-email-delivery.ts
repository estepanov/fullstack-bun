import { eq } from "drizzle-orm";
import escapeHtml from "escape-html";
import * as nodemailer from "nodemailer";
import { NotificationType } from "shared/interfaces/notification";
import type { Notification } from "shared/interfaces/notification";
import { APP_NAME } from "../app.config";
import { db } from "../db/client";
import { notificationPreferences, user as userTable } from "../db/schema";
import { env, isDevelopmentEnv } from "../env";
import { appLogger } from "../utils/logger";
import type { NotificationDeliveryStrategy } from "./notification-delivery-strategy";
/**
 * Email delivery strategy for offline users
 * Sends email notifications when users are not online to receive WebSocket messages
 */
export class EmailDeliveryStrategy implements NotificationDeliveryStrategy {
  readonly name = "email";

  constructor(private isUserOnlineFn: (userId: string) => boolean) {}

  /**
   * Check if email can be delivered to this user
   * - User must be offline (not connected via WebSocket)
   * - User must have email enabled in preferences
   * - Notification type must be in user's emailTypes list
   */
  async canDeliver(userId: string): Promise<boolean> {
    // Only send email if user is offline
    if (this.isUserOnlineFn(userId)) {
      return false;
    }

    try {
      // Check user's email preferences
      const prefs = await db
        .select({
          emailEnabled: notificationPreferences.emailEnabled,
        })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1)
        .then((rows) => rows[0]);

      // If no preferences exist, email is enabled by default
      if (!prefs) {
        return true;
      }

      return prefs.emailEnabled;
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to check email delivery preferences");
      return false;
    }
  }

  /**
   * Deliver notification via email
   */
  async deliver(notification: Notification): Promise<void> {
    try {
      // Get user email and preferences
      const userData = await db
        .select({
          email: userTable.email,
          name: userTable.name,
        })
        .from(userTable)
        .where(eq(userTable.id, notification.userId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!userData?.email) {
        appLogger.warn(
          { userId: notification.userId },
          "Cannot send notification email: user email not found",
        );
        return;
      }

      // Check if notification type should trigger email
      const shouldSendEmail = await this.shouldSendEmailForType(
        notification.userId,
        notification.type,
      );

      if (!shouldSendEmail) {
        appLogger.debug(
          { userId: notification.userId, type: notification.type },
          "Skipping email notification: type not enabled in preferences",
        );
        return;
      }

      // Send the email
      await this.sendNotificationEmail(userData.email, userData.name, notification);

      appLogger.info(
        { userId: notification.userId, notificationId: notification.id },
        "Email notification sent successfully",
      );
    } catch (error) {
      appLogger.error(
        { error, notificationId: notification.id, userId: notification.userId },
        "Failed to deliver email notification",
      );
      // Don't throw - email delivery failure shouldn't break notification creation
    }
  }

  /**
   * Check if notification type should trigger email based on user preferences
   */
  private async shouldSendEmailForType(
    userId: string,
    notificationType: NotificationType,
  ): Promise<boolean> {
    try {
      const prefs = await db
        .select({
          emailTypes: notificationPreferences.emailTypes,
        })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1)
        .then((rows) => rows[0]);

      // If no preferences, check against default email types
      if (!prefs) {
        // Default types from config
        const defaultEmailTypes: NotificationType[] = [
          NotificationType.FRIEND_REQUEST,
          NotificationType.MENTION,
          NotificationType.ANNOUNCEMENT,
          NotificationType.WARNING,
        ];
        return defaultEmailTypes.includes(notificationType);
      }

      // Parse stored JSON array
      const emailTypes = JSON.parse(prefs.emailTypes) as NotificationType[];
      return emailTypes.includes(notificationType);
    } catch (error) {
      appLogger.error(
        { error, userId, notificationType },
        "Failed to check email type preferences",
      );
      // Default to true on error to ensure important notifications are delivered
      return true;
    }
  }

  /**
   * Send notification email using existing email infrastructure
   */
  private async sendNotificationEmail(
    email: string,
    name: string,
    notification: Notification,
  ): Promise<void> {
    const transporter = this.createTransporter();

    if (!transporter) {
      if (isDevelopmentEnv()) {
        appLogger.info(
          { email, notification },
          "Would send notification email (SMTP not configured)",
        );
      }
      return;
    }

    const smtpFrom = env.SMTP_FROM;
    const notificationUrl = `${env.FE_BASE_URL}/notifications`;
    const notificationPreferencesUrl = `${env.FE_BASE_URL}/dashboard`;

    // Get accent color based on notification type
    const accentColor = this.getAccentColorForType(notification.type);

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: this.formatSubject(notification.title),
        text: this.renderEmailText({
          name,
          title: notification.title,
          content: notification.content,
          notificationUrl,
          notificationPreferencesUrl,
        }),
        html: this.renderEmailTemplate({
          name,
          title: notification.title,
          content: notification.content,
          notificationUrl,
          accentColor,
          notificationPreferencesUrl,
        }),
      });

      appLogger.debug(
        { email, notificationId: notification.id },
        "Notification email sent",
      );
    } catch (error) {
      appLogger.error(
        { error, email, notificationId: notification.id },
        "Failed to send email",
      );
      throw error;
    }
  }

  /**
   * Create nodemailer transporter
   */
  private createTransporter() {
    const smtpHost = env.SMTP_HOST;
    const smtpPort = env.SMTP_PORT;
    const smtpUser = env.SMTP_USER;
    const smtpPassword = env.SMTP_PASSWORD;
    const smtpFrom = env.SMTP_FROM;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
      return null;
    }

    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // Use TLS
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * Format email subject
   */
  private formatSubject(title: string): string {
    const sanitizedTitle = this.sanitizeHeaderComponent(title);
    return `${escapeHtml(APP_NAME)} | ${escapeHtml(sanitizedTitle)}`;
  }

  private sanitizeHeaderComponent(value: string): string {
    return value.replace(/\r?\n/g, " ").trim();
  }

  /**
   * Render plain text email
   */
  private renderEmailText({
    name,
    title,
    content,
    notificationUrl,
    notificationPreferencesUrl,
  }: {
    name: string;
    title: string;
    content: string;
    notificationUrl: string;
    notificationPreferencesUrl: string;
  }): string {
    return `${escapeHtml(APP_NAME)}

Hi ${escapeHtml(name)},

${escapeHtml(title)}

${escapeHtml(content)}

View all notifications: ${notificationUrl}

---
This is an automated notification. If you prefer not to receive these emails, you can adjust your notification preferences in your account settings: ${notificationPreferencesUrl}
`;
  }

  /**
   * Render HTML email template
   */
  private renderEmailTemplate({
    name,
    title,
    content,
    notificationUrl,
    notificationPreferencesUrl,
    accentColor,
  }: {
    name: string;
    title: string;
    content: string;
    notificationUrl: string;
    notificationPreferencesUrl: string;
    accentColor: string;
  }): string {
    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #444; margin-bottom: 20px;">${escapeHtml(APP_NAME)}</h1>
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <p style="color: #666; margin-bottom: 10px;">Hi ${escapeHtml(name)},</p>
        <h2 style="color: #444; margin-bottom: 20px;">${escapeHtml(title)}</h2>
        <p style="margin-bottom: 20px;">${escapeHtml(content)}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(notificationUrl)}"
             style="background-color: ${escapeHtml(accentColor)}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Notifications
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: ${escapeHtml(accentColor)}; font-size: 12px;"><a href="${escapeHtml(notificationUrl)}">${escapeHtml(notificationUrl)}</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated notification. If you prefer not to receive these emails,
          you can adjust your notification preferences in your <a style="word-break: break-all; color: ${escapeHtml(accentColor)}; font-size: 12px;" href="${escapeHtml(notificationPreferencesUrl)}">account settings</a>.
        </p>
      </div>
    </body>
  </html>
`;
  }

  /**
   * Get accent color based on notification type
   */
  private getAccentColorForType(type: NotificationType): string {
    const colorMap: Record<NotificationType, string> = {
      system: "#6b7280", // gray
      message: "#0f766e", // teal
      friend_request: "#7c3aed", // purple
      mention: "#0ea5e9", // sky blue
      announcement: "#2563eb", // blue
      warning: "#f59e0b", // amber
      success: "#10b981", // green
      info: "#3b82f6", // blue
    };

    return colorMap[type] || "#6b7280";
  }
}
