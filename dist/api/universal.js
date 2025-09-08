/**
 * Universal MCP handler that accepts all HTTP methods
 * and logs everything for debugging
 */
// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
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
    // Log request details for debugging
    console.log('===== INCOMING REQUEST =====');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('===========================');
    try {
        // Accept ANY method (GET, POST, PUT, DELETE, etc.)
        const body = req.body || req.query || {};
        // Try to extract method from various possible locations
        const method = body.method ||
            body.action ||
            body.command ||
            req.query.method ||
            req.query.action ||
            req.headers['x-mcp-method'] ||
            '';
        // If no method specified but it's a GET request, assume tools/list
        if (!method && req.method === 'GET') {
            return res.status(200).json({
                tools: [
                    {
                        name: "universal_test",
                        description: "Universal test tool",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    }
                ]
            });
        }
        // Handle tools/list (various formats)
        if (method.includes('list') || method.includes('tools') || method === '') {
            return res.status(200).json({
                tools: [
                    {
                        name: "test_universal",
                        description: "Test tool from universal handler",
                        inputSchema: {
                            type: "object",
                            properties: {
                                message: {
                                    type: "string",
                                    description: "Test message"
                                }
                            },
                            required: []
                        }
                    }
                ]
            });
        }
        // Handle tools/call
        if (method.includes('call') || method.includes('execute')) {
            const params = body.params || body.arguments || body;
            const toolName = params.name || params.tool || body.tool || 'test_universal';
            const toolArgs = params.arguments || params.args || body.arguments || {};
            return res.status(200).json({
                content: [
                    {
                        type: "text",
                        text: `Universal handler received: ${req.method} request with tool: ${toolName}, args: ${JSON.stringify(toolArgs)}`
                    }
                ]
            });
        }
        // Default response showing what was received
        return res.status(200).json({
            message: "Universal handler received your request",
            received: {
                method: req.method,
                body: body,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'content-type': req.headers['content-type']
                }
            },
            suggestion: "Try sending {method: 'tools/list'} or {method: 'tools/call', params: {name: 'test_universal'}}"
        });
    }
    catch (error) {
        console.error('Universal Handler Error:', error);
        return res.status(200).json({
            error: 'Error processing request',
            message: error instanceof Error ? error.message : 'Unknown error',
            note: 'But returning 200 to avoid connection issues'
        });
    }
}
