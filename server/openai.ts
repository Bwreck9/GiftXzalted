// OpenAI integration - referenced from javascript_openai blueprint
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI secret: OPENAI_API_KEY');
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getGiftRecommendations(
  profileData: {
    name: string;
    age: number;
    event: string;
    gender: string;
    relationship?: string | null;
    personality: string;
    interests: string;
    shoppingFor: string;
  },
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const systemPrompt = `You are a helpful gift recommendation assistant. You help people find the perfect gifts based on detailed profiles.

Current profile:
- Name: ${profileData.name}
- Shopping for: ${profileData.shoppingFor === 'self' ? 'themselves' : 'someone else'}
${profileData.relationship ? `- Relationship: ${profileData.relationship}` : ''}
- Age: ${profileData.age} years old
- Event: ${profileData.event}
- Gender: ${profileData.gender}
- Personality: ${profileData.personality}
- Interests: ${profileData.interests}

Instructions:
1. Provide thoughtful, personalized gift recommendations based on the profile
2. Consider the person's age, interests, personality, and the occasion
3. Suggest specific, practical gift ideas with reasoning based on the profile
4. Be conversational and helpful
5. Ask follow-up questions to refine recommendations if needed

IMPORTANT: Focus on gift ideas and descriptions. Do NOT include product links or URLs.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 8192,
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a recommendation. Please try again.';
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to generate gift recommendations: " + error.message);
  }
}
