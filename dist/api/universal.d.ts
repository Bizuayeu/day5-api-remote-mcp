/**
 * Universal MCP handler that accepts all HTTP methods
 * and logs everything for debugging
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
