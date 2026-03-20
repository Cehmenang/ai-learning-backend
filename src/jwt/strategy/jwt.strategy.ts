import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";

@Injectable()
export default class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: (req) => req.cookies?.access_token,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
            ignoreExpiration: false
        })
    }

    async validate(payload: { id: string, username: string}) {
        return payload
    }
}