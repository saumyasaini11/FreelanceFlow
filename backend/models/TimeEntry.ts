import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeEntry extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  hourlyRate: number;
  isBilled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema: Schema<ITimeEntry> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    description: { type: String, trim: true, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, min: 0, default: 0 }, // minutes
    hourlyRate: { type: Number, min: 0, default: 0 },
    isBilled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Auto-calculate duration when endTime is set
TimeEntrySchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const ms = (this.endTime as Date).getTime() - (this.startTime as Date).getTime();
    this.duration = Math.round(ms / 60000); // milliseconds → minutes
  }
  next();
});

export const TimeEntry = mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
