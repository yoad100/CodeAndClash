import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isSmtpConfigured = false;
  private isSendGridConfigured = false;
  private emailProvider: 'sendgrid' | 'smtp' | 'console' = 'console';

  constructor() {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    try {
      // Initialize SendGrid if API key is available
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        // Uncomment for EU data residency if needed
        // sgMail.setDataResidency('eu');
        
        this.isSendGridConfigured = true;
        this.emailProvider = 'sendgrid';
        console.log('📧 SendGrid email service initialized successfully');
      }
      // Fallback to SMTP if SendGrid not available
      else {
        const emailConfig = this.getSmtpConfig();
        
        if (emailConfig) {
          this.transporter = nodemailer.createTransport(emailConfig);
          this.isSmtpConfigured = true;
          this.emailProvider = 'smtp';
          console.log('📧 SMTP email service initialized successfully');
        }
      }

      // Override provider if explicitly set
      const providerOverride = process.env.EMAIL_PROVIDER;
      if (providerOverride === 'sendgrid' && this.isSendGridConfigured) {
        this.emailProvider = 'sendgrid';
      } else if (providerOverride === 'smtp' && this.isSmtpConfigured) {
        this.emailProvider = 'smtp';
      }

      if (!this.isSendGridConfigured && !this.isSmtpConfigured) {
        console.warn('⚠️ No email service configured - using console logging for development');
        this.emailProvider = 'console';
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.emailProvider = 'console';
    }
  }

  private getSmtpConfig(): EmailConfig | null {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_SECURE,
      EMAIL_USER,
      EMAIL_PASS
    } = process.env;

    // Return null if essential config is missing
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      return null;
    }

    return {
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT || '587'),
      secure: EMAIL_SECURE === 'true',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    };
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/verify-email?token=${token}`;
    
    if (this.emailProvider === 'sendgrid') {
      await this.sendWithSendGrid(
        email,
        '🎯 Verify Your Email - CodeAndClash',
        this.getVerificationEmailTemplate(username, verificationUrl),
        `Hi ${username}!\n\nWelcome to CodeAndClash! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe CodeAndClash Team`
      );
    } else if (this.emailProvider === 'smtp') {
      await this.sendWithSMTP(
        email,
        '🎯 Verify Your Email - CodeAndClash',
        this.getVerificationEmailTemplate(username, verificationUrl),
        `Hi ${username}!\n\nWelcome to CodeAndClash! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe CodeAndClash Team`
      );
    } else {
      // Development mode - log email content
      console.log('\n📧 === EMAIL VERIFICATION (DEVELOPMENT MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: 🎯 Verify Your Email - CodeAndClash`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('================================================\n');
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    if (this.emailProvider === 'sendgrid') {
      await this.sendWithSendGrid(
        email,
        '🚀 Welcome to CodeAndClash!',
        this.getWelcomeEmailTemplate(username),
        `Hi ${username}!\n\nWelcome to CodeAndClash! Your email has been verified successfully.\n\nYou're now ready to start coding battles and climb the leaderboard!\n\nGood luck and happy coding!\n\nThe CodeAndClash Team`
      );
    } else if (this.emailProvider === 'smtp') {
      await this.sendWithSMTP(
        email,
        '🚀 Welcome to CodeAndClash!',
        this.getWelcomeEmailTemplate(username),
        `Hi ${username}!\n\nWelcome to CodeAndClash! Your email has been verified successfully.\n\nYou're now ready to start coding battles and climb the leaderboard!\n\nGood luck and happy coding!\n\nThe CodeAndClash Team`
      );
    } else {
      console.log('\n📧 === WELCOME EMAIL (DEVELOPMENT MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: 🚀 Welcome to CodeAndClash!`);
      console.log('==========================================\n');
    }
  }

  private async sendWithSendGrid(to: string, subject: string, html: string, text: string): Promise<void> {
    try {
      const msg = {
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@codeandclash.app',
          name: process.env.SENDGRID_FROM_NAME || 'CodeAndClash'
        },
        subject,
        text,
        html,
      };

      await sgMail.send(msg);
      console.log('✅ SendGrid email sent successfully');
    } catch (error) {
      console.error('❌ Failed to send email via SendGrid:', error);
      throw new Error('Failed to send email via SendGrid');
    }
  }

  private async sendWithSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.isSmtpConfigured || !this.transporter) {
      throw new Error('SMTP not configured');
    }

    try {
      const mailOptions = {
        from: `"${process.env.SENDGRID_FROM_NAME || 'CodeAndClash'}" <${process.env.EMAIL_USER || 'noreply@codeandclash.app'}>`,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ SMTP email sent successfully:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error);
      throw new Error('Failed to send email via SMTP');
    }
  }

  private getVerificationEmailTemplate(username: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - CodeAndClash</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">⚔️ CodeAndClash</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to CodeAndClash, ${username}! 🎉</h2>
          
          <p>Thanks for joining our coding battle platform! To get started, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace;">
            ${verificationUrl}
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            ⏰ This verification link will expire in 24 hours for security reasons.
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Best regards,<br>The CodeAndClash Team</p>
          <p>Ready to battle? Let's code! 🚀</p>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CodeAndClash!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">⚔️ CodeAndClash</h1>
        </div>
        
        <div style="background: #f0fdf4; padding: 30px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #22c55e;">
          <h2 style="color: #1f2937; margin-top: 0;">Email Verified Successfully! ✅</h2>
          
          <p>Congratulations, ${username}! Your email has been verified and your account is now fully activated.</p>
          
          <h3 style="color: #4f46e5;">What's Next? 🚀</h3>
          <ul style="color: #374151;">
            <li>🎯 Challenge other developers to coding battles</li>
            <li>📈 Climb the leaderboard and improve your rating</li>
            <li>💡 Solve challenging programming problems</li>
            <li>🏆 Compete in tournaments and win prizes</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}" 
               style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Start Coding Battles
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Happy coding and good luck in your battles!</p>
          <p>The CodeAndClash Team 💻⚔️</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();