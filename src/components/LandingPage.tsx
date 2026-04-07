import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Heart,
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Stethoscope,
  ShieldAlert,
  Leaf,
  Dog,
  Baby,
  User,
  Home,
  Mail,
  Globe,
  MapPin,
  BrainCircuit,
  Activity
} from "lucide-react";
import atharLogo from "../assets/athar-logo.png";

// --- NEW: Animated Counter Component ---
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth effect (starts fast, slows down)
      const easeOutQuad = (t: number) => t * (2 - t);

      setCount(Math.floor(easeOutQuad(progress) * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  // Format number with commas (e.g., 3247 -> 3,247)
  return <span>{count.toLocaleString()}{suffix}</span>;
};

interface LandingPageProps {
  onSelectUserType: (
    userType: "volunteer" | "organization" | "admin",
  ) => void;
}

export function LandingPage({
  onSelectUserType,
}: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#1C9290] selection:text-white overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => scrollToSection("home")}
          >
            <img 
              src={atharLogo} 
              alt="Athar" 
              className={`w-9 h-9 transition-all duration-300 group-hover:scale-105 ${!scrolled ? 'brightness-0 invert' : ''}`} 
            />
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${!scrolled ? 'text-white' : 'text-[#043E52]'}`}>
              Athar
            </span>
          </div>
          <div className="flex items-center gap-2">
            {['About', 'How It Works', 'Contact'].map((item) => (
                <Button
                key={item}
                variant="ghost"
                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                className={`font-medium text-sm transition-colors duration-300 h-9 px-4 ${
                    !scrolled 
                    ? 'text-white hover:bg-white/10 hover:text-white' 
                    : 'text-[#043E52] hover:text-[#1C9290] hover:bg-[#1C9290]/5'
                }`}
                >
                {item}
                </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectUserType("admin")}
              className={`ml-2 font-medium text-xs border h-9 px-4 transition-all duration-300 ${
                  !scrolled 
                  ? 'border-white text-white hover:bg-white hover:text-[#043E52]' 
                  : 'border-[#043E52] text-[#043E52] hover:bg-[#043E52] hover:text-white'
              }`}
            >
              Admin Portal
            </Button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative w-full h-screen min-h-[800px] flex flex-col justify-center items-center overflow-hidden rounded-b-[50%_60px] shadow-2xl bg-[#043E52]">
        
        {/* Background Image */}
        <img 
            src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2670&auto=format&fit=crop"
            alt="Community hands holding together" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Brand Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#043E52]/90 via-[#043E52]/70 to-[#043E52]/95" />
        
        {/* Digital Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixels.png')] opacity-20 mix-blend-overlay"></div>

        {/* Floating "Live" Cards */}
        <div className="absolute left-[5%] top-[25%] hidden xl:block animate-bounce-slow">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl flex items-center gap-3">
                <div className="bg-[#1C9290] p-2 rounded-lg">
                    <BrainCircuit className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-300 font-medium uppercase">AI Status</p>
                    <p className="text-sm text-white font-bold">Optimizing Routes...</p>
                </div>
            </div>
        </div>

        <div className="absolute right-[5%] bottom-[35%] hidden xl:block animate-bounce-delayed">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl flex items-center gap-3">
                <div className="bg-[#E16A3D] p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-300 font-medium uppercase">Mobilization</p>
                    <p className="text-sm text-white font-bold">Team Deployed: Hatay</p>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl px-6 text-center text-white mt-10">
            
            <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C9290]/20 backdrop-blur-md border border-[#1C9290]/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Activity className="h-3 w-3 text-[#1C9290]" />
                    <span className="text-[10px] font-bold tracking-widest text-[#1C9290] uppercase">Live Crisis Ecosystem</span>
                </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight drop-shadow-2xl">
                Mobilizing <span className="text-[#1C9290]">Compassion</span> with <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    Intelligent Action.
                </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 max-w-xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
                The first platform connecting verified volunteers with organizations. 
                <span className="font-semibold text-white"> AI-Powered. Community-Driven. Ready to Deploy.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto mb-20">
                <Button 
                    onClick={() => onSelectUserType("volunteer")}
                    className="h-12 flex-1 text-sm font-bold bg-[#1C9290] hover:bg-[#016A6D] text-white border-0 shadow-lg shadow-[#1C9290]/20 transition-transform hover:scale-105 rounded-lg"
                >
                    Join as Volunteer
                </Button>
                <Button 
                    onClick={() => onSelectUserType("organization")}
                    className="h-12 flex-1 text-sm font-bold bg-white text-[#043E52] hover:bg-slate-50 border-0 shadow-lg transition-transform hover:scale-105 rounded-lg"
                >
                    Register Organization
                </Button>
            </div>

            {/* INTEGRATED ANIMATED STATS (Inside Hero, Transparent) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/10 pt-8 max-w-3xl mx-auto">
               {[
                   { value: 3247, label: "AVR Members", suffix: "" },
                   { value: 52, label: "Verified Partners", suffix: "" },
                   { value: 18, label: "Avg Response", suffix: "m" },
                   { value: 94, label: "Match Accuracy", suffix: "%" }
               ].map((stat, i) => (
                   <div key={i} className="flex flex-col items-center">
                       {/* Sleek, thin font for numbers with Animation */}
                       <p className="text-3xl md:text-4xl font-light text-white tracking-tight mb-1">
                         <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                       </p>
                       <p className="text-[10px] font-bold text-[#1C9290] uppercase tracking-widest">{stat.label}</p>
                   </div>
               ))}
            </div>
        </div>
      </section>

      {/* --- FOCUS AREAS (Grid Layout) --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#043E52] mb-3">Focus Areas</h2>
            <p className="text-base text-slate-500 font-medium">Where our ecosystem makes the most impact.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
                { icon: BookOpen, label: "Education", color: "bg-[#043E52]" },
                { icon: Stethoscope, label: "Health", color: "bg-[#1C9290]" },
                { icon: ShieldAlert, label: "Crisis Relief", color: "bg-[#E16A3D]" },
                { icon: Leaf, label: "Environment", color: "bg-[#016A6D]" },
                { icon: Dog, label: "Animal Welfare", color: "bg-[#FFA45D]" },
                { icon: Baby, label: "Child Care", color: "bg-[#1C9290]" },
                { icon: User, label: "Elderly Care", color: "bg-[#043E52]" },
                { icon: Home, label: "Community", color: "bg-[#016A6D]" },
              ].map((cause, i) => {
                const Icon = cause.icon;
                return (
                  <div key={i} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:-translate-y-1">
                    <div className={`${cause.color} p-4 rounded-xl text-white mb-4 shadow-md transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-[#043E52] text-sm group-hover:text-[#1C9290] transition-colors">{cause.label}</span>
                  </div>
                )
              })}
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE ATHAR --- */}
      <section id="how-it-works" className="py-24 bg-[#E16A3D] rounded-[3rem] mx-4 md:mx-10 relative overflow-hidden shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Why Choose Athar?</h2>
            <p className="text-lg text-white/90 font-medium">We replace chaos with coordination. Our platform ensures that every minute of volunteer time translates to real impact.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:translate-y-[-5px] transition-transform duration-300">
                <div className="bg-[#1C9290]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-[#1C9290]" />
                </div>
                <h3 className="text-xl font-bold text-[#043E52] mb-3">Easy Matching</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Smart algorithms connect volunteers with opportunities that match their skills and interests instantly.
                </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl hover:translate-y-[-5px] transition-transform duration-300">
                <div className="bg-[#043E52]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-7 w-7 text-[#043E52]" />
                </div>
                <h3 className="text-xl font-bold text-[#043E52] mb-3">Track Impact</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Comprehensive analytics and reporting to measure and showcase your real-world contribution.
                </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl hover:translate-y-[-5px] transition-transform duration-300">
                <div className="bg-[#E16A3D]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-7 w-7 text-[#E16A3D]" />
                </div>
                <h3 className="text-xl font-bold text-[#043E52] mb-3">Verified Trust</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  All organizations and volunteers are verified to ensure safe and meaningful experiences.
                </p>
            </div>
          </div>
        </div>
        
        {/* Subtle Texture Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </section>

      {/* --- CHOOSE YOUR IMPACT --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#043E52] mb-3">Choose Your Impact</h2>
            <p className="text-base text-slate-600">How do you want to contribute to the ecosystem?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            
            {/* Volunteer Card */}
            <div 
              onClick={() => onSelectUserType("volunteer")}
              className="group relative bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1C9290]"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1C9290]/10 rounded-lg flex items-center justify-center">
                        <Heart className="h-6 w-6 text-[#1C9290]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#043E52]">Development Hub</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Join the AI-powered training ecosystem. Get verified skills and join the Athar Volunteer Reserve.
                </p>
                <div className="space-y-3 mb-6">
                  {['Skill Paths', 'AI Simulator', 'Verified Certificates'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                      <CheckCircle className="h-4 w-4 text-[#1C9290]" />
                      {item}
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center text-[#1C9290] font-bold text-sm group-hover:gap-2 transition-all">
                    Start Volunteering <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Organization Card */}
            <div 
              onClick={() => onSelectUserType("organization")}
              className="group relative bg-[#043E52] rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E16A3D]"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Mission Control</h3>
                </div>
                <p className="text-sm text-slate-300 mb-6">
                  Activate pre-trained volunteers for crisis response. NLP-powered matching. Real-time deployment.
                </p>
                <div className="space-y-3 mb-6">
                  {['Rapid Mobilization', 'NLP Matching', 'Crisis Analytics'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-slate-200 font-medium text-xs">
                      <CheckCircle className="h-4 w-4 text-[#E16A3D]" />
                      {item}
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center text-white font-bold text-sm group-hover:gap-2 transition-all">
                    Register Organization <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- ORGANIC ABOUT SECTION --- */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div>
              <div className="inline-block px-3 py-1 bg-[#1C9290]/10 rounded-full text-[#1C9290] font-bold text-xs mb-6 tracking-wide">
                  ABOUT ATHAR
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#043E52] mb-6 leading-tight">
                Empowering communities through <span className="text-[#1C9290]">meaningful connections.</span>
              </h2>
              <p className="text-base text-slate-600 mb-6 leading-relaxed">
                Athar is dedicated to creating a seamless platform that connects passionate volunteers with non-profit organizations across Turkey and beyond. 
              </p>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">
                By leveraging technology and data-driven matching, we help volunteers find opportunities that align with their skills, interests, and values.
              </p>
              
              <div className="flex gap-10">
                <div>
                    <h4 className="text-3xl font-bold text-[#043E52] mb-1">
                        <AnimatedCounter end={10} suffix="k+" duration={1500} />
                    </h4>
                    <p className="text-slate-500 font-medium text-xs uppercase tracking-wide">Lives Impacted</p>
                </div>
                <div>
                    <h4 className="text-3xl font-bold text-[#043E52] mb-1">
                        <AnimatedCounter end={50} suffix="+" duration={1500} />
                    </h4>
                    <p className="text-slate-500 font-medium text-xs uppercase tracking-wide">Cities Reached</p>
                </div>
              </div>
            </div>
            
            {/* Right Image (Organic Blob Shape) */}
            <div className="relative">
                <div className="absolute inset-0 bg-[#E16A3D] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] rotate-6 opacity-20 blur-2xl transform scale-110"></div>
                <img 
                    src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=800" 
                    alt="Volunteers high-fiving" 
                    className="relative rounded-[40%_60%_70%_30%/40%_50%_60%_50%] shadow-2xl w-full object-cover z-10 hover:rotate-1 transition-transform duration-500"
                />
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className="bg-[#043E52] text-white pt-16 pb-8 border-t-4 border-[#FFA45D]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={atharLogo} alt="Athar" className="w-8 h-8 brightness-0 invert" />
                <span className="text-xl font-bold tracking-tight">Athar</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                Connecting volunteers with meaningful
                opportunities to create positive change in real-time.
              </p>
              <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#016A6D] rounded-full flex items-center justify-center hover:bg-[#1C9290] transition-colors cursor-pointer">
                    <Mail size={14} />
                  </div>
                  <div className="w-8 h-8 bg-[#016A6D] rounded-full flex items-center justify-center hover:bg-[#1C9290] transition-colors cursor-pointer">
                     <Globe size={14} />
                  </div>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4 font-bold text-sm text-[#FFA45D]">For Volunteers</h4>
              <ul className="space-y-2 text-slate-300 text-xs">
                <li className="hover:text-white cursor-pointer transition-colors">Find Opportunities</li>
                <li className="hover:text-white cursor-pointer transition-colors">How It Works</li>
                <li className="hover:text-white cursor-pointer transition-colors">Success Stories</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-sm text-[#FFA45D]">For Organizations</h4>
              <ul className="space-y-2 text-slate-300 text-xs">
                <li className="hover:text-white cursor-pointer transition-colors">Post Opportunities</li>
                <li className="hover:text-white cursor-pointer transition-colors">Get Verified</li>
                <li className="hover:text-white cursor-pointer transition-colors">Resources</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-sm text-[#FFA45D]">Company</h4>
              <ul className="space-y-2 text-slate-300 text-xs">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#016A6D] pt-6 text-center">
            <p className="text-slate-400 font-medium text-xs">© 2026 Athar Platform. All rights reserved.</p>
             <p className="text-slate-400 font-medium text-xs">Built With Love.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}