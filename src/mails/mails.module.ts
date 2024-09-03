import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'
import { MailsService } from './mails.service'
import { existsSync } from 'fs'

const templatesDir = existsSync(join(__dirname, 'templates'))
  ? join(__dirname, 'templates')
  : join(__dirname, '..', '..', 'src', 'mails', 'templates')

// console.log('Email template directory:', templatesDir);

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD')
          }
        },
        defaults: {
          from: `"No Reply <${config.get('MAIL_FROM')}>"`
        },
        template: {
          dir: templatesDir,
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true
          }
        }
      }),
      inject: [ConfigService]
    })
  ],
  providers: [MailsService],
  exports: [MailsService]
})
export class MailsModule {}
