// operations.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type OperationDocument = Document & OperationEntity;

@Schema()
export class OperationEntity {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  operation: any;
}

export const OperationSchema = SchemaFactory.createForClass(OperationEntity);
