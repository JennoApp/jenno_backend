import { Injectable } from "@nestjs/common";
import { MailerService } from '@nestjs-modules/mailer'
import { User } from "src/users/interfaces/User";

@Injectable()
export class MailsService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User) {
    const url = ``
    await this.mailerService.sendMail({
      to: user.email,
      subject: "Welcome to Nice App!",
      template: './welcome',
      context: {
        name: user.username,
        url,
      }
    })
  }

  async sendPasswordReset(user: User) {
    const resetUrl = `http://localhost:5173/reset-p/${user._id}`
    await this.mailerService.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      template: 'reset-password',
      context: {
        name: user.username,
        resetUrl,
      }
    })
  }
}
