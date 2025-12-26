import * as nodemailer from "nodemailer";
import { APP_NAME } from "../app.config";
import { env, isDevelopmentEnv } from "../env";

type EmailTemplateOptions = {
  title: string;
  intro: string;
  actionText: string;
  actionUrl: string;
  footer: string;
  accentColor: string;
};

const formatSubject = (title: string) => `${APP_NAME} | ${title}`;

const renderEmailText = ({
  title,
  intro,
  actionText,
  actionUrl,
  footer,
}: EmailTemplateOptions) => `${APP_NAME}

${title}

${intro}

${actionText}: ${actionUrl}

${footer}
`;

const renderEmailTemplate = ({
  title,
  intro,
  actionText,
  actionUrl,
  footer,
  accentColor,
}: EmailTemplateOptions) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #444; margin-bottom: 20px;">${APP_NAME}</h1>
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h2 style="color: #444; margin-bottom: 20px;">${title}</h2>
        <p>${intro}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}"
             style="background-color: ${accentColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${actionText}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: ${accentColor}; font-size: 12px;">${actionUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">${footer}</p>
      </div>
    </body>
  </html>
`;

// Create reusable transporter
const createTransporter = () => {
  const smtpHost = env.SMTP_HOST;
  const smtpPort = env.SMTP_PORT;
  const smtpUser = env.SMTP_USER;
  const smtpPassword = env.SMTP_PASSWORD;
  const smtpFrom = env.SMTP_FROM;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
    console.warn("SMTP configuration is incomplete. Email verification will not work.");
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
};

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    console.error(
      "Cannot send verification email: SMTP not configured. Please set SMTP_* environment variables.",
    );
    // In development, log the verification URL instead
    console.log(`\n📧 Email Verification URL for ${email}:\n${verificationUrl}\n`);
    return;
  }

  const smtpFrom = env.SMTP_FROM;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: formatSubject("Verify your email address"),
      text: renderEmailText({
        title: "Verify Your Email",
        intro:
          "Thank you for signing up! Please verify your email address by clicking the link below:",
        actionText: "Verify Email",
        actionUrl: verificationUrl,
        footer:
          "If you didn't sign up for this account, you can safely ignore this email.",
        accentColor: "#007bff",
      }),
      html: renderEmailTemplate({
        title: "Verify Your Email",
        intro:
          "Thank you for signing up! Please verify your email address by clicking the button below:",
        actionText: "Verify Email",
        actionUrl: verificationUrl,
        footer:
          "If you didn't sign up for this account, you can safely ignore this email.",
        accentColor: "#007bff",
      }),
    });

    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // In development, log the URL as fallback
    if (isDevelopmentEnv()) {
      console.log(`\n📧 Email Verification URL for ${email}:\n${verificationUrl}\n`);
    }
    throw error;
  }
}

/**
 * Send magic link sign-in email
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    console.error(
      "Cannot send magic link email: SMTP not configured. Please set SMTP_* environment variables.",
    );
    // In development, log the magic link URL instead
    console.log(`\n🔑 Magic Link URL for ${email}:\n${magicLinkUrl}\n`);
    return;
  }

  const smtpFrom = env.SMTP_FROM;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: formatSubject("Sign in link"),
      text: renderEmailText({
        title: "Your Magic Link",
        intro:
          "Click the link below to sign in. This link will expire shortly for your security.",
        actionText: "Sign In",
        actionUrl: magicLinkUrl,
        footer: "If you didn't request this email, you can safely ignore it.",
        accentColor: "#0f766e",
      }),
      html: renderEmailTemplate({
        title: "Your Magic Link",
        intro:
          "Click the button below to sign in. This link will expire shortly for your security.",
        actionText: "Sign In",
        actionUrl: magicLinkUrl,
        footer: "If you didn't request this email, you can safely ignore it.",
        accentColor: "#0f766e",
      }),
    });

    console.log(`✅ Magic link email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    if (isDevelopmentEnv()) {
      console.log(`\n🔑 Magic Link URL for ${email}:\n${magicLinkUrl}\n`);
    }
    throw error;
  }
}

/**
 * Send reset password email
 */
export async function sendResetPasswordEmail(
  email: string,
  resetPasswordUrl: string,
): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    console.error(
      "Cannot send reset password email: SMTP not configured. Please set SMTP_* environment variables.",
    );
    // In development, log the reset password URL instead
    console.log(`\n🔒 Reset Password URL for ${email}:\n${resetPasswordUrl}\n`);
    return;
  }

  const smtpFrom = env.SMTP_FROM;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: formatSubject("Reset your password"),
      text: renderEmailText({
        title: "Reset Your Password",
        intro:
          "We received a request to reset your password. Click the link below to continue.",
        actionText: "Reset Password",
        actionUrl: resetPasswordUrl,
        footer: "If you didn't request a password reset, you can safely ignore this email.",
        accentColor: "#dc2626",
      }),
      html: renderEmailTemplate({
        title: "Reset Your Password",
        intro:
          "We received a request to reset your password. Click the button below to continue.",
        actionText: "Reset Password",
        actionUrl: resetPasswordUrl,
        footer: "If you didn't request a password reset, you can safely ignore this email.",
        accentColor: "#dc2626",
      }),
    });

    console.log(`✅ Reset password email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send reset password email:", error);
    if (isDevelopmentEnv()) {
      console.log(`\n🔒 Reset Password URL for ${email}:\n${resetPasswordUrl}\n`);
    }
    throw error;
  }
}
