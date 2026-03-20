import { Module } from '@nestjs/common';
import { DocumentService } from './service/document/document.service';
import { DocumentController } from './controller/document/document.controller';
import { SupabaseService } from 'src/supabase/service/supabase/supabase.service';
import JwtStrategy from 'src/jwt/strategy/jwt.strategy';

@Module({
  providers: [DocumentService, SupabaseService, JwtStrategy],
  controllers: [DocumentController]
})
export class DocumentModule {}
