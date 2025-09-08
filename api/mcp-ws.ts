/**
 * Simple HTTP-based MCP server for Claude Web
 * Following MCP spec more strictly
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const message = req.body;
    
    // Initialize
    if (message.method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'simple-mcp',
            version: '1.0.0'
          }
        }
      });
    }

    // List tools
    if (message.method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          tools: [
            {
              name: 'get_time',
              description: 'Get current time',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            },
            {
              name: 'echo',
              description: 'Echo back the input',
              inputSchema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Message to echo'
                  }
                },
                required: ['message']
              }
            },
            {
              name: 'calculate',
              description: 'Perform simple math calculation',
              inputSchema: {
                type: 'object',
                properties: {
                  expression: {
                    type: 'string',
                    description: 'Math expression (e.g., 2+3*4)'
                  }
                },
                required: ['expression']
              }
            }
          ]
        }
      });
    }

    // Call tool
    if (message.method === 'tools/call') {
      const toolName = message.params?.name;
      const args = message.params?.arguments || {};

      if (toolName === 'get_time') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `🕐 Current time: ${new Date().toISOString()}`
              }
            ]
          }
        });
      }

      if (toolName === 'echo') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `🔊 Echo: ${args.message || 'No message provided'}`
              }
            ]
          }
        });
      }

      if (toolName === 'calculate') {
        try {
          const expression = args.expression;
          if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
            throw new Error('Invalid characters');
          }
          const result = Function('"use strict"; return (' + expression + ')')();
          
          return res.status(200).json({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `🧮 ${expression} = ${result}`
                }
              ]
            }
          });
        } catch (error) {
          return res.status(200).json({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `❌ Error calculating: ${args.expression}`
                }
              ]
            }
          });
        }
      }

      // Unknown tool
      return res.status(200).json({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: `Unknown tool: ${toolName}`
        }
      });
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