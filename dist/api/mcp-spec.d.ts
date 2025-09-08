/**
 * MCP Specification Compliant Endpoint
 * Based on standard JSON-RPC 2.0 protocol
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<void>;
