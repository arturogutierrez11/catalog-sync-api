import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        tls:
          process.env.REDIS_TLS === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
        family: 4, // ⛔ evita ::1
      },
    }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
