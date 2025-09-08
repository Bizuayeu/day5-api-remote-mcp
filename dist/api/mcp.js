"use strict";
/**
 * Day 5 - Remote MCP API Endpoint
 * Vercel Serverless Function for Claude Web Custom Connectors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const zod_1 = require("zod");
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
// CORS headers for Claude Web
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};
// MCP Request/Response schemas
const MCPToolCallSchema = zod_1.z.object({
    method: zod_1.z.literal('tools/call'),
    params: zod_1.z.object({
        name: zod_1.z.string(),
        arguments: zod_1.z.record(zod_1.z.any()).optional()
    })
});
const MCPListToolsSchema = zod_1.z.object({
    method: zod_1.z.literal('tools/list'),
    params: zod_1.z.object({}).optional()
});
// Tool argument schemas (from Day4)
const CreateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).describe("Title of document to create")
});
const WriteToDocumentSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe("Document ID to write to"),
    content: zod_1.z.string().max(10000).describe("Text content to insert"),
    insertIndex: zod_1.z.number().optional().describe("Insert position (default: 1)")
});
const ListDocumentsSchema = zod_1.z.object({
    maxResults: zod_1.z.number().min(1).max(50).optional().describe("Max documents (default: 10)")
});
// EpisodicRAG Google Docs Service (optimized for Vercel)
class VercelEpisodicRAGService {
    docsApi;
    driveApi;
    episodicRAGFolderId = null;
    constructor() {
        // Service Account authentication from environment
        const auth = new google_auth_library_1.GoogleAuth({
            credentials: this.getServiceAccountCredentials(),
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        this.docsApi = new googleapis_1.docs_v1.Docs({ auth });
        this.driveApi = new googleapis_1.drive_v3.Drive({ auth });
    }
    getServiceAccountCredentials() {
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable required');
        }
        try {
            return JSON.parse(serviceAccountKey);
        }
        catch (error) {
            throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format');
        }
    }
    async getEpisodicRAGFolder() {
        if (this.episodicRAGFolderId) {
            return this.episodicRAGFolderId;
        }
        const searchResponse = await this.driveApi.files.list({
            q: "name='EpisodicRAG' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id,name)'
        });
        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
            this.episodicRAGFolderId = searchResponse.data.files[0].id;
            return this.episodicRAGFolderId;
        }
        // Create folder if not exists
        const createResponse = await this.driveApi.files.create({
            requestBody: {
                name: 'EpisodicRAG',
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });
        this.episodicRAGFolderId = createResponse.data.id;
        return this.episodicRAGFolderId;
    }
    async createDocument(title) {
        const folderId = await this.getEpisodicRAGFolder();
        const response = await this.driveApi.files.create({
            requestBody: {
                name: title,
                mimeType: 'application/vnd.google-apps.document',
                parents: [folderId]
            },
            fields: 'id,name,createdTime,modifiedTime,webViewLink'
        });
        const file = response.data;
        return {
            id: file.id,
            title: file.name,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink
        };
    }
    async writeToDocument(documentId, content, insertIndex = 1) {
        await this.docsApi.documents.batchUpdate({
            documentId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: insertIndex },
                            text: content
                        }
                    }
                ]
            }
        });
    }
    async listLoopDocuments(maxResults = 10) {
        const folderId = await this.getEpisodicRAGFolder();
        const response = await this.driveApi.files.list({
            q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and name contains 'Loop' and trashed=false`,
            orderBy: 'modifiedTime desc',
            pageSize: maxResults,
            fields: 'files(id,name,createdTime,modifiedTime,webViewLink)'
        });
        return response.data.files?.map(file => ({
            id: file.id,
            title: file.name,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink
        })) || [];
    }
    async createLearningLogDocument() {
        const title = `Remote Loop Learning Day1-5 - ${new Date().toLocaleDateString()}`;
        const document = await this.createDocument(title);
        const content = `EpisodicRAG Remote Learning Record

Generated: ${new Date().toLocaleString()}
Source: Claude Web via Remote MCP
Location: EpisodicRAG Folder

=== Day1-4 Foundation ===
Day1: Python basics and JSON operations
Day2: Local MCP server and tool creation
Day3: Google API authentication systems
Day4: OAuth2 + Local MCP integration

=== Day5: Remote MCP Revolution ===
- Local MCP → Remote MCP Server transformation
- Vercel serverless deployment
- Claude Web Custom Connectors integration
- Universal access architecture (Desktop + Web)

Technical Achievement:
- Vercel function: Request/Response MCP protocol
- Service Account: Server-side Google API authentication
- EpisodicRAG: Centralized knowledge management
- 10-second optimization: Efficient API operations

This demonstrates the complete evolution from local Python functions to scalable remote API integration, all within the EpisodicRAG knowledge framework.

Generated by Day5 Remote MCP - Vercel Serverless Function`;
        await this.writeToDocument(document.id, content);
        return document;
    }
}
// Main handler function
async function handler(req, res) {
    // Apply CORS headers for ALL requests (including OPTIONS)
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({}).end();
    }
    try {
        // Parse MCP request
        const body = req.body;
        // Handle tools/list
        if (body?.method === 'tools/list') {
            // Return proper MCP protocol response
            const tools = [
                {
                    name: "create_document",
                    description: "Create a new Google Docs document in EpisodicRAG folder",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Title of the document to create",
                                minLength: 1,
                                maxLength: 200
                            }
                        },
                        required: ["title"]
                    }
                },
                {
                    name: "write_to_document",
                    description: "Write text to a Google Docs document",
                    inputSchema: {
                        type: "object",
                        properties: {
                            documentId: {
                                type: "string",
                                description: "Document ID to write to"
                            },
                            content: {
                                type: "string",
                                description: "Text content to insert",
                                maxLength: 10000
                            },
                            insertIndex: {
                                type: "number",
                                description: "Insert position index (default: 1)"
                            }
                        },
                        required: ["documentId", "content"]
                    }
                },
                {
                    name: "list_loop_documents",
                    description: "List Loop documents in EpisodicRAG folder",
                    inputSchema: {
                        type: "object",
                        properties: {
                            maxResults: {
                                type: "number",
                                description: "Maximum number of documents (default: 10)",
                                minimum: 1,
                                maximum: 50
                            }
                        },
                        required: []
                    }
                },
                {
                    name: "create_learning_log",
                    description: "Auto-generate Day1-5 learning record in EpisodicRAG",
                    inputSchema: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            ];
            return res.status(200).json({ tools });
        }
        // Handle tools/call
        if (body?.method === 'tools/call') {
            const { name, arguments: args } = MCPToolCallSchema.parse(body).params;
            const service = new VercelEpisodicRAGService();
            switch (name) {
                case "create_document": {
                    const { title } = CreateDocumentSchema.parse(args);
                    const document = await service.createDocument(title);
                    return res.status(200).json({
                        content: [
                            {
                                type: "text",
                                text: `Document created in EpisodicRAG folder via Remote MCP!\n\nTitle: ${document.title}\nID: ${document.id}\nURL: ${document.webViewLink}\nCreated: ${new Date(document.createdTime).toLocaleString()}\n\nSource: Claude Web → Vercel → Google Docs API`
                            }
                        ]
                    });
                }
                case "write_to_document": {
                    const { documentId, content, insertIndex } = WriteToDocumentSchema.parse(args);
                    await service.writeToDocument(documentId, content, insertIndex);
                    return res.status(200).json({
                        content: [
                            {
                                type: "text",
                                text: `Text written to EpisodicRAG document via Remote MCP!\n\nDocument ID: ${documentId}\nContent Length: ${content.length} characters\nURL: https://docs.google.com/document/d/${documentId}/edit`
                            }
                        ]
                    });
                }
                case "list_loop_documents": {
                    const { maxResults } = ListDocumentsSchema.parse(args || {});
                    const documents = await service.listLoopDocuments(maxResults);
                    const documentsList = documents.map((doc, index) => `${index + 1}. ${doc.title}\n   ID: ${doc.id}\n   Modified: ${new Date(doc.modifiedTime).toLocaleString()}\n   URL: ${doc.webViewLink}`).join('\n\n');
                    return res.status(200).json({
                        content: [
                            {
                                type: "text",
                                text: `Loop Documents in EpisodicRAG (Remote MCP) - ${documents.length} found:\n\n${documentsList || 'No Loop documents found.'}`
                            }
                        ]
                    });
                }
                case "create_learning_log": {
                    const document = await service.createLearningLogDocument();
                    return res.status(200).json({
                        content: [
                            {
                                type: "text",
                                text: `Day1-5 Learning Record created via Remote MCP!\n\nTitle: ${document.title}\nURL: ${document.webViewLink}\n\nThis record documents the complete journey from Day1 Python to Day5 Remote MCP, generated by Claude Web through Vercel serverless function!`
                            }
                        ]
                    });
                }
                default:
                    return res.status(400).json({
                        error: `Unknown tool: ${name}`
                    });
            }
        }
        // Invalid request
        return res.status(400).json({
            error: "Invalid MCP request format"
        });
    }
    catch (error) {
        console.error('MCP Handler Error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
}
