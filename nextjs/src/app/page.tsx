"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Heart, Wrench, MapPin, Sparkles, Droplets, Shield,
  Instagram, Mail, Users, PawPrint, ChevronDown,
  ArrowRight, CheckCircle, Star, Leaf, HandHeart
} from 'lucide-react';
import VolunteerForm from '@/components/VolunteerForm';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import TransparencyLedger from '@/components/TransparencyLedger';
import DonationVerifier from '@/components/DonationVerifier';
import BlockchainStatsSection from '@/components/BlockchainStatsSection';

// Animated counter component
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Floating paw prints decoration
function FloatingPaws() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary-200/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [-5, 5, -5],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <PawPrint className="w-8 h-8 md:w-12 md:h-12" />
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const scrollToForm = () => {
    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.15 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-secondary-50 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl px-6 py-3 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Heart className="w-7 h-7 text-primary-600 fill-primary-200" />
              </motion.div>
              <span className="text-xl font-display font-semibold text-primary-800">
                Give Good Club
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { href: "#story", label: "Our Story" },
                { href: "#impact", label: "Impact" },
                { href: "#how", label: "How It Works" },
                { href: "/transparency", label: "Transparency", icon: Shield },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-secondary-700 hover:text-primary-600 transition-colors font-medium text-sm flex items-center gap-1.5 rounded-lg hover:bg-primary-50"
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 ml-4">
                <motion.a
                  href="/donate"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Donate
                </motion.a>
                <motion.button
                  onClick={scrollToForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-secondary-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-secondary-700 transition-all"
                >
                  Join Us
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary-50"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <motion.span
                  animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                  className="w-full h-0.5 bg-secondary-800 rounded-full origin-left"
                />
                <motion.span
                  animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="w-full h-0.5 bg-secondary-800 rounded-full"
                />
                <motion.span
                  animate={isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                  className="w-full h-0.5 bg-secondary-800 rounded-full origin-left"
                />
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:hidden glass rounded-2xl mt-2 p-4"
              >
                <div className="flex flex-col space-y-2">
                  {[
                    { href: "#story", label: "Our Story" },
                    { href: "#impact", label: "Impact" },
                    { href: "#how", label: "How It Works" },
                    { href: "/transparency", label: "Transparency" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <a
                      href="/donate"
                      className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-xl text-center font-semibold"
                    >
                      Donate
                    </a>
                    <button
                      onClick={() => { scrollToForm(); setIsMenuOpen(false); }}
                      className="flex-1 bg-secondary-600 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Join Us
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 via-primary-50 to-accent-50" />
          <div className="absolute inset-0 paw-pattern opacity-40" />
          <FloatingPaws />
        </div>

        {/* Decorative Blobs */}
        <div className="absolute top-20 -right-20 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-secondary-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-200/20 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm border border-primary-100"
              >
                <span className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-secondary-700">Grassroots movement in Bangalore</span>
              </motion.div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-secondary-900 leading-[1.1] mb-6">
                Feed with{' '}
                <span className="relative inline-block">
                  <span className="text-gradient">love.</span>
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                  >
                    <motion.path
                      d="M0 8 Q 50 2, 100 8 T 200 8"
                      stroke="#E07856"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
                <br />
                <span className="font-light italic text-secondary-600">Build with hope.</span>
              </h1>

              <p className="text-lg sm:text-xl text-secondary-600 mb-8 max-w-xl leading-relaxed font-body">
                We&apos;re a community of animal lovers building DIY feeders for street dogs —
                creating safe spaces where they&apos;re cared for, fed, and loved.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.a
                  href="/donate"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -15px rgba(224, 120, 86, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-primary-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-primary-700 transition-all shadow-xl inline-flex items-center justify-center gap-3"
                >
                  <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Donate Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <motion.button
                  onClick={scrollToForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-white text-secondary-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-secondary-50 transition-all shadow-lg border-2 border-secondary-200 inline-flex items-center justify-center gap-3"
                >
                  <HandHeart className="w-5 h-5" />
                  Become a Volunteer
                </motion.button>
              </div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-8 mt-12 justify-center lg:justify-start"
              >
                {[
                  { value: 150, suffix: '+', label: 'Feeders Built' },
                  { value: 50, suffix: '+', label: 'Volunteers' },
                  { value: 1000, suffix: '+', label: 'Dogs Fed Daily' },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-3xl font-display font-bold text-primary-600">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-secondary-500 font-medium">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 3 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Image */}
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl organic-border-2 aspect-[4/5] max-w-md mx-auto lg:max-w-none">
                  <Image
                    src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80"
                    alt="Happy street dog looking at camera"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 via-transparent to-transparent" />

                  {/* Floating Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-800">100% Transparent</div>
                        <div className="text-sm text-secondary-600">Every rupee tracked on blockchain</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Decorative Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-6 -left-6 w-24 h-24 bg-accent-200 rounded-3xl -z-10 opacity-80"
                />
                <motion.div
                  animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary-200 rounded-full -z-10 opacity-60"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-secondary-400"
          >
            <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="py-6 bg-primary-600 overflow-hidden relative">
        <div className="flex whitespace-nowrap">
          <motion.div
            animate={{ x: "-50%" }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-8"
          >
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-8">
                {['Every meal matters', 'Built with love', 'Transparent giving', 'Community power', 'Safe spaces for strays', 'Kindness in action'].map((text, i) => (
                  <span key={i} className="text-white/90 text-lg font-medium flex items-center gap-4">
                    {text}
                    <Star className="w-4 h-4 text-accent-300 fill-accent-300" />
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section id="impact" className="py-24 bg-white relative overflow-hidden grain">
        <div className="absolute inset-0 paw-pattern opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Our Impact</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mt-3 mb-4">
              Small actions,{' '}
              <span className="text-gradient italic">big love</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Every feeder built is a promise of daily meals for street animals
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wrench, value: 150, suffix: '+', label: 'Feeders Built', colorClasses: { bg100: 'bg-primary-100', bg50: 'bg-primary-50', text: 'text-primary-600' }, description: 'Handcrafted with love' },
              { icon: PawPrint, value: 1000, suffix: '+', label: 'Dogs Fed Daily', colorClasses: { bg100: 'bg-secondary-100', bg50: 'bg-secondary-50', text: 'text-secondary-600' }, description: 'Consistent meals' },
              { icon: MapPin, value: 25, suffix: '+', label: 'Localities Covered', colorClasses: { bg100: 'bg-accent-100', bg50: 'bg-accent-50', text: 'text-accent-600' }, description: 'Across Bangalore' },
              { icon: Users, value: 50, suffix: '+', label: 'Active Volunteers', colorClasses: { bg100: 'bg-primary-100', bg50: 'bg-primary-50', text: 'text-primary-600' }, description: 'Growing community' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                className="group relative bg-gradient-to-br from-white to-secondary-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-secondary-100"
              >
                <div className={`w-16 h-16 ${stat.colorClasses.bg100} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-8 h-8 ${stat.colorClasses.text}`} />
                </div>
                <div className="font-display text-5xl font-bold text-secondary-900 mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="font-semibold text-secondary-800 text-lg mb-1">{stat.label}</div>
                <div className="text-secondary-500 text-sm">{stat.description}</div>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.colorClasses.bg50} rounded-bl-[40px] rounded-tr-3xl -z-10`} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-24 bg-gradient-to-b from-secondary-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <motion.div {...fadeInUp} className="relative order-2 lg:order-1">
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                  <Image
                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80"
                    alt="Volunteer feeding street dogs"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Floating accent card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-8 -right-8 bg-primary-600 text-white rounded-2xl p-6 shadow-xl max-w-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">5% Pledge</div>
                      <div className="text-primary-100 text-sm">It started with committing 5% of our salary for animals</div>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative blob */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-200/40 rounded-full blur-2xl -z-10" />
              </div>
            </motion.div>

            {/* Content Side */}
            <motion.div {...fadeInUp} className="order-1 lg:order-2">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Our Journey</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-8">
                Born from street experiences with{' '}
                <span className="italic text-primary-600">loyal friends</span>
              </h2>

              <div className="space-y-6 text-lg text-secondary-600 leading-relaxed">
                <p>
                  It started with a simple commitment — <span className="text-primary-600 font-semibold">5% of our salary for animals</span>.
                  What began as personal giving transformed into something bigger when we realized we could do more together.
                </p>
                <p>
                  We funded our first feeders, built them by hand with PVC pipes, and placed them around our neighborhoods.
                  The response was overwhelming. People wanted to help. Communities rallied. Dogs were safer, better fed, and more welcomed.
                </p>

                <blockquote className="border-l-4 border-primary-500 pl-6 py-4 bg-primary-50/50 rounded-r-xl italic text-primary-800 font-display text-xl">
                  &ldquo;Born out of faith, love, and street experiences with loyal dogs who ask for nothing but kindness.&rdquo;
                </blockquote>

                <p>
                  Today, Give Good Club is a growing movement of volunteers across Bangalore, building feeders,
                  refilling bowls, and creating a kinder city — one street corner at a time.
                </p>
              </div>

              <motion.a
                href="#how"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 mt-8 text-primary-600 font-semibold text-lg group"
              >
                See how we do it
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-24 bg-secondary-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">The Process</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-3 mb-4">
              How the magic{' '}
              <span className="italic text-primary-400">happens</span>
            </h2>
            <p className="text-xl text-secondary-300 max-w-2xl mx-auto">
              Three simple steps to create lasting change in your community
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Wrench,
                title: 'Build Together',
                description: 'Join our weekend workshops where we assemble feeders from PVC pipes. No experience needed — just bring your energy!',
                image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80',
              },
              {
                step: '02',
                icon: MapPin,
                title: 'Place Feeders',
                description: 'We install feeders in safe spots — near trees, gates, or walls — creating designated feeding zones that reduce conflicts.',
                image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&q=80',
              },
              {
                step: '03',
                icon: Heart,
                title: 'Love & Refill',
                description: 'Community members keep feeders stocked with kibble. Happy, healthy dogs become part of the neighborhood family.',
                image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80',
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-secondary-800/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-secondary-700/50 hover:border-primary-500/50 transition-all duration-500">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary-900 via-secondary-900/50 to-transparent" />

                    {/* Step Number */}
                    <div className="absolute top-6 left-6 font-display text-6xl font-bold text-white/10">
                      {step.step}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                        <step.icon className="w-7 h-7 text-primary-400" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-secondary-300 leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Connector Arrow (not on last item) */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 z-10">
                    <ArrowRight className="w-8 h-8 text-primary-500/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Feeders Matter Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 paw-pattern opacity-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-secondary-600 font-semibold text-sm uppercase tracking-wider">The Impact</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-4">
              Why feeders{' '}
              <span className="italic text-secondary-600">matter</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Simple solutions that create ripple effects of kindness
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Droplets, title: 'Clean & Safe', description: 'Food stays dry and hygienic, reducing health risks', color: 'bg-blue-50 text-blue-600' },
              { icon: Shield, title: 'Reduces Conflict', description: 'Designated spots mean less territorial disputes', color: 'bg-green-50 text-green-600' },
              { icon: PawPrint, title: 'Stable Population', description: 'Well-fed dogs stay in area, easier to vaccinate', color: 'bg-amber-50 text-amber-600' },
              { icon: Sparkles, title: 'Community Pride', description: 'Neighborhoods embrace their four-legged friends', color: 'bg-purple-50 text-purple-600' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                className="group bg-white rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200"
              >
                <div className={`w-20 h-20 ${benefit.color.split(' ')[0]} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className={`w-10 h-10 ${benefit.color.split(' ')[1]}`} />
                </div>
                <h3 className="font-display text-xl font-bold text-secondary-900 mb-3">{benefit.title}</h3>
                <p className="text-secondary-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Join the Movement Section */}
      <section id="join" className="py-24 bg-gradient-to-b from-secondary-50 via-primary-50/30 to-secondary-50 relative overflow-hidden">
        <FloatingPaws />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Get Involved</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-4">
              Join the{' '}
              <span className="text-gradient italic">movement</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Be part of something beautiful. Every action counts.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div {...fadeInUp}>
              <VolunteerForm />
            </motion.div>

            <motion.div {...fadeInUp} className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-secondary-900">What our volunteers say</h3>

              {[
                {
                  quote: "This is the kind of kindness our streets need. I never thought building a feeder could bring so much joy.",
                  author: "Ananya",
                  location: "Koramangala",
                  avatar: "🌸"
                },
                {
                  quote: "My kids help refill the feeder every evening. It's become our family ritual. The dogs wait for us!",
                  author: "Rajesh",
                  location: "Indiranagar",
                  avatar: "🌿"
                },
                {
                  quote: "From skeptic to believer. These feeders actually work. Our colony dogs are healthier and calmer.",
                  author: "Meera",
                  location: "Jayanagar",
                  avatar: "✨"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-secondary-700 italic mb-3">&ldquo;{testimonial.quote}&rdquo;</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-secondary-900">{testimonial.author}</span>
                        <span className="text-secondary-400">•</span>
                        <span className="text-secondary-500">{testimonial.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Donate CTA Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <Leaf className="w-6 h-6" />
                    <h4 className="font-display text-xl font-bold">Can&apos;t join yet?</h4>
                  </div>
                  <p className="text-primary-100 mb-6">
                    Support us financially! Every ₹500 builds one complete feeder that can serve dozens of dogs for years.
                  </p>
                  <motion.a
                    href="/donate"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    Donate Now
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Volunteer Map Showcase */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Growing Network
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See exactly where our volunteers and feeders are making a difference across Bangalore
            </p>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            <Link
              href="/volunteer-map"
              className="block max-w-4xl mx-auto bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-center hover:scale-[1.02] transition-transform shadow-xl"
            >
              <MapPin className="w-16 h-16 text-white mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">
                View Interactive Map
              </h3>
              <p className="text-lg text-primary-100 mb-4">
                See exactly where our volunteers are making a difference across Bangalore
              </p>
              <div className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-full font-semibold">
                Explore the Map →
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <span className="text-secondary-600 font-semibold text-sm uppercase tracking-wider">Gallery</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-4">
              Our community{' '}
              <span className="italic text-secondary-600">in action</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-primary-600 mt-4">
              <Instagram className="w-5 h-5" />
              <span className="font-semibold">#GiveGoodClub</span>
            </div>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80',
              'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&q=80',
              'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=400&q=80',
              'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&q=80',
              'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&q=80',
              'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&q=80',
              'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80'
            ].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${index === 0 || index === 5 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'}`}
              >
                <Image
                  src={image}
                  alt={`Give Good Club community photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 text-white">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">Spreading love</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Activity Feed Section */}
      <section className="py-24 bg-gradient-to-b from-secondary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <span className="text-secondary-600 font-semibold text-sm uppercase tracking-wider">Live Updates</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-4">
              Real-time{' '}
              <span className="text-gradient italic">impact</span>
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Watch the latest donations and activity as they happen
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
            <LiveActivityFeed />
          </motion.div>
        </div>
      </section>

      {/* Blockchain Stats Section */}
      <BlockchainStatsSection />

      {/* Transparency Ledger Section */}
      <section className="py-24 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp}>
            <TransparencyLedger />
          </motion.div>
        </div>
      </section>

      {/* Donation Verifier Section */}
      <section id="verify" className="py-24 bg-gradient-to-b from-white via-blue-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Transparency</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 mt-3 mb-4">
              Verify your{' '}
              <span className="italic text-blue-600">donation</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Cryptographically verify your donation is included in our blockchain batches
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <DonationVerifier />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white pt-20 pb-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="w-8 h-8 text-primary-400 fill-primary-400/30" />
                <span className="text-2xl font-display font-bold text-white">Give Good Club</span>
              </div>
              <p className="text-secondary-400 leading-relaxed mb-6">
                A community initiative born in Bangalore, fueled by love for animals. Building a kinder city, one feeder at a time.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/givegoodclub" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-secondary-800 hover:bg-primary-600 rounded-xl flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="mailto:hello@givegoodclub.org" className="w-10 h-10 bg-secondary-800 hover:bg-primary-600 rounded-xl flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-lg mb-6">Get Involved</h4>
              <ul className="space-y-3">
                {[
                  { href: "#join", label: "Volunteer" },
                  { href: "#how", label: "How It Works" },
                  { href: "/donate", label: "Donate" },
                  { href: "#gallery", label: "Gallery" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-secondary-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="font-display font-semibold text-lg mb-6">About</h4>
              <ul className="space-y-3">
                {[
                  { href: "#story", label: "Our Story" },
                  { href: "/transparency", label: "Transparency" },
                  { href: "/how-verification-works", label: "Verification Guide" },
                  { href: "/legal/privacy", label: "Privacy Policy" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-secondary-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter/CTA */}
            <div>
              <h4 className="font-display font-semibold text-lg mb-6">Stay Updated</h4>
              <p className="text-secondary-400 mb-4">
                Follow our journey and get updates on new feeder locations.
              </p>
              <motion.a
                href="https://instagram.com/givegoodclub"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Follow on Instagram
              </motion.a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-secondary-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-secondary-500 text-sm">
              © {new Date().getFullYear()} Give Good Club. Made with ❤️ for street animals.
            </p>
            <p className="text-secondary-500 text-sm font-display italic">
              Small actions, big love.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
