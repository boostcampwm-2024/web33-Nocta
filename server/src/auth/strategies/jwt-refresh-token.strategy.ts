import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { Request as ExpressRequest } from "express";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ExpressRequest) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies["refreshToken"];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: ExpressRequest) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
