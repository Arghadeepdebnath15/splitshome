import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlat } from '../context/FlatContext';
import { useAuth } from '../context/AuthContext';
import { Building2, KeyRound, PlusCircle, Users, ArrowRight, AlertCircle } from 'lucide-react';

const FlatSetupPage = () => {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [flatName, setFlatName] = useState('');
  const [flatAddress, setFlatAddress] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { createFlat, joinFlat } = useFlat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!flatName.trim()) {
      setError('Please provide a name for your flat.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await createFlat({
        name: flatName.trim(),
        address: flatAddress.trim(),
        defaultCreditValue: 1
      });

      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Failed to create flat.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating flat.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please provide an invitation code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await joinFlat(inviteCode.trim());
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid invite code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join flat with this code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome, {user?.name}!
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Set up your shared household or join an existing flatmate group
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError('');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              tab === 'create'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Create New Flat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('join');
              setError('');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              tab === 'join'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Join with Code</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Household / Flat Name *
                </label>
                <input
                  type="text"
                  required
                  value={flatName}
                  onChange={(e) => setFlatName(e.target.value)}
                  placeholder="e.g. Baker Street Flat 221B, Sunshine Residency 402"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flat Address / City (Optional)
                </label>
                <input
                  type="text"
                  value={flatAddress}
                  onChange={(e) => setFlatAddress(e.target.value)}
                  placeholder="e.g. 12 Park Avenue, Apartment 3B, New York"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  ✨ What happens next?
                </p>
                A unique invitation code will be generated automatically. You can share it with your flatmates so they can join instantly!
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Creating Flat...' : 'Create Flat & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter Flat Invitation Code *
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLAT-A92B4F"
                  className="w-full px-3.5 py-3 rounded-xl text-sm font-mono uppercase tracking-wider text-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Ask your flatmate who created the flat for their invite code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Joining Flat...' : 'Join Flat'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlatSetupPage;

