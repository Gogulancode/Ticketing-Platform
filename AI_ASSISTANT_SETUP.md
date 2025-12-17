# AI Assistant Setup Guide

Your ticketing platform has built-in AI assistant features for:
- **Auto-categorization** of tickets
- **Response suggestions** for agents
- **Ticket summarization**

## Quick Setup Options

### Option 1: DeepSeek Cloud API (Recommended for Demo)

DeepSeek offers very affordable pricing and high-quality responses.

1. **Get API Key:**
   - Visit https://platform.deepseek.com
   - Sign up and create an API key
   - DeepSeek offers free credits for new users

2. **Configure in UI:**
   - Login as Admin
   - Go to **Settings** → **AI Configuration** tab
   - Toggle **Enable AI Features** ON
   - Provider: **DeepSeek** (default)
   - Enter your API Key
   - Model: `deepseek-chat`
   - Click **Save**
   - Click **Test Connection** to verify

3. **Or configure in appsettings.json:**
   ```json
   "AISettings": {
     "Enabled": true,
     "Provider": "deepseek",
     "ApiKey": "sk-your-api-key-here",
     "BaseUrl": "https://api.deepseek.com/v1",
     "Model": "deepseek-chat",
     "MaxTokens": 1024,
     "Temperature": 0.3,
     "TimeoutSeconds": 60
   }
   ```

---

### Option 2: Local LLM with Ollama (Free, No API Key)

Run AI completely locally without any cloud dependency.

1. **Install Ollama:**
   ```powershell
   # Download from https://ollama.ai/download
   # Or use winget:
   winget install Ollama.Ollama
   ```

2. **Pull a DeepSeek model:**
   ```powershell
   # DeepSeek Coder (6.7B parameters - good balance)
   ollama pull deepseek-coder:6.7b
   
   # Or smaller/faster options:
   ollama pull phi                    # Microsoft Phi-2 (2.7B)
   ollama pull mistral               # Mistral 7B
   ollama pull llama2                # Meta Llama 2 7B
   ```

3. **Start Ollama server:**
   ```powershell
   ollama serve
   ```

4. **Configure in UI:**
   - Go to **Settings** → **AI Configuration**
   - Toggle **Enable AI Features** ON
   - Provider: **Ollama (Local)**
   - Base URL: `http://localhost:11434/v1`
   - Model: `deepseek-coder:6.7b` (or your chosen model)
   - Leave API Key empty
   - Click **Save**

5. **Or configure in appsettings.json:**
   ```json
   "AISettings": {
     "Enabled": true,
     "Provider": "ollama",
     "ApiKey": "",
     "BaseUrl": "http://localhost:11434/v1",
     "Model": "deepseek-coder:6.7b",
     "MaxTokens": 1024,
     "Temperature": 0.3,
     "TimeoutSeconds": 120
   }
   ```

---

### Option 3: OpenAI (GPT-4)

For highest quality responses (higher cost).

1. **Get API Key from OpenAI:**
   - Visit https://platform.openai.com/api-keys

2. **Configure:**
   ```json
   "AISettings": {
     "Enabled": true,
     "Provider": "openai",
     "ApiKey": "sk-your-openai-key",
     "BaseUrl": "https://api.openai.com/v1",
     "Model": "gpt-4-turbo",
     "MaxTokens": 1024,
     "Temperature": 0.3,
     "TimeoutSeconds": 60
   }
   ```

---

## Using AI Features

Once configured, AI features appear in the ticket detail view:

### 1. Smart Categorization
- Click **Categorize** on any ticket
- AI analyzes subject and description
- Suggests best category and priority
- Shows confidence level and reasoning
- One-click to apply suggestions

### 2. Response Suggestions
- Select tone: Professional, Friendly, or Formal
- Click **Generate Suggestions**
- AI provides 3 contextual response drafts
- One-click to insert into reply

### 3. Ticket Summarization
- Click **Summarize** tab
- AI creates bullet-point summary
- Tracks key issues and resolution status
- Lists action items

---

## Troubleshooting

### Connection Test Fails
1. Verify API key is correct
2. Check Base URL is accessible
3. For Ollama: ensure `ollama serve` is running
4. Check firewall/proxy settings

### Slow Responses
1. Increase `TimeoutSeconds` to 120
2. For local: use smaller model (phi, mistral)
3. Reduce `MaxTokens` to 512

### Poor Quality Suggestions
1. Increase `MaxTokens` to 2048
2. Adjust `Temperature` (0.1-0.5)
3. Try different model

---

## Provider Comparison

| Provider | Cost | Quality | Speed | Privacy |
|----------|------|---------|-------|---------|
| DeepSeek | $ | ★★★★☆ | Fast | Cloud |
| Ollama | Free | ★★★☆☆ | Varies | Local |
| OpenAI | $$$ | ★★★★★ | Fast | Cloud |
| Azure | $$ | ★★★★★ | Fast | Enterprise |

---

## API Endpoints

The AI features are exposed via REST API:

```
GET  /api/ai/status           - Check AI connection status
POST /api/ai/categorize       - Categorize a ticket
POST /api/ai/suggest          - Get response suggestions
POST /api/ai/summarize        - Summarize ticket thread
GET  /api/ai/settings         - Get AI settings (admin)
PUT  /api/ai/settings         - Update AI settings (admin)
GET  /api/ai/settings/providers - List available providers
POST /api/ai/settings/test    - Test connection
```
