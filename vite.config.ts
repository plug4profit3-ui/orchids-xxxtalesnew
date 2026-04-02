import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTaggerPlugin } from "./src/visual-edits/component-tagger-plugin.js";
import path from 'path';
const vercelApiPlugin = () => ({
  name: 'vercel-api-dev',
  configureServer(server: any) {
    // Load all .env vars into process.env for API routes
    const env = loadEnv('development', __dirname, '');
    Object.assign(process.env, env);

    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api/')) return next();

      const routeName = req.url.replace('/api/', '').split('?')[0];
      const modulePath = path.resolve(__dirname, `api/${routeName}.ts`);

      try {
        let body = '';
        await new Promise<void>((resolve) => {
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', resolve);
        });

        const mod = await server.ssrLoadModule(`/api/${routeName}.ts`);
        const handler = mod.default;

        const fakeReq = {
          method: req.method,
          headers: req.headers,
          body: body ? JSON.parse(body) : undefined,
          query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
        };

          let headersWritten = false;
          const fakeRes = {
            statusCode: 200,
            _headers: {} as Record<string, string>,
            _body: null as any,
            status(code: number) { this.statusCode = code; return this; },
            json(data: any) {
              this._body = JSON.stringify(data);
              this._headers['content-type'] = 'application/json';
              res.writeHead(this.statusCode, this._headers);
              res.end(this._body);
              return this;
            },
            setHeader(key: string, value: string) { this._headers[key] = value; return this; },
            send(data: any) {
              res.writeHead(this.statusCode, this._headers);
              res.end(typeof data === 'string' ? data : JSON.stringify(data));
              return this;
            },
            // Streaming support for SSE routes (chat with stream:true)
            write(chunk: any) {
              if (!headersWritten) {
                headersWritten = true;
                res.writeHead(this.statusCode, this._headers);
              }
              res.write(chunk);
              return true;
            },
            end(chunk?: any) {
              if (!headersWritten) {
                headersWritten = true;
                res.writeHead(this.statusCode, this._headers);
              }
              res.end(chunk);
              return this;
            },
            // Required by some Vercel handlers
            flushHeaders() {
              if (!headersWritten) {
                headersWritten = true;
                res.writeHead(this.statusCode, this._headers);
              }
            },
          };

        await handler(fakeReq, fakeRes);
      } catch (e: any) {
        console.error(`API Error [${routeName}]:`, e);
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  },
});

// Minimal plugin to log build-time and dev-time errors to console
const logErrorsPlugin = () => ({
  name: "log-errors-plugin",
  // Inject a small client-side script that mirrors Vite overlay errors to console
  transformIndexHtml() {
    return {
      tags: [
        {
          tag: "script",
          injectTo: "head",
          children: `(() => {
            try {
              const logOverlay = () => {
                const el = document.querySelector('vite-error-overlay');
                if (!el) return;
                const root = (el.shadowRoot || el);
                let text = '';
                try { text = root.textContent || ''; } catch (_) {}
                if (text && text.trim()) {
                  const msg = text.trim();
                  // Use console.error to surface clearly in DevTools
                  console.error('[Vite Overlay]', msg);
                  // Also mirror to parent iframe with structured payload
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'ERROR_CAPTURED',
                        error: {
                          message: msg,
                          stack: undefined,
                          filename: undefined,
                          lineno: undefined,
                          colno: undefined,
                          source: 'vite.overlay',
                        },
                        timestamp: Date.now(),
                      }, '*');
                    }
                  } catch (_) {}
                }
              };

              const obs = new MutationObserver(() => logOverlay());
              obs.observe(document.documentElement, { childList: true, subtree: true });

              window.addEventListener('DOMContentLoaded', logOverlay);
              // Attempt immediately as overlay may already exist
              logOverlay();
            } catch (e) {
              console.warn('[Vite Overlay logger failed]', e);
            }
          })();`
        }
      ]
    };
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    logErrorsPlugin(),
    vercelApiPlugin(),
    mode === 'development' && componentTaggerPlugin(),
  ]
}));
// Orchids restart: 1771432046528
