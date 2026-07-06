import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeLog extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
  billed: boolean;
  invoiceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema: Schema<ITimeLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.1 },
    description: { type: String, required: true, trim: true },
    billable: { type: Boolean, default: true },
    billed: { type: Boolean, default: false },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', index: true },
  },
  { timestamps: true }
);

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);
