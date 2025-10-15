import { useParams, useLocation } from 'wouter';

export default function ProfileDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">Profile Detail</h1>
        <button onClick={() => setLocation('/')}>Back to Home</button>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <p>Profile ID: {id}</p>
        <p>TODO: Implement profile detail page with manual ideas and premium results</p>
      </main>
    </div>
  );
}
