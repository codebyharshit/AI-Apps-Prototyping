# 🚀 AI App Prototyper - Deployment Guide

## **Free Hosting Options**

### 1. **Vercel (Recommended - Best for Next.js)**
- **Free tier**: Unlimited deployments, 100GB bandwidth/month
- **Perfect for Next.js**: Built by the creators of Next.js
- **Automatic deployments**: Connect your GitHub repo
- **Environment variables**: Easy API key management

### 2. **Netlify**
- **Free tier**: 100GB bandwidth/month, form submissions
- **Good for static sites**: Works well with Next.js
- **Easy setup**: Drag & drop or Git integration

### 3. **Railway**
- **Free tier**: $5 credit monthly (enough for small apps)
- **Full-stack support**: Great for apps with APIs

---

## **🚀 Vercel Deployment (Step-by-Step)**

### **Step 1: Prepare Your Repository**
Your code is already in a Git repository on the `fix/react-live-component-errors` branch.

### **Step 2: Deploy to Vercel**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your repository**: `ai-app-prototyper`
5. **Select the repository** and click "Import"

### **Step 3: Configure Project Settings**

**Framework Preset**: Next.js (should auto-detect)
**Root Directory**: `./` (leave as default)
**Build Command**: `npm run build` (should auto-detect)
**Output Directory**: `.next` (should auto-detect)

### **Step 4: Set Environment Variables**

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

```
OPENAI_API_KEY=your_openai_api_key_here
DEEP_SEEK_API_KEY=your_deepseek_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
NODE_ENV=production
```

**Important**: Replace the values with your actual API keys!

### **Step 5: Deploy**

1. **Click "Deploy"**
2. **Wait for build** (usually 2-5 minutes)
3. **Your app will be live** at `https://your-project-name.vercel.app`

---

## **🔧 Environment Variables Required**

Your app needs these API keys to function:

- **OPENAI_API_KEY**: For OpenAI Vision capabilities
- **DEEP_SEEK_API_KEY**: For DeepSeek AI model
- **CLAUDE_API_KEY**: For Claude AI model
- **NODE_ENV**: Set to "production" for deployment

---

## **📱 Alternative: Netlify Deployment**

If you prefer Netlify:

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **Click "New site from Git"**
4. **Select your repository**
5. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **Set environment variables** in Site settings
7. **Deploy**

---

## **⚠️ Important Notes**

1. **API Keys**: Never commit API keys to your repository
2. **Environment Variables**: Set them in your hosting platform's dashboard
3. **Build Process**: Your app will automatically rebuild on every Git push
4. **Custom Domain**: You can add a custom domain later if needed

---

## **🔍 Troubleshooting**

### **Build Errors**
- Check that all dependencies are in `package.json`
- Ensure Node.js version compatibility (Next.js 15 requires Node 18+)

### **Runtime Errors**
- Verify environment variables are set correctly
- Check API key validity and quotas

### **Performance Issues**
- Vercel automatically optimizes Next.js apps
- Consider upgrading to paid plan for better performance

---

## **🎉 Success!**

Once deployed, your AI App Prototyper will be accessible to anyone with an internet connection. Users can:
- Generate AI components
- Prototype applications
- Test AI functionality
- Share prototypes

**Your app will be live at**: `https://your-project-name.vercel.app`
