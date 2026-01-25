/**
 * Portfolio Store - localStorage-based portfolio management
 *
 * Allows users to group projects together and track aggregated metrics.
 * Future: Migrate to Supabase with user authentication for persistent cloud storage.
 */

const STORAGE_KEY = "gridagent_portfolios";

export interface Portfolio {
  id: string;
  name: string;
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Generate a UUID-like ID
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Load all portfolios from localStorage
export function getPortfolios(): Portfolio[] {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage not available");
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Portfolio[];
  } catch (error) {
    console.error("Failed to load portfolios:", error);
    return [];
  }
}

// Save portfolios to localStorage
function savePortfolios(portfolios: Portfolio[]): void {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage not available");
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  } catch (error) {
    console.error("Failed to save portfolios:", error);
  }
}

// Get a single portfolio by ID
export function getPortfolio(id: string): Portfolio | null {
  const portfolios = getPortfolios();
  return portfolios.find((p) => p.id === id) || null;
}

// Create a new portfolio
export function createPortfolio(name: string, projectIds: string[] = []): Portfolio {
  const portfolios = getPortfolios();
  const now = new Date().toISOString();

  const newPortfolio: Portfolio = {
    id: generateId(),
    name: name.trim(),
    projectIds,
    createdAt: now,
    updatedAt: now,
  };

  portfolios.push(newPortfolio);
  savePortfolios(portfolios);

  return newPortfolio;
}

// Update an existing portfolio
export function updatePortfolio(
  id: string,
  updates: Partial<Pick<Portfolio, "name" | "projectIds">>
): Portfolio | null {
  const portfolios = getPortfolios();
  const index = portfolios.findIndex((p) => p.id === id);

  if (index === -1) {
    console.warn(`Portfolio not found: ${id}`);
    return null;
  }

  const portfolio = portfolios[index];
  const updatedPortfolio: Portfolio = {
    ...portfolio,
    ...updates,
    name: updates.name?.trim() ?? portfolio.name,
    updatedAt: new Date().toISOString(),
  };

  portfolios[index] = updatedPortfolio;
  savePortfolios(portfolios);

  return updatedPortfolio;
}

// Delete a portfolio
export function deletePortfolio(id: string): boolean {
  const portfolios = getPortfolios();
  const filteredPortfolios = portfolios.filter((p) => p.id !== id);

  if (filteredPortfolios.length === portfolios.length) {
    console.warn(`Portfolio not found: ${id}`);
    return false;
  }

  savePortfolios(filteredPortfolios);
  return true;
}

// Add a project to a portfolio
export function addProjectToPortfolio(portfolioId: string, projectId: string): Portfolio | null {
  const portfolio = getPortfolio(portfolioId);
  if (!portfolio) {
    console.warn(`Portfolio not found: ${portfolioId}`);
    return null;
  }

  // Don't add duplicate projects
  if (portfolio.projectIds.includes(projectId)) {
    return portfolio;
  }

  return updatePortfolio(portfolioId, {
    projectIds: [...portfolio.projectIds, projectId],
  });
}

// Remove a project from a portfolio
export function removeProjectFromPortfolio(
  portfolioId: string,
  projectId: string
): Portfolio | null {
  const portfolio = getPortfolio(portfolioId);
  if (!portfolio) {
    console.warn(`Portfolio not found: ${portfolioId}`);
    return null;
  }

  return updatePortfolio(portfolioId, {
    projectIds: portfolio.projectIds.filter((id) => id !== projectId),
  });
}

// Add multiple projects to a portfolio
export function addProjectsToPortfolio(
  portfolioId: string,
  projectIds: string[]
): Portfolio | null {
  const portfolio = getPortfolio(portfolioId);
  if (!portfolio) {
    console.warn(`Portfolio not found: ${portfolioId}`);
    return null;
  }

  // Filter out duplicates
  const newProjectIds = projectIds.filter(
    (id) => !portfolio.projectIds.includes(id)
  );

  if (newProjectIds.length === 0) {
    return portfolio;
  }

  return updatePortfolio(portfolioId, {
    projectIds: [...portfolio.projectIds, ...newProjectIds],
  });
}

// Get portfolios containing a specific project
export function getPortfoliosForProject(projectId: string): Portfolio[] {
  const portfolios = getPortfolios();
  return portfolios.filter((p) => p.projectIds.includes(projectId));
}

// Check if a project is in any portfolio
export function isProjectInAnyPortfolio(projectId: string): boolean {
  const portfolios = getPortfolios();
  return portfolios.some((p) => p.projectIds.includes(projectId));
}

// Rename a portfolio
export function renamePortfolio(id: string, newName: string): Portfolio | null {
  return updatePortfolio(id, { name: newName.trim() });
}

// Clear all portfolios (use with caution)
export function clearAllPortfolios(): void {
  savePortfolios([]);
}

// Export portfolios as JSON (for backup)
export function exportPortfolios(): string {
  const portfolios = getPortfolios();
  return JSON.stringify(portfolios, null, 2);
}

// Import portfolios from JSON (for restore)
export function importPortfolios(jsonData: string, merge = true): Portfolio[] {
  try {
    const imported = JSON.parse(jsonData) as Portfolio[];

    if (!Array.isArray(imported)) {
      throw new Error("Invalid portfolio data: expected array");
    }

    // Validate structure
    for (const p of imported) {
      if (!p.id || !p.name || !Array.isArray(p.projectIds)) {
        throw new Error("Invalid portfolio structure");
      }
    }

    if (merge) {
      const existing = getPortfolios();
      const existingIds = new Set(existing.map((p) => p.id));

      // Add imported portfolios that don't already exist
      for (const p of imported) {
        if (!existingIds.has(p.id)) {
          existing.push(p);
        }
      }

      savePortfolios(existing);
      return existing;
    } else {
      savePortfolios(imported);
      return imported;
    }
  } catch (error) {
    console.error("Failed to import portfolios:", error);
    throw error;
  }
}
