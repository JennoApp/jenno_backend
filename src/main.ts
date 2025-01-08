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

  app.use((req, res, next) => {
    const origin = req.headers.origin || '*'
    console.log('Cors middleware: Origin:', origin)

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    next();
  })

  app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    next();
  });


  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://jenno-client.vercel.app',
        'https://jenno.com.co',
        'redis://default:XwKGfXdDVpIKSwAJrKnnuRGFseSpKhsc@redis-production-af4e.up.railway.app:6379'
      ]

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })



  await app.listen(port);
  console.log(`This application is running on: ${await app.getUrl()}`)
}
bootstrap();

