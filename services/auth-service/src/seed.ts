import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const MONGO_AUTH_URI = process.env.MONGO_AUTH_URI || 'mongodb://localhost:27017/realestate_auth';

async function seed() {
  const conn = await mongoose.connect(MONGO_AUTH_URI);
  console.log('Connected to auth DB');

  // Clear existing data
  await conn.connection.db!.dropDatabase();
  console.log('Cleared auth DB');

  const passwordHash = await bcrypt.hash('password123', 12);

  const users = [
    {
      email: 'admin@realestate.com',
      passwordHash,
      name: 'Rajesh Kumar',
      role: 'admin',
      phone: '+91 9876543210',
      isActive: true,
    },
    {
      email: 'sales.manager@realestate.com',
      passwordHash,
      name: 'Priya Sharma',
      role: 'sales_manager',
      phone: '+91 9876543211',
      isActive: true,
    },
    {
      email: 'agent1@realestate.com',
      passwordHash,
      name: 'Amit Patel',
      role: 'sales_agent',
      phone: '+91 9876543212',
      isActive: true,
    },
    {
      email: 'agent2@realestate.com',
      passwordHash,
      name: 'Sneha Reddy',
      role: 'sales_agent',
      phone: '+91 9876543213',
      isActive: true,
    },
    {
      email: 'engineer@realestate.com',
      passwordHash,
      name: 'Vikram Singh',
      role: 'site_engineer',
      phone: '+91 9876543214',
      isActive: true,
    },
    {
      email: 'buyer1@realestate.com',
      passwordHash,
      name: 'Ananya Gupta',
      role: 'buyer',
      phone: '+91 9876543215',
      isActive: true,
    },
    {
      email: 'buyer2@realestate.com',
      passwordHash,
      name: 'Rohit Mehta',
      role: 'buyer',
      phone: '+91 9876543216',
      isActive: true,
    },
  ];

  const UserSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
    name: String,
    role: String,
    phone: String,
    isActive: Boolean,
    oauthProvider: String,
    oauthId: String,
    lastLogin: Date,
  }, { timestamps: true });

  const User = mongoose.model('User', UserSchema);
  const inserted = await User.insertMany(users);

  console.log(`Seeded ${inserted.length} users:`);
  inserted.forEach((u) => {
    console.log(`  - ${u.email} (${u.role}) | password: password123`);
  });

  await conn.disconnect();
  console.log('Auth seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
