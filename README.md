# Deal Intelligence Agent

Deal Intelligence Agent is a full-stack, AI-powered application designed to act as an expert sales advisor. It helps sales representatives make data-driven decisions during active deals by surfacing patterns from past won/lost deals, providing specific recommendations, and identifying risks early based on stakeholder signals.

The system ingests sales interaction data (calls, emails, meeting notes), extracts structured information (stakeholders, objections, commitments) using Claude, embeds this context into a vector database using OpenAI, and provides context-aware advice to reps through a chat interface.

---

## Architecture & Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + Framer Motion (for animations)
- **Routing:** React Router v7
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js + Express.js
- **Database:** Supabase (PostgreSQL with `pgvector` for similarity search)
- **ORM / Client:** `@supabase/supabase-js`

### AI & Intelligence Layer
- **LLM Engine:** Claude (`claude-sonnet-4-20250514`) via Anthropic API (handles structured extraction, briefings, and agent chat)
- **Embeddings:** OpenAI (`text-embedding-3-small`, 1536 dims) for vectorizing deal context and objections
- **Memory Retrieval:** Cosine similarity search (`pgvector`) + pattern matching

---

## Key Features

1. **AI-Powered Interaction Extraction**
   Raw text from sales interactions is parsed by Claude to extract structured data: summaries, stakeholders (and their sentiment), objections, and commitments.
2. **Objection Memory & Pattern Recognition**
   Objections and deal context are vectorized and stored. When a rep encounters a new objection, the agent retrieves the most similar past objections and highlights winning strategies.
3. **Pre-call Briefings**
   The agent generates comprehensive summaries of active deals, including the current stage, open objections, stakeholders to watch out for, and grounded talking points based on past deals.
4. **Agent Chat**
   Reps can chat directly with the AI advisor to get specific, actionable recommendations tailored to the active deal context.

---

## Project Structure

```text
deals_agent/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── db/               # Supabase setup, schema.sql, and seed data scripts
│   │   ├── routes/           # Express routes (deals, interactions, agent)
│   │   └── services/         # Core business logic (embedding, extraction, retrieval, patterns)
│   ├── .env                  # Backend environment variables
│   └── package.json
├── frontend/                 # React + Vite web application
│   ├── src/                  # React components, pages, mock data, api hooks
│   ├── public/               # Static assets
│   ├── vite.config.js
│   └── package.json
├── ai-data/                  # AI development context, prompt engineering guides, and seed SQL
└── utils/                    # Shared utilities
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v20 or higher recommended)
- **Supabase** account and a project
- **OpenAI API Key**
- **Anthropic API Key**

### 2. Database Setup (Supabase)
1. Navigate to the SQL Editor in your Supabase project.
2. Run the schema script located in `backend/src/db/schema.sql` (or refer to `backend/context.md`) to create the necessary tables (`deals`, `stakeholders`, `interactions`, `objections`, `memory_chunks`, `patterns`) and the vector similarity RPC function (`match_memory_chunks`).
3. Run the seed data script (found in `ai-data/DEV3_AI_DATA_CONTEXT.md` or `backend/src/db/seed.sql`) to insert sample data and historical deal patterns.

### 3. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PORT=4000
   ```
4. Run the data embedding script to vectorize the seed data:
   ```bash
   npm run embed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   # Note: you may need to enter the nested frontend directory depending on the current structure
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser (typically `http://localhost:5173`).

---

## How Data Flows

1. **Interaction Logging**: The frontend POSTs an email/call transcript to `/api/interactions`.
2. **Extraction**: The backend passes the raw text to Claude (`services/extraction.js`) which returns a structured JSON mapping of stakeholders and objections.
3. **Database Insertion**: Extracted entities are saved to Supabase Postgres tables.
4. **Vector Embedding**: OpenAI embeds new objections (`services/embedding.js`) and stores them in `memory_chunks`.
5. **Agent Inference**: The rep asks for advice via `/api/agent/chat`. The backend performs a cosine similarity search on the query to retrieve past relevant deal context, passes it to Claude with the system prompt, and returns the AI's tailored response.

---

## License

Private and Confidential. All rights reserved.
