import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Star, 
  Users, 
  Bell,
  CreditCard,
  MapPin,
  Clock,
  QrCode,
  Wallet
} from 'lucide-react';

const MobileApp: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState('reservation');

  const appFeatures = [
    {
      id: 'reservation',
      title: 'Réservation de Places',
      description: 'Réservez votre place à l\'avance et évitez les files d\'attente',
      icon: <MapPin className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      id: 'payment',
      title: 'Paiement Mobile',
      description: 'Payez directement depuis l\'application avec plusieurs méthodes',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      id: 'wallet',
      title: 'Portefeuille Intégré',
      description: 'Rechargez votre portefeuille et gérez vos transactions',
      icon: <Wallet className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      id: 'history',
      title: 'Historique & Factures',
      description: 'Consultez vos sessions passées et téléchargez vos factures',
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-orange-500'
    },
    {
      id: 'notifications',
      title: 'Notifications Push',
      description: 'Recevez des alertes pour vos réservations et paiements',
      icon: <Bell className="h-6 w-6" />,
      color: 'bg-red-500'
    },
    {
      id: 'qr',
      title: 'QR Code',
      description: 'Accès rapide avec QR code pour entrée et sortie',
      icon: <QrCode className="h-6 w-6" />,
      color: 'bg-indigo-500'
    }
  ];

  const mockScreenshots = [
    'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
    'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg',
    'https://images.pexels.com/photos/4050318/pexels-photo-4050318.jpeg'
  ];

  const appStats = {
    downloads: '25K+',
    rating: 4.8,
    reviews: 1250,
    activeUsers: '18K+'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Application Mobile</h2>
            <p className="text-gray-600">SmartPark - Parking intelligent pour tous</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            App Store
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Google Play
          </button>
        </div>
      </div>

      {/* App Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Téléchargements</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.downloads}</p>
              <p className="text-sm text-blue-600">+15% ce mois</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.rating}</p>
              <p className="text-sm text-yellow-600">{appStats.reviews} avis</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.activeUsers}</p>
              <p className="text-sm text-green-600">Mensuel</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">8.5K</p>
              <p className="text-sm text-purple-600">Ce mois</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Features */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Fonctionnalités Principales</h3>
          <div className="space-y-4">
            {appFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedFeature === feature.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg text-white ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Screenshots */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Aperçu de l'Application</h3>
          <div className="grid grid-cols-3 gap-4">
            {mockScreenshots.map((screenshot, index) => (
              <div key={index} className="relative">
                <img
                  src={screenshot}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                <div className="absolute bottom-2 left-2 text-white text-xs">
                  Écran {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {appFeatures.find(f => f.id === selectedFeature)?.title}
            </h4>
            <p className="text-sm text-gray-600">
              {appFeatures.find(f => f.id === selectedFeature)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* User Feedback */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Avis Utilisateurs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Ahmed Ben Salem',
              rating: 5,
              comment: 'Application très pratique ! Plus besoin de chercher une place, je réserve à l\'avance.',
              date: '2024-03-15'
            },
            {
              name: 'Fatma Trabelsi',
              rating: 5,
              comment: 'Le paiement mobile est super rapide. Interface claire et intuitive.',
              date: '2024-03-12'
            },
            {
              name: 'Mohamed Gharbi',
              rating: 4,
              comment: 'Très bonne app, juste quelques bugs mineurs à corriger.',
              date: '2024-03-10'
            }
          ].map((review, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{review.name}</h4>
                <div className="flex items-center">
                  {Array.from({ length: review.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
              <p className="text-xs text-gray-500">{review.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Development Roadmap */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Feuille de Route</h3>
        <div className="space-y-4">
          {[
            { version: 'v2.1', status: 'completed', features: ['Paiement par QR Code', 'Mode sombre', 'Notifications push améliorées'] },
            { version: 'v2.2', status: 'in-progress', features: ['Réservation récurrente', 'Partage de places', 'Widget iOS/Android'] },
            { version: 'v2.3', status: 'planned', features: ['IA prédictive', 'Réalité augmentée', 'Intégration GPS avancée'] }
          ].map((release, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                release.status === 'completed' ? 'bg-green-500' :
                release.status === 'in-progress' ? 'bg-orange-500' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">{release.version}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    release.status === 'completed' ? 'bg-green-100 text-green-800' :
                    release.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {release.status === 'completed' ? 'Terminé' :
                     release.status === 'in-progress' ? 'En cours' : 'Planifié'}
                  </span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {release.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileApp;