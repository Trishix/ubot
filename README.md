# UBOT - AI-Powered Portfolio Chatbot

## 🚀 Easy Setup Guide

This project is separated into **Backend** (API) and **Frontend** (Terminal Interface).

### 1️⃣ Backend Setup (The Brain)

1.  Open the `backend` folder in your terminal:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables:
    *   Rename `.env.example` to `.env` (or create a new `.env` file).
    *   Open `.env` and add your **Google Gemini API Key**:
        ```env
        GOOGLE_API_KEY=your_actual_api_key_here
        ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    ✅ Server will run at: `http://localhost:3001`

---

### 2️⃣ Frontend Setup (The Interface)

1.  Open a **new terminal** window and go to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies (only needed once):
    ```bash
    npm install
    ```
3.  Start the frontend:
    ```bash
    npm run dev
    ```
    ✅ It will give you a local URL (e.g., `http://localhost:5173`). Open that in your browser!

### 🌍 Deployment Configuration

*   **Backend**: Set environment variables (`GOOGLE_API_KEY`, etc.) in your hosting provider (Render, Railway, Heroku).
*   **Frontend**: To point the frontend to a deployed backend, create a `.env` file in the `frontend` folder:
    ```env
    VITE_API_URL=https://your-deployed-backend.com/api/chat
    ```
    Then run `npm run build` to create static files for deployment.
