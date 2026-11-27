import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { AccessSessionService } from './access-session.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AccessSessionService],
  exports: [AccessSessionService],
})
export class AuthModule {}
