import mongoose, { Schema } from "mongoose";
import type { IObj, IObjField } from "../definitions/obj.js";

export const objSchema = new Schema<IObj>({
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
  createdBy: { type: String, index: true },
  updatedBy: { type: String, index: true },
  orgId: { type: String, index: true },
  appId: { type: String, index: true },
  createdByType: { type: String, index: true },
  id: { type: String, unique: true },
  tag: { type: String, index: true },
  updatedByType: { type: String, index: true },
  objRecord: Schema.Types.Map,
});

export const objModel = mongoose.model("Obj", objSchema);

export const objFieldSchema = new Schema<IObjField>({
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
  orgId: { type: String, index: true },
  appId: { type: String, index: true },
  id: { type: String, unique: true },
  tag: { type: String, index: true },
  field: { type: String, index: true },
  fieldKeys: [String],
  fieldKeyTypes: [String],
  valueTypes: [String],
});

export const objFieldModel = mongoose.model("ObjField", objFieldSchema);
