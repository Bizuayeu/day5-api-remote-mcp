"use strict";
/**
 * WebSocket-like MCP server using Server-Sent Events and POST
 * For Claude Web compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// Store active connections (in production, use Redis or similar)
const connections = new Map();
async function handler(req, res) {
    // CORS headers with WebSocket support
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Connection, Upgrade');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // Handle WebSocket upgrade simulation
    if (req.headers.upgrade === 'websocket' || req.headers.connection?.includes('Upgrade')) {
        // Simulate WebSocket handshake
        res.setHeader('Upgrade', 'websocket');
        res.setHeader('Connection', 'Upgrade');
        res.setHeader('Sec-WebSocket-Accept', 'generated-accept-key');
        return res.status(101).json({
            status: 'websocket_simulated',
            message: 'WebSocket connection established (simulated)',
            endpoints: {
                send: '/api/websocket-send',
                receive: '/api/websocket-receive'
            }
        });
    }
    // Handle regular MCP over HTTP (fallback)
    if (req.method === 'POST') {
        try {
            const { method, params, id } = req.body || {};
            // MCP Protocol handling
            switch (method) {
                case 'initialize':
                    return res.status(200).json({
                        jsonrpc: '2.0',
                        id: id || 1,
                        result: {
                            protocolVersion: '1.0',
                            capabilities: {
                                tools: {}
                            },
                            serverInfo: {
                                name: 'day5-websocket-mcp',
                                version: '1.0.0'
                            }
                        }
                    });
                case 'tools/list':
                    return res.status(200).json({
                        jsonrpc: '2.0',
                        id: id || 1,
                        result: {
                            tools: [
                                {
                                    name: 'websocket_test',
                                    description: 'Test WebSocket-compatible MCP',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {},
                                        required: []
                                    }
                                }
                            ]
                        }
                    });
                case 'tools/call':
                    const toolName = params?.name;
                    if (toolName === 'websocket_test') {
                        return res.status(200).json({
                            jsonrpc: '2.0',
                            id: id || 1,
                            result: {
                                content: [
                                    {
                                        type: 'text',
                                        text: '🎉 WebSocket-compatible MCP is working! Claude Web should be able to connect.'
                                    }
                                ]
                            }
                        });
                    }
                    break;
                default:
                    return res.status(200).json({
                        jsonrpc: '2.0',
                        id: id || 1,
                        error: {
                            code: -32601,
                            message: `Method not found: ${method}`
                        }
                    });
            }
        }
        catch (error) {
            return res.status(200).json({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error'
                }
            });
        }
    }
    // GET request - return connection info
    return res.status(200).json({
        message: 'WebSocket-compatible MCP Server',
        protocol: 'MCP over HTTP with WebSocket simulation',
        capabilities: ['tools'],
        connection_info: {
            websocket_simulation: true,
            http_fallback: true
        }
    });
}
