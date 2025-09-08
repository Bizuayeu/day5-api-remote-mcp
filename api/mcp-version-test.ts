/**
 * MCP Version Testing Endpoint
 * Tests different protocol versions Claude Web might expect
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const message = req.body;
      console.log('MCP Version Test Request:', JSON.stringify(message, null, 2));

      // Handle initialize with version negotiation
      if (message.method === 'initialize') {
        // Try the latest MCP protocol version
        const protocolVersions = [
          '2024-11-05',  // Latest known version
          '2024-10-07',  // Alternative
          '0.1.0',       // Semantic version
          '1.0',         // Simple version
          '2.0'          // Alternative
        ];

        // Use the first version, or match client's preference
        const clientVersion = message.params?.protocolVersion;
        const useVersion = protocolVersions.includes(clientVersion) ? clientVersion : protocolVersions[0];

        return res.status(200).json({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: useVersion,
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'mcp-version-test',
              version: '1.0.0'
            }
          }
        });
      }

      if (message.method === 'tools/list') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: [
              {
                name: 'version_test',
                description: 'Test different MCP protocol versions',
                inputSchema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'Test message'
                    }
                  },
                  required: []
                }
              }
            ]
          }
        });
      }

      if (message.method === 'tools/call') {
        const toolName = message.params?.name;
        if (toolName === 'version_test') {
          return res.status(200).json({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: '🎉 MCP Version Test Success!\n\nClaude Web successfully connected and can call tools.\nProtocol version compatibility confirmed!'
                }
              ]
            }
          });
        }
      }

      // Unknown method
      return res.status(200).json({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`
        }
      });

    } catch (error) {
      console.error('MCP Version Test Error:', error);
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

  // GET request - show available versions
  return res.status(200).json({
    message: 'MCP Version Testing Server',
    supported_versions: [
      '2024-11-05',
      '2024-10-07', 
      '0.1.0',
      '1.0',
      '2.0'
    ],
    note: 'This endpoint tests different MCP protocol versions for Claude Web compatibility'
  });
}