import { useParams, Link, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHomePath } from "@/hooks/use-home-path";
import { useChild } from "@/hooks/use-children";
import { useModules } from "@/hooks/use-modules";
import { useRecordProgress } from "@/hooks/use-progress";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Star, Award, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";
import type { Module } from "@shared/schema";
import { ThemeToggle } from "@/components/ThemeToggle";

import AlphabetGame from "@/components/games/AlphabetGame";
import ShapeMatcherGame from "@/components/games/ShapeMatcherGame";
import CaterpillarStory from "@/components/games/CaterpillarStory";
import DrawACatGame from "@/components/games/DrawACatGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import CountTapGame from "@/components/games/CountTapGame";
import ColorMatchGame from "@/components/games/ColorMatchGame";
import SameDifferentGame from "@/components/games/SameDifferentGame";
import FollowThePathGame from "@/components/games/FollowThePathGame";
import StartingSoundGame from "@/components/games/StartingSoundGame";
import SortingGame from "@/components/games/SortingGame";
import PatternFinishGame from "@/components/games/PatternFinishGame";
import NumberOrderGame from "@/components/games/NumberOrderGame";
import LoudOrQuietGame from "@/components/games/LoudOrQuietGame";
import HighOrLowGame from "@/components/games/HighOrLowGame";
import LetterSoundsGame from "@/components/games/LetterSoundsGame";

const MODULE_THEME: Record<string, { gradient: string; icon: string; borderColor: string }> = {
  "Learn the Alphabet": { gradient: "from-blue-400 to-cyan-400", icon: "🔤", borderColor: "border-blue-300" },
  "Letter Sounds": { gradient: "from-sky-400 to-blue-500", icon: "🔡", borderColor: "border-sky-300" },
  "Shape Matcher": { gradient: "from-orange-400 to-yellow-400", icon: "🔷", borderColor: "border-orange-300" },
  "The Hungry Caterpillar": { gradient: "from-green-400 to-emerald-500", icon: "🐛", borderColor: "border-green-300" },
  "Draw a Cat": { gradient: "from-pink-400 to-rose-500", icon: "🎨", borderColor: "border-pink-300" },
  "Memory Match": { gradient: "from-violet-400 to-purple-500", icon: "🃏", borderColor: "border-violet-300" },
  "Count & Tap": { gradient: "from-amber-400 to-orange-500", icon: "👆", borderColor: "border-amber-300" },
  "Color Match": { gradient: "from-fuchsia-400 to-pink-500", icon: "🎨", borderColor: "border-fuchsia-300" },
  "Same or Different": { gradient: "from-teal-400 to-cyan-500", icon: "🔍", borderColor: "border-teal-300" },
  "Follow the Path": { gradient: "from-lime-400 to-green-500", icon: "🗺️", borderColor: "border-lime-300" },
  "Starting Sounds": { gradient: "from-indigo-400 to-blue-500", icon: "🔊", borderColor: "border-indigo-300" },
  "Hot or Cold": { gradient: "from-red-400 to-sky-500", icon: "🌡️", borderColor: "border-red-300" },
  "Pattern Play": { gradient: "from-yellow-400 to-amber-500", icon: "🧩", borderColor: "border-yellow-300" },
  "Number Order": { gradient: "from-emerald-400 to-teal-500", icon: "🔢", borderColor: "border-emerald-300" },
  "Loud or Quiet": { gradient: "from-sky-400 to-indigo-500", icon: "🎚️", borderColor: "border-sky-300" },
  "High or Low": { gradient: "from-violet-400 to-fuchsia-500", icon: "🎶", borderColor: "border-violet-300" },
};

function getGameComponent(mod: Module, onComplete: () => void) {
  if (mod.title === "Learn the Alphabet") return <AlphabetGame onComplete={onComplete} />;
  if (mod.title === "Letter Sounds") return <LetterSoundsGame onComplete={onComplete} />;
  if (mod.title === "Shape Matcher") return <ShapeMatcherGame onComplete={onComplete} />;
  if (mod.title === "The Hungry Caterpillar") return <CaterpillarStory onComplete={onComplete} />;
  if (mod.title === "Draw a Cat") return <DrawACatGame onComplete={onComplete} />;
  if (mod.title === "Memory Match") return <MemoryMatchGame onComplete={onComplete} />;
  if (mod.title === "Count & Tap") return <CountTapGame onComplete={onComplete} />;
  if (mod.title === "Color Match") return <ColorMatchGame onComplete={onComplete} />;
  if (mod.title === "Same or Different") return <SameDifferentGame onComplete={onComplete} />;
  if (mod.title === "Follow the Path") return <FollowThePathGame onComplete={onComplete} />;
  if (mod.title === "Starting Sounds") return <StartingSoundGame onComplete={onComplete} />;
  if (mod.title === "Hot or Cold") return <SortingGame onComplete={onComplete} />;
  if (mod.title === "Pattern Play") return <PatternFinishGame onComplete={onComplete} />;
  if (mod.title === "Number Order") return <NumberOrderGame onComplete={onComplete} />;
  if (mod.title === "Loud or Quiet") return <LoudOrQuietGame onComplete={onComplete} />;
  if (mod.title === "High or Low") return <HighOrLowGame onComplete={onComplete} />;
  return null;
}

export default function ChildDashboard() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const homePath = useHomePath();
  const { data: child, isLoading: childLoading } = useChild(id ?? "");
  const { data: modules, isLoading: modulesLoading } = useModules();
  const isLoading = childLoading || modulesLoading;
  const recordProgress = useRecordProgress();
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-primary rounded-3xl"
        />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <h1 className="font-display text-4xl text-foreground">Oops! Profile not found.</h1>
        <Link href={homePath} className="px-6 py-3 bg-primary text-white rounded-full font-bold">
          Go home
        </Link>
      </div>
    );
  }

  const fireConfetti = () => {
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FF5E7E", "#FFB800", "#00D1FF"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FF5E7E", "#FFB800", "#00D1FF"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleComplete = (mod: Module) => {
    fireConfetti();
    setCompletedIds(prev => new Set(prev).add(mod.id));
    recordProgress.mutate({ childId: child.id, moduleId: mod.id, score: 20 });
    setActiveModule(null);
  };

  const getAvatarColor = (color: string) => {
    const map: Record<string, string> = {
      blue: "bg-[#4facfe]", green: "bg-[#43e97b]", purple: "bg-[#a18cd1]",
      orange: "bg-[#fa709a]", pink: "bg-[#ff0844]",
    };
    return map[color] || map.blue;
  };

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <header className="p-4 sm:p-8 flex items-center justify-between relative z-10">
        <Link href={homePath} className="w-14 h-14 bg-card rounded-full shadow-lg flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-transform" data-testid="button-home">
          <Home className="w-7 h-7" />
        </Link>
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
          >
            <Star className="w-8 h-8 text-secondary fill-secondary" />
            <span className="font-display text-3xl font-bold text-foreground">{child.learningScore}</span>
          </motion.div>
          <div className="bg-card rounded-full shadow-lg">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pb-20 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-12"
        >
          <div className={`w-32 h-32 rounded-[2rem] ${getAvatarColor(child.avatarColor)} shadow-2xl flex items-center justify-center rotate-3 border-8 border-card mb-6`}>
            <span className="font-display text-6xl text-white font-bold">{child.name.charAt(0)}</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground text-center">
            Hi, <span className="text-accent">{child.name}!</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mt-4 font-bold">Pick an activity to play!</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {(modules ?? []).map((mod, i) => {
            const theme = MODULE_THEME[mod.title] || { gradient: "from-blue-400 to-purple-400", icon: "⭐", borderColor: "border-blue-300" };
            const isCompleted = completedIds.has(mod.id);

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveModule(mod)}
                className={`cursor-pointer relative bg-card rounded-[2rem] overflow-hidden shadow-xl border-b-8 ${isCompleted ? "border-green-400" : theme.borderColor}`}
                data-testid={`card-module-${mod.id}`}
              >
                {/* Gradient banner */}
                <div className={`bg-gradient-to-r ${theme.gradient} p-6 flex items-center justify-between`}>
                  <span className="font-display text-white text-xl font-black">{mod.type.toUpperCase()}</span>
                  <span className="text-5xl">{theme.icon}</span>
                </div>

                <div className="p-6">
                  <h3 className="font-display text-2xl font-black text-foreground mb-2">{mod.title}</h3>
                  <p className="text-muted-foreground font-medium text-sm mb-5">{mod.description}</p>

                  <div className={`w-full py-3 rounded-xl font-bold text-center text-white transition-all bg-gradient-to-r ${theme.gradient} shadow-md`}>
                    {isCompleted ? "✅ Play Again!" : "▶ Let's Play!"}
                  </div>
                </div>

                {isCompleted && (
                  <div className="absolute top-3 right-3 bg-green-400 text-white rounded-full p-1">
                    <Award className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Game Modal */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-card w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "92vh" }}
            >
              {/* Modal header */}
              {(() => {
                const theme = MODULE_THEME[activeModule.title] || { gradient: "from-blue-400 to-purple-400", icon: "⭐", borderColor: "border-blue-300" };
                return (
                  <div className={`bg-gradient-to-r ${theme.gradient} px-6 py-4 flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{theme.icon}</span>
                      <h2 className="font-display text-2xl font-black text-white">{activeModule.title}</h2>
                    </div>
                    <button
                      onClick={() => setActiveModule(null)}
                      className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                      data-testid="button-close-game"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                );
              })()}

              {/* Game content */}
              <div className="flex-1 overflow-hidden p-4 sm:p-6">
                {getGameComponent(activeModule, () => handleComplete(activeModule))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
