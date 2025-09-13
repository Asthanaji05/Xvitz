const { TwitterApi } = require("twitter-api-v2");
require('dotenv').config();

// Check Twitter API rate limits
async function checkRateLimits() {
  console.log('🔍 Checking Twitter API Rate Limits...\n');
  
  try {
    // Create Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    }).readWrite;
    
    // Get user info
    const me = await client.v2.me();
    console.log(`👤 Connected as: @${me.data.username}`);
    console.log(`🆔 User ID: ${me.data.id}`);
    console.log(`📝 Name: ${me.data.name}\n`);
    
    // Try to get rate limit info by making a simple API call
    try {
      await client.v2.me();
      console.log('✅ API connection successful');
    } catch (error) {
      if (error.rateLimit) {
        console.log('📊 Rate Limit Information:');
        console.log(`   • Remaining: ${error.rateLimit.remaining}`);
        console.log(`   • Limit: ${error.rateLimit.limit}`);
        console.log(`   • Reset: ${new Date(error.rateLimit.reset * 1000).toLocaleString()}`);
        
        if (error.rateLimit.remaining <= 2) {
          console.log('⚠️  WARNING: Rate limit almost reached!');
          console.log('💡 Consider reducing tweet frequency or waiting for reset.');
        } else {
          console.log('✅ Rate limit status: Good');
        }
      } else {
        console.log('❌ Could not retrieve rate limit information');
      }
    }
    
    // Calculate time until next scheduled tweet
    const now = new Date();
    const nextTweetTimes = [
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), // Midnight
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0), // 8 AM
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0) // 4 PM
    ];
    
    const nextTweet = nextTweetTimes.find(time => time > now) || 
                     new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    
    const timeUntilNext = nextTweet - now;
    const hoursUntilNext = Math.ceil(timeUntilNext / (1000 * 60 * 60));
    
    console.log(`\n⏰ Next scheduled tweet: ${nextTweet.toLocaleString()}`);
    console.log(`⏳ Time until next tweet: ${hoursUntilNext} hours`);
    
    console.log('\n📅 Current Schedule:');
    console.log('   • 00:00 UTC (Midnight)');
    console.log('   • 08:00 UTC (8 AM)');
    console.log('   • 16:00 UTC (4 PM)');
    console.log('   • Total: 3 tweets per day (well within 17/day limit)');
    
  } catch (error) {
    console.error('❌ Error checking rate limits:', error.message);
    if (error.code === 403) {
      console.log('\n💡 403 Error - Possible causes:');
      console.log('1. Rate limit exceeded');
      console.log('2. Invalid credentials');
      console.log('3. App permissions issue');
    }
    process.exit(1);
  }
}

// Run the check
checkRateLimits()
  .then(() => {
    console.log('\n🎉 Rate limit check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Rate limit check failed:', error.message);
    process.exit(1);
  });
