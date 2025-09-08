# Day 5: APIs From Remote MCP

## 学習目標
Day4のLocal MCPサーバーをRemote MCPサーバーとしてデプロイし、Claude WebからもGoogle Docs操作を可能にする

## 今日学ぶこと
1. Local MCP vs Remote MCP の違い
2. HTTP/WebSocketベースのMCPサーバー実装
3. Claude Web Custom Connectors との統合
4. スケーラブルなAPI統合アーキテクチャ
5. 本格的なEpisodicRAGシステムの基盤構築

## プロジェクト構造
```
Day5_APIsFromRemoteMCP/
├── README.md              # このファイル
├── package.json           # Node.js プロジェクト設定
├── tsconfig.json          # TypeScript設定
├── .env.example           # 環境変数のサンプル
├── .gitignore             # Git除外ファイル
├── vercel.json            # Vercel デプロイ設定（オプション）
├── src/
│   ├── server.ts          # Remote MCPサーバー本体
│   ├── routes/
│   │   ├── mcp.ts         # MCP protocol endpoints
│   │   └── health.ts      # ヘルスチェック
│   ├── services/
│   │   └── google-docs-remote.ts # Remote用Google Docsサービス
│   ├── middleware/
│   │   ├── auth.ts        # 認証ミドルウェア
│   │   ├── cors.ts        # CORS設定
│   │   └── error.ts       # エラーハンドリング
│   └── utils/
│       ├── mcp-protocol.ts # MCPプロトコル実装
│       └── websocket.ts   # WebSocket管理
├── deployment/
│   ├── vercel/            # Vercel用設定
│   ├── railway/           # Railway用設定
│   └── docker/            # Docker用設定
└── dist/                  # コンパイル後のJavaScript
```

## Day1-4からのステップアップ

### これまでの学習 → Day5での発展
- **Day1: Python関数** → **スケーラブルなAPI関数**
- **Day2: Local MCP** → **Remote MCP Server**
- **Day3: 認証学習** → **サーバーサイド認証管理**
- **Day4: Claude Desktop統合** → **Claude Web + Custom Connectors**

## Local MCP vs Remote MCP

### Local MCP (Day4)
```
Claude Desktop ←→ Node.js Process ←→ Google APIs
     (stdio)        (localhost)       (OAuth2)
```

**特徴**:
- Claude Desktop専用
- Stdio通信（標準入出力）
- ローカルプロセス
- OAuth2認証（ユーザー権限）

### Remote MCP (Day5)  
```
Claude Web ←→ HTTP Server ←→ Google APIs
   (HTTPS)    (Remote Host)   (Service Account)
```

**特徴**:
- Claude Web + Desktop 両対応
- HTTP/WebSocket通信
- リモートサーバー
- サービスアカウント認証（サーバー権限）

## アーキテクチャ設計

### Core Components

#### 1. **Remote MCP Server**
```typescript
// HTTP endpoint for MCP protocol
app.post('/mcp', handleMCPRequest);
// WebSocket for real-time updates
app.ws('/ws', handleWebSocket);
```

#### 2. **Authentication Strategy**
```typescript
// Day3で学んだサービスアカウント認証を活用
const auth = new GoogleServiceAccount({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['docs', 'drive']
});
```

#### 3. **Claude Web Integration**
```json
// Custom Connector 設定
{
  "name": "EpisodicRAG Remote",
  "url": "https://your-server.vercel.app/mcp",
  "description": "Remote Google Docs operations"
}
```

## 技術スタック

### Backend
- **Express.js**: HTTP サーバー
- **ws**: WebSocket サポート  
- **Google APIs**: Day3・4の知識活用
- **Zod**: スキーマ検証（Day4と同じ）

### Deployment Options
1. **Vercel**: サーバーレス関数（推奨）
2. **Railway**: フルスタックホスティング
3. **Docker**: コンテナデプロイ

### Security
- **API Key認証**: カスタムコネクタ用
- **Rate Limiting**: DDoS防止
- **CORS**: クロスオリジン制御
- **Input Validation**: Zod による検証

## Day5の革新的なポイント

### 1. **Universal Access**
```
Claude Desktop (Day4) → Local MCP
Claude Web (Day5)    → Remote MCP
Mobile Apps (Future) → Same Remote MCP
```

### 2. **Scalable Architecture**
```
Single Remote Server → Multiple Client Types
                    → Multiple Google Accounts
                    → Multiple API Integrations
```

### 3. **EpisodicRAG Foundation**
- **Centralized Knowledge**: すべてのクライアントから同じEpisodicRAGフォルダーにアクセス
- **Unified API**: 一貫したGoogle Docs操作
- **Multi-User Support**: 将来的な複数ユーザー対応

## MCP Protocol Implementation

### HTTP Endpoint Design
```typescript
// MCP tools/list
GET  /mcp/tools

// MCP tools/call
POST /mcp/tools/call
{
  "name": "create_document",
  "arguments": {
    "title": "Remote Test Document"
  }
}
```

### WebSocket Real-time Updates
```typescript
// Document creation notifications
ws.send({
  "type": "document_created",
  "data": {
    "id": "doc_id",
    "url": "https://docs.google.com/..."
  }
});
```

## セキュリティ考慮事項

### 1. **API Key Management**
- Environment Variables で秘密鍵管理
- Rotation 可能な API キー設計
- Per-client access control

### 2. **Rate Limiting**
```typescript
// Per IP, Per API Key limits
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});
```

### 3. **Input Sanitization**
```typescript
// Zod schema validation
const CreateDocSchema = z.object({
  title: z.string().max(200).min(1),
  content: z.string().max(10000).optional()
});
```

## Deployment Strategy

### Phase 1: Basic Remote MCP
1. Express サーバー実装
2. Day4 tools の HTTP 版変換
3. Vercel デプロイ
4. Claude Web テスト

### Phase 2: Advanced Features
1. WebSocket リアルタイム更新
2. Multi-user support
3. Advanced error handling
4. Monitoring & Logging

### Phase 3: EpisodicRAG Integration
1. Knowledge graph connections
2. Advanced document relationships
3. AI-powered content suggestions
4. Automated knowledge curation

## 🎉 デプロイ成功！

### Railway.app でのデプロイ
- **Public URL**: https://testday5-production.up.railway.app
- **Health Check**: https://testday5-production.up.railway.app/health
- **MCP Endpoint**: https://testday5-production.up.railway.app/mcp

### Claude Web Custom Connector設定
```
Name: Railway MCP Server
URL: https://testday5-production.up.railway.app/mcp
Description: Simple MCP server hosted on Railway
```

### 利用可能なツール
- `get_time` - 現在時刻を取得
- `echo` - メッセージをエコー
- `calculate` - 簡単な数式計算

## 成功基準
- [x] Remote MCPサーバーがHTTPで動作する ✅
- [x] Claude WebでCustom Connectorが設定できる ✅
- [x] Railway.appでのデプロイ成功 ✅
- [ ] Day4と同等のGoogle Docs操作がリモートで可能
- [x] スケーラブルなアーキテクチャの基盤完成 ✅

## Day4との互換性

### Shared Tools
- `create_document` → HTTP POST /mcp/tools/call
- `write_to_document` → 同上
- `list_loop_documents` → 同上
- `create_learning_log` → 同上

### Migration Path
```
Day4 Local MCP → Day5 Remote MCP → Hybrid Usage
Claude Desktop    Claude Web        Both Platforms
```

## 次のステップ（Day6以降展望）
- **Advanced EpisodicRAG**: AIベースのナレッジキュレーション
- **Multi-API Integration**: Slack, Notion, GitHub等との統合
- **Real-time Collaboration**: リアルタイム共同編集
- **AI Assistant Integration**: GPT-4, Claude等との直接統合

## 参考リンク
- [MCP Custom Connectors](https://docs.anthropic.com/claude/docs/custom-connectors)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Google Service Account Authentication](https://cloud.google.com/docs/authentication/service-accounts)
- [WebSocket Protocol](https://developer.mozilla.org/docs/Web/API/WebSockets_API)