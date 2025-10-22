// frontend/src/components/Sessions.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Clock, 
  Car, 
  Truck, 
  Bike, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  AlertCircle, 
  Scan,
  X, 
  Euro,
  Bell
} from 'lucide-react';
import { ParkingSession, ParkingSpace } from '../types/parking';
import { apiService } from '../services/apiService';
import Tesseract from 'tesseract.js';

// ==================== SERVICE OCR AMÉLIORÉ ====================
const OCRService = {
  preprocessImage: async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        const scale = Math.min(1200 / img.width, 1200 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Amélioration du contraste
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const threshold = 128;
          const value = gray < threshold ? 0 : 255;
          data[i] = value;     // Rouge
          data[i + 1] = value; // Vert
          data[i + 2] = value; // Bleu
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
    });
  },

  recognizeLicensePlate: async (
    processedImage: string,
    onProgress?: (progress: number) => void
  ): Promise<{ plate: string | null; rawText: string; confidence: number }> => {
    try {
      const passes = [1, 1.2, 1.5];
      let bestResult = { plate: '', confidence: 0, rawText: '' };

      for (let i = 0; i < passes.length; i++) {
        const scale = passes[i];
        const result = await Tesseract.recognize(processedImage, 'eng+fra', {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: 7,
          tessedit_ocr_engine_mode: 3,
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              const baseProgress = (i / passes.length) * 100;
              const currentPassProgress = (m.progress || 0) * (100 / passes.length);
              onProgress(Math.round(baseProgress + currentPassProgress));
            }
          },
        });

        let text = result.data.text
          .replace(/[\n\r\t\s]/g, '')
          .replace(/[^A-Z0-9]/gi, '')
          .trim()
          .toUpperCase();

        text = OCRService.autoCorrectPlateText(text);

        if (result.data.confidence > bestResult.confidence && text.length >= 4) {
          bestResult = {
            plate: text,
            confidence: result.data.confidence,
            rawText: result.data.text
          };
        }
      }

      return {
        plate: bestResult.plate || null,
        rawText: bestResult.rawText,
        confidence: bestResult.confidence
      };
    } catch (err: any) {
      console.error('❌ Erreur OCRService:', err);
      throw new Error(`Erreur OCR: ${err.message}`);
    }
  },

  autoCorrectPlateText: (text: string): string => {
    if (!text) return '';
    
    let corrected = text.toUpperCase();
    
    const corrections: Record<string, string> = {
      'O': '0', 'Q': '0', 'D': '0',
      'I': '1', 'L': '1', 'T': '1',
      'Z': '2', 
      'S': '5', 
      'B': '8',
      'G': '6'
    };

    corrected = corrected.split('').map(char => corrections[char] || char).join('');

    if (corrected.length < 4 || corrected.length > 10) {
      return corrected;
    }

    return corrected;
  },

  validateLicensePlate: (plate: string): boolean => {
    if (!plate) return false;
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();
    
    const regexTunisie = /^\d{1,4}[A-Z]{1,3}\d{1,4}$/;
    const regexIntl = /^[A-Z0-9]{4,10}$/;
    
    return regexTunisie.test(cleanPlate) || regexIntl.test(cleanPlate);
  },
};

// ==================== SERVICE DE NOTIFICATION ====================
const NotificationService = {
  createNewEntryNotification: async (sessionData: any, sessionId: string): Promise<void> => {
    try {
      const now = new Date();

      let vehicleIcon = '🚗';
      let notificationType: 'info' | 'success' | 'warning' = 'info';
      
      switch (sessionData.vehicleType) {
        case 'camion':
          vehicleIcon = '🚚';
          notificationType = 'warning';
          break;
        case 'moto':
          vehicleIcon = '🏍️';
          notificationType = 'info';
          break;
        default:
          vehicleIcon = '🚗';
          notificationType = 'info';
      }

      const notificationData = {
        type: notificationType,
        title: `${vehicleIcon} Nouvelle Entrée Véhicule`,
        message: `Véhicule ${sessionData.plate.toUpperCase()} (${sessionData.vehicleType}) est entré - Place ${sessionData.spaceNumber}`,
        timestamp: now.toISOString(),
        read: false,
        category: 'parking',
        plate: sessionData.plate.toUpperCase(),
        spaceNumber: sessionData.spaceNumber,
        vehicleType: sessionData.vehicleType,
        sessionId: sessionId,
        actionUrl: '/sessions'
      };

      await apiService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour nouvelle entrée:', {
        plate: sessionData.plate,
        space: sessionData.spaceNumber,
        vehicleType: sessionData.vehicleType
      });

    } catch (error) {
      console.error('❌ Erreur création notification nouvelle entrée:', error);
    }
  },

  createReservationNotification: async (spaceNumber: string, plate: string, vehicleType: string, expiresAt: Date): Promise<void> => {
    try {
      const notificationData = {
        type: 'warning',
        title: '📋 Réservation Créée',
        message: `Place ${spaceNumber} réservée pour ${plate.toUpperCase()} (${vehicleType}) - Expire à ${expiresAt.toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        read: false,
        category: 'parking',
        plate: plate.toUpperCase(),
        spaceNumber: spaceNumber,
        vehicleType: vehicleType,
        actionUrl: '/sessions'
      };

      await apiService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour réservation:', {
        plate: plate,
        space: spaceNumber,
        vehicleType: vehicleType
      });

    } catch (error) {
      console.error('❌ Erreur création notification réservation:', error);
    }
  },

  createSpaceFreedNotification: async (spaceNumber: string, plate?: string, reason?: string): Promise<void> => {
    try {
      const message = plate 
        ? `Place ${spaceNumber} libérée - Véhicule ${plate.toUpperCase()} parti`
        : `Place ${spaceNumber} libérée${reason ? ` - ${reason}` : ''}`;

      const notificationData = {
        type: 'success',
        title: '🅿️ Place Libérée',
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        category: 'parking',
        plate: plate?.toUpperCase(),
        spaceNumber: spaceNumber,
        actionUrl: '/parking-spaces'
      };

      await apiService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour place libérée:', {
        space: spaceNumber,
        plate: plate,
        reason: reason
      });

    } catch (error) {
      console.error('❌ Erreur création notification place libérée:', error);
    }
  },

  createReservationOccupiedNotification: async (spaceNumber: string, plate: string, vehicleType: string): Promise<void> => {
    try {
      const notificationData = {
        type: 'success',
        title: '✅ Réservation Occupée',
        message: `Place ${spaceNumber} - Réservation pour ${plate.toUpperCase()} (${vehicleType}) maintenant occupée`,
        timestamp: new Date().toISOString(),
        read: false,
        category: 'parking',
        plate: plate.toUpperCase(),
        spaceNumber: spaceNumber,
        vehicleType: vehicleType,
        actionUrl: '/sessions'
      };

      await apiService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour réservation occupée:', {
        plate: plate,
        space: spaceNumber,
        vehicleType: vehicleType
      });

    } catch (error) {
      console.error('❌ Erreur création notification réservation occupée:', error);
    }
  }
};

// ==================== COMPOSANT PRINCIPAL ====================
const Sessions: React.FC = () => {
  // États principaux
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sessionToPay, setSessionToPay] = useState<ParkingSession | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'espèces' | 'carte' | 'mobile_money' | 'portefeuille'>('espèces');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportFilters, setExportFilters] = useState({
  startDate: '',
  endDate: '',
  status: 'all'
});
  // État pour le formulaire de nouvelle session
  const [newSessionData, setNewSessionData] = useState({
    plate: '',
    spaceNumber: '',
    vehicleType: 'voiture' as 'voiture' | 'camion' | 'moto'
  });

  // États pour la reconnaissance OCR
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== FONCTIONS UTILITAIRES ====================
  // CORRECTION: Fonction convertDate améliorée
const convertDate = (date: any): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (date && date.seconds) return new Date(date.seconds * 1000);
  
  console.warn('Format de date non reconnu ou invalide:', date);
  return new Date(); // Fallback à la date actuelle
};

  const getDefaultVehiclePhoto = (vehicleType: string): string => {
    switch (vehicleType) {
      case 'camion': return 'https://images.unsplash.com/photo-1558618666-fcd25856cd63?w=400';
      case 'moto': return 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400';
      default: return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400';
    }
  };

  const getVehiclePhoto = (vehicleType: string): string => {
    return getDefaultVehiclePhoto(vehicleType);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'terminé': return 'bg-blue-100 text-blue-800';
      case 'payé': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'camion': return <Truck className="w-4 h-4 text-orange-600" />;
      case 'moto': return <Bike className="w-4 h-4 text-purple-600" />;
      default: return <Car className="w-4 h-4 text-blue-600" />;
    }
  };

  // ==================== GESTION DES SESSIONS ====================
  const loadSessions = async () => {
  try {
    const sessionsData = await apiService.getSessions();
    
    // CORRECTION: Log pour debugger les dates
    console.log('📊 Sessions chargées:', sessionsData.map(s => ({
      id: s._id || s.id,
      plate: s.vehicle?.plate,
      entryTime: s.entryTime || s.startTime,
      exitTime: s.exitTime || s.endTime,
      status: s.status
    })));
    
    const formattedSessions: ParkingSession[] = sessionsData.map((session: any) => {
      // CORRECTION: Gestion robuste des dates
      const entryTime = convertDate(session.entryTime || session.startTime);
      const exitTime = session.exitTime || session.endTime ? convertDate(session.exitTime || session.endTime) : undefined;
      
      // CORRECTION: Validation de la cohérence temporelle
      if (exitTime && entryTime > exitTime) {
        console.warn('❌ Incohérence temporelle détectée:', {
          sessionId: session._id || session.id,
          entryTime: entryTime.toISOString(),
          exitTime: exitTime.toISOString()
        });
      }
      
      return {
        id: session._id || session.id,
        vehicle: session.vehicle || {
          id: `vehicle-${session._id || session.id}`,
          plate: session.plate || 'INCONNU',
          type: session.vehicleType || session.vehicle?.type || 'voiture'
        },
        spaceNumber: session.spaceNumber || 'N/A',
        entryTime: entryTime,
        exitTime: exitTime,
        status: session.status || 'active',
        amount: session.amount,
        paymentMethod: session.paymentMethod,
        photos: {
          entry: session.photos?.entry || getDefaultVehiclePhoto(session.vehicle?.type || session.vehicleType || 'voiture'),
          exit: session.photos?.exit
        },
        duration: session.duration,
        createdAt: session.createdAt ? convertDate(session.createdAt) : undefined,
        updatedAt: session.updatedAt ? convertDate(session.updatedAt) : undefined
      };
    });
    
    setSessions(formattedSessions);
    setIsLoading(false);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des sessions:', error);
    setIsLoading(false);
  }
};

  const loadParkingSpaces = async () => {
    try {
      const spaces = await apiService.getParkingSpaces();
      setParkingSpaces(spaces);
    } catch (error) {
      console.error('❌ Erreur chargement places:', error);
    }
  };

  // ==================== GESTION DES RÉSERVATIONS ====================
  const calculateExpirationDate = (): Date => {
    const now = new Date();
    return new Date(now.getTime() + 30 * 60 * 1000);
  };

  const formatTimeRemaining = (expiresAt: any): string => {
    try {
      const expirationDate = convertDate(expiresAt);
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();
      
      if (diff <= 0) return 'Expirée';
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${minutes}m ${seconds}s`;
    } catch (error) {
      console.error('Erreur formatTimeRemaining:', error);
      return 'Erreur';
    }
  };

  const cancelReservation = async (space: ParkingSpace): Promise<void> => {
    try {
      if (!space.reservation) return;

      // Mettre à jour via API
      await apiService.updateParkingSpace(space.id, {
        status: 'libre',
        reservation: null,
        updatedAt: new Date().toISOString()
      });

      // Notification d'annulation de réservation
      const notificationData = {
        type: 'error',
        title: '❌ Réservation Annulée',
        message: `Réservation annulée pour la place ${space.number} - Véhicule: ${space.reservation.plate}`,
        timestamp: new Date().toISOString(),
        read: false,
        category: 'parking',
        plate: space.reservation.plate,
        spaceNumber: space.number,
        actionUrl: '/sessions'
      };
      await apiService.createNotification(notificationData);

      console.log(`🔔 Notification créée pour annulation réservation: ${space.reservation.plate}`);

    } catch (error) {
      console.error('❌ Erreur annulation réservation:', error);
    }
  };

  // ==================== GESTION OCR AMÉLIORÉE ====================
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setOcrError('Veuillez sélectionner une image valide (jpg, png...)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setOcrError('L\'image ne doit pas dépasser 5 Mo.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async (e) => {
        try {
          const imageUrl = e.target?.result as string;
          setSelectedImage(imageUrl);
          setOcrError(null);
          await processLicensePlate(imageUrl);
        } catch (error) {
          console.error('Erreur traitement image:', error);
          setOcrError('Erreur lors du traitement de l\'image');
        }
      };
      reader.onerror = () => {
        setOcrError('Erreur de lecture du fichier');
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      setOcrError('Erreur lors de l\'upload de l\'image');
    }
  };

  const processLicensePlate = async (imageUrl: string): Promise<void> => {
    setIsProcessingImage(true);
    setOcrProgress(0);
    setOcrError(null);

    try {
      console.log('🖼️ Démarrage du traitement OCR...');

      const processedImage = await OCRService.preprocessImage(imageUrl);
      const result = await OCRService.recognizeLicensePlate(
        processedImage, 
        (progress) => setOcrProgress(progress)
      );

      console.log('📊 Résultat OCR brut:', result.rawText);
      console.log('📊 Confiance:', result.confidence);

      if (!result.plate) {
        setOcrError('Aucun texte détecté. Essayez une autre image ou saisissez manuellement.');
        return;
      }

      const cleanText = result.plate
        .replace(/[\s]/g, '')
        .trim()
        .toUpperCase();

      console.log('✅ Texte nettoyé:', cleanText);

      if (cleanText.length < 4) {
        setOcrError(`Texte trop court détecté: "${cleanText}" - Veuillez réessayer avec une image plus claire`);
      } else {
        setNewSessionData((prev) => ({ ...prev, plate: cleanText }));
        console.log(`🚗 Plaque détectée: ${cleanText}`);
        setOcrError(null);
      }
    } catch (error: any) {
      console.error('❌ Erreur OCR complète:', error);
      setOcrError('Erreur de reconnaissance. Essayez une autre image ou saisissez manuellement.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const clearSelectedImage = (): void => {
    setSelectedImage(null);
    setOcrError(null);
    setNewSessionData(prev => ({ ...prev, plate: '' }));
  };

  // ==================== GESTION PLACES DE PARKING ====================
  const getVehicleTypeFromSpace = (spaceNumber: string): 'voiture' | 'camion' | 'moto' => {
    const space = parkingSpaces.find(s => s.number === spaceNumber);
    return space?.type || 'voiture';
  };

  const hasReservationsForPlate = (plate: string): boolean => {
    if (!plate) return false;
    
    return parkingSpaces.some(space => 
      space.status === 'réservé' && 
      space.reservation && 
      space.reservation.plate === plate.toUpperCase() &&
      convertDate(space.reservation.expiresAt) > new Date()
    );
  };

  const getAvailableSpaces = (): ParkingSpace[] => {
    const plate = newSessionData.plate.toUpperCase();
    
    if (plate && hasReservationsForPlate(plate)) {
      return parkingSpaces.filter(space => 
        space.status === 'réservé' && 
        space.reservation && 
        space.reservation.plate === plate &&
        convertDate(space.reservation.expiresAt) > new Date()
      );
    }
    
    return parkingSpaces.filter(space => 
      space.status === 'libre' && 
      space.type === newSessionData.vehicleType
    );
  };

  const handleSpaceSelection = (spaceNumber: string): void => {
    setNewSessionData(prev => ({ 
      ...prev, 
      spaceNumber,
      vehicleType: getVehicleTypeFromSpace(spaceNumber)
    }));
  };

  // ==================== CRÉATION DE SESSION ====================
  const createNewSession = async (): Promise<void> => {
  try {
    if (!newSessionData.plate || !newSessionData.spaceNumber) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const plate = newSessionData.plate.toUpperCase();

    if (!OCRService.validateLicensePlate(plate)) {
      if (!confirm(`Le format de la plaque "${plate}" semble incorrect. Voulez-vous continuer ?`)) {
        return;
      }
    }

    const vehicleType = getVehicleTypeFromSpace(newSessionData.spaceNumber);

    const selectedSpace = parkingSpaces.find(space => 
      space.number === newSessionData.spaceNumber
    );

    if (!selectedSpace) {
      alert('Cette place n\'existe pas');
      return;
    }

    // Vérifier si la place est disponible
    if (selectedSpace.status === 'occupé') {
      alert('Cette place est déjà occupée');
      return;
    } else if (selectedSpace.status === 'hors-service') {
      alert('Cette place est hors service');
      return;
    }

    const activeSession = sessions.find(session => 
      session.vehicle.plate === plate && session.status === 'active'
    );

    if (activeSession) {
      alert('Ce véhicule a déjà une session active');
      return;
    }

    console.log('🚗 Création de session pour:', { 
      plate, 
      spaceNumber: newSessionData.spaceNumber, 
      vehicleType,
      timestamp: new Date().toISOString() // CORRECTION: Log du timestamp
    });

    // Structure adaptée pour MongoDB
    const sessionDataForBackend = {
      vehicle: {
        plate: plate,
        type: vehicleType
      },
      spaceNumber: newSessionData.spaceNumber,
      status: 'active'
    };

    // 1. Créer la session
    const newSession = await apiService.createSession(sessionDataForBackend);
    console.log('✅ Session créée:', newSession);

    // 2. Marquer la place comme occupée
    try {
      await apiService.updateParkingSpaceByNumber(newSessionData.spaceNumber, {
        status: 'occupé',
        currentSessionId: newSession._id || newSession.id,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Place marquée comme occupée');
    } catch (spaceError) {
      console.error('⚠️ Erreur mise à jour place, mais session créée:', spaceError);
    }

    // 3. Créer notification
    try {
      await NotificationService.createNewEntryNotification(
        {
          plate: plate,
          spaceNumber: newSessionData.spaceNumber,
          vehicleType: vehicleType
        }, 
        newSession._id || newSession.id
      );
    } catch (notifError) {
      console.error('⚠️ Erreur notification, mais session créée:', notifError);
    }

    // CORRECTION: Recharger les données avec un délai
    setTimeout(async () => {
      await loadSessions();
      await loadParkingSpaces();
    }, 1000);

    // Réinitialiser le formulaire
    setNewSessionData({
      plate: '',
      spaceNumber: '',
      vehicleType: 'voiture'
    });
    setSelectedImage(null);
    setOcrError(null);
    setShowNewSessionForm(false);

    alert('Session créée avec succès!');

  } catch (error: any) {
    console.error('❌ Erreur lors de la création de la session:', error);
    
    let errorMessage = 'Erreur lors de la création de la session';
    if (error.message.includes('404')) {
      errorMessage += ' - Le serveur backend n\'est pas accessible. Vérifiez que le serveur est démarré sur le port 3001.';
    } else if (error.message.includes('500')) {
      errorMessage += ' - Erreur interne du serveur.';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    alert(errorMessage);
  }
};

  // ==================== GESTION PAIEMENT ====================
  const calculateAmount = (duration: number, vehicleType: string): number => {
    const baseRate = 2.5;
    let multiplier = 1;
    
    switch (vehicleType) {
      case 'camion': multiplier = 1.5; break;
      case 'moto': multiplier = 0.7; break;
      default: multiplier = 1;
    }

    const hours = duration / 60;
    const calculatedAmount = Math.max(baseRate, hours * baseRate * multiplier);
    return Math.round(calculatedAmount * 100) / 100;
  };

  const openPaymentModal = (session: ParkingSession): void => {
    const exitTime = new Date();
    const duration = Math.floor((exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
    const amount = calculateAmount(duration, session.vehicle.type);
    
    setSessionToPay(session);
    setPaymentAmount(amount);
    setPaymentMethod('espèces');
    setShowPaymentModal(true);
  };

  // CORRECTION de la fonction processPayment dans Sessions.tsx
const processPayment = async (): Promise<void> => {
  if (!sessionToPay) return;

  try {
    console.log('💳 Début du processus de paiement pour:', sessionToPay.id);

    const paymentData = {
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      exitTime: new Date().toISOString(),
      duration: Math.floor((new Date().getTime() - sessionToPay.entryTime.getTime()) / (1000 * 60))
    };

    console.log('📤 Données de paiement:', paymentData);

    // Traiter le paiement via API
    const result = await apiService.processPayment(sessionToPay.id, paymentData);
    
    console.log('✅ Résultat du paiement:', result);

    // CORRECTION: Vérifier si c'est une réponse simulée
    if (result.simulated) {
      console.log('🔄 Utilisation de réponse simulée pour le paiement');
    }

    // Libérer la place de parking via API
    try {
      await apiService.updateParkingSpaceByNumber(sessionToPay.spaceNumber, {
        status: 'libre',
        currentSessionId: null,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Place libérée:', sessionToPay.spaceNumber);
    } catch (spaceError) {
      console.error('⚠️ Erreur libération place, mais paiement traité:', spaceError);
    }

    // Notification de place libérée
    try {
      await NotificationService.createSpaceFreedNotification(
        sessionToPay.spaceNumber, 
        sessionToPay.vehicle.plate,
        `Paiement ${paymentMethod} effectué`
      );
    } catch (notifError) {
      console.error('⚠️ Erreur notification, mais paiement traité:', notifError);
    }

    console.log('✅ Paiement enregistré avec succès:', {
      sessionId: sessionToPay.id,
      amount: paymentAmount,
      method: paymentMethod
    });

    // CORRECTION: Recharger les données avec délai
    setTimeout(async () => {
      await loadSessions();
      await loadParkingSpaces();
    }, 1000);

    // Fermer le modal
    setShowPaymentModal(false);
    setSessionToPay(null);
    setPaymentAmount(0);

    alert(`Paiement de ${paymentAmount.toFixed(2)} DT (${paymentMethod}) enregistré avec succès!`);

  } catch (error: any) {
    console.error('❌ Erreur lors du traitement du paiement:', error);
    
    // CORRECTION: Message d'erreur plus informatif
    let errorMessage = 'Erreur lors de l\'enregistrement du paiement';
    if (error.message.includes('404')) {
      errorMessage += ' - Les endpoints de paiement ne sont pas disponibles. Le paiement a été simulé localement.';
      // Forcer le rechargement même en cas d'erreur
      setTimeout(async () => {
        await loadSessions();
        await loadParkingSpaces();
      }, 1000);
      setShowPaymentModal(false);
      setSessionToPay(null);
      alert(`Paiement de ${paymentAmount.toFixed(2)} DT simulé avec succès! (Backend non disponible)`);
    } else {
      errorMessage += `: ${error.message}`;
      alert(errorMessage);
    }
  }
};
// CORRECTION de la fonction handleEndSession
const handleEndSession = async (sessionId: string): Promise<void> => {
  try {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      alert('Session non trouvée');
      return;
    }

    const exitTime = new Date();
    const duration = Math.floor((exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
    const amount = calculateAmount(duration, session.vehicle.type);

    console.log('🛑 Fin de session:', {
      sessionId,
      duration,
      amount,
      exitTime: exitTime.toISOString()
    });

    // CORRECTION: Appeler l'API pour terminer la session
    await apiService.endSession(sessionId, {
      exitTime: exitTime.toISOString(),
      status: 'terminé',
      amount: amount,
      duration: duration
    });

    // CORRECTION: Libérer la place via API avec gestion d'erreur
    try {
      await apiService.updateParkingSpaceByNumber(session.spaceNumber, {
        status: 'libre',
        currentSessionId: null,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Place libérée:', session.spaceNumber);
    } catch (spaceError) {
      console.error('⚠️ Erreur libération place, mais session terminée:', spaceError);
    }

    // CORRECTION: Notification avec gestion d'erreur
    try {
      await NotificationService.createSpaceFreedNotification(
        session.spaceNumber, 
        session.vehicle.plate,
        'Session terminée'
      );
    } catch (notifError) {
      console.error('⚠️ Erreur notification, mais session terminée:', notifError);
    }

    // CORRECTION: Recharger les données avec délai
    setTimeout(async () => {
      await loadSessions();
      await loadParkingSpaces();
    }, 1000);

    console.log('✅ Session terminée avec succès:', sessionId);
    alert(`Session terminée! Montant: ${amount.toFixed(2)} DT`);

  } catch (error: any) {
    console.error('❌ Erreur lors de la fin de session:', error);
    
    // CORRECTION: Message d'erreur plus informatif
    let errorMessage = 'Erreur lors de la fin de la session';
    if (error.message.includes('404')) {
      errorMessage += ' - Le serveur ne trouve pas l\'endpoint. Vérifiez que le backend est correctement configuré.';
    } else if (error.message.includes('500')) {
      errorMessage += ' - Erreur interne du serveur.';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    alert(errorMessage);
  }
};


  // ==================== COMPOSANTS INTERNES ====================
  const ReservationTimer = ({ space }: { space: ParkingSpace }) => {
    const [timeRemaining, setTimeRemaining] = useState('Calcul...');

    useEffect(() => {
      if (!space.reservation) return;

      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(space.reservation!.expiresAt));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [space.reservation]);

    return (
      <div className="flex items-center mt-1 text-xs">
        <Clock className="w-3 h-3 mr-1 text-orange-500" />
        <span className={`font-medium ${
          timeRemaining === 'Expirée' ? 'text-red-600' : 'text-orange-600'
        }`}>
          {timeRemaining === 'Expirée' ? 'EXPIRÉE' : `Expire dans ${timeRemaining}`}
        </span>
      </div>
    );
  };

  const OCRTips = () => (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h4 className="mb-2 font-medium text-blue-900">💡 Conseils pour une meilleure reconnaissance :</h4>
      <ul className="space-y-1 text-sm text-blue-700">
        <li>• Prenez la photo de face, bien centrée sur la plaque</li>
        <li>• Assurez-vous d'une bonne luminosité</li>
        <li>• Évitez les reflets et ombres sur la plaque</li>
        <li>• La plaque doit occuper au moins 50% de l'image</li>
        <li>• Format recommandé : fond clair, caractères sombres</li>
      </ul>
    </div>
  );

  const getSafePhotoUrl = (session: ParkingSession): string => {
    return session.photos?.entry || getDefaultVehiclePhoto(session.vehicle.type);
  };

  // ==================== USE EFFECTS ====================
useEffect(() => {
  let isMounted = true;
  
  const loadData = async () => {
    if (!isMounted) return;
    
    try {
      await loadSessions();
      await loadParkingSpaces();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  loadData();
  
  // CORRECTION: Réduire la fréquence de rafraîchissement
  const interval = setInterval(loadData, 30000); // 30 secondes au lieu de 5
  
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, []); 
// CORRECTION: Tableau de dépendances vide
  // ==================== FILTRES ET RENDU ====================
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.spaceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des sessions...</div>
      </div>
    );
  }

  // ==================== RENDU PRINCIPAL ====================
  return (
    <div className="space-y-6">
      {/* Header avec indicateur de notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sessions de Parking</h2>
          <p className="text-gray-600">Gestion et suivi des entrées et sorties</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewSessionForm(true)}
            className="flex items-center px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Entrée
          </button>
          <button className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => window.location.href = '/notifications'}
            className="relative flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            <span className="absolute flex w-3 h-3 -top-1 -right-1">
              <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-3 h-3 bg-red-500 rounded-full"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Nouvelle Session Form Modal */}
      {showNewSessionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nouvelle Entrée</h3>
              <button
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSessionData({ plate: '', spaceNumber: '', vehicleType: 'voiture' });
                  setSelectedImage(null);
                  setOcrError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Section Upload d'image améliorée */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  📸 Photo de la plaque d'immatriculation
                  <span className="block mt-1 text-xs text-gray-500">
                    Conseils : Photo de face, bonne luminosité, plaque bien visible
                  </span>
                </label>
                
                {selectedImage ? (
                  <div className="space-y-3">
                    <div className="relative p-1 border-2 border-green-200 rounded-lg">
                      <img
                        src={selectedImage}
                        alt="Plaque d'immatriculation"
                        className="object-contain w-full h-40 rounded-lg"
                      />
                      <button
                        onClick={clearSelectedImage}
                        className="absolute p-1 text-white bg-red-500 rounded-full top-2 right-2 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {isProcessingImage && (
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-2">
                          <Scan className="w-4 h-4 text-blue-600 animate-pulse" />
                          <span className="text-sm font-medium text-blue-700">
                            Reconnaissance en cours... {ocrProgress}%
                          </span>
                        </div>
                        <div className="w-full h-2 mt-2 bg-blue-200 rounded-full">
                          <div 
                            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                            style={{ width: `${ocrProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50"
                  >
                    <Camera className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-center text-gray-600">
                      Cliquez pour prendre une photo de la plaque
                    </p>
                    <p className="mt-1 text-xs text-center text-gray-500">
                      Ou glissez-déposez l'image ici
                      <br />
                      <span className="text-green-600">Formats supportés: JPG, PNG, WebP</span>
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Champ plaque avec suggestions améliorées */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  🚗 Plaque d'immatriculation *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newSessionData.plate}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setNewSessionData(prev => ({ 
                        ...prev, 
                        plate: value,
                        spaceNumber: ''
                      }));
                    }}
                    placeholder="Ex: 1234TU123, 123TU123, ABC123"
                    className="w-full px-3 py-2 font-mono text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {!selectedImage && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute p-2 text-gray-400 transition-colors transform -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
                      title="Prendre une photo pour reconnaissance automatique"
                      type="button"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    Formats supportés: 
                    <span className="ml-2 font-mono">1234TU123</span>
                    <span className="mx-2 font-mono">•</span>
                    <span className="font-mono">123TU123</span>
                    <span className="mx-2 font-mono">•</span>
                    <span className="font-mono">ABC123</span>
                  </p>
                  
                  {newSessionData.plate && !OCRService.validateLicensePlate(newSessionData.plate) && (
                    <p className="text-xs text-orange-600">
                      ⚠️ Le format semble incorrect. Vérifiez la plaque.
                    </p>
                  )}
                </div>
              </div>

              {/* Messages d'erreur OCR améliorés */}
              {ocrError && (
                <div className={`p-3 rounded-lg border ${
                  ocrError.includes('✅') 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {ocrError.includes('✅') ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-sm ${
                        ocrError.includes('✅') 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {ocrError}
                      </p>
                      {ocrError.includes('⚠️') && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1 text-xs text-orange-600 underline"
                        >
                          Réessayer avec une autre photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Conseils pour l'OCR */}
              {!selectedImage && <OCRTips />}

              {/* Sélection du type de véhicule */}
              {newSessionData.plate && !hasReservationsForPlate(newSessionData.plate) && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Type de véhicule *
                  </label>
                  <select
                    value={newSessionData.vehicleType}
                    onChange={(e) => setNewSessionData(prev => ({ 
                      ...prev, 
                      vehicleType: e.target.value as 'voiture' | 'camion' | 'moto',
                      spaceNumber: ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="voiture">Voiture</option>
                    <option value="camion">Camion</option>
                    <option value="moto">Moto</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Sélectionnez le type de véhicule pour voir les places disponibles
                  </p>
                </div>
              )}

              {/* Sélection de la place */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Place de parking *
                </label>
                <select
                  value={newSessionData.spaceNumber}
                  onChange={(e) => handleSpaceSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={getAvailableSpaces().length === 0}
                >
                  <option value="">Sélectionner une place</option>
                  {getAvailableSpaces().map(space => (
                    <option key={space.id} value={space.number}>
                      {space.number} - Zone {space.zone} ({space.type.toUpperCase()})
                      {space.status === 'réservé' && ' - RÉSERVÉE'}
                      {space.status === 'libre' && ' - LIBRE'}
                    </option>
                  ))}
                </select>
                
                {/* Compte à rebours pour les places réservées */}
                {newSessionData.spaceNumber && hasReservationsForPlate(newSessionData.plate) && (
                  <div className="mt-2">
                    {(() => {
                      const selectedSpace = parkingSpaces.find(s => s.number === newSessionData.spaceNumber);
                      if (selectedSpace?.reservation) {
                        return <ReservationTimer space={selectedSpace} />;
                      }
                      return null;
                    })()}
                  </div>
                )}
                
                {/* Messages d'information */}
                {newSessionData.plate && (
                  <div className="mt-2 space-y-1">
                    {hasReservationsForPlate(newSessionData.plate) ? (
                      <>
                        <p className="text-xs text-green-600">
                          ✅ Réservation trouvée pour {newSessionData.plate.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getAvailableSpaces().length} place(s) réservée(s) disponible(s)
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-blue-600">
                          ℹ️ Aucune réservation trouvée pour {newSessionData.plate.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getAvailableSpaces().length} place(s) libre(s) pour {newSessionData.vehicleType}
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                {getAvailableSpaces().length === 0 && newSessionData.plate && (
                  <p className="mt-1 text-xs text-red-500">
                    {hasReservationsForPlate(newSessionData.plate) 
                      ? `Aucune place réservée valide trouvée pour ${newSessionData.plate.toUpperCase()}`
                      : `Aucune place libre trouvée pour ${newSessionData.vehicleType}`
                    }
                  </p>
                )}
              </div>

              {/* Affichage automatique du type de véhicule */}
              {newSessionData.spaceNumber && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Type de véhicule (automatique)
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                      {getVehicleIcon(getVehicleTypeFromSpace(newSessionData.spaceNumber))}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {getVehicleTypeFromSpace(newSessionData.spaceNumber)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Type déterminé automatiquement par la place sélectionnée
                  </p>
                </div>
              )}

              {/* Information contextuelle */}
              {newSessionData.plate && (
                <div className={`p-3 rounded-lg ${
                  hasReservationsForPlate(newSessionData.plate) 
                    ? 'bg-yellow-50' 
                    : 'bg-blue-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className={`w-4 h-4 ${
                      hasReservationsForPlate(newSessionData.plate) 
                        ? 'text-yellow-600' 
                        : 'text-blue-600'
                    }`} />
                    <p className={`text-sm ${
                      hasReservationsForPlate(newSessionData.plate) 
                        ? 'text-yellow-700' 
                        : 'text-blue-700'
                    }`}>
                      {hasReservationsForPlate(newSessionData.plate) 
                        ? <><strong>Réservation détectée:</strong> Les places affichées sont réservées pour votre plaque {newSessionData.plate.toUpperCase()}. <strong>Attention:</strong> La réservation expire automatiquement après 30 minutes.</>
                        : <><strong>Pas de réservation:</strong> Choisissez une place libre parmi celles disponibles pour {newSessionData.vehicleType}.</>
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSessionData({ plate: '', spaceNumber: '', vehicleType: 'voiture' });
                  setSelectedImage(null);
                  setOcrError(null);
                }}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createNewSession}
                disabled={getAvailableSpaces().length === 0 || !newSessionData.plate || !newSessionData.spaceNumber}
                className="flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer la Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Paiement */}
      {showPaymentModal && sessionToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                💳 Paiement de Stationnement
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSessionToPay(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informations de la session */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="mb-2 font-medium text-gray-900">Détails de la session</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plaque:</span>
                    <span className="font-medium">{sessionToPay.vehicle.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Place:</span>
                    <span className="font-medium">{sessionToPay.spaceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type véhicule:</span>
                    <span className="font-medium capitalize">{sessionToPay.vehicle.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-medium">
                      {Math.floor((new Date().getTime() - sessionToPay.entryTime.getTime()) / (1000 * 60 * 60))}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Montant du paiement */}
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Montant à payer:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {paymentAmount.toFixed(2)} DT
                  </span>
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Méthode de paiement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'espèces', label: '💵 Espèces', icon: '💰' },
                    { value: 'carte', label: '💳 Carte', icon: '💳' },
                    { value: 'mobile_money', label: '📱 Mobile Money', icon: '📱' },
                    { value: 'portefeuille', label: '👛 Portefeuille', icon: '👛' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-lg">{method.icon}</div>
                      <div className="mt-1 text-xs font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes supplémentaires */}
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-700">
                  💡 Le paiement sera enregistré dans la base de données et la place sera libérée automatiquement.
                </p>
              </div>
            </div>

            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSessionToPay(null);
                }}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={processPayment}
                className="flex items-center justify-center flex-1 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Euro className="w-4 h-4 mr-2" />
                Confirmer le Paiement
              </button>
            </div>
          </div>
        </div>
      )}
{/* Modal d'Export */}
{showExportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="w-full max-w-md p-6 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Exporter les Sessions
        </h3>
        <button
          onClick={() => setShowExportModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Format d'export */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Format d'export
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pdf', label: 'PDF', icon: '📄' },
              { value: 'excel', label: 'Excel', icon: '📊' },
              { value: 'csv', label: 'CSV', icon: '📋' }
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => setExportFormat(format.value as any)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  exportFormat === format.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg">{format.icon}</div>
                <div className="mt-1 text-xs font-medium">{format.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filtres de date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Date de début
            </label>
            <input
              type="date"
              value={exportFilters.startDate}
              onChange={(e) => setExportFilters(prev => ({ 
                ...prev, 
                startDate: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Date de fin
            </label>
            <input
              type="date"
              value={exportFilters.endDate}
              onChange={(e) => setExportFilters(prev => ({ 
                ...prev, 
                endDate: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtre de statut */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            value={exportFilters.status}
            onChange={(e) => setExportFilters(prev => ({ 
              ...prev, 
              status: e.target.value 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Active</option>
            <option value="terminé">Terminé</option>
            <option value="payé">Payé</option>
          </select>
        </div>

        {/* Informations */}
        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
          <p className="text-sm text-blue-700">
            💡 L'export inclura {filteredSessions.length} session(s) correspondant aux critères sélectionnés.
            {exportFilters.startDate && exportFilters.endDate && (
              <span> Période: {new Date(exportFilters.startDate).toLocaleDateString('fr-FR')} - {new Date(exportFilters.endDate).toLocaleDateString('fr-FR')}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex mt-6 space-x-3">
        <button
          onClick={() => setShowExportModal(false)}
          className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={handleExport}
          disabled={filteredSessions.length === 0}
          className="flex items-center justify-center flex-1 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter ({filteredSessions.length})
        </button>
      </div>
    </div>
  </div>
)}
      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Rechercher par plaque ou place..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="terminé">Terminé</option>
              <option value="payé">Payé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Sessions ({filteredSessions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Place
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Entrée
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Sortie
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Durée
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => {
                const duration = session.duration || 
                  (session.exitTime 
                    ? Math.floor((session.exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60))
                    : Math.floor((Date.now() - session.entryTime.getTime()) / (1000 * 60)));

                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={getSafePhotoUrl(session)}
                          alt="Vehicle"
                          className="object-cover w-12 h-12 mr-3 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultVehiclePhoto(session.vehicle.type);
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.vehicle.plate}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {session.vehicle.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.spaceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.entryTime.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.exitTime ? session.exitTime.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Math.floor(duration / 60)}h {duration % 60}min
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.amount ? `${session.amount.toFixed(2)} DT` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2 text-sm font-medium">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Détails
                      </button>
                      {session.status === 'active' && (
                        <button
                          onClick={() => handleEndSession(session.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Terminer
                        </button>
                      )}
                      {session.status === 'terminé' && !session.paymentMethod && (
                        <button
                          onClick={() => openPaymentModal(session)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Payer
                        </button>
                      )}
                      {session.status === 'payé' && (
                        <span className="text-green-600">✓ Payé</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Détails de la Session
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Informations Véhicule</h4>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p><span className="font-medium">Plaque:</span> {selectedSession.vehicle.plate}</p>
                    <p><span className="font-medium">Type:</span> {selectedSession.vehicle.type}</p>
                    <p><span className="font-medium">Place:</span> {selectedSession.spaceNumber}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Horaires</h4>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p><span className="font-medium">Entrée:</span> {selectedSession.entryTime.toLocaleString('fr-FR')}</p>
                    {selectedSession.exitTime && (
                      <p><span className="font-medium">Sortie:</span> {selectedSession.exitTime.toLocaleString('fr-FR')}</p>
                    )}
                    <p><span className="font-medium">Statut:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSession.status)}`}>
                        {selectedSession.status}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedSession.amount && (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">Paiement</h4>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p><span className="font-medium">Montant:</span> {selectedSession.amount.toFixed(2)} DT</p>
                      {selectedSession.paymentMethod && (
                        <p><span className="font-medium">Méthode:</span> {selectedSession.paymentMethod}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-900">Photos</h4>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-sm text-gray-600">Photo d'entrée</p>
                    <img
                      src={getSafePhotoUrl(selectedSession)}
                      alt="Entry photo"
                      className="object-cover w-full h-32 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getDefaultVehiclePhoto(selectedSession.vehicle.type);
                      }}
                    />
                  </div>
                  {selectedSession.photos?.exit && (
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Photo de sortie</p>
                      <img
                        src={selectedSession.photos.exit}
                        alt="Exit photo"
                        className="object-cover w-full h-32 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;