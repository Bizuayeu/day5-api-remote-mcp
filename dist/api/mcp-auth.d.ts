/**
 * MCP endpoint with optional authentication support
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
