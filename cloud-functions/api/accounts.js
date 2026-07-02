const accountsStore = new Map();

function wrapMapAsKV(map) {
  return {
    async get(key) {
      const val = map.get(key);
      return val !== undefined ? val : null;
    },
    async put(key, value) {
      map.set(key, value);
    },
    async delete(key) {
      map.delete(key);
    },
    async list({ prefix } = {}) {
      const keys = [];
      for (const k of map.keys()) {
        if (!prefix || k.startsWith(prefix)) {
          keys.push({ name: k });
        }
      }
      return { keys };
    },
  };
}

function getKV(env, bindingName, fallbackMap) {
  const binding = env[bindingName];
  if (binding && typeof binding.get === 'function') return binding;
  return wrapMapAsKV(fallbackMap);
}

function randomHex(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const kv = getKV(context.env, 'HOSTING_ACCOUNTS', accountsStore);
  const body = await context.request.json();
  const { action, username, password } = body;

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'signup') {
    const subdomain = username.toLowerCase();
    const existing = await kv.get(`subdomain:${subdomain}`);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Username already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accountId = 'acc_' + randomHex(8);
    const passwordHash = await sha256(password);
    const account = {
      accountId,
      username,
      subdomain,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await kv.put(`acc_${accountId}`, JSON.stringify(account));
    await kv.put(`subdomain:${subdomain}`, accountId);

    return new Response(JSON.stringify({ accountId, username, subdomain, createdAt: account.createdAt }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'login') {
    const subdomain = username.toLowerCase();
    const accountId = await kv.get(`subdomain:${subdomain}`);
    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const raw = await kv.get(`acc_${accountId}`);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const account = JSON.parse(raw);
    const passwordHash = await sha256(password);
    if (account.passwordHash !== passwordHash) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ accountId: account.accountId, username: account.username, subdomain: account.subdomain, createdAt: account.createdAt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const kv = getKV(context.env, 'HOSTING_ACCOUNTS', accountsStore);
  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('accountId');

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = await kv.get(`acc_${accountId}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'Account not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const account = JSON.parse(raw);
  return new Response(JSON.stringify({ accountId: account.accountId, username: account.username, subdomain: account.subdomain, createdAt: account.createdAt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
