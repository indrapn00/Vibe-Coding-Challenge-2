import { User } from '../types';

// IMPORTANT: Replace this with your actual Cloud Function URL from the deployment step.
// Example: https://api-ab12cde-uc.a.run.app
const API_BASE_URL = 'https://api-ab12cde-uc.a.run.app'; 
const SESSION_KEY = 'gemini-link-aggregator-session';

export const signUp = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Sign up failed.');
  }

  const user: User = await response.json();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Sign in failed.');
  }
  
  const user: User = await response.json();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const signOut = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to sign out", error);
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error("Failed to get current user from session", error);
    return null;
  }
};