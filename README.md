# UBOT

**UBOT** is an intelligent platform that lets you clone your professional identity into an AI chatbot. It digests your Resume (PDF) and GitHub profile to create a conversational agent that speaks for you, answers recruiters' questions, and showcases your skills—24/7.

![UBOT Terminal Interface](/public/og-image.png)

## 🧠 How It Works

### 1. **Ingestion & Processing**
*   **Input**: You upload a **PDF Resume** and optionally provide a **GitHub username**.
*   **Parsing**:
    *   `pdf-parse` extracts text from your resume.
    *   GitHub API fetches your profile, pinned repositories, and bio.
*   **Persona Generation**:
    *   **OpenRouter** (rotating through free models like `Step-3.5-Flash` and `Qwen 3`) analyzes this raw data to build a structured JSON profile.
*   **Vector Embeddings (RAG)**:
    *   **Google Gemini Embeddings**: We use `gemini-embedding-001` (3072 dimensions) for high-accuracy semantic search.
    *   **Key Rotation**: To bypass free-tier quota limits, the system automatically rotates through up to **5 Google API keys**.
    *   Vectors are stored in **Supabase** (PostgreSQL + `pgvector`).
*   **Source Attribution**:
    *   All ingested data is transparently tagged (e.g., `[Source: Resume]`, `[Source: GitHub]`) so the bot knows where its knowledge comes from.

### 2. **The Chat Experience**
*   **Retrieval Augmented Generation (RAG)**:
    *   When a user asks a question, we generate a 3072-dim embedding for their query using rotated Google keys.
    *   We perform a **semantic search** in Supabase retrieving up to 10 context chunks for breadth.
*   **Response Generation**:
    *   The relevant context is fed into **OpenRouter**, which answers in the first person ("I built...", "My experience...").
    *   The system includes model rotation to ensure responses are delivered even if specific free models are timing out.

---

## 🛠️ Compute Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** | App Router, Server Components. |
| **LLM Inference** | **OpenRouter** | Rotating free models (`Step-3.5-Flash`, `Qwen 3`, `DeepSeek`) for high reliability. |
| **Embeddings** | **Google AI** | `gemini-embedding-001` (3072 dims) with multi-key rotation. |
| **Database** | **Supabase** | PostgreSQL + `pgvector` for storage and semantic search. |
| **Styling** | **Vanilla CSS** | Modern "Terminal/Hacker" glassmorphism aesthetic. |
| **Email** | **Resend** | Transactional emails for contact forms. |

---

## 🚦 Getting Started

### Prerequisites
*   Node.js 20+
*   Supabase Account (with `vector` extension enabled)
*   **OpenRouter API Key**
*   **Google AI Studio Keys** (Free tier works! Get multiple for rotation)

### Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/yourusername/ubot.git
    cd ubot
    npm install
    ```

2.  **Environment Setup**
    Create `.env.local`:
    ```bash
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...

    # OpenRouter (Chat & Persona)
    OPENROUTER_API_KEY=...
    NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

    # Google (Embeddings Key Rotation)
    FREE_API_KEY_1=...
    FREE_API_KEY_2=...
    FREE_API_KEY_3=...
    FREE_API_KEY_4=...
    FREE_API_KEY_5=...

    # Resend (Contact Form)
    RESEND_API_KEY=...
    ```

3.  **Database Setup (SQL)**
    Run this in your **Supabase SQL Editor**:
    ```sql
    -- Enable Vector Extension
    create extension if not exists vector;

    -- Documents Table for RAG
    create table documents (
      id bigserial primary key,
      content text,
      metadata jsonb,
      embedding vector(3072), -- Matches gemini-embedding-001 dimensions
      user_id uuid references auth.users not null
    );

    -- Search Function
    create or replace function match_documents (
      query_embedding vector(3072),
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
