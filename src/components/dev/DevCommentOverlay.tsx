import React, { useState, useEffect, useRef } from 'react';
import { DevComment, User } from '../../types';
import { FirebaseService } from '../../api/firebase';
import {
  MessageSquare,
  MessageCircle,
  X,
  Send,
  Edit2,
  Trash2,
  Check,
  MapPin,
  Clock,
  User as UserIcon,
} from 'lucide-react';

interface DevCommentOverlayProps {
  currentUser: User;
  activeTab: string;
  onNavigateTab: (tab: any) => void;
  highlightedCommentId?: string | null;
  onClearHighlight?: () => void;
}

export const DevCommentOverlay: React.FC<DevCommentOverlayProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  highlightedCommentId,
  onClearHighlight,
}) => {
  const [comments, setComments] = useState<DevComment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCommentPos, setNewCommentPos] = useState<{
    x: number;
    y: number;
    xPercent: number;
    yPercent: number;
    targetDescription: string;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState(currentUser.name || 'Staff');
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const newCommentInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to real-time comments from Firebase Firestore
  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToComments(
      fetchedComments => {
        setComments(fetchedComments);
      },
      err => {
        console.warn('Real-time listener warning:', err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Disable browser right-click completely inside the app and open commenting box
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Completely disable browser right-click menu

      // If user right-clicked inside the open new comment popup, don't reset it
      const target = e.target as HTMLElement;
      if (target.closest('.dev-comment-box')) {
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      const xPercent = (clientX / window.innerWidth) * 100;
      const yPercent = (clientY / window.innerHeight) * 100;

      // Extract brief description of clicked target
      let desc = '';
      if (target) {
        const text = target.innerText?.trim().slice(0, 45);
        const aria = target.getAttribute('aria-label');
        const title = target.getAttribute('title');
        const placeholder = (target as HTMLInputElement).placeholder;
        const tag = target.tagName.toLowerCase();

        if (aria) desc = aria;
        else if (placeholder) desc = `Input: ${placeholder}`;
        else if (title) desc = title;
        else if (text && text.length > 2) desc = text;
        else desc = `${tag.toUpperCase()} section`;
      }

      setNewCommentPos({
        x: clientX,
        y: clientY,
        xPercent,
        yPercent,
        targetDescription: desc || 'Application Screen',
      });
      setNewCommentText('');
      setAuthorName(currentUser.name);
      setIsAdding(true);
      setEditingCommentId(null);
      setErrorMessage(null);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [currentUser]);

  // Focus textarea when new comment opens
  useEffect(() => {
    if (isAdding && newCommentInputRef.current) {
      setTimeout(() => {
        newCommentInputRef.current?.focus();
      }, 50);
    }
  }, [isAdding]);

  // Focus textarea when editing
  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 50);
    }
  }, [editingCommentId]);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdding(false);
        setEditingCommentId(null);
        if (onClearHighlight) onClearHighlight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearHighlight]);

  const handleSaveNewComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentPos || !newCommentText.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await FirebaseService.addComment({
        content: newCommentText.trim(),
        authorName: authorName.trim() || currentUser.name,
        authorRole: currentUser.role,
        tab: activeTab,
        targetDescription: newCommentPos.targetDescription,
        xPercent: newCommentPos.xPercent,
        yPercent: newCommentPos.yPercent,
      });

      setIsAdding(false);
      setNewCommentText('');
      setNewCommentPos(null);
    } catch (err: any) {
      setErrorMessage('Could not save comment to Firebase. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await FirebaseService.updateComment(commentId, editText.trim());
      setEditingCommentId(null);
      setEditText('');
    } catch (err: any) {
      setErrorMessage('Failed to update comment.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this feedback comment?')) {
      try {
        await FirebaseService.deleteComment(commentId);
        if (hoveredCommentId === commentId) setHoveredCommentId(null);
        if (editingCommentId === commentId) setEditingCommentId(null);
      } catch (err: any) {
        alert('Failed to delete comment from Firebase.');
        console.error(err);
      }
    }
  };

  // Only display balloons that belong to the current activeTab
  const visibleComments = comments.filter(c => c.tab === activeTab);

  // Position adjustment so popup stays inside viewport
  const getPopupStyle = (x: number, y: number) => {
    const width = 310;
    const height = 240;
    let left = x + 10;
    let top = y + 10;

    if (left + width > window.innerWidth - 20) {
      left = Math.max(20, x - width - 10);
    }
    if (top + height > window.innerHeight - 20) {
      top = Math.max(20, y - height - 10);
    }

    return { left: `${left}px`, top: `${top}px` };
  };

  return (
    <>
      {/* Balloon Pin Icons overlay across the screen */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
        {visibleComments.map(comment => {
          const isHovered = hoveredCommentId === comment.id;
          const isHighlighted = highlightedCommentId === comment.id;
          const isEditing = editingCommentId === comment.id;

          return (
            <div
              key={comment.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${comment.xPercent}%`,
                top: `${comment.yPercent}%`,
                transform: 'translate(-50%, -100%)',
              }}
              onMouseEnter={() => !isEditing && setHoveredCommentId(comment.id)}
              onMouseLeave={() => !isEditing && setHoveredCommentId(null)}
            >
              {/* Balloon Pin */}
              <div
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 group ${
                  isHighlighted ? 'scale-125 animate-bounce' : 'hover:scale-115'
                }`}
                onClick={() => {
                  setHoveredCommentId(comment.id);
                  if (isHighlighted && onClearHighlight) onClearHighlight();
                }}
              >
                {/* Balloon Pin Head */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
                    isHighlighted
                      ? 'bg-rose-600 ring-4 ring-rose-300 ring-offset-2'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/30'
                  }`}
                  title={`${comment.authorName}: ${comment.content.slice(0, 40)}...`}
                >
                  <MessageCircle className="w-4 h-4 fill-white text-indigo-700" />
                </div>
                {/* Balloon Tail string */}
                <div className="w-0.5 h-2.5 bg-indigo-500/80 mx-auto -mt-0.5" />

                {/* Pulsing indicator if recently highlighted from Dev module */}
                {isHighlighted && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>

              {/* Hover Tooltip / Detail Card */}
              {(isHovered || isEditing || isHighlighted) && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 p-3.5 z-50 text-xs pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                  onMouseEnter={() => setHoveredCommentId(comment.id)}
                  onMouseLeave={() => !isEditing && setHoveredCommentId(null)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {comment.authorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 truncate block text-[11px]">
                          {comment.authorName}
                        </span>
                        {comment.authorRole && (
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                            {comment.authorRole}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setEditingCommentId(comment.id);
                              setEditText(comment.content);
                            }}
                            title="Edit comment"
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteComment(comment.id);
                            }}
                            title="Delete comment"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Content / Edit Form */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50"
                        placeholder="Edit comment..."
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="px-2 py-1 text-[11px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSaving || !editText.trim()}
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[11px]">
                        {comment.content}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[150px]" title={comment.targetDescription}>
                          📍 {comment.targetDescription || 'Screen target'}
                        </span>
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Arrow pointing down to balloon */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white drop-shadow-xs" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Comment Floating Input Box (Opens at right-click location) */}
      {isAdding && newCommentPos && (
        <div
          className="fixed z-50 dev-comment-box select-none animate-in fade-in zoom-in-95 duration-100"
          style={getPopupStyle(newCommentPos.x, newCommentPos.y)}
        >
          <div className="w-76 sm:w-80 bg-white rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden">
            {/* Box Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquare className="w-4 h-4 shrink-0 text-indigo-200" />
                <span className="font-semibold text-xs tracking-tight truncate">
                  Add Screen Feedback
                </span>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="w-5 h-5 rounded flex items-center justify-center text-indigo-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Target context chip */}
            <div className="px-3.5 pt-2.5 pb-1 bg-indigo-50/60 border-b border-indigo-100 text-[10px] text-indigo-900 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate font-medium">
                Target: {newCommentPos.targetDescription}
              </span>
            </div>

            {/* Box Form */}
            <form onSubmit={handleSaveNewComment} className="p-3.5 space-y-2.5">
              {errorMessage && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px]">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Your Comment / Feedback
                </label>
                <textarea
                  ref={newCommentInputRef}
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Type feedback, suggestions, or bug note here..."
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <UserIcon className="w-2.5 h-2.5" />
                    <span>Your Name</span>
                  </div>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="shrink-0 pt-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !newCommentText.trim()}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {isSaving ? 'Saving...' : 'Pin'}
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center">
                Press Esc to cancel · Comments saved in Firebase
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
