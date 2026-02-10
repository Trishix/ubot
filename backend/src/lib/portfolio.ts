import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Note: data directory is now two levels up since we moved this file to src/lib/
const DATA_FILE = path.join(__dirname, '../../data/portfolio.json');

export interface Portfolio {
  name: string;
  role: string;
  bio: string;
  email?: string;
  github?: string;
  linkedin?: string;
  location?: string;
  availability?: string;
  skills: string[];
  projects: any[];
  experience: any[];
}

// Get portfolio data
export async function getPortfolio(): Promise<Portfolio> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    console.error('❌ Error reading portfolio:', error.message);
    // Return default data if file doesn't exist
    return {
      name: "Trishit Swarnakar",
      role: "Full Stack Developer",
      bio: "Portfolio data not configured yet.",
      skills: [],
      projects: [],
      experience: []
    };
  }
}

// Update portfolio data
export async function updatePortfolio(newData: Partial<Portfolio>): Promise<Portfolio> {
  try {
    // Merge with existing data
    const current = await getPortfolio();
    const updated = { ...current, ...newData };

    await fs.writeFile(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('✅ Portfolio updated successfully');
    return updated;
  } catch (error: any) {
    console.error('❌ Error updating portfolio:', error.message);
    throw error;
  }
}
