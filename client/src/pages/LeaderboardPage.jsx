import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { Trophy, Award, Heart, CheckCircle2, Sparkles, Scale } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [leaderboard, setLeaderboard] = useState([]);
  const [spotlight, setSpotlight] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
        setSpotlight(res.data.spotlight || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [lastEvent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span>Flatmate Recognition & Leaderboard</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Celebrating helpfulness, chore contributions, and mutual living harmony
        </p>
      </div>

      {/* Friendly Spotlight Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Most Helpful Flatmate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Most Helpful Flatmate
            </span>
            <span className="text-xl">😇</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={spotlight.mostHelpful?.user?.name || 'Pending'}
              color={spotlight.mostHelpful?.user?.avatarColor}
              size="md"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {spotlight.mostHelpful?.user?.name || 'No chores yet'}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                {spotlight.mostHelpful
                  ? `Completed ${spotlight.mostHelpful.tasksCompletedForOthers} chore(s) for flatmates`
                  : 'Step up to claim!'}
              </p>
            </div>
          </div>
        </div>

        {/* Most Chores Done Overall */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Most Chores Completed
            </span>
            <span className="text-xl">🏆</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={spotlight.mostCompleted?.user?.name || 'Pending'}
              color={spotlight.mostCompleted?.user?.avatarColor}
              size="md"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {spotlight.mostCompleted?.user?.name || 'No chores yet'}
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                {spotlight.mostCompleted
                  ? `${spotlight.mostCompleted.tasksCompletedTotal} total tasks finished`
                  : 'Household waiting'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Credit Earner */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Highest Credits Earned
            </span>
            <span className="text-xl">💎</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={spotlight.highestEarned?.user?.name || 'Pending'}
              color={spotlight.highestEarned?.user?.avatarColor}
              size="md"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {spotlight.highestEarned?.user?.name || '0 Credits'}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold mt-0.5">
                {spotlight.highestEarned
                  ? `+${spotlight.highestEarned.creditsEarned} chore credits earned`
                  : 'Earn by helping out'}
              </p>
            </div>
          </div>
        </div>

        {/* Most Credits Owed */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200 dark:border-rose-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Most Credits Owed
            </span>
            <span className="text-xl">🤝</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={spotlight.mostOwed?.user?.name || 'All even'}
              color={spotlight.mostOwed?.user?.avatarColor}
              size="md"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {spotlight.mostOwed?.user?.name || 'No outstanding debts'}
              </p>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold mt-0.5">
                {spotlight.mostOwed
                  ? `Owes -${spotlight.mostOwed.creditsOwed} credits (ready to settle!)`
                  : 'All flatmates even'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Member List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Flatmate Contribution Standings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by net chore balance and household tasks completed
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 sm:px-6">Rank & Flatmate</th>
                <th className="py-3 px-4 text-center">Tasks Done (Total)</th>
                <th className="py-3 px-4 text-center">Helped Others</th>
                <th className="py-3 px-4 text-right">Earned</th>
                <th className="py-3 px-4 text-right">Owed</th>
                <th className="py-3 px-4 sm:px-6 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {leaderboard.map((item, idx) => {
                const isMe = item.user._id === user?._id;
                return (
                  <tr
                    key={item.user._id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isMe ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                  >
                    <td className="py-3.5 px-4 sm:px-6 flex items-center gap-3">
                      <span className="font-extrabold text-sm w-4 text-slate-400">
                        {idx + 1}
                      </span>
                      <Avatar
                        name={item.user.name}
                        color={item.user.avatarColor}
                        size="sm"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.user.name}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              You
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {item.badges?.map((b) => (
                            <span
                              key={b.name}
                              className="text-xs"
                              title={`${b.name}: ${b.desc}`}
                            >
                              {b.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.tasksCompletedTotal}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.tasksCompletedForOthers} times
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      +{item.creditsEarned}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                      -{item.creditsOwed}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span
                        className={`inline-block font-extrabold px-2.5 py-1 rounded-full text-xs ${item.netBalance > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : item.netBalance < 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                      >
                        {item.netBalance > 0 ? `+${item.netBalance}` : item.netBalance}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;