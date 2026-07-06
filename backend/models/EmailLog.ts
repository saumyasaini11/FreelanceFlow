import mongoose, { Schema, Document } from 'mongoose';

export enum EmailStatus {
  SENT = 'Sent',
  FAILED = 'Failed',
}

export interface IEmailLog extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  to: string;
  subject: string;
  body: string;
  status: EmailStatus;
  sentAt: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema: Schema<IEmailLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EmailStatus),
      default: EmailStatus.SENT,
      index: true,
    },
    sentAt: { type: Date, default: Date.now },
    errorMessage: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
