import React, { useState, useEffect } from 'react';
import { DevComment, User } from '../../types';
import { FirebaseService } from '../../api/firebase';
import {
  MessageSquare,
  Search,
  Filter,
  ArrowUpRight,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';

interface DevFeedbackModuleProps {
  currentUser: User;
  onJumpToComment: (comment: DevComment) => void;
}

export const DevFeedbackModule: React.FC<DevFeedbackModuleProps> = ({
  currentUser,
  onJumpToComment,
}) => {
  const [comments, setComments] = useState<DevComment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabFilter, setSelectedTabFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time comments from Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = FirebaseService.subscribeToComments(
      list => {
        setComments(list);
        setIsLoading(false);
      },
      err => {
        console.error('Failed to load comments:', err);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleStartEdit = (comment: DevComment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    setIsSaving(true);
    try {
      await FirebaseService.updateComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (err: any) {
      alert('Failed to update comment in Firebase.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await FirebaseService.deleteComment(commentId);
      } catch (err: any) {
        alert('Failed to delete comment from Firebase.');
        console.error(err);
      }
    }
  };

  // Tab mapping for human-readable names
  const getTabLabel = (tabKey: string) => {
    switch (tabKey) {
      case 'overview':
        return 'Dashboard Overview';
      case 'patients':
        return 'Patient List';
      case 'counselling':
        return 'Counselling & Surgery';
      case 'billing':
        return 'Billing & Estimates';
      case 'reports':
        return 'Reports Module';
      case 'settings':
        return 'Settings';
      case 'users':
        return 'Staff Management';
      case 'audit':
        return 'Audit Trail';
      default:
        return tabKey;
    }
  };

  // Filtered comments
  const filteredComments = comments.filter(c => {
    const matchesSearch =
      c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.targetDescription && c.targetDescription.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = selectedTabFilter === 'all' || c.tab === selectedTabFilter;

    return matchesSearch && matchesTab;
  });

  // Unique tabs in the comments
  const uniqueTabs = Array.from(new Set(comments.map(c => c.tab)));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#EAF0F6] text-slate-800">
      {/* Top Banner / Info Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-[#CBD8E4] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Feedback & Development Comments
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                Review Period
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Right-click anywhere in the workstation to pin a comment. Review and jump directly to any pinned location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Sync Active</span>
            </div>
          </div>
        </div>

        {/* Quick Instructions Banner */}
        <div className="mt-4 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>How to add comments:</strong> Right-click on any screen, button, form, or table to drop a feedback balloon. Everyone can view and collaborate on feedback here during the testing period.
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Comments
            </span>
            <span className="text-xl font-bold text-indigo-700 font-mono">
              {comments.length}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Sections Pinned
            </span>
            <span className="text-xl font-bold text-slate-800 font-mono">
              {uniqueTabs.length}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Active Contributors
            </span>
            <span className="text-xl font-bold text-slate-800 font-mono">
              {new Set(comments.map(c => c.authorName)).size}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Storage Adapter
            </span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Firebase Firestore
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 sm:px-6 py-3 bg-[#E1EAF2] border-b border-[#CBD8E4] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search comments, author, target..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#CBD8E4] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTabFilter}
              onChange={e => setSelectedTabFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#CBD8E4] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Modules ({comments.length})</option>
              {uniqueTabs.map(tab => (
                <option key={tab} value={tab}>
                  {getTabLabel(tab)} ({comments.filter(c => c.tab === tab).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredComments.length} of {comments.length} comments
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
            <span className="text-xs">Loading comments from Firestore...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center bg-white/70 rounded-2xl border border-dashed border-slate-300">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 text-sm">
              {comments.length === 0 ? 'No feedback comments yet' : 'No matching comments found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {comments.length === 0
                ? 'Right-click anywhere on any screen to add the first comment.'
                : 'Try clearing your search query or module filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredComments.map(comment => {
              const isEditing = editingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="bg-white rounded-xl border border-[#CBD8E4] shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Author & Tab Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-slate-900 truncate block">
                            {comment.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {getTabLabel(comment.tab)}
                        </span>
                      </div>
                    </div>

                    {/* Target Context */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate font-medium">
                        Target: {comment.targetDescription || 'Screen'}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto shrink-0 font-mono">
                        ({Math.round(comment.xPercent)}%, {Math.round(comment.yPercent)}%)
                      </span>
                    </div>

                    {/* Content or Edit Box */}
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          className="w-full p-2 text-xs border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-[11px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSaving || !editText.trim()}
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 text-[11px] rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap py-1">
                        {comment.content}
                      </p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit comment text"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* JUMP TO PARTICULAR PLACE */}
                    <button
                      onClick={() => onJumpToComment(comment)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={`Go to ${getTabLabel(comment.tab)} and show pin`}
                    >
                      <span>Jump to Location</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
