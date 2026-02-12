

**UBOT** is an intelligent platform that lets you clone your professional identity into an AI chatbot. It digests your Resume (PDF) and GitHub profile to create a conversational agent that speaks for you, answers recruiters' questions, and showcases your skills—24/7.

![UBOT Terminal Interface](/public/og-image.png)

## 🧠 How It Works

### 1. **Ingestion & Processing**
*   **Input**: You upload a **PDF Resume** and optionally provide a **GitHub username**.
*   **Parsing**:
    *   `pdf-parse` extracts text from your resume.
    *   GitHub API fetches your pinned repositories, languages, and bio.
*   **Persona Generation**:
    *   Google Gemini (Flash/Lite) analyzes this raw data to build a structured JSON profile (Bio, Role, Skills, etc.).
*   **Vector Embeddings (RAG)**:
    *   **Local Embeddings**: We use **@xenova/transformers** (`all-mpnet-base-v2`) to generate high-quality vector embeddings of your data locally on the server.
    *   *Why Local?* This avoids external API rate limits and quotas for embeddings, making ingestion free and fast.
    *   Vectors are stored in **Supabase** (PostgreSQL + `pgvector`).

### 2. **The Chat Experience**
*   **Retrieval Augmented Generation (RAG)**:
    *   When a user asks a question, we generate an embedding for their query (using Xenova).
    *   We perform a **semantic search** in Supabase to find the most relevant chunks of your resume and GitHub data.
*   **Response Generation**:
    *   The relevant context is fed into **Google Gemini**, which answers in the first person ("I built...", "My experience...").

---

## 🛠️ Compute Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** | App Router, Server Actions, React Server Components. |
| **Language** | **TypeScript** | Full type safety across API and UI. |
| **Database** | **Supabase** | PostgreSQL for data, **pgvector** for RAG, and Authentication. |
| **LLM Inference** | **Google Gemini** | `gemini-2.5-flash-lite` for fast, intelligent responses. |
| **Embeddings** | **Xenova** | `@xenova/transformers` running `all-mpnet-base-v2` locally. |
| **Styling** | **Tailwind CSS** | Custom "Terminal/Hacker" design system. |
| **Email** | **Resend** | Transactional emails for contact forms. |

---

## 🚀 Key Features

*   **📄 PDF Resume RAG**: Upload your CV, and the bot learns every detail—from work history to soft skills.
*   **🐙 GitHub Integration**: Auto-syncs your top repos to answer technical questions about your code.
*   **⚡ CV-Only Mode**: Don't have active GitHub? No problem. Create a bot with just your Resume.
*   **🔋 Dual-Input**: Use both sources for the ultimate "Career Twin".
*   **🖥️ Terminal UI**: A distinct, immersive aesthetic that stands out from generic chat interfaces.
*   **🔗 Custom Handle**: Get a unique link (e.g., `ubot.com/chat/yourname`) to share with recruiters.

---

## 🚦 Getting Started

### Prerequisites
*   Node.js 20+
*   Supabase Account (with `vector` extension enabled)
*   Google AI Studio Key (Free tier works!)

### Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/yourusername/ubot.git
    cd ubot
    npm install
    ```

2.  **Environment Setup**
    Create `.env.local` with the following:
    ```bash
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Google Gemini
    GOOGLE_API_KEY=your_gemini_key
    # Optional: Multiple keys for rotation to avoid rate limits
    FREE_API_KEY_1=another_key

    # GitHub (Optional but recommended for higher limits)
    GITHUB_TOKEN=your_github_token
    ```

3.  **Database Setup (SQL)**
    Run this in your Supabase SQL Editor:
    ```sql
    -- Enable Vector Extension
    create extension if not exists vector;

    -- Documents Table for RAG
    create table documents (
      id bigserial primary key,
      content text,
      metadata jsonb,
      embedding vector(768), -- Matches Xenova mpnet-base-v2 dimensions
      user_id uuid references auth.users not null
    );

    -- Search Function
    create or replace function match_documents (
      query_embedding vector(768),
      match_threshold float,
      match_count int,
      filter_user_id uuid
    ) returns table (
      id bigint,
      content text,
      metadata jsonb,
      similarity float
    ) language plpgsql stable as $$
    begin
      return query select
        id,
        content,
        metadata,
        1 - (documents.embedding <=> query_embedding) as similarity
      from documents
      where 1 - (documents.embedding <=> query_embedding) > match_threshold
      and user_id = filter_user_id
      order by documents.embedding <=> query_embedding
      limit match_count;
    end;
    $$;
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📄 License
MIT License. Built for the future of work.
