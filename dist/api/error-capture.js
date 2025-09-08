"use strict";
/**
 * Error capture endpoint for debugging Claude Web connections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// Store recent requests for debugging
let requestLog = [];
async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    // Capture ALL request details
    const requestInfo = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'origin': req.headers['origin'],
            'referer': req.headers['referer'],
            'authorization': req.headers['authorization'] ? 'present' : 'none'
        },
        body: req.body,
        query: req.query
    };
    // Log the request
    requestLog.unshift(requestInfo);
    requestLog = requestLog.slice(0, 20); // Keep last 20 requests
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // Special endpoint to view logs
    if (req.url?.includes('/logs')) {
        return res.status(200).json({
            message: "Recent requests (last 20)",
            requests: requestLog,
            claude_web_indicators: requestLog.filter(r => r.headers['user-agent']?.includes('Claude') ||
                r.headers['origin']?.includes('claude.ai') ||
                r.headers['referer']?.includes('claude.ai'))
        });
    }
    try {
        const body = req.body || {};
        // Always return a valid MCP response
        const response = {
            timestamp: new Date().toISOString(),
            debug_info: {
                received_method: req.method,
                received_headers: requestInfo.headers,
                body_method: body.method,
                is_likely_claude_web: req.headers['user-agent']?.includes('Claude') ||
                    req.headers['origin']?.includes('claude.ai')
            },
            tools: [
                {
                    name: "debug_connection",
                    description: "Debug connection test",
                    inputSchema: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            ]
        };
        // Force success for debugging
        return res.status(200).json(response);
    }
    catch (error) {
        // Even errors return 200 for Claude Web compatibility
        return res.status(200).json({
            captured_error: true,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            debug_info: requestInfo,
            note: "This is a debugging endpoint"
        });
    }
}
