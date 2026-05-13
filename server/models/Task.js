const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // ── Core ────────────────────────────────────────────────────────────────
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
    // postedBy supports individual, business, or professional posting a task
    postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Categorisation ───────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development', 'Mobile Development', 'Design & Creative',
        'Digital Marketing', 'Content & Writing', 'Data & Analytics',
        'Finance & Accounting', 'Legal & Compliance', 'HR & Recruitment',
        'Sales & Business Dev', 'Project Management', 'IT & Networking',
        'Engineering', 'Operations', 'Other',
      ],
    },
    tags: [{ type: String, trim: true, lowercase: true }],

    // ── Skills required ──────────────────────────────────────────────────────
    skillsRequired: [{ type: String, trim: true }],

    // ── Budget & timeline ────────────────────────────────────────────────────
    budgetType:   { type: String, enum: ['fixed', 'hourly'], required: true },
    budgetMin:    { type: Number, min: 0 },
    budgetMax:    { type: Number, min: 0 },
    currency:     { type: String, default: 'ZMW' },
    deadline:     { type: Date },
    duration:     {
      type: String,
      enum: ['less than a week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', 'ongoing'],
    },

    // ── Attachments ──────────────────────────────────────────────────────────
    attachments: [{
      url:          String,   // S3 public URL
      key:          String,   // S3 object key (for deletion)
      originalName: String,
    }],

    // ── Location / remote ────────────────────────────────────────────────────
    locationType: { type: String, enum: ['remote', 'on-site', 'hybrid'], default: 'remote' },
    location:     { type: String, trim: true },

    // ── Status lifecycle ─────────────────────────────────────────────────────
    // open → in-progress → completed | cancelled
    status: {
      type:    String,
      enum:    ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },

    // ── Assigned professional ────────────────────────────────────────────────
    assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt:   { type: Date },
    completedAt:  { type: Date },

    // ── Proposals ────────────────────────────────────────────────────────────
    proposalCount: { type: Number, default: 0 },
    maxProposals:  { type: Number, default: 20 },

    // ── Visibility ───────────────────────────────────────────────────────────
    isPublished:  { type: Boolean, default: true },
    isFeatured:   { type: Boolean, default: false },

    // ── Stats ────────────────────────────────────────────────────────────────
    views:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
taskSchema.index({ postedBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ skillsRequired: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' }); // full-text search

module.exports = mongoose.model('Task', taskSchema);
