
// pages/api/analyze-design.js - Claude AI Analysis Endpoint
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url, title, html, styles, screenshot, tokens, timestamp } = req.body;
    
    // Validate required fields
    if (!url || !html) {
      return res.status(400).json({ error: 'Missing required fields: url, html' });
    }
    
    console.log(`🤖 Analyzing design for: ${url}`);
    
    // Build Claude prompt
    const prompt = buildDesignAnalysisPrompt({
      url,
      title,
      html: html.substring(0, 8000), // Limit HTML length
      styles: JSON.stringify(styles).substring(0, 4000),
      tokens: tokens ? JSON.stringify(tokens).substring(0, 2000) : null,
      timestamp
    });
    
    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // Parse Claude's response
    const claudeResponse = message.content[0].text;
    let analysisResult;
    
    try {
      // Try to parse as JSON
      analysisResult = JSON.parse(claudeResponse);
    } catch (parseError) {
      // If not valid JSON, create structured response
      analysisResult = {
        summary: claudeResponse,
        issues: extractIssuesFromText(claudeResponse),
        score: calculateScore(claudeResponse),
        recommendations: extractRecommendations(claudeResponse)
      };
    }
    
    // Add metadata
    const response = {
      ...analysisResult,
      metadata: {
        url,
        title,
        analyzedAt: new Date().toISOString(),
        model: 'claude-3-5-sonnet-20241022'
      }
    };
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

function buildDesignAnalysisPrompt({ url, title, html, styles, tokens, timestamp }) {
  return `
You are an expert UX/UI designer and accessibility specialist analyzing a web page for design quality and consistency issues.

ANALYSIS REQUEST:
- URL: ${url}
- Title: ${title}
- Analyzed at: ${timestamp}

PAGE DATA:
HTML Structure (truncated):
\`\`\`html
${html}
\`\`\`

Computed Styles (sample):
\`\`\`json
${styles}
\`\`\`

${tokens ? `Design Tokens:
\`\`\`json
${tokens}
\`\`\`` : 'No design tokens provided.'}

ANALYSIS REQUIREMENTS:
Analyze this page for the following issues and return a JSON response:

1. **Visual Hierarchy Issues**
   - Inconsistent heading sizes
   - Poor contrast ratios
   - Unclear information architecture

2. **Consistency Problems**
   - Inconsistent spacing/padding
   - Mixed font sizes/families
   - Inconsistent component styling
   - Color usage inconsistencies

3. **Design Token Compliance** (if tokens provided)
   - Elements not using defined tokens
   - Values that are close but not exact matches
   - Missing token applications

4. **Layout & Spacing Issues**
   - Inconsistent margins/padding
   - Alignment problems
   - Responsive design concerns

5. **Accessibility Concerns**
   - Color contrast issues
   - Missing semantic HTML
   - Focus state problems

RESPONSE FORMAT:
Return ONLY a valid JSON object with this structure:

{
  "summary": "Brief overall assessment (2-3 sentences)",
  "score": 85,
  "issues": [
    {
      "id": "unique-issue-id",
      "title": "Issue Title",
      "description": "Detailed description of the problem",
      "severity": "high|medium|low",
      "category": "visual-hierarchy|consistency|tokens|layout|accessibility",
      "elements": ["selector1", "selector2"],
      "recommendation": "Specific actionable fix",
      "tokenSuggestion": "suggested.token.name (if applicable)"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific recommendation",
      "impact": "Expected improvement"
    }
  ],
  "positives": [
    "Things that are working well"
  ]
}

Focus on actionable insights. Be specific about which elements have issues and provide concrete recommendations.
  `;
}

function extractIssuesFromText(text) {
  // Fallback parser if Claude doesn't return JSON
  const issues = [];
  const lines = text.split('\n');
  
  let currentIssue = null;
  
  for (const line of lines) {
    if (line.includes('Issue:') || line.includes('Problem:')) {
      if (currentIssue) issues.push(currentIssue);
      currentIssue = {
        id: `issue-${issues.length + 1}`,
        title: line.replace(/Issue:|Problem:/g, '').trim(),
        description: '',
        severity: 'medium',
        category: 'other',
        elements: [],
        recommendation: ''
      };
    } else if (currentIssue && line.trim()) {
      currentIssue.description += line + ' ';
    }
  }
  
  if (currentIssue) issues.push(currentIssue);
  return issues;
}

function calculateScore(text) {
  // Simple scoring based on issue keywords
  const issueWords = ['problem', 'issue', 'error', 'wrong', 'bad', 'poor'];
  const positiveWords = ['good', 'excellent', 'well', 'proper', 'consistent'];
  
  const issueCount = issueWords.reduce((count, word) => 
    count + (text.toLowerCase().split(word).length - 1), 0);
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (text.toLowerCase().split(word).length - 1), 0);
  
  return Math.max(30, Math.min(100, 85 - (issueCount * 5) + (positiveCount * 3)));
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('Recommend') || line.includes('Suggest') || line.includes('Fix')) {
      recommendations.push({
        priority: 'medium',
        action: line.trim(),
        impact: 'Improved user experience'
      });
    }
  }
  
  return recommendations.length > 0 ? recommendations : [
    {
      priority: 'high',
      action: 'Review the analysis above and implement suggested improvements',
      impact: 'Better design consistency and user experience'
    }
  ];
}