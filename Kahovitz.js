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
async function generateCharacterDialogue(character, context, phase, turnNumber) {
  try {
    const client = character === 'Char1' ? groqClients.char1 : groqClients.char2;
    
    const systemPrompt = `You are ${character}, a character in an ongoing story. 
Current phase: ${phase}
Turn number: ${turnNumber}

Respond naturally to the conversation context. Stay in character and maintain consistency with your personality and the story's tone.
Keep your response engaging and move the story forward naturally.`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Story context: ${context}\n\nWhat does ${character} say next?` }
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

// API Endpoint: Story Generation
app.post('/api/generate-story', async (req, res) => {
  try {
    const { 
      refinedPrompt, 
      openingScene, 
      phasePlan, 
      totalUtterances = 20, 
      summaryInterval = 4 
    } = req.body;
    
    if (!refinedPrompt || !openingScene || !phasePlan) {
      return res.status(400).json({ error: 'refinedPrompt, openingScene, and phasePlan are required' });
    }

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
      
      // Determine current phase
      const currentPhase = getCurrentPhase(phasePlan, totalUtterances, turn);
      
      // Determine next speaker (alternate between Char1 and Char2)
      const nextSpeaker = lastSpeaker === 'Char1' ? 'Char2' : 'Char1';
      
      // Generate character dialogue
      const dialogue = await generateCharacterDialogue(nextSpeaker, currentContext, currentPhase.name, turn);
      
      // Store conversation
      storyData.conversations.push({
        speaker: nextSpeaker,
        text: dialogue,
        turn: turn,
        phase: currentPhase.name
      });
      
      // Update context
      currentContext += `\n${nextSpeaker}: ${dialogue}`;
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
    const allSummaries = storyData.summaries.map(s => s.summary);
    storyData.masterSummary = await generateMasterSummary(allSummaries);
    
    // Generate markdown
    const markdown = generateMarkdown(storyData);
    
    console.log('✅ Story generation completed successfully');
    
    res.json({
      data: storyData,
      markdown: markdown
    });
    
  } catch (error) {
    console.error('❌ Error in /api/generate-story:', error);
    res.status(500).json({ error: error.message });
  }
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
        <title>Kahovitz Story Pipeline v2</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            textarea { width: 100%; height: 100px; margin: 10px 0; }
            .result { background: white; padding: 15px; border-radius: 4px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>🎭 Kahovitz Story Pipeline v2</h1>
        <div class="container">
            <h2>Step 1: Plan Your Story</h2>
            <textarea id="roughIdea" placeholder="Enter your rough story idea..."></textarea>
            <button onclick="planStory()">Generate Plan</button>
            
            <div id="planResult" class="result" style="display: none;">
                <h3>Generated Plan</h3>
                <div id="planContent"></div>
                <button onclick="generateStory()">Generate Full Story</button>
            </div>
            
            <div id="storyResult" class="result" style="display: none;">
                <h3>Generated Story</h3>
                <div id="storyContent"></div>
                <button onclick="downloadMarkdown()">Download Markdown</button>
            </div>
        </div>
        
        <script>
            let currentPlan = null;
            let currentStory = null;
            
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
                    document.getElementById('planContent').innerHTML = \`
                        <p><strong>Refined Prompt:</strong> \${result.refinedPrompt}</p>
                        <p><strong>Phase Plan:</strong></p>
                        <ul>
                            <li><strong>Setup:</strong> \${result.phasePlan.setup}</li>
                            <li><strong>Rising Action:</strong> \${result.phasePlan.risingAction}</li>
                            <li><strong>Climax:</strong> \${result.phasePlan.climax}</li>
                            <li><strong>Resolution:</strong> \${result.phasePlan.resolution}</li>
                        </ul>
                        <p><strong>Opening Scene:</strong> \${result.openingScene}</p>
                    \`;
                    document.getElementById('planResult').style.display = 'block';
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
            
            async function generateStory() {
                if (!currentPlan) {
                    alert('Please generate a plan first');
                    return;
                }
                
                try {
                    const response = await fetch('/api/generate-story', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...currentPlan,
                            totalUtterances: 20,
                            summaryInterval: 4
                        })
                    });
                    
                    const result = await response.json();
                    if (result.error) throw new Error(result.error);
                    
                    currentStory = result;
                    document.getElementById('storyContent').innerHTML = \`
                        <p><strong>Master Summary:</strong> \${result.data.masterSummary}</p>
                        <p><strong>Total Conversations:</strong> \${result.data.conversations.length}</p>
                        <p><strong>Total Summaries:</strong> \${result.data.summaries.length}</p>
                        <p><strong>Total Narrations:</strong> \${result.data.narrations.length}</p>
                    \`;
                    document.getElementById('storyResult').style.display = 'block';
                } catch (error) {
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
