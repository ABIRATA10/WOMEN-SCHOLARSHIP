import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Bell, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface NoticeManagementProps {
  adminEmail: string;
}

export const NoticeManagement: React.FC<NoticeManagementProps> = ({ adminEmail }) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/notices`, {
        headers: { 'x-user-email': adminEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': adminEmail }
      });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notice:', error);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noticeData = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${API_URL}/api/admin/notices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': adminEmail 
        },
        body: JSON.stringify(noticeData)
      });

      if (res.ok) {
        fetchNotices();
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save notice:', error);
    }
  };

  if (isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">Create New Notice</h3>
          <button 
            onClick={() => setIsCreating(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input 
              name="title" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="e.g., New Scholarship Available!"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Body</label>
            <textarea 
              name="body" 
              required 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="Enter the notice details here..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Post Notice
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-end">
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> New Notice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            No notices found.
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{notice.title}</h4>
                    <p className="text-xs font-bold text-slate-400 mb-2">
                      {new Date(notice.date).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Delete Notice"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-slate-600 whitespace-pre-wrap">{notice.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
