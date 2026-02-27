import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, X, CheckCircle2, Info, AlertTriangle, Sparkles } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'scholarship';
  timestamp: Date;
  read: boolean;
}

export const NotificationManager: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState<Notification | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved notifications
    const saved = localStorage.getItem('scholar_notifications');
    if (saved) {
      setNotifications(JSON.parse(saved).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
    }

    // Simulate an initial notification
    const timer = setTimeout(() => {
      addNotification({
        title: "Welcome to ScholarMatch AI!",
        message: "Complete your profile to get real-time scholarship matches tailored to your background.",
        type: 'info'
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('scholar_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      addNotification({
        title: "Notifications Enabled",
        message: "You'll now receive updates about new scholarship matches and deadlines.",
        type: 'success'
      });
    }
  };

  const addNotification = (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    setShowToast(newNotification);
    setTimeout(() => setShowToast(null), 5000);

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl transition-all relative ${
            isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
          }`}
        >
          {permission === 'denied' ? <BellOff size={20} /> : <Bell size={20} />}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[120]"
            >
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-indigo-400" />
                  <span className="font-black uppercase tracking-widest text-xs">Notifications</span>
                </div>
                <button onClick={markAllAsRead} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                  Mark all read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {permission === 'default' && (
                  <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                    <p className="text-xs text-indigo-900 font-bold mb-3">Stay updated with real-time scholarship alerts!</p>
                    <button
                      onClick={requestPermission}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      Enable Push Notifications
                    </button>
                  </div>
                )}

                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-6 transition-colors ${n.read ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <div className="flex gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                            n.type === 'warning' ? 'bg-rose-50 text-rose-600' :
                            n.type === 'scholarship' ? 'bg-amber-50 text-amber-600' :
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                            {n.type === 'success' ? <CheckCircle2 size={16} /> :
                             n.type === 'warning' ? <AlertTriangle size={16} /> :
                             n.type === 'scholarship' ? <Sparkles size={16} /> :
                             <Info size={16} />}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block pt-1">
                              {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-6 top-24 z-[130] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => {
              setIsOpen(true);
              setShowToast(null);
            }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              showToast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              showToast.type === 'warning' ? 'bg-rose-50 text-rose-600' :
              'bg-indigo-50 text-indigo-600'
            }`}>
              <Bell size={20} />
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-black text-slate-900">{showToast.title}</h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">{showToast.message}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowToast(null); }} className="text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
