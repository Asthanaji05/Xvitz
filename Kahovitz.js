const express = require('express');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = 5175; // Different port from other services

app.use(express.json());
// Removed static file serving to avoid serving Xvitz interface

// Initialize Groq clients with different API keys
const groqClients = {
  char1: new Groq({ apiKey: process.env.GROQ_1 }),
  char2: new Groq({ apiKey: process.env.GROQ_2 }),
  asd: new Groq({ apiKey: process.env.GROQ_3 }), // A/S/D (refinement, summarization, narration)
  b: new Groq({ apiKey: process.env.GROQ_4 }),   // Master summary
  c: new Groq({ apiKey: process.env.GROQ_5 })    // Classifier
};

// Model configuration
const MODEL_CONFIG = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.8,
  maxTokens: 500
};

// Utility function to sanitize classifier response
function sanitizeClassifierResponse(response) {
  const cleanResponse = response.toLowerCase().trim();
  if (cleanResponse.includes('true') || cleanResponse.includes('yes') || cleanResponse.includes('1')) {
    return true;
  }
  if (cleanResponse.includes('false') || cleanResponse.includes('no') || cleanResponse.includes('0')) {
    return false;
  }
  // Default to false if unclear
  return false;
}

// Model A: Prompt Refinement and Phase Planning
async function refinePromptAndPlan(roughIdea) {
  try {
    const systemPrompt = `You are a master storyteller and narrative architect. Your task is to:
1. Refine the user's rough story idea into a detailed, engaging prompt
2. Create a structured phase plan for story development

PHASE PLAN STRUCTURE:
- Setup: Introduction of characters and world
- Rising Action: Building tension and conflict
- Climax: Peak of the story's conflict
- Resolution: Conclusion and character growth

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

    const completion = await groqClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Rough story idea: ${roughIdea}` }
      ],
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      max_tokens: MODEL_CONFIG.maxTokens
    });

    const response = completion.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      // Fallback: extract content manually
      const refinedPrompt = response.split('"refinedPrompt":')[1]?.split('"phasePlan":')[0]?.replace(/"/g, '').trim() || response;
      return {
        refinedPrompt: refinedPrompt,
        phasePlan: {
          setup: "Introduction of characters and world",
          risingAction: "Building tension and conflict", 
          climax: "Peak of the story's conflict",
          resolution: "Conclusion and character growth"
        }
      };
    }
  } catch (error) {
    console.error('Error in refinePromptAndPlan:', error);
    throw error;
  }
}

// Model A: Opening Scene Generation
async function generateOpeningScene(refinedPrompt) {
  try {
    const systemPrompt = `You are a master storyteller. Create an engaging opening scene that sets the stage for the story. 
The opening should introduce the world, establish mood, and hook the reader immediately.
Keep it concise but vivid and engaging.`;

    const completion = await groqClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create an opening scene for: ${refinedPrompt}` }
      ],
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      max_tokens: MODEL_CONFIG.maxTokens
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateOpeningScene:', error);
    throw error;
  }
}

// Character Dialogue Generation
async function generateCharacterDialogue(character, context, phase, turnNumber, characters) {
  try {
    const client = character === 'Char1' ? groqClients.char1 : groqClients.char2;
    const charInfo = character === 'Char1' ? characters.char1 : characters.char2;
    
    const systemPrompt = `You are ${charInfo.name}, a character in an ongoing story. 

CHARACTER PROFILE:
${charInfo.personality}

Current phase: ${phase}
Turn number: ${turnNumber}

Respond naturally to the conversation context. Stay in character and maintain consistency with your personality and the story's tone.
Keep your response engaging and move the story forward naturally.`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Story context: ${context}\n\nWhat does ${charInfo.name} say next?` }
      ],
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      max_tokens: MODEL_CONFIG.maxTokens
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error(`Error in generateCharacterDialogue for ${character}:`, error);
    throw error;
  }
}

// Model S: Summarization
async function summarizeSegment(conversationSegment) {
  try {
    const systemPrompt = `You are a skilled story editor. Summarize the key events and character developments from this conversation segment.
Focus on plot progression, character interactions, and important details that advance the story.
Keep the summary concise but comprehensive.`;

    const completion = await groqClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize this conversation segment:\n${conversationSegment}` }
      ],
      model: MODEL_CONFIG.model,
      temperature: 0.5, // Lower temperature for more consistent summaries
      max_tokens: 300
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarizeSegment:', error);
    throw error;
  }
}

// Model C: Narration Trigger Classifier
async function shouldAddNarration(summary) {
  try {
    const systemPrompt = `You are a binary classifier for story narration. 
Based on the summary provided, determine if narration should be added to enhance the story.
Consider: Does this segment need additional context, atmosphere, or narrative bridge?

Respond ONLY with "True" or "False" - no other text.`;

    const completion = await groqClients.c.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summary: ${summary}\n\nShould narration be added? (True/False)` }
      ],
      model: MODEL_CONFIG.model,
      temperature: 0.1, // Very low temperature for consistent classification
      max_tokens: 10
    });

    const response = completion.choices[0].message.content;
    return sanitizeClassifierResponse(response);
  } catch (error) {
    console.error('Error in shouldAddNarration:', error);
    return false; // Default to false on error
  }
}

// Model D: Narration Generation
async function generateNarration(context, summary) {
  try {
    const systemPrompt = `You are a master narrator. Create engaging narration that bridges story segments and enhances the reader's experience.
The narration should provide context, atmosphere, or narrative insight without being intrusive.
Keep it concise and flowing naturally with the story.`;

    const completion = await groqClients.asd.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Story context: ${context}\nRecent summary: ${summary}\n\nGenerate engaging narration.` }
      ],
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      max_tokens: 200
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateNarration:', error);
    throw error;
  }
}

// Model B: Master Summary
async function generateMasterSummary(allSummaries) {
  try {
    const systemPrompt = `You are a master story editor. Create a comprehensive master summary of the entire story using all the segment summaries provided.
The master summary should capture the complete narrative arc, character development, and key themes.
Make it engaging and well-structured.`;

    const completion = await groqClients.b.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a master summary from these segment summaries:\n${allSummaries.join('\n\n')}` }
      ],
      model: MODEL_CONFIG.model,
      temperature: 0.6,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateMasterSummary:', error);
    throw error;
  }
}

// Determine current phase based on turn number
function getCurrentPhase(phasePlan, totalUtterances, currentTurn) {
  const phaseOrder = ['setup', 'risingAction', 'climax', 'resolution'];
  const phaseThresholds = [
    Math.floor(totalUtterances * 0.25), // Setup: first 25%
    Math.floor(totalUtterances * 0.5),  // Rising Action: 25-50%
    Math.floor(totalUtterances * 0.75), // Climax: 50-75%
    totalUtterances                     // Resolution: 75-100%
  ];

  for (let i = 0; i < phaseThresholds.length; i++) {
    if (currentTurn <= phaseThresholds[i]) {
      return {
        name: phaseOrder[i],
        description: phasePlan[phaseOrder[i]]
      };
    }
  }
  
  return {
    name: 'resolution',
    description: phasePlan.resolution
  };
}

// Generate Markdown output
function generateMarkdown(data) {
  return `# Story Generated by Kahovitz

## Initial Context
${data.initialContext}

## Opening Scene
${data.openingScene}

## Conversations
${data.conversations.map((conv, index) => `### Turn ${index + 1}: ${conv.speaker}
${conv.text}

`).join('')}

## Segment Summaries
${data.summaries.map((summary, index) => `### Summary ${index + 1}
${summary.summary}

`).join('')}

## Narrations
${data.narrations.map((narration, index) => `### Narration ${index + 1}
${narration.narration}

`).join('')}

## Master Summary
${data.masterSummary}

---
*Generated by Kahovitz Story Pipeline v2*`;
}

// API Endpoint: Plan Generation
app.post('/api/plan', async (req, res) => {
  try {
    const { roughIdea } = req.body;
    
    if (!roughIdea) {
      return res.status(400).json({ error: 'roughIdea is required' });
    }

    console.log('🎭 Kahovitz: Planning story...');
    
    // Step 1: Refine prompt and create phase plan
    const planResult = await refinePromptAndPlan(roughIdea);
    
    // Step 2: Generate opening scene
    const openingScene = await generateOpeningScene(planResult.refinedPrompt);
    
    console.log('✅ Plan generated successfully');
    
    res.json({
      refinedPrompt: planResult.refinedPrompt,
      phasePlan: planResult.phasePlan,
      openingScene: openingScene
    });
    
  } catch (error) {
    console.error('❌ Error in /api/plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store for active story generation sessions
const activeSessions = new Map();

// API Endpoint: Story Generation (Streaming)
app.post('/api/generate-story', async (req, res) => {
  try {
    const { 
      refinedPrompt, 
      openingScene, 
      phasePlan, 
      characters,
      totalUtterances = 20, 
      summaryInterval = 4 
    } = req.body;
    
    if (!refinedPrompt || !openingScene || !phasePlan) {
      return res.status(400).json({ error: 'refinedPrompt, openingScene, and phasePlan are required' });
    }

    // Create session ID
    const sessionId = Date.now().toString();
    activeSessions.set(sessionId, { status: 'starting' });

    console.log('🎭 Kahovitz: Generating story...');
    console.log(`📊 Total utterances: ${totalUtterances}, Summary interval: ${summaryInterval}`);
    
    // Initialize story data structure
    const storyData = {
      initialContext: refinedPrompt,
      openingScene: openingScene,
      conversations: [],
      summaries: [],
      narrations: [],
      masterSummary: ""
    };
    
    let currentContext = openingScene;
    let lastSpeaker = null;
    
    // Generate conversations
    for (let turn = 1; turn <= totalUtterances; turn++) {
      console.log(`🔄 Turn ${turn}/${totalUtterances}`);
      
      // Update session status
      activeSessions.set(sessionId, { 
        status: 'generating', 
        progress: (turn / totalUtterances) * 100,
        message: `Generating turn ${turn}/${totalUtterances}`
      });
      
      // Determine current phase
      const currentPhase = getCurrentPhase(phasePlan, totalUtterances, turn);
      
      // Determine next speaker (alternate between Char1 and Char2)
      const nextSpeaker = lastSpeaker === 'Char1' ? 'Char2' : 'Char1';
      
      // Generate character dialogue
      const dialogue = await generateCharacterDialogue(nextSpeaker, currentContext, currentPhase.name, turn, characters);
      
      // Store conversation
      const charName = nextSpeaker === 'Char1' ? characters.char1.name : characters.char2.name;
      storyData.conversations.push({
        speaker: charName,
        text: dialogue,
        turn: turn,
        phase: currentPhase.name
      });
      
      // Update context
      currentContext += `\n${charName}: ${dialogue}`;
      lastSpeaker = nextSpeaker;
      
      // Summarize at intervals
      if (turn % summaryInterval === 0) {
        console.log(`📝 Summarizing at turn ${turn}...`);
        
        // Get recent conversations for summarization
        const recentConversations = storyData.conversations.slice(-summaryInterval);
        const conversationText = recentConversations.map(conv => `${conv.speaker}: ${conv.text}`).join('\n');
        
        // Generate summary
        const summary = await summarizeSegment(conversationText);
        storyData.summaries.push({
          turn: turn,
          summary: summary
        });
        
        // Check if narration is needed
        const needsNarration = await shouldAddNarration(summary);
        
        if (needsNarration) {
          console.log(`📖 Adding narration at turn ${turn}...`);
          const narration = await generateNarration(currentContext, summary);
          storyData.narrations.push({
            turn: turn,
            narration: narration
          });
          currentContext += `\nNarrator: ${narration}`;
        }
      }
    }
    
    // Generate master summary
    console.log('📚 Generating master summary...');
    activeSessions.set(sessionId, { 
      status: 'summarizing', 
      progress: 95,
      message: 'Generating master summary...'
    });
    
    const allSummaries = storyData.summaries.map(s => s.summary);
    storyData.masterSummary = await generateMasterSummary(allSummaries);
    
    // Generate markdown
    const markdown = generateMarkdown(storyData);
    
    console.log('✅ Story generation completed successfully');
    
    // Store final result
    activeSessions.set(sessionId, { 
      status: 'complete', 
      progress: 100,
      message: 'Story generation complete!',
      story: { data: storyData, markdown: markdown }
    });
    
    res.json({ sessionId, status: 'started' });
    
  } catch (error) {
    console.error('❌ Error in /api/generate-story:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Story Generation Stream
app.get('/api/generate-story-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sessionId = req.query.sessionId;
  if (!sessionId) {
    res.write(`data: ${JSON.stringify({ error: 'No session ID provided' })}\n\n`);
    res.end();
    return;
  }

  const checkSession = () => {
    const session = activeSessions.get(sessionId);
    if (!session) {
      res.write(`data: ${JSON.stringify({ error: 'Session not found' })}\n\n`);
      res.end();
      return;
    }

    if (session.status === 'complete') {
      res.write(`data: ${JSON.stringify({ type: 'complete', story: session.story })}\n\n`);
      activeSessions.delete(sessionId);
      res.end();
      return;
    }

    // Send progress update
    res.write(`data: ${JSON.stringify({ 
      type: 'progress', 
      percentage: session.progress, 
      message: session.message 
    })}\n\n`);

    // Check again in 1 second
    setTimeout(checkSession, 1000);
  };

  checkSession();

  req.on('close', () => {
    // Clean up if client disconnects
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Kahovitz Story Pipeline v2',
    groqKeys: {
      char1: !!process.env.GROQ_1,
      char2: !!process.env.GROQ_2,
      asd: !!process.env.GROQ_3,
      b: !!process.env.GROQ_4,
      c: !!process.env.GROQ_5
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎭 Kahovitz Story Pipeline v2</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 30px;
            }
            h1 { 
                text-align: center; 
                margin-bottom: 30px; 
                color: #333;
                font-size: 2.5rem;
            }
            .section { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 12px; 
                margin-bottom: 20px;
                border-left: 4px solid #667eea;
            }
            .section h2 { 
                color: #333; 
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            button { 
                background: linear-gradient(45deg, #667eea, #764ba2); 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-weight: 600;
                transition: all 0.3s ease;
                margin: 5px;
            }
            button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            button:disabled { opacity: 0.6; cursor: not-allowed; }
            textarea, input { 
                width: 100%; 
                padding: 12px; 
                border: 2px solid #e9ecef; 
                border-radius: 8px; 
                font-family: inherit;
                margin: 10px 0;
                transition: border-color 0.3s ease;
            }
            textarea:focus, input:focus { 
                outline: none; 
                border-color: #667eea; 
            }
            .result { 
                background: white; 
                padding: 20px; 
                border-radius: 12px; 
                margin-top: 15px;
                border: 1px solid #e9ecef;
            }
            .character-config {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 15px 0;
            }
            .character-box {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
            }
            .phase-editor {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 15px 0;
            }
            .phase-box {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
            }
            .live-updates {
                max-height: 400px;
                overflow-y: auto;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .update-item {
                background: white;
                padding: 10px;
                margin: 5px 0;
                border-radius: 6px;
                border-left: 3px solid #667eea;
            }
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(45deg, #667eea, #764ba2);
                transition: width 0.3s ease;
            }
            .loading { display: none; }
            .loading.show { display: block; }
            .icon { font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎭 Kahovitz Story Pipeline v2</h1>
            
            <!-- Step 1: Story Idea -->
            <div class="section">
                <h2>📝 Step 1: Your Story Idea</h2>
                <textarea id="roughIdea" placeholder="Enter your rough story idea... (e.g., A fantasy adventure about a knight and a rogue)" rows="3"></textarea>
                <button onclick="planStory()">🚀 Generate Plan</button>
            </div>
            
            <!-- Step 2: Character Configuration -->
            <div class="section" id="characterSection" style="display: none;">
                <h2>👥 Step 2: Define Your Characters</h2>
                <div class="character-config">
                    <div class="character-box">
                        <h3>Character 1</h3>
                        <input type="text" id="char1Name" placeholder="Character name (e.g., Sir Gareth)" />
                        <textarea id="char1Personality" placeholder="Describe their personality, background, and role in the story..." rows="4"></textarea>
                    </div>
                    <div class="character-box">
                        <h3>Character 2</h3>
                        <input type="text" id="char2Name" placeholder="Character name (e.g., Rogue Elena)" />
                        <textarea id="char2Personality" placeholder="Describe their personality, background, and role in the story..." rows="4"></textarea>
                    </div>
                </div>
            </div>
            
            <!-- Step 3: Plan Review & Edit -->
            <div class="section" id="planSection" style="display: none;">
                <h2>📋 Step 3: Review & Edit Plan</h2>
                <div class="result">
                    <h3>Refined Prompt</h3>
                    <textarea id="refinedPrompt" rows="4"></textarea>
                    
                    <h3>Phase Plan</h3>
                    <div class="phase-editor">
                        <div class="phase-box">
                            <h4>Setup</h4>
                            <textarea id="phaseSetup" rows="3"></textarea>
                        </div>
                        <div class="phase-box">
                            <h4>Rising Action</h4>
                            <textarea id="phaseRising" rows="3"></textarea>
                        </div>
                        <div class="phase-box">
                            <h4>Climax</h4>
                            <textarea id="phaseClimax" rows="3"></textarea>
                        </div>
                        <div class="phase-box">
                            <h4>Resolution</h4>
                            <textarea id="phaseResolution" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <h3>Opening Scene</h3>
                    <textarea id="openingScene" rows="6"></textarea>
                    
                    <button onclick="generateStory()">🎬 Generate Full Story</button>
                </div>
            </div>
            
            <!-- Step 4: Live Story Generation -->
            <div class="section" id="storySection" style="display: none;">
                <h2>🎭 Step 4: Live Story Generation</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
                <div id="progressText">Ready to generate...</div>
                
                <div class="live-updates" id="liveUpdates">
                    <div class="update-item">Waiting to start story generation...</div>
                </div>
                
                <div class="result" id="finalResult" style="display: none;">
                    <h3>📚 Final Story</h3>
                    <div id="storyContent"></div>
                    <button onclick="downloadMarkdown()">📥 Download Markdown</button>
                </div>
            </div>
        </div>
        
        <script>
            let currentPlan = null;
            let currentStory = null;
            let eventSource = null;
            
            async function planStory() {
                const roughIdea = document.getElementById('roughIdea').value;
                if (!roughIdea) {
                    alert('Please enter a story idea');
                    return;
                }
                
                try {
                    const response = await fetch('/api/plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roughIdea })
                    });
                    
                    const result = await response.json();
                    if (result.error) throw new Error(result.error);
                    
                    currentPlan = result;
                    
                    // Populate editable fields
                    document.getElementById('refinedPrompt').value = result.refinedPrompt;
                    document.getElementById('phaseSetup').value = result.phasePlan.setup;
                    document.getElementById('phaseRising').value = result.phasePlan.risingAction;
                    document.getElementById('phaseClimax').value = result.phasePlan.climax;
                    document.getElementById('phaseResolution').value = result.phasePlan.resolution;
                    document.getElementById('openingScene').value = result.openingScene;
                    
                    // Show character configuration
                    document.getElementById('characterSection').style.display = 'block';
                    document.getElementById('planSection').style.display = 'block';
                    
                    // Scroll to character section
                    document.getElementById('characterSection').scrollIntoView({ behavior: 'smooth' });
                    
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
            
            async function generateStory() {
                if (!currentPlan) {
                    alert('Please generate a plan first');
                    return;
                }
                
                // Get character names and personalities
                const char1Name = document.getElementById('char1Name').value || 'Char1';
                const char1Personality = document.getElementById('char1Personality').value || 'A character in the story';
                const char2Name = document.getElementById('char2Name').value || 'Char2';
                const char2Personality = document.getElementById('char2Personality').value || 'Another character in the story';
                
                // Get updated plan from textareas
                const updatedPlan = {
                    refinedPrompt: document.getElementById('refinedPrompt').value,
                    openingScene: document.getElementById('openingScene').value,
                    phasePlan: {
                        setup: document.getElementById('phaseSetup').value,
                        risingAction: document.getElementById('phaseRising').value,
                        climax: document.getElementById('phaseClimax').value,
                        resolution: document.getElementById('phaseResolution').value
                    },
                    characters: {
                        char1: { name: char1Name, personality: char1Personality },
                        char2: { name: char2Name, personality: char2Personality }
                    },
                    totalUtterances: 20,
                    summaryInterval: 4
                };
                
                // Show story section
                document.getElementById('storySection').style.display = 'block';
                document.getElementById('storySection').scrollIntoView({ behavior: 'smooth' });
                
                // Clear previous updates
                document.getElementById('liveUpdates').innerHTML = '<div class="update-item">Starting story generation...</div>';
                document.getElementById('progressFill').style.width = '0%';
                document.getElementById('progressText').textContent = 'Initializing...';
                
                try {
                    // Send the story generation request first
                    const response = await fetch('/api/generate-story', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedPlan)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to start story generation');
                    }
                    
                    const result = await response.json();
                    const sessionId = result.sessionId;
                    
                    // Start Server-Sent Events for live updates
                    if (eventSource) eventSource.close();
                    
                    eventSource = new EventSource(\`/api/generate-story-stream?sessionId=\${sessionId}\`);
                    
                    eventSource.onmessage = function(event) {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'progress') {
                            document.getElementById('progressFill').style.width = data.percentage + '%';
                            document.getElementById('progressText').textContent = data.message;
                        } else if (data.type === 'complete') {
                            currentStory = data.story;
                            document.getElementById('progressFill').style.width = '100%';
                            document.getElementById('progressText').textContent = 'Story generation complete!';
                            
                            // Show final result
                            document.getElementById('storyContent').innerHTML = \`
                                <p><strong>Master Summary:</strong> \${data.story.data.masterSummary}</p>
                                <p><strong>Total Conversations:</strong> \${data.story.data.conversations.length}</p>
                                <p><strong>Total Summaries:</strong> \${data.story.data.summaries.length}</p>
                                <p><strong>Total Narrations:</strong> \${data.story.data.narrations.length}</p>
                            \`;
                            document.getElementById('finalResult').style.display = 'block';
                            
                            eventSource.close();
                        } else if (data.error) {
                            alert('Error: ' + data.error);
                            eventSource.close();
                        }
                    };
                    
                    eventSource.onerror = function() {
                        eventSource.close();
                        alert('Connection lost. Please try again.');
                    };
                    
                } catch (error) {
                    if (eventSource) eventSource.close();
                    alert('Error: ' + error.message);
                }
            }
            
            function downloadMarkdown() {
                if (!currentStory) return;
                
                const blob = new Blob([currentStory.markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'kahovitz-story.md';
                a.click();
                URL.revokeObjectURL(url);
            }
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🎭 Kahovitz Story Pipeline v2 running on port ${PORT}`);
  console.log('🌐 Visit http://localhost:5175 to start creating stories!');
  console.log('📚 API Endpoints:');
  console.log('  POST /api/plan - Generate story plan');
  console.log('  POST /api/generate-story - Generate full story');
  console.log('  GET /health - Health check');
});
