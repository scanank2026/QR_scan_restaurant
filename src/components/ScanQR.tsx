import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export const ScanQR = () => {
  const { slug, tableNumber } = useParams<{ slug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      if (!slug || !tableNumber) {
        setError('Invalid QR code.');
        return;
      }

      try {
        // 1. Get restaurant
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', slug)
          .single();

        if (restaurantError || !restaurant) {
          throw new Error('Restaurant not found.');
        }

        // 2. Get table
        const { data: table, error: tableError } = await supabase
          .from('tables')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('table_number', tableNumber)
          .single();

        if (tableError || !table) {
          throw new Error('Table not found.');
        }

        // 3. Create a new session valid for 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        const { data: session, error: sessionError } = await supabase
          .from('table_sessions')
          .insert([{
            restaurant_id: restaurant.id,
            table_id: table.id,
            expires_at: expiresAt.toISOString()
          }])
          .select('id')
          .single();

        if (sessionError || !session) {
          throw new Error('Failed to create session.');
        }

        // 4. Redirect to menu with session ID
        navigate(`/order/${slug}/${tableNumber}?session_id=${session.id}`, { replace: true });

      } catch (err: any) {
        console.error('Error initializing session:', err);
        setError(err.message || 'Failed to initialize session.');
      }
    };

    initializeSession();
  }, [slug, tableNumber, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Scan Failed</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <h1 className="text-xl font-bold text-slate-900">Setting up your table...</h1>
        <p className="text-slate-500">Please wait a moment.</p>
      </div>
    </div>
  );
};
