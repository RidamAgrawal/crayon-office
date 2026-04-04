import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env["GMAIL_USER"],
                pass: process.env["GMAIL_APP_PASS"],
            },
        });
    }
    return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
    await getTransporter().sendMail({
        from: process.env["GMAIL_USER"],
        to,
        subject: "Your verification code",
        html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #172b4d; margin: 0 0 8px;">Your verification code</h2>
        <p style="color: #6b778c; margin: 0 0 24px;">Enter this code to complete your account setup:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0c66e4; padding: 16px; background: #f4f5f7; border-radius: 4px; text-align: center;">${code}</div>
        <p style="color: #6b778c; font-size: 13px; margin: 24px 0 0;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
    });
}