import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ConfigService } from '@nestjs/config'


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true
  });
  
  app.useWebSocketAdapter(new IoAdapter(app))

  app.enableCors({
    origin: [
      'https://jenno-client.vercel.app',
      'https://jenno.com.co'
    ],
    credentials: true
  })

  const configService = app.get(ConfigService)
  const port = configService.get('PORT') || 3000

  await app.listen(port);
  console.log(`This application is running on: ${await app.getUrl()}`)
}
bootstrap();

