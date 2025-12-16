import * as nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn("SMTP configuration is incomplete. Email verification will not work.");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: Number.parseInt(smtpPort, 10),
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

  const smtpFrom = process.env.SMTP_FROM || "noreply@yourapp.com";

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
              <h1 style="color: #444; margin-bottom: 20px;">Verify Your Email</h1>
              <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verify Email
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff; font-size: 12px;">${verificationUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't sign up for this account, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // In development, log the URL as fallback
    if (process.env.NODE_ENV === "development") {
      console.log(`\n📧 Email Verification URL for ${email}:\n${verificationUrl}\n`);
    }
    throw error;
  }
}
