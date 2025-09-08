/**
 * Root endpoint to catch all requests
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log request details
  console.log('Root request:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Return helpful information for debugging
  return res.status(200).json({
    message: "Day5 Remote MCP Server Root",
    requested_path: req.url,
    method: req.method,
    available_endpoints: [
      "/api/mcp - Service Account version",
      "/api/mcp-oauth - OAuth2 version (recommended)",
      "/api/health - Health check",
      "/api/error-capture - Debug endpoint",
      "/api/account-info - Account information"
    ],
    recommendation: "Use /api/mcp-oauth for Claude Web Custom Connectors",
    debug_info: {
      timestamp: new Date().toISOString(),
      user_agent: req.headers['user-agent'],
      origin: req.headers['origin']
    }
  });
}