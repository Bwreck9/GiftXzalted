// OpenAI integration - referenced from javascript_openai blueprint
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI secret: OPENAI_API_KEY');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getGiftRecommendations(
  profileData: {
    name: string;
    ageRange?: string | null;
    gender?: string | null;
    relationship?: string | null;
    personalityTraits?: string[];
    interests?: string;
    closeness?: string | null;
    budget?: string | null;
    giftPreferences?: string[];
    dislikes?: string | null;
    giftStyle?: string | null;
    location?: string | null;
    additionalNotes?: string | null;
  },
  userMessage?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  alreadyGeneratedIdeas?: string[],
  numIdeas: number = 10
): Promise<string> {
  try {
    // Build profile context from available data
    let profileContext = `You are a helpful gift recommendation assistant. You help people find the perfect gifts based on detailed profiles.

Current profile for ${profileData.name}:`;

    if (profileData.ageRange) {
      profileContext += `\n- Age Range: ${profileData.ageRange}`;
    }
    if (profileData.gender) {
      profileContext += `\n- Gender: ${profileData.gender}`;
    }
    if (profileData.relationship) {
      profileContext += `\n- Relationship: ${profileData.relationship}`;
    }
    if (profileData.closeness) {
      profileContext += `\n- Closeness: ${profileData.closeness}`;
    }
    if (profileData.personalityTraits && profileData.personalityTraits.length > 0) {
      profileContext += `\n- Personality Traits: ${profileData.personalityTraits.join(', ')}`;
    }
    if (profileData.interests) {
      profileContext += `\n- Interests: ${profileData.interests}`;
    }
    if (profileData.budget) {
      profileContext += `\n- Budget: ${profileData.budget}`;
    }
    if (profileData.giftPreferences && profileData.giftPreferences.length > 0) {
      profileContext += `\n- Gift Preferences: ${profileData.giftPreferences.join(', ')}`;
    }
    if (profileData.dislikes) {
      profileContext += `\n- Dislikes/Avoid: ${profileData.dislikes}`;
    }
    if (profileData.giftStyle) {
      profileContext += `\n- Gift Style: ${profileData.giftStyle === 'unique-thoughtful' ? 'Unique & Thoughtful' : 'Safe & Popular'}`;
    }
    if (profileData.location) {
      profileContext += `\n- Location: ${profileData.location}`;
    }
    if (profileData.additionalNotes) {
      profileContext += `\n- Additional Notes: ${profileData.additionalNotes}`;
    }

    profileContext += `\n\nInstructions:
1. Provide thoughtful, personalized gift recommendations based on the profile above
2. Consider their personality traits, interests, budget, and preferences
3. Suggest exactly ${numIdeas} specific, practical gift ideas with clear reasoning based on the profile
4. Return ONLY a valid JSON array (no markdown, no extra text) with this exact format:
[
  {
    "id": 1,
    "title": "Gift Name",
    "reason": "Why this gift is perfect for them based on their profile"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, nothing else
- No markdown code blocks, no explanations
- Each reason should be 1-2 sentences explaining why it matches their profile
- Focus on gift ideas and descriptions. Do NOT include product links or URLs.`;

    // Add already-generated ideas to avoid duplicates
    if (alreadyGeneratedIdeas && alreadyGeneratedIdeas.length > 0) {
      profileContext += `\n\nPREVIOUSLY GENERATED IDEAS TO AVOID:
The following gift ideas have already been suggested in this session. DO NOT suggest these again. Be creative and provide completely different, unique gift ideas:
${alreadyGeneratedIdeas.map((idea, idx) => `${idx + 1}. ${idea}`).join('\n')}

Generate ${numIdeas} NEW and DIFFERENT gift ideas that are NOT similar to the ones listed above.`;
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: profileContext },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })));
    }

    // Add user message if provided, otherwise use default prompt
    messages.push({ 
      role: 'user', 
      content: userMessage || 'Based on this profile, please suggest some thoughtful gift ideas.' 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_completion_tokens: 2048,
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a recommendation. Please try again.';
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to generate gift recommendations: " + error.message);
  }
}
