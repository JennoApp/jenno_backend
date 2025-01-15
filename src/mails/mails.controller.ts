import { Body, Controller, Get, Post } from "@nestjs/common";
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
  resetPassword(@Body() email: string) {
    return this.mailsService.resetPassword(email)
  }
}
