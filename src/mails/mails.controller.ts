import { Controller, Get } from "@nestjs/common";



@Controller('mails')
export class MailsController {
  constructor() {}

  @Get()
  getMails() {
    return "all mails!"
  }
}
