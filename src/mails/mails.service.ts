import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resend } from 'resend';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class MailsService {
  private resend: Resend;

  constructor(private readonly usersService: UsersService) {
    this.resend = new Resend('re_84vzYpQn_CMoaeoABBkzTFTBmRnHdXEBV');
  }

  /* ============================
     RESET PASSWORD
    ============================ */
  async resetPassword(userEmail: string) {
    try {
      const resetToken = jwt.sign(
        { email: userEmail },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      const resetUrl = `https://jenno-client.vercel.app/resetpassword?token=${resetToken}`;

      const { data, error } = await this.resend.emails.send({
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
        `,
      });

      if (error) {
        console.error('Error enviando el correo:', error);
        throw new Error('No se pudo enviar el correo de restablecimiento.');
      }

      return {
        success: true,
        message: 'Correo de restablecimiento enviado.',
        data,
      };
    } catch (error) {
      console.error('Error en ResetPassword:', error);
      throw new Error(
        'No se pudo procesar la solicitud de restablecimiento de contraseña.',
      );
    }
  }

  async updatePassword(token: string, newPassword: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded.email;

      // Obtener el usuario por email
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException(
          `Usuario con el correo ${email} no encontrado.`,
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedPassword;
      await user.save();

      return {
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      throw new BadRequestException('Token inválido o expirado.');
    }
  }

  /* ============================
     🛒 NUEVA VENTA
    ============================ */

  async notifySellerSale(params: {
    sellerId: string;
    orderId: string;
    productName: string;
    quantity: number;
    total: number;
    buyerName: string;
  }) {
    const seller = await this.usersService.getUser(params.sellerId);

    if (!seller || !seller.email) {
      throw new NotFoundException('Vendedor sin email');
    }

    const { error } = await this.resend.emails.send({
      from: 'Ventas Jenno <ventas@jenno.com.co>',
      to: seller.email,
      subject: '🎉 ¡Has realizado una venta!',
      html: `
          <h2>¡Felicidades ${seller.username || ''}!</h2>

          <p>Acabas de realizar una venta en <b>Jenno</b>.</p>

          <h3>📦 Detalles:</h3>
          <ul>
            <li><b>Producto:</b> ${params.productName}</li>
            <li><b>Cantidad:</b> ${params.quantity}</li>
            <li><b>Total:</b> $${params.total.toLocaleString()}</li>
            <li><b>Comprador:</b> ${params.buyerName}</li>
            <li><b>Orden:</b> ${params.orderId}</li>
          </ul>

          <p>Ingresa a Jenno para gestionar el envío.</p>

          <a href="https://jenno-client.vercel.app/seller/orders"
             style="padding:10px 16px;background:black;color:white;border-radius:6px;text-decoration:none;">
             Ver órdenes
          </a>

          <p>Equipo Jenno</p>
        `,
    });

    if (error) {
      console.error('Error enviando correo venta:', error);
    }

    return { success: true };
  }
}
