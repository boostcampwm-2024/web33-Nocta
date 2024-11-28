export interface IJwtPayload {
  sub?: string; // 사용자 ID
  email?: string; // 사용자 이메일
  iat: number; // 발급 시간
  exp: number; // 만료 시간
}
