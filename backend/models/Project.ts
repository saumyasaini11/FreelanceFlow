import mongoose, { Schema, Document } from 'mongoose';

export enum ProjectStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
}

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  budget: number;
  hourlyRate: number;
  deadline: Date;
  status: ProjectStatus;
  progress: number;
  deliverables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    budget: { type: Number, required: true, min: 0, default: 0 },
    hourlyRate: { type: Number, required: true, min: 0, default: 0 },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.NOT_STARTED,
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    deliverables: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
