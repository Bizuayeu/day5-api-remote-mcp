/**
 * Health check endpoint for Remote MCP Server
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Apply CORS headers for ALL requests (including OPTIONS)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).end();
  }

  try {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Day5 Remote MCP - EpisodicRAG',
      version: '1.0.0'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}