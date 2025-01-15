import { Injectable } from "@nestjs/common";
import { Resend } from 'resend'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt';


const resend = new Resend('re_RogfRF3F_MLaGM1P1axCfPqWW2ed1tiQN');

@Injectable()
export class MailsService {
  constructor() { }

  async resetPassword(userEmail: string) {
    try {
      const resetToken = jwt.sign(
        { email: userEmail },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const hash = await bcrypt.hash(resetToken, 12)
      const resetUrl = `https://jenno-client.vercel.app/resetpassword?token=${encodeURIComponent(hash)}`;


      const { data, error } = await resend.emails.send({
        from: 'Soporte Jenno <soporte@jenno.com.co>',
        to: userEmail,
        subject: 'Restablece tu contraseña',
        html: `
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace a continuación para continuar:</p>
          <a href="${resetUrl}">Restablecer contraseña</a>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <p>Atentamente,</p>
          <p>El equipo de Jenno</p>
        `
      })

      if (error) {
        console.error('Error enviando el correo:', error);
        throw new Error('No se pudo enviar el correo de restablecimiento.');
      }

      return { success: true, message: 'Correo de restablecimiento enviado.', data };
    } catch (error) {
      console.error('Error en ResetPassword:', error);
      throw new Error('No se pudo procesar la solicitud de restablecimiento de contraseña.');
    }
  }

  // async sendUserConfirmation(user: User) {
  //   const url = ``
  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: "Welcome to Nice App!",
  //     template: './welcome',
  //     context: {
  //       name: user.username,
  //       url,
  //     }
  //   })
  // }

  // async sendPasswordReset(user: User) {
  //   const resetUrl = `http://localhost:5173/reset-p/${user._id}`
  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: "Password Reset Request",
  //     template: 'reset-password',
  //     context: {
  //       name: user.username,
  //       resetUrl,
  //     }
  //   })
  // }
}
