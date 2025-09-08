/**
 * WebSocket-like MCP server using Server-Sent Events and POST
 * For Claude Web compatibility
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
