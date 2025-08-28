// test-tweet.js
const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

(async () => {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Verify credentials first
    const me = await client.v2.me();
    console.log("✅ Authenticated as:", me.data);

    // Try posting a tweet
    const tweet = await client.v2.tweet("🚀 Test tweet from Xvitz (Asthanaji)!");
    console.log("✅ Tweet posted:", tweet.data);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
