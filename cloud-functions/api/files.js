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

const ALLOWED_EXTENSIONS = ['.php', '.css', '.html', '.js', '.txt'];

function isValidFilename(name) {
  if (!name || name.length === 0) return false;
  const ext = name.slice(name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
  const base = name.slice(0, name.lastIndexOf('.'));
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return false;
  return true;
}

export async function onRequestPost(context) {
  const fkv = getKV(context.env, 'HOSTING_FILES', filesStore);
  const akv = getKV(context.env, 'HOSTING_ACCOUNTS', accountsStore);
  const body = await context.request.json();
  const { accountId, action, filename, content } = body;

  if (!accountId || !action || !filename) {
    return new Response(JSON.stringify({ error: 'accountId, action, and filename required' }), {
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

  if (!isValidFilename(filename)) {
    return new Response(JSON.stringify({ error: 'Invalid filename. Allowed extensions: ' + ALLOWED_EXTENSIONS.join(', ') }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const draftKey = `draft:${accountId}:${filename}`;

  if (action === 'create' || action === 'update') {
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content required for create/update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const fileData = {
      filename,
      content,
      updatedAt: new Date().toISOString(),
    };
    await fkv.put(draftKey, JSON.stringify(fileData));
    return new Response(JSON.stringify({ success: true, filename, action }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'delete') {
    await fkv.delete(draftKey);
    const pubKey = `pub:${accountId}:${filename}`;
    await fkv.delete(pubKey);
    return new Response(JSON.stringify({ success: true, filename, action }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action. Use create, update, or delete' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const fkv = getKV(context.env, 'HOSTING_FILES', filesStore);
  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('accountId');
  const filename = url.searchParams.get('filename');

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (filename) {
    const draftKey = `draft:${accountId}:${filename}`;
    const raw = await fkv.get(draftKey);
    if (!raw) {
      const pubKey = `pub:${accountId}:${filename}`;
      const pubRaw = await fkv.get(pubKey);
      if (!pubRaw) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(JSON.parse(pubRaw)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(JSON.parse(raw)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prefix = `draft:${accountId}:`;
  const list = await fkv.list({ prefix });
  const files = list.keys.map(k => {
    const fname = k.name.slice(prefix.length);
    return { filename: fname };
  });

  return new Response(JSON.stringify({ files }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
