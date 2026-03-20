import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleGuard implements CanActivate {
  private readonly client: OAuth2Client

  constructor(public configService: ConfigService){
    this.client = new OAuth2Client(configService.get<string>('CLIENT_ID')!)
  }

  async canActivate( context: ExecutionContext ): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.body
    if(!token) throw new BadRequestException('Token tidak ditemukan!')
    try{
      const ticket = await this.client.verifyIdToken({
        idToken: token.credential,
        audience: this.configService.get<string>('CLIENT_ID')!,
      })
      const payload = ticket.getPayload()
      request.user = payload
      return true;
    }catch(err){ 
      console.log(err)
      return false 
    }
  }
}

