#!/bin/bash

echo "🚀 AI App Prototyper - Deployment Helper"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not found. Please initialize git first."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Consider committing them before deployment:"
    echo "   git add . && git commit -m 'Pre-deployment commit'"
    echo ""
fi

echo "✅ Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New Project'"
echo "4. Import your repository: ai-app-prototyper"
echo "5. Configure environment variables:"
echo "   - OPENAI_API_KEY"
echo "   - DEEP_SEEK_API_KEY"
echo "   - CLAUDE_API_KEY"
echo "   - NODE_ENV=production"
echo "6. Click 'Deploy'"
echo ""
echo "🔗 Your app will be live at: https://your-project-name.vercel.app"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
