import "express";

declare module "express" {
  export interface Request {
    user?: User;
    cookies: { [key: string]: string };
  }
}
