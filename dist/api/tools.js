"use strict";
/**
 * Alternative tools endpoint (common MCP path)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // Redirect to main OAuth2 endpoint
    return res.status(200).json({
        message: "Alternative MCP endpoint",
        redirect_to: "/api/mcp-oauth",
        tools: [
            {
                name: "authenticate_google",
                description: "Authenticate with Google Account",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ],
        note: "This is an alternative path. Main endpoint: /api/mcp-oauth"
    });
}
