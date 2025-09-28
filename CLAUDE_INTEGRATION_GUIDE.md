# Claude AI Integration Guide

This guide explains how to integrate and use Claude AI alongside your existing DeepSeek AI setup in the AI App Prototyper.

## 🚀 What's New

- **Dual AI Support**: Now supports both DeepSeek and Claude AI models
- **Model Selection**: Choose between different AI providers for different tasks
- **Performance Comparison**: Test and compare both AI models side-by-side
- **Vision Support**: Claude supports image analysis (when configured)
- **Flexible Routing**: Automatically routes requests to your preferred AI provider

## 🔑 Setup Instructions

### 1. Get Your Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-...`)

### 2. Configure API Keys

1. Open the **Settings Panel** in your app
2. Enter your **DeepSeek API Key** (if not already configured)
3. Enter your **Claude API Key**
4. Click **Save Settings**

### 3. Select Your Preferred AI Provider

1. In the Settings Panel, use the **AI Model Selection** section
2. Choose between:
   - **DeepSeek**: Great for coding, analysis, and general assistance
   - **Claude**: Excels at reasoning, analysis, and creative tasks
3. Select specific model variants for each provider

## 🧪 Testing the Integration

### Quick Test

1. Navigate to **Test New Components** page
2. Click **Claude vs DeepSeek Test**
3. Enter a test prompt
4. Test both AI models
5. Compare response times and quality

### What to Test

- **Simple Questions**: "What is the capital of France?"
- **Creative Tasks**: "Write a short story about a robot"
- **Analysis**: "Analyze the benefits of renewable energy"
- **Code Generation**: "Create a React component for a todo list"

## 🔧 API Endpoints

### Claude Main API
- **Endpoint**: `/api/ai/claude`
- **Use Case**: General AI tasks, image analysis, structured output
- **Features**: Vision support, structured JSON responses

### Claude Chat API
- **Endpoint**: `/api/ai/claude-chat`
- **Use Case**: Conversational AI, chat-based interactions
- **Features**: Multi-turn conversations, context awareness

### Automatic Routing
- **Endpoint**: `/api/ai`
- **Use Case**: Main AI endpoint that automatically routes to preferred provider
- **Features**: Smart routing based on user preferences

## 📊 Model Comparison

### Claude Models
- **Claude 3.5 Sonnet** (Default): Balanced performance, excellent reasoning
- **Claude 3 Opus**: Most capable, highest quality responses
- **Claude 3 Haiku**: Fastest, good for simple tasks

### DeepSeek Models
- **DeepSeek Chat**: Fast and efficient general purpose
- **DeepSeek Coder**: Specialized for code generation

## 🎯 Use Cases

### When to Use Claude
- **Complex reasoning tasks**
- **Creative writing and analysis**
- **Image analysis and understanding**
- **Structured data generation**
- **Academic or research tasks**

### When to Use DeepSeek
- **Code generation and debugging**
- **Technical analysis**
- **Fast responses for simple queries**
- **Cost-effective processing**

## 🔍 Troubleshooting

### Common Issues

1. **"Claude API key not configured"**
   - Check your API key in settings
   - Ensure the key is valid and active
   - Verify the key has proper permissions

2. **"API error: 401"**
   - Invalid or expired API key
   - Check your Anthropic account status
   - Verify billing and usage limits

3. **"No response generated"**
   - Check your internet connection
   - Verify the prompt is not too long
   - Try a simpler test query

4. **Slow response times**
   - Claude models can be slower than DeepSeek
   - Check your internet connection
   - Consider using Claude Haiku for speed

### Performance Tips

1. **Use appropriate models** for your task type
2. **Keep prompts concise** for faster responses
3. **Test both providers** to find the best fit
4. **Monitor API usage** to avoid rate limits

## 🔄 Migration from DeepSeek

### Gradual Transition
1. **Start with testing**: Use the comparison tool to evaluate both
2. **Identify use cases**: Determine which tasks work better with each AI
3. **Set preferences**: Configure your preferred provider for different scenarios
4. **Monitor performance**: Track response quality and speed

### Fallback Strategy
- If Claude fails, the system automatically falls back to DeepSeek
- Both APIs are called independently, ensuring reliability
- Error handling provides graceful degradation

## 📈 Performance Metrics

### What to Measure
- **Response Time**: How fast each AI responds
- **Response Quality**: Length, accuracy, and relevance
- **Success Rate**: Percentage of successful API calls
- **Cost Efficiency**: Cost per response (if applicable)

### Benchmarking
- Test with identical prompts across both AIs
- Use the built-in comparison tool
- Document performance patterns for your use cases
- Adjust preferences based on results

## 🚀 Advanced Features

### Structured Output
- Both AIs support structured JSON responses
- Useful for data extraction and formatting
- Configurable schemas for consistent output

### Image Analysis
- Claude supports image uploads and analysis
- Automatic routing to Claude for image tasks
- Fallback to text-based analysis if needed

### Multi-Modal Support
- Text and image inputs supported
- Automatic content type detection
- Provider-specific optimization

## 🔐 Security Considerations

### API Key Management
- Keys are stored in browser localStorage
- Keys are sent only to respective APIs
- Consider implementing server-side key management for production

### Data Privacy
- Claude and DeepSeek have different privacy policies
- Review data handling practices for each provider
- Consider data sensitivity when choosing providers

## 📚 Additional Resources

### Documentation
- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Support
- Check the browser console for detailed error logs
- Review API response status codes
- Test with simple prompts first
- Use the comparison tool to identify issues

## 🎉 Getting Started

1. **Configure your API keys** in the settings panel
2. **Test both AIs** using the comparison tool
3. **Set your preferences** based on performance
4. **Start building** with your preferred AI provider
5. **Monitor and optimize** based on your specific use cases

---

**Happy AI-powered prototyping! 🚀**

For questions or issues, check the browser console logs and refer to the troubleshooting section above.

