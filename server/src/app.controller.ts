import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Get a greeting message" })
  @ApiResponse({ status: 200, description: "Successfully retrieved greeting message." })
  public getHello(): string {
    return this.appService.getHello();
  }
}
