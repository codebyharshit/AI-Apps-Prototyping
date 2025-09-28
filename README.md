This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### API Configuration

This app supports multiple AI providers. Add a `.env.local` file to the root directory with your API keys:

```env
# For image processing and vision capabilities (OpenAI GPT-4 Vision)
OPENAI_API_KEY=your_openai_key_here

# For text-based AI processing (DeepSeek Chat)
DEEP_SEEK_API_KEY=your_deepseek_key_here
```

**When each API is used:**
- **OpenAI**: When processing images (vision capabilities)
- **DeepSeek**: For text-only AI interactions (cheaper alternative)
- **Fallback**: If neither API is available, the system provides helpful error messages

### Running the Development Server

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
