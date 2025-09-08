/**
 * Real WebSocket MCP server for platforms that support WebSocket
 * Compatible with Railway, Render, etc.
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

const port = process.env.PORT || 3000;

// HTTP server for health checks
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url || '', true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      server: 'websocket-mcp',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'WebSocket MCP Server',
    status: 'ready',
    websocket: `wss://${req.headers.host}/`,
    note: 'Use WebSocket connection for MCP communication'
  }));
});

// WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/'
});

// MCP message handlers
const handleMessage = (message: any) => {
  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        serverInfo: {
          name: 'websocket-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [
          {
            name: 'get_current_time',
            description: 'Get current date and time',
            inputSchema: {
              type: 'object',
              properties: {
                timezone: {
                  type: 'string',
                  description: 'Timezone (e.g., Asia/Tokyo, UTC)',
                  default: 'UTC'
                }
              },
              required: []
            }
          },
          {
            name: 'calculate_math',
            description: 'Perform mathematical calculations',
            inputSchema: {
              type: 'object',
              properties: {
                expression: {
                  type: 'string',
                  description: 'Mathematical expression to evaluate'
                }
              },
              required: ['expression']
            }
          },
          {
            name: 'generate_uuid',
            description: 'Generate a UUID',
            inputSchema: {
              type: 'object',
              properties: {
                version: {
                  type: 'number',
                  description: 'UUID version (4 = random)',
                  default: 4
                }
              },
              required: []
            }
          },
          {
            name: 'encode_decode_text',
            description: 'Encode or decode text',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Text to process' },
                operation: {
                  type: 'string',
                  enum: ['base64_encode', 'base64_decode', 'url_encode', 'url_decode'],
                  description: 'Operation to perform'
                }
              },
              required: ['text', 'operation']
            }
          }
        ]
      }
    };
  }

  if (message.method === 'tools/call') {
    const toolName = message.params?.name;
    const args = message.params?.arguments || {};

    if (toolName === 'get_current_time') {
      const timezone = args.timezone || 'UTC';
      const now = new Date();
      
      let timeString;
      try {
        timeString = now.toLocaleString('en-US', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        timeString = now.toISOString();
      }
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `🕐 Current Time\n\nTimezone: ${timezone}\nTime: ${timeString}\nISO: ${now.toISOString()}`
            }
          ]
        }
      };
    }

    if (toolName === 'calculate_math') {
      try {
        const expression = args.expression;
        if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
          throw new Error('Invalid characters in expression');
        }
        const result = Function('"use strict"; return (' + expression + ')')();
        
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `🧮 Math Calculation\n\nExpression: ${expression}\nResult: ${result}`
              }
            ]
          }
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `❌ Math Error\n\nCouldn't evaluate: ${args.expression}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ]
          }
        };
      }
    }

    if (toolName === 'generate_uuid') {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `🆔 Generated UUID\n\nUUID: ${uuid}\nVersion: 4 (random)`
            }
          ]
        }
      };
    }

    if (toolName === 'encode_decode_text') {
      try {
        const { text, operation } = args;
        let result;
        
        switch (operation) {
          case 'base64_encode':
            result = Buffer.from(text, 'utf8').toString('base64');
            break;
          case 'base64_decode':
            result = Buffer.from(text, 'base64').toString('utf8');
            break;
          case 'url_encode':
            result = encodeURIComponent(text);
            break;
          case 'url_decode':
            result = decodeURIComponent(text);
            break;
          default:
            throw new Error('Unknown operation');
        }
        
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `🔄 Text ${operation.replace('_', ' ').toUpperCase()}\n\nOriginal: ${text}\nResult: ${result}`
              }
            ]
          }
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: `❌ Encoding Error\n\nOperation: ${args.operation}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ]
          }
        };
      }
    }
  }

  // Unknown method
  return {
    jsonrpc: '2.0',
    id: message.id,
    error: {
      code: -32601,
      message: `Method not found: ${message.method}`
    }
  };
};

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received:', message);
      
      const response = handleMessage(message);
      ws.send(JSON.stringify(response));
      
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(port, () => {
  console.log(`WebSocket MCP server listening on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`WebSocket: ws://localhost:${port}/`);
});