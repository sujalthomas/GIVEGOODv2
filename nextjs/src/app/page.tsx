"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Wrench, MapPin, Sparkles, Droplets, Shield, Instagram, Mail, Users, PawPrint } from 'lucide-react';
import VolunteerForm from '@/components/VolunteerForm';

export default function Home() {
  const scrollToForm = () => {
    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-primary-600" />
              <span className="text-xl font-bold text-primary-600">Give Good Club</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#story" className="text-gray-600 hover:text-primary-600 transition-colors">
                Our Story
              </Link>
              <Link href="#how" className="text-gray-600 hover:text-primary-600 transition-colors">
                How It Works
              </Link>
              <Link href="#join" className="text-gray-600 hover:text-primary-600 transition-colors">
                Volunteer
              </Link>
              <Link href="#gallery" className="text-gray-600 hover:text-primary-600 transition-colors">
                Gallery
              </Link>
              <button
                onClick={scrollToForm}
                className="bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700 transition-all transform hover:scale-105"
              >
                Join Us
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80"
            alt="Happy street dogs in Delhi"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 via-primary-800/60 to-primary-900/80" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Feed with love.
              <span className="block mt-2 font-light italic text-secondary-100">Build with hope.</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary-50 mb-12 max-w-3xl mx-auto leading-relaxed">
              Give Good Club is a community of animal lovers setting up DIY feeders for street dogs, 
              so they&apos;re cared for in safe, designated spaces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={scrollToForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-accent-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent-800 transition-colors shadow-xl"
              >
                Join Us Today
              </motion.button>
              <motion.a
                href="https://donate.stripe.com/test_example"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-secondary-50 transition-colors shadow-xl"
              >
                Donate Now
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80"
                  alt="Person feeding street dogs"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  It started with a simple commitment — <span className="text-primary-600 font-semibold">5% of our salary for animals</span>. 
                  What began as personal giving transformed into something bigger when we realized we could do more together.
                </p>
                <p>
                  We funded our first feeders, built them by hand with PVC pipes, and placed them around our neighborhoods. 
                  The response was overwhelming. People wanted to help. Communities rallied. Dogs were safer, better fed, and more welcomed.
                </p>
                <p className="font-light italic text-primary-700 text-xl">
                  &quot;Born out of faith, love, and street experiences with loyal dogs who ask for nothing but kindness.&quot;
                </p>
                <p>
                  Today, Give Good Club is a growing movement of volunteers across Delhi/NCR, building feeders, 
                  refilling bowls, and creating a kinder city — one street corner at a time.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-24 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to make a lasting impact in your community
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Wrench,
                title: 'Build Together',
                description: 'Join our weekend workshops where we assemble feeders from PVC pipes. No experience needed — just bring your energy!',
                image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80',
                color: 'primary'
              },
              {
                icon: MapPin,
                title: 'Place Feeders',
                description: 'We install feeders in safe spots — near trees, gates, or walls — creating designated feeding zones that reduce conflicts.',
                image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&q=80',
                color: 'secondary'
              },
              {
                icon: Heart,
                title: 'Love & Refill',
                description: 'Community members keep feeders stocked with kibble. Happy, healthy dogs become part of the neighborhood family.',
                image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80',
                color: 'accent'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className={`absolute inset-0 bg-${step.color}-600/20 group-hover:bg-${step.color}-600/30 transition-colors`} />
                </div>
                <div className="p-6">
                  <div className={`w-12 h-12 bg-${step.color}-100 rounded-full flex items-center justify-center mb-4`}>
                    <step.icon className={`w-6 h-6 text-${step.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Feeders Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Feeders Matter
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple solutions that create ripple effects of kindness
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Droplets, title: 'Clean & Safe', description: 'Food stays dry and hygienic, reducing health risks' },
              { icon: Shield, title: 'Reduces Conflict', description: 'Designated spots mean less territorial disputes' },
              { icon: PawPrint, title: 'Stable Population', description: 'Well-fed dogs stay in area, easier to vaccinate' },
              { icon: Sparkles, title: 'Community Pride', description: 'Neighborhoods embrace their four-legged friends' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                className="bg-secondary-50 rounded-2xl p-6 text-center hover:bg-secondary-100 transition-colors group"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                  <benefit.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Join the Movement Section */}
      <section id="join" className="py-24 bg-gradient-to-b from-secondary-100 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join the Movement
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Be part of something beautiful. Every action counts.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <VolunteerForm />
            </div>

            <motion.div {...fadeInUp} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What Our Volunteers Say</h3>
              
              {[
                {
                  quote: "This is the kind of kindness our streets need. I never thought building a feeder could bring so much joy.",
                  author: "Ananya, Saket"
                },
                {
                  quote: "My kids help refill the feeder every evening. It's become our family ritual. The dogs wait for us!",
                  author: "Rajesh, Vasant Kunj"
                },
                {
                  quote: "From skeptic to believer. These feeders actually work. Our colony dogs are healthier and calmer.",
                  author: "Meera, Hauz Khas"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  {...fadeInUp}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                >
                  <p className="text-gray-700 italic mb-3">&quot;{testimonial.quote}&quot;</p>
                  <p className="text-primary-600 font-semibold">— {testimonial.author}</p>
                </motion.div>
              ))}

              <div className="bg-accent-200 rounded-2xl p-6 mt-8">
                <h4 className="text-xl font-bold text-gray-900 mb-3">Can&apos;t Join Yet?</h4>
                <p className="text-gray-700 mb-4">
                  Support us financially! Every ₹500 builds one complete feeder that can serve dozens of dogs for years.
                </p>
                <a
                  href="https://donate.stripe.com/test_example"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-accent-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-accent-800 transition-colors"
                >
                  Donate Now
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Community in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              Moments of love, building, and feeding
            </p>
            <div className="flex items-center justify-center space-x-2 text-primary-600">
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
                {...fadeInUp}
                className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer"
              >
                <Image
                  src={image}
                  alt={`Give Good Club community photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6 text-primary-400" />
                <span className="text-xl font-bold text-white">Give Good Club</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                A community initiative born in Delhi, fueled by love for animals.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Get Involved</h4>
              <ul className="space-y-2">
                <li><Link href="#join" className="hover:text-primary-400 transition-colors">Volunteer</Link></li>
                <li><Link href="#how" className="hover:text-primary-400 transition-colors">How It Works</Link></li>
                <li><a href="https://donate.stripe.com/test_example" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">Donate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                <li><Link href="#story" className="hover:text-primary-400 transition-colors">Our Story</Link></li>
                <li><Link href="#gallery" className="hover:text-primary-400 transition-colors">Gallery</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-primary-400 transition-colors">Privacy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="https://instagram.com/givegoodclub" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="mailto:hello@givegoodclub.org" className="hover:text-primary-400 transition-colors">
                  <Mail className="w-6 h-6" />
                </a>
                <a href="#join" className="hover:text-primary-400 transition-colors">
                  <Users className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Give Good Club. Made with ❤️ for street animals.</p>
            <p className="mt-2 italic">Small actions, big love.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}