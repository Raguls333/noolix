import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

/**
 * Toggle email sending without code changes
 * MAIL_ENABLED=false → logs only
 */
const MAIL_ENABLED = process.env.MAIL_ENABLED === "true";

let transporter = null;

if (MAIL_ENABLED) {
 transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
}

/**
 * Internal helper – single place to send mails
 */
async function sendMail({ to, subject, html }) {
  if (!MAIL_ENABLED) {
    logger.info(
      { to, subject },
      "MAIL_DISABLED: email not sent (MAIL_ENABLED=false)"
    );
    return { ok: true, skipped: true };
  }

  try {
    console.log("Sending email to:", process.env.SMTP_USER, process.env.SMTP_PASS);
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `"NOOLIX" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    logger.info(
      { to, subject, messageId: info.messageId },
      "MAIL_SENT"
    );

    return { ok: true };
  } catch (error) {
    logger.error(
      { error, to, subject },
      "MAIL_FAILED"
    );
    throw error;
  }
}

/**
 * Approval email
 */
export async function sendApprovalEmail({ to, subject, approvalUrl }) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <p>Hello,</p>

      <p>
        Please review and approve the project scope using the link below.
      </p>

      <p style="margin: 20px 0;">
        <a href="${approvalUrl}"
           style="
             background:#111;
             color:#fff;
             padding:12px 18px;
             text-decoration:none;
             border-radius:4px;
             display:inline-block;
           ">
          Review & Approve Scope
        </a>
      </p>

      <p>
        If you need changes, you can request them from the same link.
      </p>

      <p>
        — NOOLIX
      </p>
    </div>
  `;

  return sendMail({ to, subject, html });
}

/**
 * Acceptance email
 */
export async function sendAcceptanceEmail({ to, subject, acceptanceUrl }) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <p>Hello,</p>

      <p>
        The work has been delivered. Please confirm acceptance using the link below.
      </p>

      <p style="margin: 20px 0;">
        <a href="${acceptanceUrl}"
           style="
             background:#0a7cff;
             color:#fff;
             padding:12px 18px;
             text-decoration:none;
             border-radius:4px;
             display:inline-block;
           ">
          Confirm Acceptance
        </a>
      </p>

      <p>
        — NOOLIX
      </p>
    </div>
  `;

  return sendMail({ to, subject, html });
}

/**
 * Invite team member email
 */
export async function sendInviteEmail({ to, name, tempPassword, invitedBy }) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <p>Hello ${name || ""},</p>

      <p>
        You have been invited to join the NOOLIX workspace by ${invitedBy || "a founder"}.
      </p>

      <p>
        Use the credentials below to sign in:
      </p>

      <p style="margin: 12px 0;">
        <strong>Email:</strong> ${to}<br />
        <strong>Temporary Password:</strong> ${tempPassword}
      </p>

      <p>
        After signing in, please update your password.
      </p>

      <p>
        Thanks,<br />
        NOOLIX
      </p>
    </div>
  `;

  return sendMail({ to, subject: "You're invited to NOOLIX", html });
}
