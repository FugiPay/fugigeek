const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Core identity ───────────────────────────────────────────────────────
    name:  { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    avatar:   { type: String, default: '' },
    phone:    { type: String, trim: true, default: '' }, // shared across all roles

    // ── Role ────────────────────────────────────────────────────────────────
    // 'individual'   → personal user, posts tasks, hires professionals
    // 'business'     → company, posts tasks, hires professionals
    // 'professional' → applies to tasks, completes work
    // 'manager'      → platform moderation, limited admin access
    // 'admin'        → full platform management
    role: {
      type: String,
      enum: ['individual', 'business', 'professional', 'manager', 'admin'],
      required: [true, 'Role is required'],
    },

    // ── Individual profile ────────────────────────────────────────────────────
    individualProfile: {
      occupation: { type: String, trim: true },
      location:   { type: String, trim: true },
      bio:        { type: String, maxlength: 1000 },
    },

    // ── Business profile ─────────────────────────────────────────────────────
    businessProfile: {
      companyName:  { type: String, trim: true },
      industry:     { type: String, trim: true },
      companySize:  { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
      website:      { type: String, trim: true },
      description:  { type: String, maxlength: 1000 },
      location:     { type: String, trim: true },
      verified:     { type: Boolean, default: false },
    },

    // ── Professional profile ─────────────────────────────────────────────────
    professionalProfile: {
      headline:       { type: String, trim: true, maxlength: 150 },
      bio:            { type: String, maxlength: 2000 },
      skills:         [{ type: String, trim: true }],
      hourlyRate:     { type: Number, min: 0 },
      currency:       { type: String, default: 'ZMW' },
      availability:   {
        type: String,
        enum: ['full-time', 'part-time', 'weekends', 'contract'],
        default: 'contract',
      },
      location:       { type: String, trim: true },
      portfolio:      [{ title: String, url: String, description: String }],
      certifications: [{ name: String, issuer: String, year: Number }],
      languages:      [{
        language:    String,
        proficiency: { type: String, enum: ['basic', 'conversational', 'fluent', 'native'] },
      }],
      responseTime:   { type: String, default: 'within 24 hours' },
      verified:       { type: Boolean, default: false },
    },

    // ── Aggregated stats ────────────────────────────────────────────────────
    stats: {
      rating:         { type: Number, default: 0, min: 0, max: 5 },
      reviewCount:    { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      totalEarnings:  { type: Number, default: 0 }, // professionals
      totalSpent:     { type: Number, default: 0 }, // businesses
    },

    // ── Account state ───────────────────────────────────────────────────────
    isActive:            { type: Boolean, default: true },
    isEmailVerified:     { type: Boolean, default: false },
    emailVerifyToken:    String,
    resetPasswordToken:  String,
    resetPasswordExpire: Date,
    lastSeen:            { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ role: 1 });
userSchema.index({ 'professionalProfile.skills': 1 });
userSchema.index({ createdAt: -1 });

// ── Hash password before save ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
