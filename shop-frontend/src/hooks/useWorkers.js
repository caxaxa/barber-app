// src/hooks/useWorkers.js

import { useState, useEffect } from 'react';
import { fetchWorkers } from '../services/api';
import { useConfig } from '../context/ConfigContext';

/**
 * Custom hook to fetch the list of workers.
 * In individual mode, if no workers are returned, this hook
 * injects a single "worker" based on sessionStorage values.
 */
export default function useWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserRole } = useConfig();

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const data = await fetchWorkers();
        if (canceled) return;

        // If individual account and no workers fetched, inject the single user
        if (getUserRole() === 'individual' && Array.isArray(data) && data.length === 0) {
          const shopId = sessionStorage.getItem('shopId');
          const workerName = sessionStorage.getItem('workerName') || shopId;
          setWorkers([{ worker_id: shopId, name: workerName }]);
        } else {
          setWorkers(data);
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [getUserRole]);

  return { workers, loading };
}
