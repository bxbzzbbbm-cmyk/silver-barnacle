const FILES = context => context.env.HOSTING_FILES;
const ACCOUNTS = context => context.env.HOSTING_ACCOUNTS;

export async function onRequestPost(context) {
  const fkv = FILES(context);
  const akv = ACCOUNTS(context);
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
  const fkv = FILES(context);
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
