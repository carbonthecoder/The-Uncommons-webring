import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function nodeApiDevPlugin(): Plugin {
  return {
    name: 'node-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (
          !url.startsWith('/api/get-nodes') &&
          !url.startsWith('/api/save-node') &&
          !url.startsWith('/api/reorder-nodes') &&
          !url.startsWith('/api/vacate-slot')
        ) {
          return next();
        }

        try {
          // @ts-ignore
          const { getAllNodes, saveNodeRecord, batchUpdateNodes, vacateSlotRecord } = await import('./api/db.js');

          if (url.startsWith('/api/get-nodes') && req.method === 'GET') {
            const bypassCache = url.includes('refresh=true');
            const nodes = await getAllNodes(bypassCache);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                nodes,
                count: nodes.filter((n: any) => n.verified && n.domain && !n.domain.includes('unclaimed')).length,
                timestamp: new Date().toISOString(),
              })
            );
            return;
          }

          if (req.method === 'POST') {
            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
            });
            req.on('end', async () => {
              try {
                const body = JSON.parse(rawBody || '{}');

                const { key, pin } = body;
                const cleanKey = String(key || '').trim().toUpperCase();
                const cleanPin = String(pin || '').trim();
                const isFounderAuth = cleanPin === '918542' || cleanKey === 'UNC-ALPHA-2026' || cleanPin === '000000' || cleanKey === 'UNC-COUNCIL-01' || cleanPin === '111111';

                if (url.startsWith('/api/save-node')) {
                  const { node } = body;
                  if (!node || !node.id) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ success: false, error: 'Node data required.' }));
                  }
                  if (!isFounderAuth) {
                    res.statusCode = 403;
                    return res.end(JSON.stringify({ success: false, error: 'Invalid credentials.' }));
                  }
                  const saved = await saveNodeRecord(node);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ success: true, node: saved }));
                }

                if (url.startsWith('/api/reorder-nodes')) {
                  const { nodes } = body;
                  if (!isFounderAuth) {
                    res.statusCode = 403;
                    return res.end(JSON.stringify({ success: false, error: 'Invalid credentials.' }));
                  }
                  const updated = await batchUpdateNodes(nodes);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ success: true, nodes: updated }));
                }

                if (url.startsWith('/api/vacate-slot')) {
                  const { slotId } = body;
                  if (!isFounderAuth) {
                    res.statusCode = 403;
                    return res.end(JSON.stringify({ success: false, error: 'Invalid credentials.' }));
                  }
                  const vacated = await vacateSlotRecord(slotId);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ success: true, node: vacated }));
                }

                next();
              } catch (parseErr: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          next();
        } catch (err: any) {
          console.error('Vite dev node-api middleware error:', err);
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodeApiDevPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
