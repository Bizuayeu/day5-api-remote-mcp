"use strict";
/**
 * OAuth2 Callback Handler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
async function handler(req, res) {
    try {
        const { code, error } = req.query;
        if (error) {
            return res.status(400).send(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error: ${error}</p>
            <p><a href="/api/auth-start">Try again</a></p>
          </body>
        </html>
      `);
        }
        if (!code) {
            return res.status(400).send(`
        <html>
          <head><title>Missing Code</title></head>
          <body>
            <h1>Missing Authorization Code</h1>
            <p><a href="/api/auth-start">Start authentication</a></p>
          </body>
        </html>
      `);
        }
        // TODO: Exchange code for tokens
        // For now, just show success
        return res.status(200).send(`
      <html>
        <head><title>Authentication Success</title></head>
        <body>
          <h1>✅ Authentication Successful!</h1>
          <p>Authorization code received: ${code}</p>
          <p>You can now close this window and use the MCP tools.</p>
          <script>
            // Store auth code for MCP to use
            localStorage.setItem('google_auth_code', '${code}');
            // Optionally close window
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
    }
    catch (error) {
        return res.status(500).send(`
      <html>
        <head><title>Callback Error</title></head>
        <body>
          <h1>Callback Error</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `);
    }
}
