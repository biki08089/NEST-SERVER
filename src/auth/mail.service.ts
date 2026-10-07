import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendOtpEmail(to: string, otp: string): Promise<void> {
        // 1. Always log the OTP to the console so you can test immediately in development!
        this.logger.log(`\n========================================\n📩 OTP for ${to}: [ ${otp} ] (Valid for 5 mins)\n========================================\n`);

        // 2. If you provide real Gmail credentials in .env, it will also send the real email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await this.transporter.sendMail({
                    from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
                    to,
                    subject: 'Your LMS Verification OTP',
                    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>LMS Verification Code</h2>
              <p>Your one-time verification code (OTP) is:</p>
              <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
              <p>This code will expire in 5 minutes.</p>
            </div>
          `,
                });
                this.logger.log(`Real email delivered to ${to}`);
            } catch (error: any) {
                this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            }
        }
    }
}
