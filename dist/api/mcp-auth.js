/**
 * MCP endpoint with optional authentication support
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
    // Support both GET and POST for maximum compatibility
    if (req.method === 'GET') {
        // Simple status check
        return res.status(200).json({
            status: 'ready',
            service: 'Day5 Remote MCP',
            available_methods: ['tools/list', 'tools/call']
        });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        // Log the incoming request for debugging
        console.log('Request headers:', req.headers);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        const body = req.body || {};
        // Handle different variations of method names
        const method = body.method || body.action || body.command;
        // Handle tools/list
        if (method === 'tools/list' || method === 'list' || method === 'getTools') {
            return res.status(200).json({
                tools: [
                    {
                        name: "test_connection",
                        description: "Test the MCP connection",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: "echo",
                        description: "Echo back a message",
                        inputSchema: {
                            type: "object",
                            properties: {
                                message: {
                                    type: "string",
                                    description: "Message to echo"
                                }
                            },
                            required: ["message"]
                        }
                    }
                ]
            });
        }
        // Handle tools/call
        if (method === 'tools/call' || method === 'call' || method === 'execute') {
            const params = body.params || body.arguments || {};
            const toolName = params.name || params.tool || body.tool;
            const toolArgs = params.arguments || params.args || body.arguments || {};
            if (toolName === 'test_connection') {
                return res.status(200).json({
                    content: [
                        {
                            type: "text",
                            text: "✅ MCP Connection successful! Day5 Remote MCP is working."
                        }
                    ]
                });
            }
            if (toolName === 'echo') {
                return res.status(200).json({
                    content: [
                        {
                            type: "text",
                            text: `Echo: ${toolArgs.message || 'No message provided'}`
                        }
                    ]
                });
            }
            return res.status(400).json({
                error: `Unknown tool: ${toolName}`,
                available_tools: ['test_connection', 'echo']
            });
        }
        // If method not recognized, return helpful error
        return res.status(400).json({
            error: `Unknown method: ${method}`,
            received_body: body,
            expected_format: {
                method: "tools/list or tools/call",
                params: "optional parameters"
            }
        });
    }
    catch (error) {
        console.error('MCP Handler Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
