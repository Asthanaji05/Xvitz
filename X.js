// This is a Template to post the posts on twitter (X) automaticall
const express = require("express");
const { TwitterApi } = require("twitter-api-v2");
const { HttpsProxyAgent } = require("https-proxy-agent");
require('dotenv').config();

const app = express();
const PORT = 5173;

// HTTPS proxy to connect to (optional)
// twitter-api-v2 will always use HTTPS
const proxy = process.env.HTTP_PROXY;

// Twitter API credentials from environment variables
const TWITTER_CREDENTIALS = {
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
};

// Alternative: Bearer Token (if you have one)
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Create TwitterApi client with optional proxy
let client;
if (proxy) {
  // create an instance of the `HttpsProxyAgent` class with the proxy server information
  const httpAgent = new HttpsProxyAgent(proxy);
  if (BEARER_TOKEN) {
    // Use Bearer Token authentication
    client = new TwitterApi(BEARER_TOKEN, { httpAgent }).readWrite;
  } else {
    // Use OAuth 1.0a authentication
    client = new TwitterApi(TWITTER_CREDENTIALS, { httpAgent }).readWrite;
  }
} else {
  // Use without proxy
  if (BEARER_TOKEN) {
    // Use Bearer Token authentication
    client = new TwitterApi(BEARER_TOKEN).readWrite;
  } else {
    // Use OAuth 1.0a authentication
    client = new TwitterApi(TWITTER_CREDENTIALS).readWrite;
  }
}

// Endpoint to post a tweet
app.get("/callback", async (req, res) => {
  try {
    const text = req.query.text || "Hello from Node.js server 🚀";
    console.log(`Attempting to tweet: "${text}"`);
    
    const tweet = await client.v2.tweet(text);
    console.log("Tweet posted successfully:", tweet);
    res.json({ success: true, tweet });
  } catch (err) {
    console.error("Error posting tweet:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Test endpoint to verify client configuration
app.get("/test", async (req, res) => {
  try {
    console.log("Testing client configuration...");
    const me = await client.v2.me();
    console.log("Client authenticated successfully:", me);
    res.json({ 
      success: true, 
      user: me,
      message: "Client is properly configured and authenticated"
    });
  } catch (err) {
    console.error("Client test failed:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.data || err.errors || 'No additional details available'
    });
  }
});

// Diagnostic endpoint to check configuration
app.get("/diagnose", (req, res) => {
  res.json({
    hasProxy: !!proxy,
    hasBearerToken: !!BEARER_TOKEN,
    usingOAuth: !BEARER_TOKEN,
    credentials: {
      hasAppKey: !!TWITTER_CREDENTIALS.appKey,
      hasAppSecret: !!TWITTER_CREDENTIALS.appSecret,
      hasAccessToken: !!TWITTER_CREDENTIALS.accessToken,
      hasAccessSecret: !!TWITTER_CREDENTIALS.accessSecret,
    },
    message: "Check your Twitter App settings and ensure credentials are correct"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
