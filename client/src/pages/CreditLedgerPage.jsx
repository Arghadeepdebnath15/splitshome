import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LedgerTable from '../components/credits/LedgerTable';
import PairwiseDebtCard from '../components/credits/PairwiseDebtCard';
import TransactionHistory from '../components/credits/TransactionHistory';
import SettleModal from '../components/credits/SettleModal';
import DisputeModal from '../components/credits/DisputeModal';
import { Scale, Sparkles, Handshake, AlertTriangle, ArrowRight } from 'lucide-react';

const CreditLedgerPage = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [ledger, setLedger] = useState([]);
  const [pairwiseDebts, setPairwiseDebts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settle modal state
  const [settleDebtor, setSettleDebtor] = useState(null);
  const [settleCreditor, setSettleCreditor] = useState(null);
  const [suggestedAmount, setSuggestedAmount] = useState(1);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Dispute modal state
  const [selectedTxnToDispute, setSelectedTxnToDispute] = useState(null);

  const [modalLoading, setModalLoading] = useState(false);

  const fetchCreditData = async () => {
    try {
      const [ledgerRes, txnRes] = await Promise.all([
        api.get('/credits/ledger'),
        api.get('/credits/transactions?limit=50')
      ]);

      if (ledgerRes.data.success) {
        setLedger(ledgerRes.data.ledger);
        setPairwiseDebts(ledgerRes.data.pairwiseDebts);
      }

      if (txnRes.data.success) {
        setTransactions(txnRes.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, [lastEvent]);

  const handleOpenSettle = (debtor, creditor, amount) => {
    setSettleDebtor(debtor);
    setSettleCreditor(creditor);
    setSuggestedAmount(amount);
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettle = async (settleData) => {
    setModalLoading(true);
    try {
      const res = await api.post('/credits/settle', settleData);
      if (res.data.success) {
        setIsSettleModalOpen(false);
        fetchCreditData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDispute = async (transactionId, reason) => {
    setModalLoading(true);
    try {
      const res = await api.post('/credits/dispute', { transactionId, reason });
      if (res.data.success) {
        setSelectedTxnToDispute(null);
        fetchCreditData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Find user's own stats in ledger
  const myStat = ledger.find((l) => l.user?._id === user?._id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <span>Chore Credit & Debt Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent credit ledger for work done on behalf of flatmates
          </p>
        </div>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            My Net Chore Balance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                (myStat?.netBalance || 0) > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (myStat?.netBalance || 0) < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {(myStat?.netBalance || 0) > 0
                ? `+${myStat?.netBalance}`
                : myStat?.netBalance || 0}
            </span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {(myStat?.netBalance || 0) > 0
              ? 'You are owed work by your flatmates'
              : (myStat?.netBalance || 0) < 0
              ? 'You owe work to your flatmates'
              : 'All your chore debts are balanced!'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Total Credits Earned
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{myStat?.creditsEarned || 0}
            </span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Earned by stepping up and completing tasks for others
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Total Credits Owed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              -{myStat?.creditsOwed || 0}
            </span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generated when flatmates did chores assigned to you
          </p>
        </div>
      </div>

      {/* Official Master Ledger Table */}
      <LedgerTable ledger={ledger} currentUserId={user?._id} />

      {/* Pairwise Debt Breakdown Grid */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Direct Flatmate Debt Balances
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pairwise net who-owes-whom matrix with 1-click settlement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pairwiseDebts.length === 0 ? (
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
              No pairwise debts recorded yet. All flatmates are currently even!
            </div>
          ) : (
            pairwiseDebts.map((pair, idx) => (
              <PairwiseDebtCard
                key={idx}
                pair={pair}
                onSettle={handleOpenSettle}
                currentUserId={user?._id}
              />
            ))
          )}
        </div>
      </div>

      {/* Permanent Transaction History */}
      <TransactionHistory
        transactions={transactions}
        onDispute={(txn) => setSelectedTxnToDispute(txn)}
        currentUserId={user?._id}
      />

      {/* Settle Modal */}
      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        debtor={settleDebtor}
        creditor={settleCreditor}
        suggestedAmount={suggestedAmount}
        onConfirm={handleConfirmSettle}
        loading={modalLoading}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={!!selectedTxnToDispute}
        onClose={() => setSelectedTxnToDispute(null)}
        transaction={selectedTxnToDispute}
        onConfirm={handleConfirmDispute}
        loading={modalLoading}
      />
    </div>
  );
};

export default CreditLedgerPage;

