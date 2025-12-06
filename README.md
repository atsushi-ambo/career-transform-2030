# Career Transform 2030

A hackathon demo app that analyzes company DNA and simulates your future career path for 2030.

## Features

- Company DNA analysis from URL
- AI-powered career simulation with scenario-based questions
- Personalized future job offer generation
- Voice input/output support
- Real-time radar chart visualization

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```
4. Add your OpenAI API key to `.env.local`:
   ```
   VITE_OPENAI_API_KEY=your-api-key-here
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- OpenAI API
- Web Speech API

## Security Notes

- API keys are stored in `.env.local` (not committed to git)
- Input sanitization is applied to all user inputs
- This is a demo app intended for local development only

## License

MIT
