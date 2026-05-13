/**
 * seedCategories.js — Run once to populate default categories.
 *
 * Usage:
 *   cd server
 *   node scripts/seedCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Web Development',      icon: '💻', order: 1 },
  { name: 'Mobile Development',   icon: '📱', order: 2 },
  { name: 'Design & Creative',    icon: '🎨', order: 3 },
  { name: 'Digital Marketing',    icon: '📣', order: 4 },
  { name: 'Content & Writing',    icon: '✍️',  order: 5 },
  { name: 'Data & Analytics',     icon: '📊', order: 6 },
  { name: 'Finance & Accounting', icon: '💰', order: 7 },
  { name: 'Legal & Compliance',   icon: '⚖️',  order: 8 },
  { name: 'HR & Recruitment',     icon: '👥', order: 9 },
  { name: 'Sales & Business Dev', icon: '📈', order: 10 },
  { name: 'Project Management',   icon: '📋', order: 11 },
  { name: 'IT & Networking',      icon: '🖧',  order: 12 },
  { name: 'Engineering',          icon: '⚙️',  order: 13 },
  { name: 'Operations',           icon: '🏭', order: 14 },
  { name: 'Other',                icon: '📁', order: 15 },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ name: cat.name });
    if (existing) { skipped++; continue; }
    await Category.create(cat);
    created++;
    console.log(`  ✓ Created: ${cat.icon} ${cat.name}`);
  }

  console.log(`\n✅ Done — ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
