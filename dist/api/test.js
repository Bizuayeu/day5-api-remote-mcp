/**
 * Test endpoint for debugging Custom Connector
 */
export default async function handler(req, res) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
    // Apply CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // Log request details
    const requestInfo = {
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        url: req.url
    };
    console.log('Incoming request:', JSON.stringify(requestInfo, null, 2));
    // Simple test response
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'Test endpoint working',
            timestamp: new Date().toISOString()
        });
    }
    // For POST requests, echo back with MCP-style response
    if (req.method === 'POST') {
        const body = req.body || {};
        // If it's a tools/list request
        if (body.method === 'tools/list' || body.method === 'list_tools') {
            return res.status(200).json({
                tools: [
                    {
                        name: "test_tool",
                        description: "Simple test tool",
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
        // Echo back the request
        return res.status(200).json({
            echo: body,
            received_at: new Date().toISOString()
        });
    }
    return res.status(405).json({ error: 'Method not allowed' });
}
