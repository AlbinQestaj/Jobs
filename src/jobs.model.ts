import { Schema, model } from 'mongoose';

interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
  applied?: boolean;
  dateApplied?: Date;
}

const jobSchema = new Schema<Job>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  url: { type: String, required: true },
  applied: { type: Boolean, default: false },
  dateApplied: Date,
});

const JobModel = model<Job>('Job', jobSchema);

export default JobModel;