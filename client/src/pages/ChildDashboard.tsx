import { useParams, Link } from "wouter";
import { useChildDashboard } from "@/hooks/use-children";
import { useRecordProgress } from "@/hooks/use-progress";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Star, Play, Award, CheckCircle2, ChevronLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";
import type { Module } from "@shared/schema";

export default function ChildDashboard() {
  const { id } = useParams();
  const { data: dashboard, isLoading } = useChildDashboard(Number(id));
  const recordProgress = useRecordProgress();
  const [playingModule, setPlayingModule] = useState<Module | null>(null);
  const [completedModuleId, setCompletedModuleId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-secondary rounded-3xl"
        />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-6">
        <h1 className="font-display text-4xl text-foreground">Oops! We couldn't find your profile.</h1>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-full font-bold">Go Back Home</Link>
      </div>
    );
  }

  const { child, recommendedModules } = dashboard;

  const handlePlay = (mod: Module) => {
    setPlayingModule(mod);
    // Simulate playing a module for 3 seconds
    setTimeout(() => {
      setPlayingModule(null);
      fireConfetti();
      setCompletedModuleId(mod.id);
      recordProgress.mutate({ childId: child.id, moduleId: mod.id, score: 10 });
      
      // Clear success state after a bit
      setTimeout(() => setCompletedModuleId(null), 3000);
    }, 3000);
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF5E7E', '#FFB800', '#00D1FF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF5E7E', '#FFB800', '#00D1FF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const getAvatarColor = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-[#4facfe]',
      green: 'bg-[#43e97b]',
      purple: 'bg-[#a18cd1]',
      orange: 'bg-[#fa709a]',
      pink: 'bg-[#ff0844]',
    };
    return map[color] || map.blue;
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="p-4 sm:p-8 flex items-center justify-between relative z-10">
        <Link href="/" className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-transform">
          <Home className="w-7 h-7" />
        </Link>

        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border-4 border-[#FFFBEB]"
        >
          <Star className="w-8 h-8 text-secondary fill-secondary" />
          <span className="font-display text-3xl font-bold text-foreground">{child.learningScore}</span>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-20 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-12"
        >
          <div className={`w-32 h-32 rounded-[2rem] ${getAvatarColor(child.avatarColor)} shadow-2xl flex items-center justify-center rotate-3 border-8 border-white mb-6`}>
             <span className="font-display text-6xl text-white font-bold">{child.name.charAt(0)}</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground text-center">
            Hi, <span className="text-accent">{child.name}!</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mt-4 font-bold">What shall we play today?</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {recommendedModules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlay(mod)}
              className={`
                cursor-pointer relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-xl border-b-8
                ${completedModuleId === mod.id ? 'border-green-400 ring-4 ring-green-200' : 'border-primary/20'}
              `}
            >
              <div className="mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                  ${mod.type === 'video' ? 'bg-blue-100 text-blue-500' : 
                    mod.type === 'game' ? 'bg-orange-100 text-orange-500' :
                    mod.type === 'story' ? 'bg-purple-100 text-purple-500' :
                    'bg-pink-100 text-pink-500'
                  }
                `}>
                  {completedModuleId === mod.id ? (
                     <CheckCircle2 className="w-10 h-10 text-green-500" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold leading-tight mb-2 text-foreground">{mod.title}</h3>
              <p className="text-muted-foreground font-medium text-sm line-clamp-2">{mod.description}</p>

              {completedModuleId === mod.id && (
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-sm">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white rounded-full p-3 shadow-xl">
                    <Award className="w-12 h-12 text-secondary fill-secondary" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>

      {/* Playing Overlay */}
      <AnimatePresence>
        {playingModule && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-4xl aspect-video rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col items-center justify-center"
            >
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-8 border-t-accent border-r-primary border-b-secondary border-l-green-400 rounded-full mb-8"
              />
              <h2 className="font-display text-4xl font-bold text-foreground">Playing {playingModule.title}...</h2>
              <p className="text-xl text-muted-foreground mt-2 font-medium">Getting everything ready!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
