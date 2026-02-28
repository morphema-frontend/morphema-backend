import process from 'process';

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error('Usage: node scripts/smoke.mjs https://<BACKEND_URL>');
  process.exit(1);
}

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
if (!email || !password) {
  console.error('Missing SMOKE_EMAIL or SMOKE_PASSWORD env vars');
  process.exit(1);
}

async function readJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function assertStatus(res, expected, label) {
  if (res.status === expected) return;
  const payload = await readJsonSafe(res);
  throw new Error(`${label} expected ${expected}, got ${res.status}: ${JSON.stringify(payload)}`);
}

async function run() {
  const healthRes = await fetch(`${baseUrl}/api/health`);
  await assertStatus(healthRes, 200, 'GET /api/health');
  const health = await readJsonSafe(healthRes);
  console.log('health', health);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  await assertStatus(loginRes, 200, 'POST /api/auth/login');
  const login = await readJsonSafe(loginRes);
  if (!login?.accessToken) {
    throw new Error('Missing accessToken in login response');
  }

  const meRes = await fetch(`${baseUrl}/api/horeca-venues/me`, {
    headers: { Authorization: `Bearer ${login.accessToken}` },
  });
  if (meRes.status !== 200 && meRes.status !== 404 && meRes.status !== 403) {
    const payload = await readJsonSafe(meRes);
    throw new Error(`GET /api/horeca-venues/me unexpected ${meRes.status}: ${JSON.stringify(payload)}`);
  }
  console.log('horeca-venues/me status', meRes.status);

  console.log('smoke ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
