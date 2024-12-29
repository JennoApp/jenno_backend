import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ConfigService } from '@nestjs/config'
import { ServerOptions } from 'socket.io'


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true
  });
  
  const configService = app.get(ConfigService)
  const port = configService.get('PORT') || 3000

  // Crear y configurar adaptador para WebSocket
  class CustomIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions) {
      const server = super.createIOServer(port, {
        ...options,
        cors: {
          origin: [
            'https://jenno-client.vercel.app',
            'https://jenno.com.co',
          ],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['polling', 'websocket'], // Transportes permitidos
      });
      return server;
    }
  }

  // Crear y configurar adaptador
  app.useWebSocketAdapter(new CustomIoAdapter(app))

  app.enableCors({
    origin: [
      '*',
      'https://jenno-client.vercel.app',
      'https://jenno.com.co'
    ],
    credentials: true
  })

  

  await app.listen(port);
  console.log(`This application is running on: ${await app.getUrl()}`)
}
bootstrap();

