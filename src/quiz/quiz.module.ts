import { Module } from '@nestjs/common';
import { QuizController } from './controller/quiz/quiz.controller';
import { QuizService } from './service/quiz/quiz.service';
import JwtStrategy from 'src/jwt/strategy/jwt.strategy';
import { SupabaseService } from 'src/supabase/service/supabase/supabase.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, JwtStrategy, SupabaseService]
})
export class QuizModule {}
