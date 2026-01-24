import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/Card';
import { ArrowRight, GraduationCap, Target, TrendingUp, Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const counsellingOptions = [
  {
    id: 'JoSAA',
    name: 'JOSAA',
    fullName: 'Joint Seat Allocation Authority - IITs, NITs, IIITs, GFTIs',
    icon: GraduationCap,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20'
  },
  {
    id: 'CSAB',
    name: 'CSAB',
    fullName: 'Central Seat Allocation Board - Special Round',
    icon: Target,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20'
  },
  {
    id: 'AKTU',
    name: 'AKTU',
    fullName: 'Dr. A.P.J. Abdul Kalam Technical University - UP State',
    icon: TrendingUp,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  {
    id: 'MHTCET',
    name: 'MHTCET',
    fullName: 'Maharashtra Common Entrance Test',
    icon: Sparkles,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20'
  },
  {
    id: 'Multi',
    name: 'Multi-Counselling',
    fullName: 'Search across all counselling systems for maximum opportunities',
    icon: Layers,
    color: 'text-purple-500',
    bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/50',
    highlight: true
  }
];

const CounsellingPage = () => {
  return (
    <div className="relative min-h-screen container mx-auto px-4 py-20">
       {/* Background Elements similar to HomePage for consistency */}
       <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-indigo-950/20 via-slate-900/20 to-teal-900/20 -z-20 transform skew-y-[-2deg] origin-top-left scale-110 pointer-events-none" />

      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
          Choose Your Counselling
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Select the counselling type to start your prediction
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {counsellingOptions.map((option) => (
          <Link 
            key={option.id} 
            to={`/predict?type=${option.id}`}
            className="group"
          >
            <GlassCard 
              className={`h-full p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden ${option.highlight ? 'ring-2 ring-purple-500/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`h-14 w-14 rounded-xl ${option.bg} flex items-center justify-center`}>
                  <option.icon className={`h-7 w-7 ${option.color}`} />
                </div>
                <ArrowRight className={`h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors ${option.highlight ? 'text-purple-400' : ''}`} />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {option.name}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {option.fullName}
              </p>
              
              {option.highlight && (
                <div className="absolute inset-0 border-2 border-dashed border-purple-500/20 rounded-2xl pointer-events-none group-hover:border-purple-500/40 transition-colors" />
              )}
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CounsellingPage;
