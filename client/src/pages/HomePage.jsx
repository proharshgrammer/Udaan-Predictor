import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/Card';
import { ArrowRight, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  return (
    <div className="relative overflow-hidden w-full">
      {/* Background Gradients */}
      {/* Background Gradients */}
      {/* Dark Mode Gradient (Hidden in Light) */}
      <div className="hidden dark:block absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-900 -z-20 transform skew-y-[-2deg] origin-top-left scale-110" />
      {/* Light Mode Gradient (Visible in Light) */}
      <div className="dark:hidden absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-indigo-50/50 via-white to-teal-50/50 -z-20 transform skew-y-[-2deg] origin-top-left scale-110" />
      
      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] -z-10 mix-blend-overlay" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-24 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm dark:shadow-glow">
            AI-Powered Counselling
          </span>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight leading-tight drop-shadow-sm dark:drop-shadow-lg text-slate-900 dark:text-white">
            Udaan Vidyapeeth <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-teal-400 dark:to-cyan-300">Predictor</span>
          </h1>
          <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-100 font-medium italic mb-10 drop-shadow-sm dark:drop-shadow-md">
            "Your Dreams, Our Wings"
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/counselling">
              <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-indigo-950 dark:hover:bg-teal-50 shadow-xl shadow-indigo-500/20 dark:shadow-teal-500/20 px-8">
                Predict Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="bg-white/50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-transparent dark:text-white dark:border-white/30 dark:hover:bg-white/10 px-8">
                Admin Access
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="p-8 hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-6">
                <TrendingUp className="text-teal-500 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trend Analysis</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              We analyze the last 3 years of closing ranks using a custom weighted average to predict the expected cutoff for 2026.
            </p>
          </GlassCard>

          <GlassCard className="p-8 hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                <Activity className="text-orange-500 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Volatility & Risk</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Standard deviation calculations determine the volatility of each college's cutoff, assigning 'Safe' or 'Risky' badges.
            </p>
          </GlassCard>

          <GlassCard className="p-8 hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="text-indigo-500 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Confidence Bands</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Understand your admission chances with probability percentages based on Z-score mapping.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
