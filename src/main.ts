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
  const port = configService.get('PORT') || 4000

  // Crear y configurar adaptador para WebSocket
  class CustomIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions) {
      const server = super.createIOServer(port, {
        ...options,
        cors: {
          origin: [
            'https://jenno-client.vercel.app',
            'https://jenno.com.co',
            'https://admin.jenno.com.co',
            'http://localhost:3000',
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
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    next();
  })

  // app.use((req, res, next) => {
  //   console.log('Request Headers:', req.headers);
  //   next();
  // });


  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://jenno-client.vercel.app',
        'https://www.jenno.com.co',
        'http://localhost:5173',
        'redis://default:AUVPAAIjcDEzYzkxNjY1YjkyMTM0OGU3OTE4ZDQ0Yzc4MDFkZjlhZHAxMA@wondrous-leopard-17743.upstash.io:6379'
      ]

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Access-Control-Allow-Credentials',
      'Cache-Control',
      'Content-Disposition',
      'Content-Length',
      'Origin'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })



  await app.listen(port);
  console.log(`This application is running on: ${await app.getUrl()}`)
}
bootstrap();
