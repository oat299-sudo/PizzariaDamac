
import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { CustomerView } from './views/CustomerView';
import { KitchenView } from './views/KitchenView';
import { POSView } from './views/POSView';
import { Lock, ArrowLeft, User, Key } from 'lucide-react';

const MainLayout = () => {
  const { currentView, navigateTo, isAdminLoggedIn, adminLogin } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Helper to handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(username, password);
    if (success) {
      setError(false);
      setUsername('');
      setPassword('');
    } else {
      setError(true);
      setPassword('');
    }
  };

  // Render Logic
  if (currentView === 'customer') {
    return <CustomerView />;
  }

  // Auth Guard for Protected Views
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-800">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Staff Access</h2>
            <p className="text-gray-500 text-sm mt-1">
              Please login to access the {currentView === 'kitchen' ? 'Kitchen Display' : 'POS System'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.trim()); // Trim whitespace
                    setError(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Enter password"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg text-center font-bold animate-pulse">
                Invalid credentials. (Hint: admin / 123)
              </div>
            )}
            
            <button 
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg mt-2"
            >
              Login
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button 
              onClick={() => navigateTo('customer')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition"
            >
              <ArrowLeft size={16} /> Back to Customer Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Protected Routes
  if (currentView === 'kitchen') return <KitchenView />;
  if (currentView === 'pos') return <POSView />;

  return <CustomerView />; // Fallback
};

const App = () => {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <MainLayout />
      </div>
    </StoreProvider>
  );
};

export default App;
