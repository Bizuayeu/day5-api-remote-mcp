/**
 * Extremely simple endpoint for Claude Web testing
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // Always return success with minimal MCP response
    return res.status(200).json({
        tools: [
            {
                name: "test",
                description: "Test tool",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ]
    });
}
