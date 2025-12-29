"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';

interface FormData {
  name: string;
  area: string;
  helpType: string[];
  email: string;
}

export default function VolunteerForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    area: '',
    helpType: [],
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const helpOptions = [
    { value: 'build', label: 'Build feeders with us' },
    { value: 'refill', label: 'Refill feeders regularly' },
    { value: 'spread', label: 'Spread the word' }
  ];

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      helpType: prev.helpType.includes(value)
        ? prev.helpType.filter(v => v !== value)
        : [...prev.helpType, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { error: insertError } = await supabase
        .from('volunteers')
        .insert({
          name: formData.name,
          area: formData.area,
          email: formData.email || null,
          help_types: formData.helpType
        });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);

      // Reset form after 4 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', area: '', helpType: [], email: '' });
      }, 4000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-secondary-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to the movement!
        </h3>
        <p className="text-gray-600">
          We&apos;ll reach out soon to get you started on spreading kindness.
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-primary-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900">Join Our Community</h3>
        <p className="text-gray-600 mt-2">
          Every pair of hands makes a difference. Let&apos;s build something beautiful together.
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="Priya Sharma"
        />
      </div>

      <div>
        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
          Your Area/Colony *
        </label>
        <input
          type="text"
          id="area"
          required
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="Koramangala, Bangalore"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="priya@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How would you like to help? *
        </label>
        <div className="space-y-3">
          {helpOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={formData.helpType.includes(option.value)}
                onChange={() => handleCheckboxChange(option.value)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700 group-hover:text-primary-600 transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.name || !formData.area || !formData.email || formData.helpType.length === 0}
        className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Joining...
          </span>
        ) : (
          'Count Me In!'
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        By joining, you agree to receive updates about our feeder-building sessions and animal welfare initiatives.
      </p>
    </motion.form>
  );
}

