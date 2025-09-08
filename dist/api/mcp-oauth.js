"use strict";
/**
 * MCP with OAuth2 Authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
async function handler(req, res) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        const { method, params } = req.body || {};
        // Handle tools/list
        if (method === 'tools/list') {
            return res.status(200).json({
                tools: [
                    {
                        name: "authenticate_google",
                        description: "Authenticate with Google Account (choose your account)",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: "create_document_oauth",
                        description: "Create Google Docs document (requires authentication)",
                        inputSchema: {
                            type: "object",
                            properties: {
                                title: {
                                    type: "string",
                                    description: "Document title"
                                }
                            },
                            required: ["title"]
                        }
                    },
                    {
                        name: "list_documents_oauth",
                        description: "List your Google Docs (requires authentication)",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    }
                ]
            });
        }
        // Handle tools/call
        if (method === 'tools/call') {
            const toolName = params?.name;
            const args = params?.arguments || {};
            if (toolName === 'authenticate_google') {
                const authUrl = `https://day5-api-s-from-remote-mcp.vercel.app/api/auth-start`;
                return res.status(200).json({
                    content: [
                        {
                            type: "text",
                            text: `🔐 Google Authentication Required

To use Google Docs tools, please authenticate with your Google account:

1. Open this URL in your browser: ${authUrl}
2. Choose your Google account
3. Grant permissions for Google Docs and Drive
4. Return here to use the authenticated tools

Click the link to start authentication: ${authUrl}`
                        }
                    ]
                });
            }
            if (toolName === 'create_document_oauth') {
                return res.status(200).json({
                    content: [
                        {
                            type: "text",
                            text: `❌ Authentication required

Please run the 'authenticate_google' tool first to connect your Google account.

This tool will create: "${args.title}"
In your personal Google Drive (not Service Account drive)`
                        }
                    ]
                });
            }
            if (toolName === 'list_documents_oauth') {
                return res.status(200).json({
                    content: [
                        {
                            type: "text",
                            text: `❌ Authentication required

Please run the 'authenticate_google' tool first to connect your Google account.

This will list documents from your personal Google Drive.`
                        }
                    ]
                });
            }
            return res.status(200).json({
                content: [
                    {
                        type: "text",
                        text: `Unknown tool: ${toolName}. Available tools: authenticate_google, create_document_oauth, list_documents_oauth`
                    }
                ]
            });
        }
        return res.status(400).json({
            error: `Unknown method: ${method}`
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'MCP OAuth Handler Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
