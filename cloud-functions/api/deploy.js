const filesStore = new Map();
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

export async function onRequestPost(context) {
  const fkv = getKV(context.env, 'HOSTING_FILES', filesStore);
  const akv = getKV(context.env, 'HOSTING_ACCOUNTS', accountsStore);
  const body = await context.request.json();
  const { accountId } = body;

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accRaw = await akv.get(`acc_${accountId}`);
  if (!accRaw) {
    return new Response(JSON.stringify({ error: 'Account not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const account = JSON.parse(accRaw);
  const prefix = `draft:${accountId}:`;
  const list = await fkv.list({ prefix });
  const deployedAt = new Date().toISOString();

  for (const key of list.keys) {
    const fname = key.name.slice(prefix.length);
    const raw = await fkv.get(key.name);
    const fileData = JSON.parse(raw);
    fileData.deployedAt = deployedAt;
    const pubKey = `pub:${accountId}:${fname}`;
    await fkv.put(pubKey, JSON.stringify(fileData));
  }

  const manifest = {
    accountId,
    subdomain: account.subdomain,
    deployedAt,
    fileCount: list.keys.length,
  };
  await fkv.put(`deploy:${accountId}`, JSON.stringify(manifest));

  return new Response(JSON.stringify({ success: true, siteUrl: `/host/${account.subdomain}/`, manifest }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const fkv = getKV(context.env, 'HOSTING_FILES', filesStore);
  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('accountId');

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = await fkv.get(`deploy:${accountId}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'No deployment found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(JSON.parse(raw)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
