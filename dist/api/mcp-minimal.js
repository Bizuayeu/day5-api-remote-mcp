/**
 * Minimal MCP endpoint for testing Claude Web Custom Connectors
 */
// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
};
export default async function handler(req, res) {
    // Apply CORS headers to ALL responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { method, params } = req.body || {};
        // Handle different MCP methods
        switch (method) {
            case 'tools/list':
            case 'list_tools':
                return res.status(200).json({
                    tools: [
                        {
                            name: "hello_world",
                            description: "A simple hello world tool",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name to greet"
                                    }
                                },
                                required: ["name"]
                            }
                        }
                    ]
                });
            case 'tools/call':
            case 'call_tool':
                const toolName = params?.name || params?.tool_name;
                const toolArgs = params?.arguments || params?.args || {};
                if (toolName === 'hello_world') {
                    return res.status(200).json({
                        content: [
                            {
                                type: "text",
                                text: `Hello, ${toolArgs.name || 'World'}! This is Day5 Remote MCP working!`
                            }
                        ]
                    });
                }
                return res.status(400).json({
                    error: `Unknown tool: ${toolName}`
                });
            default:
                return res.status(400).json({
                    error: `Unknown method: ${method}`,
                    supported_methods: ['tools/list', 'tools/call']
                });
        }
    }
    catch (error) {
        console.error('MCP Handler Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
