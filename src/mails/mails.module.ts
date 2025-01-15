import { Module } from '@nestjs/common'
import { MailsController } from './mails.controller'
import { MailsService } from './mails.service'
import { UsersModule } from 'src/users/users.module'

@Module({
  imports: [UsersModule],
  controllers: [MailsController],
  providers: [MailsService],
})
export class MailsModule {}
