"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, CheckCircle, AlertCircle, Upload, MapPin } from 'lucide-react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';
import { getCoordinatesFromPincode, getAreaNameFromPincode } from '@/lib/geocoding/bangalore-pincodes';

interface FeederSubmissionFormProps {
  adminMode?: boolean;
  onSuccess?: () => void;
}

interface FormData {
  location_name: string;
  pincode: string;
  area_name: string;
  landmark: string;
  latitude: number;
  longitude: number;
  capacity_kg: string;
  feeder_type: string;
  notes: string;
}

export default function FeederSubmissionForm({ adminMode = false, onSuccess }: FeederSubmissionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    location_name: '',
    pincode: '',
    area_name: '',
    landmark: '',
    latitude: 0,
    longitude: 0,
    capacity_kg: '',
    feeder_type: 'pvc_pipe',
    notes: ''
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [createAsActive, setCreateAsActive] = useState(false);

  const feederTypes = [
    { value: 'pvc_pipe', label: 'PVC Pipe' },
    { value: 'metal_bowl', label: 'Metal Bowl' },
    { value: 'wooden_box', label: 'Wooden Box' },
    { value: 'custom', label: 'Custom' }
  ];

  const handlePincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: numericValue }));
    
    if (numericValue.length === 6) {
      // Validate Bangalore pincode
      if (!/^560\d{3}$/.test(numericValue)) {
        setPincodeError('Please enter a valid Bangalore pincode (560xxx)');
        return;
      }
      
      setPincodeError(null);
      
      // Auto-fill coordinates and area name from pincode reference
      const coords = getCoordinatesFromPincode(numericValue);
      const areaName = getAreaNameFromPincode(numericValue);
      
      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lon,
          area_name: areaName || prev.area_name
        }));
      }
    } else if (numericValue.length > 0) {
      setPincodeError('Pincode must be 6 digits');
    } else {
      setPincodeError(null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.location_name || !formData.pincode || !formData.latitude || !formData.longitude) {
        throw new Error('Please fill all required fields');
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
        const fileName = `feeder_${timestamp}_${photo.name.replace(/[^0-9a-zA-Z.\-_]/g, '_')}`;
        
        // Upload using user ID as folder (pattern: userId/feeder_timestamp_name.jpg)
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

      // Submit feeder
      const submitData = {
        location_name: formData.location_name,
        pincode: formData.pincode,
        area_name: formData.area_name || getAreaNameFromPincode(formData.pincode) || undefined,
        landmark: formData.landmark || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        capacity_kg: formData.capacity_kg ? parseFloat(formData.capacity_kg) : undefined,
        feeder_type: formData.feeder_type,
        notes: formData.notes || undefined,
        photo_url: photoUrl || undefined,
        skipApproval: adminMode && createAsActive // Pass admin bypass flag
      };

      const response = await fetch('/api/feeders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feeder');
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
            location_name: '',
            pincode: '',
            area_name: '',
            landmark: '',
            latitude: 0,
            longitude: 0,
            capacity_kg: '',
            feeder_type: 'pvc_pipe',
            notes: ''
          });
          setPhoto(null);
          setPhotoPreview(null);
          setPincodeError(null);
        }, 4000);
      }
    } catch (err: unknown) {
      console.error('Error submitting feeder:', err);
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
          Feeder Submitted Successfully!
        </h3>
        <p className="text-gray-600">
          {adminMode && createAsActive 
            ? "Feeder is now active and visible on the map."
            : "Your feeder submission is pending admin approval. We'll review it soon!"}
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      <div className="text-center mb-6">
        <Home className="w-12 h-12 text-primary-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900">Submit a New Feeder</h3>
        <p className="text-gray-600 mt-2">
          Help us expand our network and feed more animals across Bangalore
        </p>
      </div>

      {/* Location Name */}
      <div>
        <label htmlFor="location_name" className="block text-sm font-medium text-gray-700 mb-2">
          Feeder Location Name *
        </label>
        <input
          type="text"
          id="location_name"
          required
          value={formData.location_name}
          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="e.g., Koramangala Park Main Gate"
        />
      </div>

      {/* Pincode */}
      <div>
        <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
          Pincode * <span className="text-gray-500 text-xs">(Bangalore only)</span>
        </label>
        <input
          type="text"
          id="pincode"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={formData.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            pincodeError ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="560034"
        />
        {pincodeError && (
          <p className="mt-1 text-sm text-red-600">{pincodeError}</p>
        )}
        {formData.pincode.length === 6 && !pincodeError && (
          <p className="mt-1 text-sm text-green-600">✓ Valid pincode - Location auto-filled</p>
        )}
      </div>

      {/* Area Name (auto-filled, editable) */}
      <div>
        <label htmlFor="area_name" className="block text-sm font-medium text-gray-700 mb-2">
          Area Name <span className="text-gray-500 text-xs">(auto-filled from pincode)</span>
        </label>
        <input
          type="text"
          id="area_name"
          value={formData.area_name}
          onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="e.g., Koramangala"
        />
      </div>

      {/* Landmark */}
      <div>
        <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-2">
          Landmark (optional)
        </label>
        <input
          type="text"
          id="landmark"
          value={formData.landmark}
          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="e.g., Near Sony World Junction"
        />
      </div>

      {/* Coordinates Display (read-only) */}
      {formData.latitude !== 0 && formData.longitude !== 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <MapPin className="w-4 h-4" />
            <span>
              Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Capacity */}
      <div>
        <label htmlFor="capacity_kg" className="block text-sm font-medium text-gray-700 mb-2">
          Feeder Capacity (kg) - optional
        </label>
        <input
          type="number"
          id="capacity_kg"
          step="0.1"
          min="0"
          max="50"
          value={formData.capacity_kg}
          onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="e.g., 5.0"
        />
        <p className="text-xs text-gray-500 mt-1">How much food can the feeder hold?</p>
      </div>

      {/* Feeder Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Feeder Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {feederTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.feeder_type === type.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input
                type="radio"
                name="feeder_type"
                value={type.value}
                checked={formData.feeder_type === type.value}
                onChange={(e) => setFormData({ ...formData, feeder_type: e.target.value })}
                className="sr-only"
              />
              <span className={`font-medium ${
                formData.feeder_type === type.value ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feeder Photo <span className="text-gray-500 text-xs">(optional, max 5MB)</span>
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
              <p className="text-sm text-gray-600">Click to upload feeder photo</p>
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
          Additional Notes (optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          rows={3}
          placeholder="Any additional information about the feeder location or setup..."
        />
      </div>

      {/* Admin Mode Toggle */}
      {adminMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createAsActive}
              onChange={(e) => setCreateAsActive(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-amber-900">
              Create as Active (skip approval) - Admin privilege
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
          !formData.location_name || 
          !formData.pincode || 
          pincodeError !== null ||
          formData.latitude === 0
        }
        className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {uploading ? 'Uploading Photo...' : 'Submitting...'}
          </span>
        ) : (
          'Submit Feeder'
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        By submitting, you confirm that this location is suitable for a feeder and you have permission to install it.
      </p>
    </motion.form>
  );
}

