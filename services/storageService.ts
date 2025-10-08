import { LinkItem } from '../types';

const getStorageKey = (userEmail: string) => `gemini-link-aggregator-links-${userEmail}`;

export const getLinks = (userEmail: string): LinkItem[] => {
  if (!userEmail) return [];
  try {
    const savedLinks = localStorage.getItem(getStorageKey(userEmail));
    if (savedLinks) {
      return JSON.parse(savedLinks);
    }
  } catch (error) {
    console.error("Failed to load links from localStorage", error);
  }
  return [];
};

export const saveLinks = (links: LinkItem[], userEmail: string): void => {
  if (!userEmail) return;
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(links));
  } catch (error) {
    console.error("Failed to save links to localStorage", error);
  }
};
