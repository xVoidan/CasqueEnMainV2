import { useEffect, useState } from 'react';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card">
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>🎓 CasqueEnMains Admin</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#dc2626',
                    brandAccent: '#ef4444',
                  },
                },
              },
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion...',
                  email_input_placeholder: 'Votre email',
                  password_input_placeholder: 'Votre mot de passe',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: "S'inscrire",
                  loading_button_label: 'Inscription...',
                  email_input_placeholder: 'Votre email',
                  password_input_placeholder: 'Votre mot de passe',
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>🚫 Accès Refusé</h1>
          <p>Cette interface est réservée aux administrateurs.</p>
          <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Email autorisé : {ADMIN_EMAIL}
          </p>
          <button
            className="btn"
            style={{ marginTop: '2rem' }}
            onClick={() => supabase.auth.signOut()}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard session={session} />;
}
