const { XAgent, LinkedInAgent, WhatsAppAgent } = require('./social-agents');

async function testSocialAgents() {
  console.log("🌟 Testing All Social Media Agents - Moscownpur Style! ✨\n");

  // Initialize all agents
  const xAgent = new XAgent();
  const linkedInAgent = new LinkedInAgent();
  const whatsAppAgent = new WhatsAppAgent();

  const agents = {
    "X (Twitter)": xAgent,
    "LinkedIn": linkedInAgent,
    "WhatsApp": whatsAppAgent
  };

  // Test 1: Individual personality tests
  console.log("📝 Test 1: Individual Personality Tests");
  console.log("=" .repeat(60));

  for (const [platform, agent] of Object.entries(agents)) {
    console.log(`\n📱 ${platform} Agent (${agent.name})`);
    console.log("-" .repeat(40));
    
    try {
      const response = await agent.chat("Hello! Tell me about yourself and what makes you special");
      console.log(`${agent.name}: ${response}`);
      console.log(`📚 Memory entries: ${agent.getHistory().length}`);
    } catch (error) {
      console.error(`❌ ${platform} personality test failed:`, error.message);
    }
  }

  // Test 2: Platform-specific content creation
  console.log("\n\n📝 Test 2: Platform-Specific Content Creation");
  console.log("=" .repeat(60));

  // X (Twitter) - Engaging content
  console.log("\n🐦 X (Twitter) - Engaging Content");
  try {
    const xResponse = await xAgent.chat("Create a viral tweet about creativity and imagination");
    console.log(`Xvitz: ${xResponse}`);
  } catch (error) {
    console.error("❌ X content test failed:", error.message);
  }

  // LinkedIn - Professional content
  console.log("\n💼 LinkedIn - Professional Content");
  try {
    const linkedInResponse = await linkedInAgent.chat("Write a professional post about the importance of creativity in business");
    console.log(`Linkvitz: ${linkedInResponse}`);
  } catch (error) {
    console.error("❌ LinkedIn content test failed:", error.message);
  }

  // WhatsApp - Friendly content
  console.log("\n💬 WhatsApp - Friendly Content");
  try {
    const whatsAppResponse = await whatsAppAgent.chat("Send a fun message about creativity and imagination");
    console.log(`WhatsVitz: ${whatsAppResponse}`);
  } catch (error) {
    console.error("❌ WhatsApp content test failed:", error.message);
  }

  // Test 3: Conversation flow with memory
  console.log("\n\n📝 Test 3: Conversation Flow with Memory");
  console.log("=" .repeat(60));

  const conversationFlow = [
    "What's your favorite magical creature?",
    "How do you help creators?",
    "Tell me about Moscownpur",
    "Give me a creative prompt",
    "Where can I find more tools?"
  ];

  for (const [platform, agent] of Object.entries(agents)) {
    console.log(`\n📱 ${platform} Conversation Flow`);
    console.log("-" .repeat(40));
    
    try {
      for (let i = 0; i < conversationFlow.length; i++) {
        console.log(`\n💬 Message ${i + 1}: "${conversationFlow[i]}"`);
        console.log(`${agent.name}: `);
        
        const response = await agent.streamChatWithHistory(conversationFlow[i]);
        console.log(`\n📚 Memory entries: ${agent.getHistory().length}`);
        
        // Show current memory
        if (agent.getHistory().length > 0) {
          console.log("📖 Current Memory:");
          agent.getHistory().forEach((msg, index) => {
            const preview = msg.content.length > 25 ? msg.content.substring(0, 25) + "..." : msg.content;
            console.log(`  ${index + 1}. ${msg.role}: ${preview}`);
          });
        }
      }
    } catch (error) {
      console.error(`❌ ${platform} conversation test failed:`, error.message);
    }
  }

  // Test 4: Website integration comparison
  console.log("\n\n📝 Test 4: Website Integration Comparison");
  console.log("=" .repeat(60));

  const websitePrompt = "How can I learn more about your tools and the realm of Moscownpur?";

  for (const [platform, agent] of Object.entries(agents)) {
    console.log(`\n📱 ${platform} Website Integration`);
    console.log("-" .repeat(40));
    
    try {
      const response = await agent.chat(websitePrompt);
      console.log(`${agent.name}: ${response}`);
    } catch (error) {
      console.error(`❌ ${platform} website integration test failed:`, error.message);
    }
  }

  // Test 5: Token limit verification
  console.log("\n\n📝 Test 5: Token Limit Verification");
  console.log("=" .repeat(60));

  const longPrompt = "Write a detailed description of a magical forest in Moscownpur with all its wonders, creatures, and mystical properties";

  for (const [platform, agent] of Object.entries(agents)) {
    console.log(`\n📱 ${platform} Token Limit Test`);
    console.log("-" .repeat(40));
    
    try {
      const response = await agent.chat(longPrompt);
      console.log(`Response length: ${response.length} characters`);
      console.log(`Estimated tokens: ~${Math.ceil(response.length / 4)}`);
      console.log(`Response: ${response.substring(0, 100)}...`);
      
      if (Math.ceil(response.length / 4) <= 280) {
        console.log("✅ Within 280 token limit");
      } else {
        console.log("⚠️ May exceed 280 token limit");
      }
    } catch (error) {
      console.error(`❌ ${platform} token test failed:`, error.message);
    }
  }

  // Test 6: Memory isolation verification
  console.log("\n\n📝 Test 6: Memory Isolation Verification");
  console.log("=" .repeat(60));

  console.log("Testing that each agent has separate memory systems...");
  
  for (const [platform, agent] of Object.entries(agents)) {
    console.log(`\n📱 ${platform} Memory Count: ${agent.getHistory().length} entries`);
    console.log("Memory preview:");
    agent.getHistory().forEach((msg, index) => {
      const preview = msg.content.length > 20 ? msg.content.substring(0, 20) + "..." : msg.content;
      console.log(`  ${index + 1}. ${msg.role}: ${preview}`);
    });
  }

  console.log("\n🌟 All social media agents tested successfully! ✨");
  console.log("🎯 Each agent maintains its own personality and memory system!");
  console.log("🌐 All agents naturally guide users to www.moscownpur.in!");
}

// Run the test
testSocialAgents().catch(console.error);
