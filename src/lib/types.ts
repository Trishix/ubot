export interface PortfolioData {
    name: string;
    role: string;
    bio: string;
    skills: string[];
    github: string;
    socials?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
}

export interface Profile {
    id: string;
    username: string;
    portfolio_data: PortfolioData;
    created_at: string;
}

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};
