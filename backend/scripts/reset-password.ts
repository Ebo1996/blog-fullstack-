/**
 * Quick script to reset a user's password
 * Usage: npx ts-node -r tsconfig-paths/register scripts/reset-password.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGODB_URI!;
const USER_EMAIL = 'melalabirhanu285@gmail.com';
const NEW_PASSWORD = 'NewPassword123!';

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function resetPassword() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const user = await User.findOne({ email: USER_EMAIL });
  if (!user) {
    console.log(`❌ User not found: ${USER_EMAIL}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);
  console.log('Hashing new password...');
  
  const newHash = await bcrypt.hash(NEW_PASSWORD, 12);
  user.passwordHash = newHash;
  await user.save();

  console.log(`\n✅ Password reset successful!`);
  console.log(`\nLogin credentials:`);
  console.log(`  Email: ${USER_EMAIL}`);
  console.log(`  Password: ${NEW_PASSWORD}`);
  console.log(`\nYou can now login at: http://localhost:3000/login\n`);

  await mongoose.disconnect();
}

resetPassword().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
