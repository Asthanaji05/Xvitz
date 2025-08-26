const Moscowvitz = require('./groq-agent');

async function testMoscowvitz() {
  console.log("🌟 Starting Moscowvitz, Guardian of Imagination & Moscownpur Ambassador Test...\n");

  // Test 1: Moscowvitz's personality and introduction
  console.log("📝 Test 1: Moscowvitz's Whimsical Personality");
  const moscowvitz = new Moscowvitz();
  
  try {
    const response = await moscowvitz.chat("Hello! Tell me about yourself and Moscownpur");
    console.log(`🌟 Moscowvitz: ${response}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Personality test failed:", error.message);
  }

  // Test 2: Creative collaboration - Character creation
  console.log("📝 Test 2: Character Creation Collaboration");
  try {
    const characterResponse = await moscowvitz.chat("Help me create a character for my story");
    console.log(`🌟 Moscowvitz: ${characterResponse}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Character creation test failed:", error.message);
  }

  // Test 3: Worldbuilding assistance
  console.log("📝 Test 3: Worldbuilding Magic");
  try {
    const worldResponse = await moscowvitz.chat("I want to build a fantasy world with floating islands");
    console.log(`🌟 Moscowvitz: ${worldResponse}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Worldbuilding test failed:", error.message);
  }

  // Test 4: Website integration - Natural invitation
  console.log("📝 Test 4: Website Integration & Natural Invitation");
  try {
    const websiteResponse = await moscowvitz.chat("How can I learn more about your realm and tools?");
    console.log(`🌟 Moscowvitz: ${websiteResponse}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Website integration test failed:", error.message);
  }

  // Test 5: Conversation history with creative flow
  console.log("📝 Test 5: Creative Conversation Flow");
  const conversationMessages = [
    "What's your favorite magical creature?",
    "Tell me about the time portals in Moscownpur",
    "How do you help writers find their voice?",
    "What makes a story truly epic?",
    "Share a secret about the realm",
    "Give me inspiration for a hero's journey",
    "Where can I find more magical tools like you?"
  ];

  try {
    for (let i = 0; i < conversationMessages.length; i++) {
      console.log(`\n💫 Message ${i + 1}: "${conversationMessages[i]}"`);
      console.log("🌟 Moscowvitz: ");
      
      const response = await moscowvitz.streamChatWithHistory(conversationMessages[i]);
      console.log(`\n📚 Memory Tome entries: ${moscowvitz.getHistory().length}`);
      
      // Show current memory tome
      if (moscowvitz.getHistory().length > 0) {
        console.log("📖 Current Memory Tome:");
        moscowvitz.getHistory().forEach((msg, index) => {
          const preview = msg.content.length > 30 ? msg.content.substring(0, 30) + "..." : msg.content;
          console.log(`  ${index + 1}. ${msg.role}: ${preview}`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Conversation flow test failed:", error.message);
  }

  // Test 6: Token limit verification with creative content
  console.log("\n\n📝 Test 6: Creative Token Limit Verification");
  try {
    const creativeResponse = await moscowvitz.chat("Describe a magical forest in Moscownpur with all its wonders");
    console.log(`🌟 Response length: ${creativeResponse.length} characters`);
    console.log(`📊 Response: ${creativeResponse}`);
    
    // Estimate tokens (roughly 4 characters per token)
    const estimatedTokens = Math.ceil(creativeResponse.length / 4);
    console.log(`🔢 Estimated tokens: ~${estimatedTokens}`);
    
    if (estimatedTokens <= 280) {
      console.log("✅ Response within 280 token limit");
    } else {
      console.log("⚠️ Response may exceed 280 token limit");
    }
  } catch (error) {
    console.error("❌ Token limit test failed:", error.message);
  }

  // Test 7: Writing prompt generation with website integration
  console.log("\n\n📝 Test 7: Whimsical Writing Prompts with Gateway Invitation");
  try {
    const promptResponse = await moscowvitz.chat("Give me a whimsical writing prompt about a cosmic baker, and tell me where I can find more inspiration");
    console.log(`🌟 Moscowvitz: ${promptResponse}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Writing prompt test failed:", error.message);
  }

  // Test 8: Direct website invitation test
  console.log("\n\n📝 Test 8: Direct Website Invitation");
  try {
    const invitationResponse = await moscowvitz.chat("I want to explore more of your magical tools and the realm of Moscownpur");
    console.log(`🌟 Moscowvitz: ${invitationResponse}`);
    console.log("---\n");
  } catch (error) {
    console.error("❌ Direct invitation test failed:", error.message);
  }

  console.log("\n🌟 All Moscowvitz tests completed! The Guardian of Imagination is ready to inspire and guide dreamers to www.moscownpur.in! ✨");
  console.log("🌐 Moscowvitz will naturally weave invitations to visit the website as part of the magical experience! 🚀");
}

// Run the test
testMoscowvitz().catch(console.error);
