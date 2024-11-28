import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtRefreshTokenAuthGuard extends AuthGuard("jwt-refresh") {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Refresh Token 유효성 인증
    const canActivate = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest();

    // 사용자에게 등록된 Refresh Token와 일치 여부 확인
    const { refreshToken } = request.cookies;
    const isValid = await this.authService.validateRefreshToken(refreshToken);
    if (!isValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return canActivate;
  }
}
