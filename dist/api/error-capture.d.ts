/**
 * Error capture endpoint for debugging Claude Web connections
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
