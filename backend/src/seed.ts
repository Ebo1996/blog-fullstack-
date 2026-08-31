/**
 * Seed script — run with:  npx ts-node -r tsconfig-paths/register src/seed.ts
 *
 * Creates:
 *  - 1 admin user
 *  - 1 organizer user
 *  - 1 attendee user
 *  - 8 categories
 *  - 6 sample published events with ticket types
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const MONGO_URI = process.env.MONGODB_URI!;

// ─── Schemas ────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true },
  passwordHash: String, role: { type: String, default: 'attendee' },
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

const CategorySchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true },
  icon: String, description: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Category = mongoose.model('Category', CategorySchema);

const EventSchema = new mongoose.Schema({
  organizerId: mongoose.Schema.Types.ObjectId,
  categoryId: mongoose.Schema.Types.ObjectId,
  title: String, slug: { type: String, unique: true },
  description: String, shortDescription: String,
  imageUrl: String, type: { type: String, default: 'in_person' },
  venue: { name: String, address: String, city: String, country: String },
  startAt: Date, endAt: Date, capacity: Number,
  status: { type: String, default: 'published' },
  isFeatured: Boolean, currency: { type: String, default: 'ETB' },
  minPrice: Number, maxPrice: Number, tags: [String],
}, { timestamps: true });
const Event = mongoose.model('Event', EventSchema);

const TicketTypeSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  name: String, description: String,
  price: Number, currency: { type: String, default: 'ETB' },
  quantity: Number, soldQuantity: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  maxPerOrder: { type: Number, default: 10 },
}, { timestamps: true });
const TicketType = mongoose.model('TicketType', TicketTypeSchema);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const slug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + crypto.randomBytes(3).toString('hex');

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // Users
  const hash = await bcrypt.hash('Admin1234!', 12);
  const orgHash = await bcrypt.hash('Organizer1234!', 12);
  const attHash = await bcrypt.hash('Attendee1234!', 12);

  const [admin, organizer, attendee] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'admin@eventify.et' },
      { name: 'Platform Admin', email: 'admin@eventify.et', passwordHash: hash, role: 'admin', emailVerified: true, isActive: true },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: 'organizer@eventify.et' },
      { name: 'Test Organizer', email: 'organizer@eventify.et', passwordHash: orgHash, role: 'organizer', emailVerified: true, isActive: true },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: 'attendee@eventify.et' },
      { name: 'Test Attendee', email: 'attendee@eventify.et', passwordHash: attHash, role: 'attendee', emailVerified: true, isActive: true },
      { upsert: true, new: true }
    ),
  ]);
  console.log('✅ Users seeded');
  console.log('   Admin:     admin@eventify.et     / Admin1234!');
  console.log('   Organizer: organizer@eventify.et / Organizer1234!');
  console.log('   Attendee:  attendee@eventify.et  / Attendee1234!\n');

  // Categories
  const cats = [
    { name: 'Music', slug: 'music', icon: '🎵', description: 'Concerts, festivals, and live performances' },
    { name: 'Technology', slug: 'technology', icon: '💻', description: 'Tech conferences, hackathons, and meetups' },
    { name: 'Business', slug: 'business', icon: '💼', description: 'Networking, summits, and business events' },
    { name: 'Culture', slug: 'culture', icon: '🎭', description: 'Art, theater, film, and cultural events' },
    { name: 'Sports', slug: 'sports', icon: '⚽', description: 'Sports events, tournaments, and fitness' },
    { name: 'Education', slug: 'education', icon: '📚', description: 'Workshops, seminars, and training' },
    { name: 'Food & Drink', slug: 'food-drink', icon: '🍽️', description: 'Food festivals, tastings, and culinary events' },
    { name: 'Community', slug: 'community', icon: '🤝', description: 'Meetups, charity, and community events' },
  ];
  const categories = await Promise.all(
    cats.map((c) => Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true }))
  );
  console.log('✅ Categories seeded:', cats.map((c) => c.name).join(', '), '\n');

  const catMap: Record<string, mongoose.Types.ObjectId> = {};
  cats.forEach((c, i) => { catMap[c.slug] = categories[i]!._id as mongoose.Types.ObjectId; });

  // Events
  const events = [
    {
      title: 'Addis Tech Summit 2027',
      desc: 'The largest technology conference in East Africa. Two days of keynotes, workshops, and networking with 2,000+ developers, founders, and innovators from across the continent. Topics: AI, fintech, cloud infrastructure, developer tools, and the future of African tech.',
      short: 'East Africa\'s largest tech conference',
      slug: slug('addis-tech-summit'),
      cat: 'technology',
      venue: { name: 'Millennium Hall', address: 'Bole Road', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-03-15T09:00:00Z'),
      end: new Date('2027-03-16T18:00:00Z'),
      capacity: 2000, featured: true,
      tickets: [
        { name: 'VIP Pass', desc: 'Front-row seating, exclusive networking dinner, speaker meet & greet, swag bag', price: 3500, qty: 150 },
        { name: 'General Admission', desc: 'Full 2-day conference access including workshops and meals', price: 800, qty: 1500 },
        { name: 'Early Bird', desc: 'Discounted general admission — limited time', price: 500, qty: 300 },
      ],
    },
    {
      title: 'Addis Music Festival 2027',
      desc: 'Three unforgettable days of world-class Ethiopian and international music at Unity Park. Featuring 30+ artists across 4 stages, food village, cultural exhibitions, and art installations. The biggest outdoor music event in Ethiopia.',
      short: 'Three days of world-class music at Unity Park',
      slug: slug('addis-music-festival'),
      cat: 'music',
      venue: { name: 'Unity Park', address: 'Sidist Kilo', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-06-20T17:00:00Z'),
      end: new Date('2027-06-22T23:30:00Z'),
      capacity: 8000, featured: true,
      tickets: [
        { name: 'VIP Weekend', desc: 'VIP area access, premium bar, dedicated viewing platform, artist lounge access', price: 4500, qty: 500 },
        { name: '3-Day Pass', desc: 'Full festival access for all 3 days', price: 1200, qty: 6000 },
        { name: 'Single Day', desc: 'One-day festival access — choose your day at entry', price: 500, qty: 5000 },
      ],
    },
    {
      title: 'Ethiopia Entrepreneurship Summit',
      desc: 'A two-day immersive business summit connecting Ethiopia\'s most ambitious entrepreneurs with investors, mentors, and global business leaders. Featuring 50+ speakers, live pitch competitions, and deal-making sessions. Africa is rising — be part of it.',
      short: 'Connect with Ethiopia\'s top entrepreneurs and investors',
      slug: slug('ethiopia-entrepreneurship-summit'),
      cat: 'business',
      venue: { name: 'Skylight Hotel', address: 'Bole Medhanealem', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-04-10T08:30:00Z'),
      end: new Date('2027-04-11T18:00:00Z'),
      capacity: 500, featured: false,
      tickets: [
        { name: 'Investor Pass', desc: 'Premium access, deal room, investor networking dinner', price: 8000, qty: 50 },
        { name: 'Startup Pass', desc: 'Full summit access including pitch competition entry', price: 2000, qty: 300 },
        { name: 'General Pass', desc: 'Full summit access without pitch competition', price: 1000, qty: 150 },
      ],
    },
    {
      title: 'Addis Creative Arts Festival',
      desc: 'A celebration of Ethiopian contemporary art, photography, film, theater, and design. Featuring gallery exhibitions, live performances, film screenings, artist talks, and interactive workshops. A cultural experience unlike anything else in the city.',
      short: 'Celebrating Ethiopian art, film, and culture',
      slug: slug('addis-creative-arts-festival'),
      cat: 'culture',
      venue: { name: 'Ethiopian Institute of Architecture', address: 'Sidist Kilo', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-05-05T10:00:00Z'),
      end: new Date('2027-05-07T21:00:00Z'),
      capacity: 1500, featured: false,
      tickets: [
        { name: 'Festival Pass', desc: 'Full 3-day festival access including workshops and film screenings', price: 600, qty: 1000 },
        { name: 'Single Day', desc: 'One-day access to exhibitions and talks', price: 200, qty: 2000 },
        { name: 'Free Community Day', desc: 'Free access on the final day — limited slots', price: 0, qty: 500 },
      ],
    },
    {
      title: 'Web Development Bootcamp Addis',
      desc: 'An intensive 3-day hands-on web development workshop for aspiring developers. Learn HTML, CSS, JavaScript, React, and Next.js from working industry engineers. Projects, code reviews, and career guidance included. Laptop required.',
      short: 'Hands-on web development workshop for all skill levels',
      slug: slug('web-dev-bootcamp-addis'),
      cat: 'education',
      venue: { name: 'iCog Labs', address: 'CMC Road', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-02-14T09:00:00Z'),
      end: new Date('2027-02-16T17:00:00Z'),
      capacity: 60, featured: false,
      tickets: [
        { name: 'Standard', desc: 'Full 3-day workshop, lunch included, certificate on completion', price: 1500, qty: 50 },
        { name: 'Student', desc: 'Discounted rate for students with valid ID', price: 800, qty: 10 },
      ],
    },
    {
      title: 'Addis Food & Coffee Festival',
      desc: 'Celebrate the best of Ethiopian food and coffee culture. 60+ restaurants, farms, and roasters come together for a two-day culinary journey through injera, tibs, kitfo, tej, and of course — the world\'s finest coffee ceremony. Cooking demos, coffee tastings, live music.',
      short: 'A culinary journey through Ethiopian food and coffee',
      slug: slug('addis-food-coffee-festival'),
      cat: 'food-drink',
      venue: { name: 'Meskel Square', address: 'Meskel Square', city: 'Addis Ababa', country: 'Ethiopia' },
      start: new Date('2027-07-12T11:00:00Z'),
      end: new Date('2027-07-13T21:00:00Z'),
      capacity: 5000, featured: true,
      tickets: [
        { name: 'Tasting Pass', desc: 'Unlimited tastings from all participating vendors, welcome cocktail', price: 900, qty: 2000 },
        { name: 'General Entry', desc: 'Festival entry with discounted tasting tokens', price: 200, qty: 5000 },
      ],
    },
  ];

  for (const ev of events) {
    const existing = await Event.findOne({ title: ev.title });
    if (existing) { console.log(`   Skipping (exists): ${ev.title}`); continue; }

    const newEvent = await Event.create({
      organizerId: organizer!._id,
      categoryId: catMap[ev.cat],
      title: ev.title,
      slug: ev.slug,
      description: ev.desc,
      shortDescription: ev.short,
      type: 'in_person',
      venue: ev.venue,
      startAt: ev.start,
      endAt: ev.end,
      capacity: ev.capacity,
      status: 'published',
      isFeatured: ev.featured,
      currency: 'ETB',
      minPrice: Math.min(...ev.tickets.map((t) => t.price)),
      maxPrice: Math.max(...ev.tickets.map((t) => t.price)),
      tags: [],
    });

    for (const tt of ev.tickets) {
      await TicketType.create({
        eventId: newEvent._id,
        name: tt.name,
        description: tt.desc,
        price: tt.price,
        currency: 'ETB',
        quantity: tt.qty,
        soldQuantity: 0,
        status: 'active',
        maxPerOrder: 10,
      });
    }
    console.log(`   ✅ ${ev.title} (${ev.tickets.length} ticket types)`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('📍 Test accounts:');
  console.log('   Admin:     http://localhost:3000/admin        → admin@eventify.et / Admin1234!');
  console.log('   Organizer: http://localhost:3000/organizer    → organizer@eventify.et / Organizer1234!');
  console.log('   Attendee:  http://localhost:3000/dashboard    → attendee@eventify.et / Attendee1234!');
  console.log('\n📍 Public site: http://localhost:3000');
  console.log('📍 API docs:    http://localhost:3001/api/docs\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
