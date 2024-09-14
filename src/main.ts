import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true
  });
  
  app.useWebSocketAdapter(new IoAdapter(app))

  app.enableCors({
    origin: [
      'http://localhost:5173'
    ]
  })

  const port = process.env.PORT || 3000

  await app.listen(port);
}
bootstrap();

