/**
 * Simple HTTP-based MCP server for Claude Web
 * Following MCP spec more strictly
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
