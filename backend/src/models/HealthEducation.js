const mongoose = require('mongoose');

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const metricsSchema = new Schema(
  {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { _id: false }
);

const healthEducationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    publishDate: { type: Date },
    scheduledAt: { type: Date },
    featured: { type: Boolean, default: false },
    thumbnailUrl: { type: String, trim: true },
    metrics: { type: metricsSchema, default: () => ({}) },
    attachments: [attachmentSchema],
    campaign: {
      title: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      status: { type: String, trim: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdByName: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

healthEducationSchema.index({ category: 1, publishDate: -1 });
healthEducationSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('HealthEducation', healthEducationSchema);
