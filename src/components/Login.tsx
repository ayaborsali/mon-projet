import { useState } from "react";
import { Car, MapPin, Loader2, Shield, UserCog, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLoginSuccess: (token: string, userData: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || "Erreur de connexion");
        } catch {
          setError(`Erreur HTTP ${res.status}: ${errorText}`);
        }
        return;
      }

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      // Stocker les informations utilisateur
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Connexion réussie - redirection selon le rôle
      onLoginSuccess(data.token, data.user);
      
      // Redirection basée sur le rôle de l'utilisateur
      switch (data.user.role) {
        case 'admin':
          navigate("/dashboard");
          break;
        case 'operator':
          navigate("/sessions");
          break;
        case 'customer':
          navigate("/parking");
          break;
        default:
          navigate("/parking");
      }
    } catch (err: any) {
      console.error("Erreur lors de la connexion:", err);
      setError("Erreur de connexion au serveur. Vérifiez que le serveur est démarré.");
    } finally {
      setIsLoading(false);
    }
  };

  // Informations de connexion par rôle
  const getRoleCredentials = (role: string) => {
    switch (role) {
      case 'admin':
        return { email: 'admin@smartparking.com', password: 'admin123' };
      case 'operator':
        return { email: 'operator@smartparking.com', password: 'operator123' };
      case 'customer':
        return { email: 'customer@smartparking.com', password: 'customer123' };
      default:
        return { email: '', password: '' };
    }
  };

  const fillCredentials = (role: string) => {
    const credentials = getRoleCredentials(role);
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="relative w-full max-w-6xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shadow-blue-500/50">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-white">SmartParking</h1>
          <p className="flex items-center justify-center gap-2 text-blue-200">
            <MapPin className="w-4 h-4" />
            Votre solution de stationnement intelligent
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          {/* Carte Admin */}
          <div className="p-6 border-2 border-red-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Administrateur</h3>
              <p className="text-sm text-slate-600">Accès complet au système</p>
            </div>
            <ul className="mb-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Dashboard complet
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Gestion des utilisateurs
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Toutes les sessions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Tous les paiements
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Configuration système
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Statistiques avancées
              </li>
            </ul>
            <button
              onClick={() => fillCredentials('admin')}
              className="w-full py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
            >
              Utiliser identifiants Admin
            </button>
          </div>

          {/* Carte Opérateur */}
          <div className="p-6 border-2 border-blue-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-blue-100 rounded-lg">
                <UserCog className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Opérateur</h3>
              <p className="text-sm text-slate-600">Gestion opérationnelle</p>
            </div>
            <ul className="mb-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Sessions actives
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Gestion des paiements
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Places de parking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Gestion utilisateurs
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Configuration système
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Statistiques complètes
              </li>
            </ul>
            <button
              onClick={() => fillCredentials('operator')}
              className="w-full py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Utiliser identifiants Opérateur
            </button>
          </div>

          {/* Carte Client */}
          <div className="p-6 border-2 border-green-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Client</h3>
              <p className="text-sm text-slate-600">Utilisation basique</p>
            </div>
            <ul className="mb-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Places de parking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Réserver une place
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Mes sessions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Autres utilisateurs
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Paiements globaux
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Administration
              </li>
            </ul>
            <button
              onClick={() => fillCredentials('customer')}
              className="w-full py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              Utiliser identifiants Client
            </button>
          </div>
        </div>

        {/* Formulaire de connexion */}
        <div className="p-8 shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Connexion au système</h2>
            {email && (
              <div className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                {email.includes('admin') ? 'Admin' : 
                 email.includes('operator') ? 'Opérateur' : 'Client'}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="admin@smartparking.com"
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <strong>Erreur :</strong> {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full gap-2 py-4 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter au système"
              )}
            </button>

            <div className="p-4 text-xs text-gray-600 border rounded-lg bg-gray-50">
              <p className="mb-2 font-medium">💡 Conseil : Cliquez sur les boutons ci-dessus pour remplir automatiquement les identifiants de test.</p>
              <p>Le système vous redirigera automatiquement vers l'interface adaptée à votre rôle.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}