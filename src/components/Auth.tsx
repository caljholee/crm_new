import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Spark Code Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and password to access the platform
          </p>
        </div>
        <div className="mt-8">
          <SupabaseAuth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4F46E5',
                    brandAccent: '#4338CA',
                  },
                },
              },
              style: {
                button: {
                  flex: '1',
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px',
                },
                container: {
                  width: '100%',
                },
              },
            }}
            view="sign_in"
            showLinks={true}
          />
        </div>
      </div>
    </div>
  );
}