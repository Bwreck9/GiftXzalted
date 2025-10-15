import { useLocation } from 'wouter';

export default function ProfilesList() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">All Profiles</h1>
        <button onClick={() => setLocation('/')}>Back to Home</button>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <p>TODO: Implement profiles list page showing all profiles with manual ideas and premium results</p>
      </main>
    </div>
  );
}
