import { Injectable } from "@nestjs/common";
import { Resend } from "resend";


@Injectable()
export class MailerService {
   private readonly resend = new Resend(process.env.RESEND_API_KEY);

    async sendOtpEmail(to: string[], otp: string) {
        await this.resend.emails.send({
            from: "noreply@resend.dev",
            to,
            subject: "Your OTP Code",
            html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
        });
    }
}