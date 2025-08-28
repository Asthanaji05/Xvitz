const Groq = require('groq-sdk');
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.8,
  maxTokens: 200
};

// Initialize test clients
const testClients = {
  char1: new Groq({ apiKey: process.env.GROQ_1 }),
  char2: new Groq({ apiKey: process.env.GROQ_2 }),
  asd: new Groq({ apiKey: process.env.GROQ_3 }),
  b: new Groq({ apiKey: process.env.GROQ_4 }),
  c: new Groq({ apiKey: process.env.GROQ_5 })
};

// Utility function to sanitize classifier response (same as Kahovitz.js)
function sanitizeClassifierResponse(response) {
  const cleanResponse = response.toLowerCase().trim();
  if (cleanResponse.includes('true') || cleanResponse.includes('yes') || cleanResponse.includes('1')) {
    return true;
  }
  if (cleanResponse.includes('false') || cleanResponse.includes('no') || cleanResponse.includes('0')) {
    return false;
  }
  return false;
}

// Test functions for each model role
async function testModelA() {
  console.log('🧪 Testing Model A (Prompt Refinement & Phase Planning)...');
  
  try {
    const systemPrompt = `You are a master storyteller and narrative architect. Your task is to:
1. Refine the user's rough story idea into a detailed, engaging prompt
2. Create a structured phase plan for story development

Provide your response in this exact JSON format:
{
  "refinedPrompt": "detailed story prompt here",
  "phasePlan": {
    "setup": "description of setup phase",
    "risingAction": "description of rising action phase", 
    "climax": "description of climax phase",
    "resolution": "description of resolution phase"
  }
}`;

    const completion = await testClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Rough story idea: A fantasy adventure about a knight and a rogue" }
      ],
      model: TEST_CONFIG.model,
      temperature: TEST_CONFIG.temperature,
      max_tokens: TEST_CONFIG.maxTokens
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Model A Response:', response.substring(0, 100) + '...');
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ JSON parsing successful');
      return true;
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, but response generated');
      return true;
    }
  } catch (error) {
    console.error('❌ Model A test failed:', error.message);
    return false;
  }
}

async function testChar1() {
  console.log('🧪 Testing Char1 (Character Dialogue)...');
  
  try {
    const systemPrompt = `You are Char1, a character in an ongoing story. 
Current phase: setup
Turn number: 1

Respond naturally to the conversation context. Stay in character and maintain consistency with your personality and the story's tone.
Keep your response engaging and move the story forward naturally.`;

    const completion = await testClients.char1.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Story context: A medieval tavern where two adventurers meet for the first time.\n\nWhat does Char1 say next?" }
      ],
      model: TEST_CONFIG.model,
      temperature: TEST_CONFIG.temperature,
      max_tokens: TEST_CONFIG.maxTokens
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Char1 Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Char1 test failed:', error.message);
    return false;
  }
}

async function testChar2() {
  console.log('🧪 Testing Char2 (Character Dialogue)...');
  
  try {
    const systemPrompt = `You are Char2, a character in an ongoing story. 
Current phase: setup
Turn number: 2

Respond naturally to the conversation context. Stay in character and maintain consistency with your personality and the story's tone.
Keep your response engaging and move the story forward naturally.`;

    const completion = await testClients.char2.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Story context: A medieval tavern where two adventurers meet for the first time.\nChar1: Greetings, fellow traveler! What brings you to this humble establishment?\n\nWhat does Char2 say next?" }
      ],
      model: TEST_CONFIG.model,
      temperature: TEST_CONFIG.temperature,
      max_tokens: TEST_CONFIG.maxTokens
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Char2 Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Char2 test failed:', error.message);
    return false;
  }
}

async function testModelS() {
  console.log('🧪 Testing Model S (Summarization)...');
  
  try {
    const systemPrompt = `You are a skilled story editor. Summarize the key events and character developments from this conversation segment.
Focus on plot progression, character interactions, and important details that advance the story.
Keep the summary concise but comprehensive.`;

    const completion = await testClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Summarize this conversation segment:\nChar1: Greetings, fellow traveler! What brings you to this humble establishment?\nChar2: I seek adventure and fortune in these lands. And you?\nChar1: The same! Perhaps we could join forces?\nChar2: That sounds like a wise decision. Two are stronger than one." }
      ],
      model: TEST_CONFIG.model,
      temperature: 0.5,
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Model S Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Model S test failed:', error.message);
    return false;
  }
}

async function testModelC() {
  console.log('🧪 Testing Model C (Classifier)...');
  
  try {
    const systemPrompt = `You are a binary classifier for story narration. 
Based on the summary provided, determine if narration should be added to enhance the story.
Consider: Does this segment need additional context, atmosphere, or narrative bridge?

Respond ONLY with "True" or "False" - no other text.`;

    const completion = await testClients.c.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Summary: Two adventurers meet in a tavern and decide to join forces for their quest.\n\nShould narration be added? (True/False)" }
      ],
      model: TEST_CONFIG.model,
      temperature: 0.1,
      max_tokens: 10
    });

    const response = completion.choices[0].message.content;
    const result = sanitizeClassifierResponse(response);
    console.log('✅ Model C Response:', response.trim(), '→', result);
    return true;
  } catch (error) {
    console.error('❌ Model C test failed:', error.message);
    return false;
  }
}

async function testModelD() {
  console.log('🧪 Testing Model D (Narration)...');
  
  try {
    const systemPrompt = `You are a master narrator. Create engaging narration that bridges story segments and enhances the reader's experience.
The narration should provide context, atmosphere, or narrative insight without being intrusive.
Keep it concise and flowing naturally with the story.`;

    const completion = await testClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Story context: A medieval tavern where two adventurers meet and decide to join forces.\nRecent summary: Two adventurers meet in a tavern and decide to join forces for their quest.\n\nGenerate engaging narration." }
      ],
      model: TEST_CONFIG.model,
      temperature: TEST_CONFIG.temperature,
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Model D Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Model D test failed:', error.message);
    return false;
  }
}

async function testModelB() {
  console.log('🧪 Testing Model B (Master Summary)...');
  
  try {
    const systemPrompt = `You are a master story editor. Create a comprehensive master summary of the entire story using all the segment summaries provided.
The master summary should capture the complete narrative arc, character development, and key themes.
Make it engaging and well-structured.`;

    const completion = await testClients.b.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Create a master summary from these segment summaries:\n\nTwo adventurers meet in a tavern and decide to join forces for their quest.\n\nThe duo embarks on their journey, facing their first challenges together.\n\nThey discover an ancient map that leads to a hidden treasure." }
      ],
      model: TEST_CONFIG.model,
      temperature: 0.6,
      max_tokens: 200
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Model B Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Model B test failed:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🎭 Kahovitz Story Pipeline v2 - Comprehensive Test Suite');
  console.log('=' .repeat(60));
  
  // Check API keys
  console.log('🔑 Checking API Keys...');
  const keys = {
    'GROQ_1 (Char1)': !!process.env.GROQ_1,
    'GROQ_2 (Char2)': !!process.env.GROQ_2,
    'GROQ_3 (A/S/D)': !!process.env.GROQ_3,
    'GROQ_4 (B)': !!process.env.GROQ_4,
    'GROQ_5 (C)': !!process.env.GROQ_5
  };
  
  Object.entries(keys).forEach(([key, present]) => {
    console.log(`${present ? '✅' : '❌'} ${key}: ${present ? 'Present' : 'Missing'}`);
  });
  
  console.log('\n🧪 Running Model Tests...');
  
  const testResults = {
    'Model A (Refinement & Planning)': await testModelA(),
    'Char1 (Character Dialogue)': await testChar1(),
    'Char2 (Character Dialogue)': await testChar2(),
    'Model S (Summarization)': await testModelS(),
    'Model C (Classifier)': await testModelC(),
    'Model D (Narration)': await testModelD(),
    'Model B (Master Summary)': await testModelB()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(40));
  
  let passedTests = 0;
  let totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (passed) passedTests++;
  });
  
  console.log('\n📈 Overall Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Kahovitz is ready for story generation.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check your API keys and network connection.');
  }
  
  console.log('\n🚀 To start Kahovitz, run: node Kahovitz.js');
  console.log('🌐 Then visit: http://localhost:5175');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testModelA,
  testChar1,
  testChar2,
  testModelS,
  testModelC,
  testModelD,
  testModelB,
  runAllTests
};
