# 🌟 Xvitz - Magical AI Content Creator

> **Transform your X (Twitter) presence with AI-powered magical content creation!**

Xvitz is a sophisticated AI-powered application that automatically generates engaging, viral-worthy content for X (Twitter) using the magical Xvitz AI agent from the realm of Moscownpur. Create compelling tweets with just one click!

## ✨ Features

### 🎯 **Core Capabilities**
- **One-Click Content Creation**: Generate and post tweets automatically
- **AI-Powered Content**: Uses Groq's Llama-3.3-70b model for high-quality content
- **Multiple Content Categories**: Creative, Writing, Moscownpur, and Random themes
- **Custom Prompts**: Write your own prompts for specific content needs
- **Memory System**: Maintains conversation context (last 5 interactions)
- **Beautiful UI**: Modern, responsive web interface with magical design
- **Real-time Feedback**: See exactly what was generated and posted

### 🤖 **Xvitz AI Agent**
- **Personality**: Engaging, interactive, witty, and trend-aware
- **Specialization**: Optimized for X (Twitter) content creation
- **Memory**: Maintains conversation history for contextual responses
- **Token Limit**: 200 tokens per response for Twitter-friendly content
- **Website Integration**: Naturally promotes www.moscownpur.in

### 🎨 **Content Categories**
- **Creative**: Storytelling, worldbuilding, character creation
- **Writing**: Writing prompts, overcoming writer's block, inspiration
- **Moscownpur**: Magical realm, creative tools, community features
- **Random**: Mixed creative prompts for variety

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Twitter Developer Account with API access
- Groq API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd X
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Twitter API Credentials (OAuth 1.0a)
   TWITTER_APP_KEY=your_twitter_app_key
   TWITTER_APP_SECRET=your_twitter_app_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   
   # Groq API Key
   GROQ_API_KEY=your_groq_api_key
   
   # Optional: Proxy Configuration
   HTTP_PROXY=your_proxy_url
   
   # Optional: Bearer Token (comment out if using OAuth 1.0a)
   # TWITTER_BEARER_TOKEN=your_bearer_token
   ```

4. **Start the application**
   ```bash
   node Xvitz.js
   ```

5. **Open your browser**
   Navigate to `http://localhost:5174`

## 🎯 Usage

### Web Interface

1. **Choose a Category**: Select from Random, Creative, Writing, or Moscownpur
2. **Custom Prompt** (Optional): Write your own prompt for specific content
3. **Generate Content**: Click "Generate Content" to preview
4. **Auto Post**: Click "Auto Post to X" to create and post immediately

### API Endpoints

#### Generate Content (Preview Only)
```bash
GET /generate?category=creative
GET /generate?prompt=Create a viral tweet about magic
```

#### Auto Post to X
```bash
GET /auto-tweet?category=writing
GET /auto-tweet?prompt=Write about creativity
```

#### Post Custom Text
```bash
GET /post?text=Your custom tweet text
```

#### Test Xvitz Agent
```bash
GET /test-xvitz?prompt=Hello Xvitz!
```

#### Memory Management
```bash
GET /memory                    # View memory
GET /clear-memory             # Clear memory
```

#### System Information
```bash
GET /health                   # Health check
GET /diagnose                 # System diagnostics
```

## 🏗️ Architecture

### File Structure
```
X/
├── Xvitz.js                 # Main application server
├── social-agents.js         # AI agent definitions
├── public/
│   └── index.html          # Web interface
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md              # This documentation
```

### Core Components

#### 1. **Xvitz.js** - Main Server
- Express.js web server
- Twitter API integration
- Xvitz agent initialization
- Content generation and posting logic
- Static file serving

#### 2. **social-agents.js** - AI Agents
- `BaseSocialAgent`: Base class with common functionality
- `XAgent`: Specialized for X (Twitter) content
- Memory management (last 5 messages)
- 200-token output limit
- Platform-specific personality

#### 3. **public/index.html** - Web Interface
- Modern, responsive design
- Real-time content generation
- Category selection
- Custom prompt input
- Status feedback and animations

## 🔧 Configuration

### Twitter API Setup

1. **Create a Twitter Developer Account**
   - Visit [Twitter Developer Portal](https://developer.twitter.com/)
   - Apply for a developer account
   - Create a new app

2. **Get API Credentials**
   - App Key and App Secret
   - Access Token and Access Secret
   - Enable Read and Write permissions

3. **Environment Variables**
   ```env
   TWITTER_APP_KEY=your_app_key
   TWITTER_APP_SECRET=your_app_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   ```

### Groq API Setup

1. **Get Groq API Key**
   - Visit [Groq Console](https://console.groq.com/)
   - Create an account
   - Generate an API key

2. **Environment Variable**
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

### Proxy Configuration (Optional)
```env
HTTP_PROXY=https://your-proxy-server:port
```

## 🎨 Customization

### Adding New Content Categories

Edit the `CONTENT_PROMPTS` object in `Xvitz.js`:

```javascript
const CONTENT_PROMPTS = {
  // ... existing categories
  newCategory: [
    "Prompt 1 for new category",
    "Prompt 2 for new category",
    "Prompt 3 for new category"
  ]
};
```

### Modifying Xvitz Personality

Edit the `buildMessages` method in `XAgent` class in `social-agents.js`:

```javascript
buildMessages(userMessage) {
  const systemPrompt = `You are Xvitz, [your custom personality description]...`;
  // ... rest of the method
}
```

### Changing Output Token Limit

Modify the `maxTokens` property in the agent classes:

```javascript
class XAgent extends BaseSocialAgent {
  constructor() {
    super("Xvitz", "X (Twitter)", "personality");
    this.maxTokens = 300; // Change from 200 to desired limit
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **403 Forbidden Error**
- **Cause**: Twitter API permissions or authentication issues
- **Solution**: 
  - Ensure OAuth 1.0a credentials are correct
  - Comment out `TWITTER_BEARER_TOKEN` in `.env`
  - Verify app has Read and Write permissions

#### 2. **401 Unauthorized Error**
- **Cause**: Invalid API credentials
- **Solution**: 
  - Check all Twitter API credentials in `.env`
  - Ensure credentials are not expired
  - Verify app permissions

#### 3. **Groq API Errors**
- **Cause**: Invalid or missing API key
- **Solution**: 
  - Verify `GROQ_API_KEY` in `.env`
  - Check Groq account status and credits

#### 4. **Proxy Connection Issues**
- **Cause**: Invalid proxy configuration
- **Solution**: 
  - Verify proxy URL format
  - Test proxy connectivity
  - Remove proxy if not needed

### Debug Endpoints

Use these endpoints to diagnose issues:

```bash
# Check system health
curl http://localhost:5174/health

# View system diagnostics
curl http://localhost:5174/diagnose

# Test Xvitz agent
curl http://localhost:5174/test-xvitz

# View memory state
curl http://localhost:5174/memory
```

## 📊 API Response Examples

### Successful Content Generation
```json
{
  "success": true,
  "generatedContent": "🌟💡 Inspiration strike! 🚀 Found it in a sunset, a convo with a stranger, or a random dream? 🌅🗣️🌃 Share your weirdest & most wonderful sources of inspiration with me! 📝💬 #InspirationAnywhere #Moscownpur #CreativeSpark 🚀✨ Explore more sparks at www.moscownpur.in 🌐💫",
  "prompt": "Create a tweet about finding inspiration in everyday life",
  "category": "writing",
  "xvitzMemory": 5
}
```

### Successful Tweet Posting
```json
{
  "success": true,
  "tweet": {
    "data": {
      "id": "1960278433818173700",
      "text": "🌟💡 Inspiration strike! 🚀 Found it in a sunset..."
    }
  },
  "generatedContent": "🌟💡 Inspiration strike! 🚀 Found it in a sunset...",
  "prompt": "Create a tweet about finding inspiration in everyday life",
  "category": "writing",
  "xvitzMemory": 5
}
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique API keys
- Rotate credentials regularly

### API Rate Limits
- Twitter API: 300 tweets per 3-hour window
- Groq API: Check your plan limits
- Implement rate limiting if needed

### Proxy Security
- Use HTTPS proxies only
- Verify proxy server security
- Monitor proxy logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Acknowledgments

- **Moscownpur**: The magical realm that inspired Xvitz
- **Groq**: For providing the powerful Llama-3.3-70b model
- **Twitter API**: For enabling social media automation
- **Express.js**: For the robust web server framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Visit [www.moscownpur.in](https://www.moscownpur.in)
- Check the troubleshooting section above

---

**Made with ❤️ and AI Magic by the Moscownpur Team**

*Transform your social media presence with the power of AI and imagination!* ✨🚀
