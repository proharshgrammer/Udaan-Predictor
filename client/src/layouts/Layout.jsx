import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BarChart3, Lock, Sun, Moon } from 'lucide-react';

const Layout = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-teal-500/30">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-white/20 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-auto">
               <img 
                 src="/images/udaan-dark.png" 
                 alt="Udaan Vidyapeeth" 
                 className="h-full w-auto object-contain dark:hidden transition-all duration-300 group-hover:scale-105" 
               />
               <img 
                 src="/images/udaan-light.png" 
                 alt="Udaan Vidyapeeth" 
                 className="h-full w-auto object-contain hidden dark:block transition-all duration-300 group-hover:scale-105" 
               />
            </div>
            {/* Optional: Text if logo doesn't have it, but user sent logos so typically just logo is fine. 
                I will add the name as requested if logo is icon-only. 
                Looking at filenames udaan-light/dark, it implies full branding.
            */}
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-teal-400 transition-colors">Home</Link>
            <Link to="/counselling" className="hover:text-indigo-600 dark:hover:text-teal-400 transition-colors">Predictor</Link>
          </nav>

          <div className="flex items-center space-x-3">
             <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
               {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
             </Button>

            <Link to="/login">
              <Button variant="ghost" size="sm">
                <Lock className="mr-2 h-4 w-4" /> Admin
              </Button>
            </Link>
            <Link to="/counselling">
              <Button variant="primary" size="sm" className="hidden sm:flex">
                Start Prediction
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
         <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Udaan Vidyapeeth Predictor. All rights reserved.</p>
          <p className="text-xs mt-2 opacity-60">Your Dreams, Our Wings</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
