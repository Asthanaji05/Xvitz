const express = require("express");
const { TwitterApi } = require("twitter-api-v2");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { XAgent } = require("./social-agents");
require('dotenv').config();

const app = express();
const PORT = 5174; // Different port from X.js

// Serve static files from public directory
app.use(express.static('public'));

// HTTPS proxy to connect to (optional)
const proxy = process.env.HTTP_PROXY;

// Twitter API credentials from environment variables
const TWITTER_CREDENTIALS = {
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
};


// Create TwitterApi client with optional proxy
if (proxy) {
  const httpAgent = new HttpsProxyAgent(proxy);
  client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  }, { httpAgent }).readWrite;
} else {
  client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  }).readWrite;
}


// Initialize Xvitz agent
const xvitzAgent = new XAgent();

// Predefined prompts for different types of content
const CONTENT_PROMPTS = {
  creative: [
    "Create a viral tweet about the magic of storytelling",
    "Write an engaging tweet about worldbuilding and imagination",
    "Generate a tweet about character creation that will go viral",
    "Create a tweet about the power of creativity in our lives",
    "Write an inspiring tweet about following your dreams"
  ],
  writing: [
    "Give me a writing prompt that will inspire creators",
    "Create a tweet about overcoming writer's block",
    "Write about the joy of creating new worlds",
    "Generate a tweet about the magic of words",
    "Create a tweet about finding inspiration in everyday life"
  ],
  moscownpur: [
    "Tell me about the wonders of Moscownpur in a tweet",
    "Create a tweet about the magical realm of Moscownpur",
    "Write about the creative tools available in Moscownpur",
    "Generate a tweet about the community of dreamers in Moscownpur",
    "Create a tweet about the endless possibilities in Moscownpur"
  ],
  random: [
    "What's your favorite magical creature?",
    "How do you help creators find their voice?",
    "What makes a story truly epic?",
    "Share a secret about the realm of imagination",
    "Give me inspiration for a hero's journey"
  ]
};

// Function to get a random prompt from a category
function getRandomPrompt(category = 'random') {
  const prompts = CONTENT_PROMPTS[category] || CONTENT_PROMPTS.random;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Function to clean tweet text (remove extra spaces, ensure it's Twitter-friendly)
function cleanTweetText(text) {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
    .substring(0, 280); // Ensure it's within Twitter's character limit
}

// Endpoint to generate and post a tweet automatically
app.get("/auto-tweet", async (req, res) => {
  try {
    const category = req.query.category || 'random';
    const customPrompt = req.query.prompt;
    
    console.log(`🎯 Xvitz generating content for category: ${category}`);
    
    // Get the prompt
    const prompt = customPrompt || getRandomPrompt(category);
    console.log(`📝 Using prompt: "${prompt}"`);
    
    // Generate content using Xvitz
    console.log("🤖 Xvitz is creating magical content...");
    const generatedContent = await xvitzAgent.chat(prompt);
    
    // Clean the content for Twitter
    const tweetText = cleanTweetText(generatedContent);
    console.log(`✨ Generated tweet: "${tweetText}"`);
    
    // Post to Twitter
    console.log("🐦 Posting to X (Twitter)...");
    const tweet = await client.v2.tweet(tweetText);
    
    console.log("✅ Tweet posted successfully!");
    console.log("📊 Tweet ID:", tweet.data.id);
    
    res.json({ 
      success: true, 
      tweet: tweet,
      generatedContent: tweetText,
      prompt: prompt,
      category: category,
      xvitzMemory: xvitzAgent.getHistory().length
    });
    
  } catch (err) {
    console.error("❌ Error in auto-tweet:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Endpoint to generate content without posting
app.get("/generate", async (req, res) => {
  try {
    const category = req.query.category || 'random';
    const customPrompt = req.query.prompt;
    
    console.log(`🎯 Xvitz generating content for category: ${category}`);
    
    const prompt = customPrompt || getRandomPrompt(category);
    console.log(`📝 Using prompt: "${prompt}"`);
    
    const generatedContent = await xvitzAgent.chat(prompt);
    const tweetText = cleanTweetText(generatedContent);
    
    res.json({ 
      success: true, 
      generatedContent: tweetText,
      prompt: prompt,
      category: category,
      xvitzMemory: xvitzAgent.getHistory().length
    });
    
  } catch (err) {
    console.error("❌ Error generating content:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Endpoint to post a custom tweet
app.get("/post", async (req, res) => {
  try {
    const text = req.query.text;
    
    if (!text) {
      return res.status(400).json({ error: "Text parameter is required" });
    }
    
    const tweetText = cleanTweetText(text);
    console.log(`🐦 Posting custom tweet: "${tweetText}"`);
    
    const tweet = await client.v2.tweet(tweetText);
    
    console.log("✅ Custom tweet posted successfully!");
    res.json({ success: true, tweet: tweet });
    
  } catch (err) {
    console.error("❌ Error posting custom tweet:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Endpoint to test Xvitz agent
app.get("/test-xvitz", async (req, res) => {
  try {
    const testPrompt = req.query.prompt || "Hello! Tell me about yourself";
    
    console.log("🤖 Testing Xvitz agent...");
    const response = await xvitzAgent.chat(testPrompt);
    
    res.json({ 
      success: true, 
      response: response,
      prompt: testPrompt,
      xvitzMemory: xvitzAgent.getHistory().length,
      memoryHistory: xvitzAgent.getHistory()
    });
    
  } catch (err) {
    console.error("❌ Error testing Xvitz:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Endpoint to clear Xvitz memory
app.get("/clear-memory", (req, res) => {
  xvitzAgent.clearHistory();
  console.log("🧹 Xvitz memory cleared");
  res.json({ 
    success: true, 
    message: "Xvitz memory cleared",
    xvitzMemory: xvitzAgent.getHistory().length
  });
});

// Endpoint to get Xvitz memory
app.get("/memory", (req, res) => {
  res.json({ 
    success: true, 
    xvitzMemory: xvitzAgent.getHistory().length,
    memoryHistory: xvitzAgent.getHistory()
  });
});

// Diagnostic endpoint
app.get("/diagnose", (req, res) => {
  res.json({
    hasProxy: !!proxy,
    credentials: {
      hasAppKey: !!TWITTER_CREDENTIALS.appKey,
      hasAppSecret: !!TWITTER_CREDENTIALS.appSecret,
      hasAccessToken: !!TWITTER_CREDENTIALS.accessToken,
      hasAccessSecret: !!TWITTER_CREDENTIALS.accessSecret,
    },
    xvitzAgent: {
      name: xvitzAgent.name,
      platform: xvitzAgent.platform,
      memoryCount: xvitzAgent.getHistory().length,
      groqApiKey: !!process.env.GROQ_API_KEY
    },
    availableCategories: Object.keys(CONTENT_PROMPTS),
    message: "Xvitz is ready to create and post magical content!"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "Xvitz",
    timestamp: new Date().toISOString(),
    xvitzMemory: xvitzAgent.getHistory().length
  });
});

// Serve the main UI
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`🌟 Xvitz running at http://localhost:${PORT}`);
  console.log(`🤖 Xvitz Agent: ${xvitzAgent.name} (${xvitzAgent.platform})`);
  console.log(`📚 Available content categories: ${Object.keys(CONTENT_PROMPTS).join(', ')}`);
  console.log(`🌐 Ready to create and post magical content to X! ✨`);
});
