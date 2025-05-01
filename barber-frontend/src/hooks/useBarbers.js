// src/hooks/useBarbers.js

import { useState, useEffect } from 'react';
import { fetchBarbers } from '../services/api';
import { useConfig } from '../context/ConfigContext';

/**
 * Custom hook to fetch the list of barbers (or workers).
 * In individual mode, if no barbers are returned, this hook
 * injects a single "barber" based on sessionStorage values.
 */
export default function useBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserRole } = useConfig();

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const data = await fetchBarbers();
        if (canceled) return;

        // If individual account and no barbers fetched, inject the single user
        if (getUserRole() === 'individual' && Array.isArray(data) && data.length === 0) {
          const shopId = sessionStorage.getItem('shopId');
          const barberName = sessionStorage.getItem('barberName') || shopId;
          setBarbers([{ barber_id: shopId, name: barberName }]);
        } else {
          setBarbers(data);
        }
      } catch (error) {
        console.error('Error fetching barbers:', error);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [getUserRole]);

  return { barbers, loading };
}
