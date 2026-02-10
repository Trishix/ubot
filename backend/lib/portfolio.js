import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/portfolio.json');

// Get portfolio data
export async function getPortfolio() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading portfolio:', error.message);
    // Return default data if file doesn't exist
    return {
      name: "Developer",
      role: "Software Engineer",
      bio: "Portfolio data not configured yet.",
      skills: [],
      projects: [],
      experience: []
    };
  }
}

// Update portfolio data
export async function updatePortfolio(newData) {
  try {
    // Merge with existing data
    const current = await getPortfolio();
    const updated = { ...current, ...newData };
    
    await fs.writeFile(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('✅ Portfolio updated successfully');
    return updated;
  } catch (error) {
    console.error('❌ Error updating portfolio:', error.message);
    throw error;
  }
}
