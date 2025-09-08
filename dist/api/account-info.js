"use strict";
/**
 * Account information endpoint to check which account is being used
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const google_auth_library_1 = require("google-auth-library");
const googleapis_1 = require("googleapis");
// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};
async function handler(req, res) {
    // Apply CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    if (req.method === 'OPTIONS') {
        return res.status(200).json({}).end();
    }
    try {
        // Service Account authentication
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            return res.status(200).json({
                error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured',
                setup_required: true
            });
        }
        const credentials = JSON.parse(serviceAccountKey);
        const auth = new google_auth_library_1.GoogleAuth({
            credentials: credentials,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents'
            ]
        });
        const driveApi = new googleapis_1.drive_v3.Drive({ auth });
        // Get account information
        const aboutResponse = await driveApi.about.get({
            fields: 'user,storageQuota'
        });
        const user = aboutResponse.data.user;
        const quota = aboutResponse.data.storageQuota;
        return res.status(200).json({
            service_account_info: {
                email: credentials.client_email,
                project_id: credentials.project_id,
                type: credentials.type
            },
            drive_account_info: {
                email: user?.emailAddress,
                displayName: user?.displayName,
                photoLink: user?.photoLink
            },
            storage_quota: {
                limit: quota?.limit,
                usage: quota?.usage,
                usageInDrive: quota?.usageInDrive,
                usageInDriveTrash: quota?.usageInDriveTrash
            },
            analysis: {
                is_personal_account: user?.emailAddress?.includes('@gmail.com'),
                quota_exceeded: quota?.usage && quota?.limit && parseInt(quota.usage) >= parseInt(quota.limit),
                available_space: quota?.limit && quota?.usage ?
                    (parseInt(quota.limit) - parseInt(quota.usage)) : 'unknown'
            }
        });
    }
    catch (error) {
        return res.status(200).json({
            error: 'Failed to get account info',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}
