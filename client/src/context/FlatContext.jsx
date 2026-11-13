import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FlatContext = createContext();

export const FlatProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [currentFlat, setCurrentFlat] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingFlat, setLoadingFlat] = useState(false);

  const fetchFlat = async () => {
    if (!user || !user.flat) {
      setCurrentFlat(null);
      setMembers([]);
      return;
    }
    setLoadingFlat(true);
    try {
      const res = await api.get('/flats/current');
      if (res.data.success) {
        setCurrentFlat(res.data.flat);
        setMembers(res.data.flat.members.map(m => m.user).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching flat details:', error);
      if (error.response?.status === 404 || error.response?.status === 403) {
        setCurrentFlat(null);
        setMembers([]);
      }
    } finally {
      setLoadingFlat(false);
    }
  };

  useEffect(() => {
    fetchFlat();
  }, [user?.flat]);

  const createFlat = async ({ name, address, defaultCreditValue }) => {
    const res = await api.post('/flats/create', { name, address, defaultCreditValue });
    if (res.data.success) {
      setCurrentFlat(res.data.flat);
      setMembers(res.data.flat.members.map(m => m.user).filter(Boolean));
      updateUser({ ...user, flat: res.data.flat._id, role: 'admin' });
      return { success: true, flat: res.data.flat };
    }
    return { success: false, message: res.data.message };
  };

  const joinFlat = async (inviteCode) => {
    const res = await api.post('/flats/join', { inviteCode });
    if (res.data.success) {
      setCurrentFlat(res.data.flat);
      setMembers(res.data.flat.members.map(m => m.user).filter(Boolean));
      updateUser({ ...user, flat: res.data.flat._id, role: 'member' });
      return { success: true, flat: res.data.flat };
    }
    return { success: false, message: res.data.message };
  };

  const leaveFlat = async () => {
    const res = await api.post('/flats/leave');
    if (res.data.success) {
      setCurrentFlat(null);
      setMembers([]);
      updateUser({ ...user, flat: null, role: 'member' });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const updateFlatSettings = async (settings) => {
    const res = await api.put('/flats/settings', settings);
    if (res.data.success) {
      setCurrentFlat(res.data.flat);
      setMembers(res.data.flat.members.map(m => m.user).filter(Boolean));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  return (
    <FlatContext.Provider
      value={{
        currentFlat,
        members,
        loadingFlat,
        createFlat,
        joinFlat,
        leaveFlat,
        refreshFlat: fetchFlat,
        updateFlatSettings
      }}
    >
      {children}
    </FlatContext.Provider>
  );
};

export const useFlat = () => useContext(FlatContext);

