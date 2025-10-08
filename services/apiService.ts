import { LinkItem } from '../types';
import { getCurrentUser } from './authService';

// IMPORTANT: Replace this with your actual Cloud Function URL from the deployment step.
const API_BASE_URL = 'https://asia-southeast2-gcp-demo-02-307713.cloudfunctions.net/api';

const getAuthHeaders = (): Record<string, string> => {
    const user = getCurrentUser();
    if (!user?.token) {
        throw new Error('User is not authenticated.');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
    };
};

export const getLinks = async (): Promise<LinkItem[]> => {
    const response = await fetch(`${API_BASE_URL}/links`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Could not fetch links.");
    }

    return await response.json();
};

export const addLink = async (url: string): Promise<LinkItem> => {
    const response = await fetch(`${API_BASE_URL}/links`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add link.");
    }
    
    return await response.json();
};