import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function HelpButton() {
  const [isUrgent, setIsUrgent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Détecte les pics d'urgence dans un rayon de 5km
    const detectLocalUrgency = async () => {
      const { data } = await supabase.rpc('detect_local_urgency', {
        radius_km: 5,
        min_requests: 3
      });
      
      if (data) {
        setIsUrgent(true);
        setCountdown(300); // 5 minutes pour répondre
      }
    };

    const interval = setInterval(detectLocalUrgency, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergency = async () => {
    // Vibre le téléphone si supporté
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Crée une urgence avec géoloc
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000
      });
    });

    const { error } = await supabase.from('helps').insert({
      type: 'urgent',
      urgency: 10,
      location: `POINT(${position.coords.longitude} ${position.coords.latitude})`,
      status: 'open'
    });

    if (!error) {
      // Envoie notifications aux helpers proches
      await supabase.functions.invoke('notify-rescuers', {
        body: { lat: position.coords.latitude, lng: position.coords.longitude }
      });
    }
  };

  return (
    <>
      {isUrgent && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50 animate-pulse-red">
          🚨 URGENCE À {countdown}s - {countdown} personnes ont besoin d'aide à proximité
        </div>
      )}
      
      <button 
        onClick={handleEmergency}
        className="fixed bottom-6 right-6 w-20 h-20 bg-red-600 rounded-full shadow-2xl hover:bg-red-700 transition transform hover:scale-110 z-40"
      >
        <div className="text-white text-2xl font-bold">🆘</div>
        <div className="text-white text-xs">URGENCE</div>
      </button>
    </>
  );
}