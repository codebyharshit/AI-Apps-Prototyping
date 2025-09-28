import axios from 'axios';

// Deepseek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEP_SEEK_API_KEY;

// Create a client for Deepseek API
export const deepseekClient = {
  /**
   * Generate a chat completion using Deepseek API
   */
  createChatCompletion: async (params: {
    model: string;
    messages: Array<{role: string; content: string | Array<{type: string; [key: string]: any}>}>;
    temperature?: number;
    max_tokens?: number;
  }) => {
    try {
      const response = await axios.post(`${DEEPSEEK_API_URL}/chat/completions`, 
        {
          model: params.model,
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          }
        }
      );
      
      return {
        choices: [
          {
            message: {
              content: response.data.choices[0].message.content
            }
          }
        ]
      };
    } catch (error: any) {
      console.error('Deepseek API error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Default model mapping from OpenAI to Deepseek
export const modelMapping = {
  'gpt-4o-mini': 'deepseek-chat',
  'gpt-4': 'deepseek-chat',
  'gpt-3.5-turbo': 'deepseek-chat'
};

/**
 * Generate a React component using Deepseek API
 */
export const generateComponentWithDeepseek = async (prompt: string, componentType: string = 'Container') => {
  try {
    console.log('🤖 Generating component with Deepseek:', componentType);
    console.log('📝 Prompt length:', prompt.length);

    const response = await deepseekClient.createChatCompletion({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert React developer. Generate clean, functional React components that work with React Live. Always include the render() call at the end.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const generatedCode = response.choices[0]?.message?.content || '';
    
    if (!generatedCode) {
      throw new Error('No code generated from Deepseek API');
    }

    console.log('✅ Component generated successfully with Deepseek');
    console.log('📄 Generated code length:', generatedCode.length);

    return {
      success: true,
      component: generatedCode,
      componentType
    };

  } catch (error: any) {
    console.error('❌ Error generating component with Deepseek:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate component',
      componentType
    };
  }
}; 