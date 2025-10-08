
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LinkItem, User } from './types';
import { getLinks, addLink } from './services/apiService';
import { getCurrentUser, signIn, signUp, signOut } from './services/authService';
import Header from './components/Header';
import LinkInputForm from './components/LinkInputForm';
import TagFilter from './components/TagFilter';
import LinkCard from './components/LinkCard';
import SkeletonCard from './components/SkeletonCard';
import AuthPage from './components/AuthPage';

const MainApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isAddingLink, setIsAddingLink] = useState<boolean>(false);
  const [isFetchingLinks, setIsFetchingLinks] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsFetchingLinks(true);
        let loadedLinks = await getLinks();
        // Sort links by date on the client-side to ensure newest are first
        loadedLinks = loadedLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLinks(loadedLinks);
      } catch (err: any) {
        setError("Could not fetch your links. Please try again later.");
        console.error(err);
      } finally {
        setIsFetchingLinks(false);
      }
    };
    fetchLinks();
  }, [user.token]); // Refetch if the user token changes (e.g. re-login)

  const handleAddLink = useCallback(async (url: string) => {
    setIsAddingLink(true);
    setError(null);

    try {
        new URL(url);
    } catch (_) {
        setError("Please enter a valid URL.");
        setIsAddingLink(false);
        return;
    }

    if (links.some(link => link.url === url)) {
        setError("This link has already been added.");
        setIsAddingLink(false);
        return;
    }

    try {
      const newLink = await addLink(url);
      setLinks(prevLinks => [newLink, ...prevLinks]);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while adding the link.');
    } finally {
      setIsAddingLink(false);
    }
  }, [links]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    links.forEach(link => {
      link.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (!activeTag) {
      return links;
    }
    return links.filter(link => link.tags.includes(activeTag));
  }, [links, activeTag]);

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <Header user={user} onLogout={onLogout} />

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="lg:w-1/3 lg:sticky top-8 self-start">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
              <LinkInputForm onAddLink={handleAddLink} isLoading={isAddingLink} error={error} />
              {allTags.length > 0 && (
                <TagFilter tags={allTags} activeTag={activeTag} onSelectTag={setActiveTag} />
              )}
            </div>
          </aside>

          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAddingLink && <SkeletonCard />}
              {isFetchingLinks ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : filteredLinks.length > 0 ? (
                filteredLinks.map(link => <LinkCard key={link.id} link={link} />)
              ) : (
                !isAddingLink && (
                  <div className="md:col-span-2 text-center py-16 px-6 bg-slate-800 rounded-2xl">
                    <h3 className="text-xl font-semibold text-slate-300">No links to display</h3>
                    <p className="text-slate-500 mt-2">
                      {links.length > 0 ? 'Select another tag or "All" to see more.' : 'Add your first link to get started!'}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
    const [isAuthenticating, setIsAuthenticating] = useState(true);

    useEffect(() => {
        // This effect ensures we have the latest user from session storage on mount.
        setCurrentUser(getCurrentUser());
        setIsAuthenticating(false);
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        const user = await signIn(email, password);
        setCurrentUser(user);
    };

    const handleSignUp = async (email: string, password: string) => {
        const user = await signUp(email, password);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        signOut();
        setCurrentUser(null);
    };

    if (isAuthenticating) {
        return (
            <div className="bg-slate-900 min-h-screen flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (!currentUser) {
        return <AuthPage onSignIn={handleSignIn} onSignUp={handleSignUp} />;
    }

    return <MainApp user={currentUser} onLogout={handleLogout} />;
};

export default App;
