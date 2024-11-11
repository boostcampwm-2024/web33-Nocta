import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CrdtModule } from "./crdt/crdt.module";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost:27017"),
    CrdtModule, // CrdtModule 추가
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
