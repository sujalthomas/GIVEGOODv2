"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Droplets, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';

interface RefillLogFormProps {
  adminMode?: boolean;
  onSuccess?: () => void;
}

interface AssignedFeeder {
  id: string;
  location_name: string;
  pincode: string;
  area_name: string | null;
  status: string;
  last_refilled_at: string | null;
  next_refill_due: string | null;
}

interface FormData {
  feeder_id: string;
  food_quantity_kg: string;
  food_type: string;
  feeder_condition: string;
  notes: string;
}

export default function RefillLogForm({ adminMode = false, onSuccess }: RefillLogFormProps) {
  const { user } = useGlobal();
  const [feeders, setFeeders] = useState<AssignedFeeder[]>([]);
  const [loadingFeeders, setLoadingFeeders] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    feeder_id: '',
    food_quantity_kg: '',
    food_type: 'dry_kibble',
    feeder_condition: 'good',
    notes: ''
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyImmediately, setVerifyImmediately] = useState(false);

  const foodTypes = [
    { value: 'dry_kibble', label: 'Dry Kibble' },
    { value: 'wet_food', label: 'Wet Food' },
    { value: 'rice_mix', label: 'Rice Mix' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'good', label: 'Good', icon: '✓', color: 'text-green-600' },
    { value: 'needs_cleaning', label: 'Needs Cleaning', icon: '🧹', color: 'text-yellow-600' },
    { value: 'needs_repair', label: 'Needs Repair', icon: '🔧', color: 'text-orange-600' },
    { value: 'damaged', label: 'Damaged', icon: '⚠️', color: 'text-red-600' }
  ];

  const fetchAssignedFeeders = useCallback(async () => {
    try {
      setLoadingFeeders(true);
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      if (adminMode) {
        // Admin can see all active feeders
        const { data, error } = await supabase
          .from('feeders')
          .select('id, location_name, pincode, area_name, status, last_refilled_at, next_refill_due')
          .eq('status', 'active')
          .order('location_name');

        if (error) throw error;
        setFeeders((data || []) as AssignedFeeder[]);
      } else {
        // Volunteer sees only assigned feeders
        if (!user?.email) {
          setFeeders([]);
          return;
        }

        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!volunteer) {
          setFeeders([]);
          return;
        }

        const { data, error } = await supabase
          .from('volunteer_feeders')
          .select(`
            feeders (
              id,
              location_name,
              pincode,
              area_name,
              status,
              last_refilled_at,
              next_refill_due
            )
          `)
          .eq('volunteer_id', volunteer.id)
          .eq('feeders.status', 'active');

        if (error) throw error;

        // Extract feeders from nested structure
        interface VolunteerFeederItem {
          feeders: AssignedFeeder | null;
        }
        const assignedFeeders = (data || [])
          .map((item: VolunteerFeederItem) => item.feeders)
          .filter((f: AssignedFeeder | null): f is AssignedFeeder => f !== null);

        setFeeders(assignedFeeders);
      }
    } catch (error) {
      console.error('Error fetching feeders:', error);
      setError('Failed to load feeders');
    } finally {
      setLoadingFeeders(false);
    }
  }, [adminMode, user?.email]);

  useEffect(() => {
    if (user) {
      fetchAssignedFeeders();
    }
  }, [user, fetchAssignedFeeders]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickQuantity = (kg: number) => {
    setFormData({ ...formData, food_quantity_kg: kg.toString() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.feeder_id || !formData.food_quantity_kg) {
        throw new Error('Please select a feeder and enter quantity');
      }

      const quantity = parseFloat(formData.food_quantity_kg);
      if (isNaN(quantity) || quantity < 0.1 || quantity > 100) {
        throw new Error('Food quantity must be between 0.1 and 100 kg');
      }

      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      // Get current user ID for storage
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        setUploading(true);
        const timestamp = Date.now();
        const fileName = `refill_${timestamp}_${photo.name.replace(/[^0-9a-zA-Z.\-_]/g, '_')}`;

        // Upload using user ID as folder (pattern: userId/refill_timestamp_name.jpg)
        const { error: uploadError } = await supabaseClient.uploadFile(
          currentUser.id,
          fileName,
          photo
        );

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload photo');
        }

        // Get public URL - path is userId/fileName
        const { data: urlData } = supabaseClient
          .getSupabaseClient()
          .storage
          .from('files')
          .getPublicUrl(`${currentUser.id}/${fileName}`);

        photoUrl = urlData.publicUrl;
        setUploading(false);
      }

      // Submit refill
      const submitData = {
        feeder_id: formData.feeder_id,
        food_quantity_kg: parseFloat(formData.food_quantity_kg),
        food_type: formData.food_type,
        feeder_condition: formData.feeder_condition,
        notes: formData.notes || undefined,
        photo_url: photoUrl || undefined,
        verifyImmediately: adminMode && verifyImmediately // Pass admin bypass flag
      };

      const response = await fetch('/api/refills/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log refill');
      }

      setSubmitted(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Reset form after 4 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            feeder_id: '',
            food_quantity_kg: '',
            food_type: 'dry_kibble',
            feeder_condition: 'good',
            notes: ''
          });
          setPhoto(null);
          setPhotoPreview(null);
        }, 4000);
      }
    } catch (err: unknown) {
      console.error('Error logging refill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Refill Logged Successfully!
        </h3>
        <p className="text-gray-600">
          {adminMode && verifyImmediately
            ? "Refill has been verified and recorded."
            : "Your refill log is pending admin verification. Thank you for your dedication!"}
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

  if (loadingFeeders) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (feeders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No Feeders Assigned
        </h3>
        <p className="text-gray-600">
          You don&apos;t have any assigned feeders yet. Submit a feeder first or ask an admin to assign you to existing feeders.
        </p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      <div className="text-center mb-6">
        <Droplets className="w-12 h-12 text-primary-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900">Log a Refill</h3>
        <p className="text-gray-600 mt-2">
          Track your feeder maintenance and help us monitor impact
        </p>
      </div>

      {/* Feeder Selection */}
      <div>
        <label htmlFor="feeder_id" className="block text-sm font-medium text-gray-700 mb-2">
          Select Feeder *
        </label>
        <select
          id="feeder_id"
          required
          value={formData.feeder_id}
          onChange={(e) => setFormData({ ...formData, feeder_id: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
          <option value="">Choose a feeder...</option>
          {feeders.map((feeder) => (
            <option key={feeder.id} value={feeder.id}>
              {feeder.location_name} ({feeder.area_name || feeder.pincode})
              {feeder.last_refilled_at && ` - Last: ${new Date(feeder.last_refilled_at).toLocaleDateString('en-IN')}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {adminMode ? `${feeders.length} active feeders` : `You have ${feeders.length} assigned feeder(s)`}
        </p>
      </div>

      {/* Selected Feeder Info */}
      {formData.feeder_id && feeders.find(f => f.id === formData.feeder_id) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          {(() => {
            const selected = feeders.find(f => f.id === formData.feeder_id)!;
            const isOverdue = selected.next_refill_due && new Date(selected.next_refill_due) < new Date();

            return (
              <div className="text-sm text-blue-800">
                <p className="font-semibold">{selected.location_name}</p>
                {selected.last_refilled_at ? (
                  <p className="text-xs mt-1">
                    Last refilled: {new Date(selected.last_refilled_at).toLocaleDateString('en-IN')}
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-yellow-700">Never refilled before</p>
                )}
                {isOverdue && (
                  <p className="text-xs mt-1 text-red-700 font-semibold">
                    ⚠️ Overdue for refill!
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Food Quantity */}
      <div>
        <label htmlFor="food_quantity_kg" className="block text-sm font-medium text-gray-700 mb-2">
          Food Quantity (kg) *
        </label>
        <input
          type="number"
          id="food_quantity_kg"
          required
          step="0.1"
          min="0.1"
          max="100"
          value={formData.food_quantity_kg}
          onChange={(e) => setFormData({ ...formData, food_quantity_kg: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="e.g., 3.5"
        />

        {/* Quick Select Buttons */}
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 5].map(kg => (
            <button
              key={kg}
              type="button"
              onClick={() => handleQuickQuantity(kg)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-primary-100 hover:text-primary-700 transition-colors"
            >
              {kg} kg
            </button>
          ))}
        </div>
      </div>

      {/* Food Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Food Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {foodTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.food_type === type.value
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
                }`}
            >
              <input
                type="radio"
                name="food_type"
                value={type.value}
                checked={formData.food_type === type.value}
                onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                className="sr-only"
              />
              <span className={`text-sm font-medium ${formData.food_type === type.value ? 'text-primary-700' : 'text-gray-700'
                }`}>
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Feeder Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Feeder Condition *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {conditions.map((condition) => (
            <label
              key={condition.value}
              className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.feeder_condition === condition.value
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
                }`}
            >
              <input
                type="radio"
                name="feeder_condition"
                value={condition.value}
                checked={formData.feeder_condition === condition.value}
                onChange={(e) => setFormData({ ...formData, feeder_condition: e.target.value })}
                className="sr-only"
              />
              <span className="text-lg">{condition.icon}</span>
              <span className={`text-sm font-medium ${formData.feeder_condition === condition.value ? condition.color : 'text-gray-700'
                }`}>
                {condition.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo Proof <span className="text-gray-500 text-xs">(optional but encouraged, max 5MB)</span>
        </label>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          {photoPreview ? (
            <div className="relative w-full h-full">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload refill photo</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          rows={3}
          placeholder="Any observations about the feeder or animals..."
        />
      </div>

      {/* Admin Mode Toggle */}
      {adminMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifyImmediately}
              onChange={(e) => setVerifyImmediately(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-amber-900">
              Verify Immediately (skip verification) - Admin privilege
            </span>
          </label>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          loading ||
          uploading ||
          !formData.feeder_id ||
          !formData.food_quantity_kg
        }
        className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {uploading ? 'Uploading Photo...' : 'Logging Refill...'}
          </span>
        ) : (
          'Log Refill'
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Your refill log helps us track the impact we&apos;re making together.
      </p>
    </motion.form>
  );
}

