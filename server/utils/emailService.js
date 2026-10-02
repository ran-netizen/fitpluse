const nodemailer = require('nodemailer');

/**
 * Generate a clean 6-digit numeric OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Dispatch verification email with 6-digit code
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} name 
 */
const sendVerificationEmail = async (toEmail, otp, name = 'Athlete') => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log(`\n========================================================`);
  console.log(`[FITPULSE OTP DISPATCH]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`Verification Code: >>> ${otp} <<< (Valid for 10 minutes)`);
  console.log(`========================================================\n`);

  if (!emailUser || !emailPass) {
    console.log(`[EMAIL INFO] EMAIL_USER or EMAIL_PASS not configured in .env.`);
    console.log(`[EMAIL INFO] The 6-digit code "${otp}" is printed above for local verification.`);
    return { sent: false, mode: 'console', otp };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"FitPulse PRO" <${emailUser}>`,
      to: toEmail,
      subject: `Your FitPulse PRO Verification Code: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #022c22; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">FitPulse PRO</h1>
            <p style="margin: 6px 0 0 0; color: #064e3b; font-size: 13px; font-weight: 600;">Fitness & Workout Logger</p>
          </div>
          <div style="padding: 32px 28px;">
            <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 18px; font-weight: 700;">Welcome, ${name}!</h2>
            <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Thank you for registering with FitPulse PRO. Use the following 6-digit verification code to confirm your email address and activate your account:
            </p>
            <div style="background-color: #020617; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace, Courier; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #34d399;">
                ${otp}
              </span>
              <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">This code will expire in 10 minutes</p>
            </div>
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
              If you didn't create an account with FitPulse PRO, you can safely ignore this email.
            </p>
          </div>
          <div style="border-top: 1px solid #1e293b; padding: 16px 28px; text-align: center; background-color: #090d16;">
            <p style="margin: 0; color: #475569; font-size: 11px;">
              FitPulse PRO &bull; Academic MERN Fitness & Workout Logger &bull; Secure Account Activation
            </p>
          </div>
        </div>
      `,
      text: `Welcome to FitPulse PRO, ${name}!\n\nYour 6-digit verification code is: ${otp}\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Message sent via Nodemailer to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, mode: 'smtp', messageId: info.messageId, otp };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email via Nodemailer:`, error.message);
    console.log(`[EMAIL FALLBACK] Use console OTP for verification: ${otp}`);
    return { sent: false, error: error.message, mode: 'error_fallback', otp };
  }
};

module.exports = {
  generateOtp,
  sendVerificationEmail
};
