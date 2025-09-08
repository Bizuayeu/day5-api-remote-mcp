/**
 * Debug endpoint that returns all request information
 */
// Store last few requests for debugging
let requestHistory = [];
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    // Capture request details
    const requestInfo = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
    };
    // Store in history (keep last 5)
    requestHistory.unshift(requestInfo);
    requestHistory = requestHistory.slice(0, 5);
    // Special endpoint to view history
    if (req.url?.includes('history')) {
        return res.status(200).json({
            message: "Request history (last 5 requests)",
            history: requestHistory
        });
    }
    try {
        const body = req.body || {};
        const method = body.method || body.action || '';
        // Always return a valid MCP response
        if (method.includes('list') || !method) {
            return res.status(200).json({
                debug: {
                    received_method: req.method,
                    received_body: body,
                    received_headers: {
                        'user-agent': req.headers['user-agent'],
                        'content-type': req.headers['content-type'],
                        'authorization': req.headers['authorization'] ? 'present' : 'none'
                    }
                },
                tools: [
                    {
                        name: "debug_tool",
                        description: "Debug tool",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    }
                ]
            });
        }
        if (method.includes('call')) {
            return res.status(200).json({
                debug: {
                    received_method: req.method,
                    received_body: body
                },
                content: [
                    {
                        type: "text",
                        text: "Debug response: " + JSON.stringify(body)
                    }
                ]
            });
        }
        // Default: echo everything back
        return res.status(200).json({
            debug: requestInfo,
            response: "Echo mode - showing what was received",
            tools: []
        });
    }
    catch (error) {
        // Return error details in response
        return res.status(200).json({
            error_occurred: true,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            error_stack: error instanceof Error ? error.stack : '',
            request_info: requestInfo,
            note: "Returning 200 to maintain connection"
        });
    }
}
