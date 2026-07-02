const ACCOUNTS = context => context.env.HOSTING_ACCOUNTS;
const FILES = context => context.env.HOSTING_FILES;

const CONTENT_TYPES = {
  '.php': 'text/x-php',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.txt': 'text/plain',
};

export async function onRequestGet(context) {
  const akv = ACCOUNTS(context);
  const fkv = FILES(context);
  const url = new URL(context.request.url);
  const pathParts = url.pathname.replace(/^\/host\//, '').split('/');
  const subdomain = pathParts[0];
  let filepath = pathParts.slice(1).join('/') || 'index.php';

  if (!subdomain) {
    return new Response('Subdomain required', { status: 400 });
  }

  const accountId = await akv.get(`subdomain:${subdomain}`);
  if (!accountId) {
    return new Response('Site not found', { status: 404 });
  }

  const pubKey = `pub:${accountId}:${filepath}`;
  const raw = await fkv.get(pubKey);
  if (!raw) {
    // Try index.php if filepath was a directory-like path
    if (!filepath.endsWith('index.php')) {
      const indexPath = filepath.endsWith('/') ? filepath + 'index.php' : filepath.replace(/\/?$/, '/index.php');
      const indexRaw = await fkv.get(`pub:${accountId}:${indexPath}`);
      if (indexRaw) {
        const fileData = JSON.parse(indexRaw);
        const ext = indexPath.slice(indexPath.lastIndexOf('.'));
        const ct = CONTENT_TYPES[ext] || 'text/plain';
        return new Response(fileData.content, {
          status: 200,
          headers: { 'Content-Type': ct },
        });
      }
    }
    return new Response('File not found', { status: 404 });
  }

  const fileData = JSON.parse(raw);
  const ext = filepath.slice(filepath.lastIndexOf('.'));
  const ct = CONTENT_TYPES[ext] || 'text/plain';
  return new Response(fileData.content, {
    status: 200,
    headers: { 'Content-Type': ct },
  });
}
