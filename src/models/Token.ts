import mongoose, { Schema, Document, Types } from "mongoose";

export interface Itoken extends Document {
  token: string;
  user: Types.ObjectId;
  createdAt: Date;
}

const tokenSchema: Schema = new Schema({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    ref: "User",
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 10 * 60 * 1000,
    expires: 0,
  },
});

const Token = mongoose.model<Itoken>("Token", tokenSchema);
export default Token;
