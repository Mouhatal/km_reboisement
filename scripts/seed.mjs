import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvIfPresent() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

loadDotEnvIfPresent();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function ensureUser(email, password, fullName, role) {
  // Try to find existing auth user
  const { data: users, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const existing = users.users.find(u => u.email === email);

  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user: ${email}`);
  } else {
    console.log(`Auth user exists: ${email}`);
  }

  // Upsert profile
  const { error: upsertErr } = await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    role
  }, { onConflict: 'id' });
  if (upsertErr) throw upsertErr;
  console.log(`Upserted profile for: ${email} (${role})`);

  return userId;
}

async function main() {
  try {
    await ensureUser('admin@example.com', 'Admin1234!', 'Admin Demo', 'administrateur');
    await ensureUser('enqueteur@example.com', 'Enq1234!', 'Enquêteur Demo', 'enqueteur');
    console.log('Seeding completed.');
  } catch (e) {
    console.error('Seeding failed:', e);
    process.exit(1);
  }
}

main();


