import { Module } from "@nestjs/common";
import { CrdtService } from "./crdt.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Doc, DocumentSchema } from "../schemas/document.schema";
import { CrdtGateway } from "./crdt.gateway";

@Module({
  imports: [MongooseModule.forFeature([{ name: Doc.name, schema: DocumentSchema }])],
  providers: [CrdtService, CrdtGateway],
  exports: [CrdtService],
})
export class CrdtModule {}
