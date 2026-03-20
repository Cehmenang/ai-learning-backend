import { Module } from '@nestjs/common';
import { AttemptService } from './service/attempt/attempt.service';
import { AttemptController } from './controller/attempt/attempt.controller';
import JwtStrategy from 'src/jwt/strategy/jwt.strategy';

@Module({
  providers: [AttemptService, JwtStrategy],
  controllers: [AttemptController]
})
export class AttemptModule {}
