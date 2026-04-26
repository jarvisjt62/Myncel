'use client';

import { useState } from 'react';

export default function AdminFixPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const setupAdmin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: 'myncel-admin-setup-2024' })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Unknown error');
        if (data.details) {
          setError(`${data.error}: ${data.details}`);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="font-medium mb-2">This will reset the admin user:</p>
            <p><strong>Email:</strong> admin@myncel.com</p>
            <p><strong>Password:</strong> Admin123!</p>
          </div>
          
          <button
            onClick={setupAdmin}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Setup Admin User'}
          </button>
          
          {result && (
            <div className="p-4 bg-green-50 rounded text-green-700">
              <p className="font-medium">Success!</p>
              <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
              <p className="mt-4">You can now login with the credentials above.</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 rounded text-red-700">
              <p className="font-medium">Error:</p>
              <p className="text-sm whitespace-pre-wrap">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}