/**
 * MCP Version Testing Endpoint
 * Tests different protocol versions Claude Web might expect
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
