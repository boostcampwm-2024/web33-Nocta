import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type DocumentDocument = Document & Doc;

@Schema()
export class Doc {
  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Doc);
