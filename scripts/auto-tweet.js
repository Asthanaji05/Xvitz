const { TwitterApi } = require("twitter-api-v2");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { XAgent } = require("../social-agents");
require('dotenv').config();

// Twitter API credentials
const TWITTER_CREDENTIALS = {
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
};

// Create TwitterApi client with optional proxy
const proxy = process.env.HTTP_PROXY;
let client;
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

// Content prompts (same as Xvitz.js)
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

// Function to clean tweet text
function cleanTweetText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 280);
}

// Function to retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (error.code === 403) {
        console.log('🚫 403 Forbidden - likely rate limiting');
        
        if (error.rateLimit) {
          console.log('📊 Rate limit info:', error.rateLimit);
          
          if (error.rateLimit.remaining === 0) {
            console.log('⏳ Rate limit exhausted, waiting for reset...');
            const resetTime = error.rateLimit.reset * 1000;
            const waitTime = resetTime - Date.now();
            if (waitTime > 0) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            continue;
          }
        }
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Main auto-tweet function with robust error handling
async function autoTweet() {
  try {
    console.log('🤖 Xvitz Auto-Tweet starting...');
    
    // Randomly select a category
    const categories = Object.keys(CONTENT_PROMPTS);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🎯 Selected category: ${randomCategory}`);
    
    // Get a random prompt
    const prompt = getRandomPrompt(randomCategory);
    console.log(`📝 Using prompt: "${prompt}"`);
    
    // Generate content using Xvitz
    console.log('✨ Xvitz is creating magical content...');
    const generatedContent = await xvitzAgent.chat(prompt);
    
    // Clean the content for Twitter
    const tweetText = cleanTweetText(generatedContent);
    console.log(`🐦 Generated tweet: "${tweetText}"`);
    
    // Post to Twitter with retry logic
    console.log('🚀 Posting to X (Twitter)...');
    const tweet = await retryWithBackoff(async () => {
      return await client.v2.tweet(tweetText);
    });

    // Get your account details
    const me = await client.v2.me();
    const username = me.data.username;

    console.log('✅ Tweet posted successfully!');
    console.log('📊 Tweet ID:', tweet.data.id);
    console.log(`🔗 Tweet URL: https://x.com/${username}/status/${tweet.data.id}`);
    
    return {
      success: true,
      tweetId: tweet.data.id,
      tweetText: tweetText,
      category: randomCategory,
      prompt: prompt,
      memoryCount: xvitzAgent.getHistory().length
    };
    
  } catch (error) {
    console.error('❌ Error in auto-tweet:', error);
    
    // Provide helpful error information
    if (error.code === 403) {
     console.log("403 error")
    }
    
    throw error;
  }
}

// Run the auto-tweet
autoTweet()
  .then(result => {
    console.log('🎉 Auto-tweet completed successfully!');
    console.log('📋 Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Auto-tweet failed:', error.message);
    process.exit(1);
  });
