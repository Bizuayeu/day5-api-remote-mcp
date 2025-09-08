"use strict";
/**
 * OAuth2 Authentication Start Endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const google_auth_library_1 = require("google-auth-library");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
async function handler(req, res) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        // OAuth2 credentials from Day4
        const oauth2Client = new google_auth_library_1.GoogleAuth({
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ],
            // Use OAuth2 instead of Service Account for user selection
        });
        // Generate OAuth2 authorization URL
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ||
            '393088014937-cveqsib5ph67i5uji7pfhjvm63n7qdgq.apps.googleusercontent.com';
        const REDIRECT_URI = `https://day5-api-s-from-remote-mcp.vercel.app/api/auth-callback`;
        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive')}&` +
            `access_type=offline&` +
            `prompt=select_account`; // Force account selection
        if (req.method === 'GET') {
            // Direct browser redirect
            res.writeHead(302, { Location: authUrl });
            res.end();
            return;
        }
        // API response with auth URL
        return res.status(200).json({
            message: "Authentication required",
            auth_url: authUrl,
            instructions: "Open this URL to authenticate with your Google account"
        });
    }
    catch (error) {
        return res.status(200).json({
            error: 'Authentication setup failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
