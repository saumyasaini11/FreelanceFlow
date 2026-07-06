import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Keep email unique per user profile
ClientSchema.index({ userId: 1, email: 1 }, { unique: true });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
