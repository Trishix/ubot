# UBOT Platform

UBOT is an AI-powered platform that allows users to create their own "AI Career Twin" - a personalized chatbot that can answer questions based on their professional profile, GitHub activity, and resume.

## 🚀 Features

- **AI Career Twin**: Generate a personalized chatbot trained on your professional data.
- **GitHub Integration**: Automatically fetch and analyze your GitHub repositories.
- **Resume Parsing**: Upload your CV to extract skills and experience.
- **Terminal-Style UI**: A sleek, hacker-themed interface for a unique user experience.
- **Dual Email System**: Professional contact form with support notifications and user confirmations.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI Engine**: Google Gemini 2.5 Flash / Flash-Lite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + Custom Terminal Theme
- **Email**: Resend API

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [**Email Service Guide**](docs/EMAIL_SERVICE.md): Configuration and usage of the dual email system.
- [**Quick Start Email**](docs/QUICK_START_EMAIL.md): Fast setup guide for email functionality.
- [**API Quota Guide**](docs/API_QUOTA_GUIDE.md): Managing Google AI API limits and key rotation.
- [**Build Summary**](docs/BUILD_SUMMARY.md): Changelog and resolution of recent build issues.

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ubot.git
   cd ubot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```
   Required keys:
   - Supabase URL & Anon Key
   - GitHub Token
   - Google AI API Key(s)
   - Resend API Key (for emails)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open locally**
   Visit [http://localhost:3000](http://localhost:3000)

## 📧 Email Service Setup

The platform uses **Resend** for transactional emails. To enable:

1. Add `RESEND_API_KEY` to `.env.local`
2. Verify your domain in Resend dashboard (for production)
3. See [Email Service Guide](docs/EMAIL_SERVICE.md) for full details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
