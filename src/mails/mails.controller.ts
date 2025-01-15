import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import { MailsService } from "./mails.service";

@Controller('mails')
export class MailsController {
  constructor(
    private mailsService: MailsService
  ) {}

  @Get()
  getMails() {
    return "all mails!"
  }

  @Post('resetpassword')
  resetPassword(@Body('email') email: string) {
    return this.mailsService.resetPassword(email)
  }

  @Post('updatepassword')
  updatePassword(@Body() body: { token: string, newPassword: string }) {
    const { token, newPassword } = body

    if (!token || !newPassword) {
      throw new BadRequestException('Token y nueva contraseña son obligatorios.');
    }

    try {
      const result = this.mailsService.updatePassword(token, newPassword);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al actualizar la contraseña.');
    }
  }
}
