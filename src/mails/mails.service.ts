import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Resend } from 'resend'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service'


const resend = new Resend('re_RogfRF3F_MLaGM1P1axCfPqWW2ed1tiQN');

@Injectable()
export class MailsService {
  constructor(
   private readonly usersService: UsersService
  ) { }

  async resetPassword(userEmail: string) {
    try {
      const resetToken = jwt.sign(
        { email: userEmail },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const resetUrl = `https://jenno-client.vercel.app/resetpassword?token=${resetToken}`;

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


  async updatePassword(token: string, newPassword: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET)
      const email = decoded.email

      // Obtener el usuario por email
      const user = await this.usersService.getUserByEmail(email)
      if (!user) {
        throw new NotFoundException(`Usuario con el correo ${email} no encontrado.`);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      user.password = hashedPassword
      await user.save()

      return {
        message: 'Contraseña actualizada exitosamente'
      }
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      throw new BadRequestException('Token inválido o expirado.');
    }
  }
}
