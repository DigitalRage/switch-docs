const fs = require('fs');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const repository = process.env.GITHUB_REPOSITORY || 'DigitalRage/switch-docs';
const branch = process.env.GITHUB_BRANCH || 'main';
const token = process.env.GITHUB_TOKEN;
const documents = new Map();
const saveTimers = new Map();

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function githubPath(documentPath) {
  return `https://api.github.com/repos/${repository}/contents/${documentPath}`;
}

async function saveDocument(documentPath, title, html) {
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  const currentResponse = await fetch(`${githubPath(documentPath)}?ref=${encodeURIComponent(branch)}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'switch-docs' }
  });
  const current = currentResponse.ok ? await currentResponse.json() : {};
  const safeTitle = String(title).replace(/[&<>"']/g, '');
  const content = Buffer.from(`<!doctype html><meta charset="utf-8"><title>${safeTitle}</title>${html}`).toString('base64');
  const response = await fetch(githubPath(documentPath), {
    method: 'PUT',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'switch-docs' },
    body: JSON.stringify({ message: `Switch Docs: save ${title}`, content, branch, ...(current.sha ? { sha: current.sha } : {}) })
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/save') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await saveDocument(data.path, data.title, data.html);
        sendJson(response, 200, { saved: true });
      } catch (error) {
        sendJson(response, 500, { saved: false, error: error.message });
      }
    });
    return;
  }

  const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filePath = path.resolve(root, requested === '/' ? 'index.html' : `.${requested}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

const socketServer = new WebSocketServer({ server, path: '/collab' });
socketServer.on('connection', socket => {
  let room;
  socket.on('message', raw => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === 'join') {
        room = message.path;
        if (documents.has(room)) socket.send(JSON.stringify({ type: 'update', ...documents.get(room) }));
        return;
      }
      if (message.type !== 'update' || !room) return;
      const update = { title: message.title, html: message.html };
      documents.set(room, update);
      socketServer.clients.forEach(client => {
        if (client !== socket && client.readyState === 1 && client.room === room) client.send(JSON.stringify({ type: 'update', ...update }));
      });
      clearTimeout(saveTimers.get(room));
      saveTimers.set(room, setTimeout(() => {
        saveDocument(room, update.title, update.html).catch(console.error).finally(() => saveTimers.delete(room));
      }, 1000));
    } catch (error) {
      console.error('Collaboration message failed:', error.message);
    }
  });
  Object.defineProperty(socket, 'room', { get: () => room });
});

server.listen(port, () => console.log(`Switch Docs running at http://localhost:${port}`));