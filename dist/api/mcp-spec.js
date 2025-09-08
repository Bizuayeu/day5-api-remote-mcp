/**
 * MCP Specification Compliant Endpoint
 * Based on standard JSON-RPC 2.0 protocol
 */
export default async function handler(req, res) {
    // Essential CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    // Handle GET - return capabilities
    if (req.method === 'GET') {
        res.status(200).json({
            mcp_version: "1.0",
            capabilities: {
                tools: true,
                prompts: false,
                resources: false
            },
            server_info: {
                name: "day5-remote-mcp",
                version: "1.0.0"
            }
        });
        return;
    }
    // Handle POST - MCP/JSON-RPC requests
    if (req.method === 'POST') {
        try {
            const { id, method, params } = req.body || {};
            // Initialize/handshake request
            if (method === 'initialize') {
                res.status(200).json({
                    jsonrpc: "2.0",
                    id: id || 1,
                    result: {
                        protocolVersion: "1.0",
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: "day5-remote-mcp",
                            version: "1.0.0"
                        }
                    }
                });
                return;
            }
            // List available tools
            if (method === 'tools/list') {
                res.status(200).json({
                    jsonrpc: "2.0",
                    id: id || 1,
                    result: {
                        tools: [
                            {
                                name: "hello",
                                description: "Say hello",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        name: {
                                            type: "string",
                                            description: "Name to greet"
                                        }
                                    },
                                    required: []
                                }
                            }
                        ]
                    }
                });
                return;
            }
            // Call a tool
            if (method === 'tools/call') {
                const toolName = params?.name;
                const args = params?.arguments || {};
                if (toolName === 'hello') {
                    res.status(200).json({
                        jsonrpc: "2.0",
                        id: id || 1,
                        result: {
                            content: [
                                {
                                    type: "text",
                                    text: `Hello, ${args.name || 'World'}!`
                                }
                            ]
                        }
                    });
                    return;
                }
                // Tool not found error
                res.status(200).json({
                    jsonrpc: "2.0",
                    id: id || 1,
                    error: {
                        code: -32601,
                        message: `Tool not found: ${toolName}`
                    }
                });
                return;
            }
            // Method not found
            res.status(200).json({
                jsonrpc: "2.0",
                id: id || 1,
                error: {
                    code: -32601,
                    message: `Method not found: ${method}`
                }
            });
            return;
        }
        catch (error) {
            // Parse error
            res.status(200).json({
                jsonrpc: "2.0",
                id: null,
                error: {
                    code: -32700,
                    message: "Parse error",
                    data: error instanceof Error ? error.message : "Unknown error"
                }
            });
            return;
        }
    }
    // Method not allowed
    res.status(405).json({
        error: "Method not allowed"
    });
}
