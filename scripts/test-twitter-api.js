const { TwitterApi } = require("twitter-api-v2");
require('dotenv').config();

// Test Twitter API credentials and permissions
async function testTwitterAPI() {
  console.log('🔍 Testing Twitter API Credentials...\n');
  
  // Check if environment variables are set
  const requiredVars = ['TWITTER_APP_KEY', 'TWITTER_APP_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Make sure to set these in your .env file or GitHub secrets');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  
  // Create Twitter client
  let client;
  try {
    client = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    }).readWrite;
    
    console.log('✅ Twitter client created successfully');
  } catch (error) {
    console.error('❌ Failed to create Twitter client:', error.message);
    return false;
  }
  
  // Test 1: Get user info
  let me;
  try {
    console.log('\n🔍 Test 1: Getting user information...');
    me = await client.v2.me();
    console.log('✅ User info retrieved successfully!');
    console.log(`👤 Username: @${me.data.username}`);
    console.log(`🆔 User ID: ${me.data.id}`);
    console.log(`📝 Name: ${me.data.name}`);
  } catch (error) {
    console.error('❌ Failed to get user info:', error.message);
    console.error('🔧 Error details:', {
      code: error.code,
      type: error.type,
      data: error.data
    });
    return false;
  }
  
  // Test 2: Check app permissions
  try {
    console.log('\n🔍 Test 2: Checking app permissions...');
    const appInfo = await client.v2.appInfo();
    console.log('✅ App info retrieved successfully!');
    console.log(`📱 App Name: ${appInfo.data.name}`);
    console.log(`🔑 App ID: ${appInfo.data.id}`);
  } catch (error) {
    console.error('❌ Failed to get app info:', error.message);
    console.error('🔧 Error details:', {
      code: error.code,
      type: error.type,
      data: error.data
    });
  }
  
  // Test 3: Try to post a test tweet (optional)
  const testTweet = process.argv.includes('--test-tweet');
  if (testTweet) {
    try {
      console.log('\n🔍 Test 3: Testing tweet posting...');
      const testText = `🧪 Test tweet from Xvitz at ${new Date().toISOString()} - Testing API permissions! 🚀✨`;
      const tweet = await client.v2.tweet(testText);
      console.log('✅ Test tweet posted successfully!');
      console.log(`📊 Tweet ID: ${tweet.data.id}`);
      console.log(`🔗 Tweet URL: https://x.com/${me.data.username}/status/${tweet.data.id}`);
    } catch (error) {
      console.error('❌ Failed to post test tweet:', error.message);
      console.error('🔧 Error details:', {
        code: error.code,
        type: error.type,
        data: error.data
      });
      
      if (error.code === 403) {
        console.log('\n💡 403 Error Solutions:');
        console.log('1. Check if your app has "Read and Write" permissions (not "Read-only")');
        console.log('2. Regenerate your Access Token and Secret after changing permissions');
        console.log('3. Make sure you\'re using OAuth 1.0a tokens (not OAuth 2.0)');
        console.log('4. Verify your app type is "Web App, Automated App or Bot"');
      }
      
      return false;
    }
  } else {
    console.log('\n💡 To test tweet posting, run: node scripts/test-twitter-api.js --test-tweet');
  }
  
  console.log('\n🎉 Twitter API test completed successfully!');
  return true;
}

// Run the test
testTwitterAPI()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Your Twitter API is ready to use.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check your credentials and permissions.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  });
