import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle, Calendar, Clock, ChevronDown, Check } from 'lucide-react';
import { ApiClient } from '../api/client';
import { User } from '../types';
import { HospitalLogo } from './Logo';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  isLiveServerMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isLiveServerMode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState<string>('admin');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string; time: string }>({ date: '', time: '' });

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load registered staff accounts
    ApiClient.getUsers().then(u => {
      setUsers(u);
    });

    // Update clock and date
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter users based on username input alone
  const filteredUsers = useMemo(() => {
    if (!username.trim()) return users;
    const clean = username.trim().toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(clean));
  }, [username, users]);

  // Compute autofill suggestion based on typed text
  const autofillSuggestion = useMemo(() => {
    if (!username.trim()) return '';
    const clean = username.trim().toLowerCase();
    const match = users.find(u => u.username.toLowerCase().startsWith(clean));
    if (match && match.username.toLowerCase() !== clean) {
      return match.username.slice(username.trim().length);
    }
    return '';
  }, [username, users]);

  // Full matched user for autofill
  const matchedUser = useMemo(() => {
    if (!username.trim()) return null;
    const clean = username.trim().toLowerCase();
    return users.find(u => u.username.toLowerCase().startsWith(clean)) || null;
  }, [username, users]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  // Immediate PIN authentication handler upon entering 4 digits
  const handlePinChange = async (inputVal: string) => {
    const digits = inputVal.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setErrorMessage('');

    if (digits.length === 4) {
      if (!username.trim()) {
        setErrorMessage('Please enter or select a username');
        triggerShake();
        if (usernameInputRef.current) usernameInputRef.current.focus();
        return;
      }

      setIsLoading(true);
      try {
        const result = await ApiClient.login(username.trim(), digits);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Incorrect PIN. Please try again.');
          triggerShake();
          setPin('');
          if (pinInputRef.current) pinInputRef.current.focus();
        }
      } catch {
        setErrorMessage('Connection error. Please try again.');
        triggerShake();
        setPin('');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle keyboard navigation & Tab autofill completion
  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      if (autofillSuggestion && matchedUser) {
        e.preventDefault();
        setUsername(matchedUser.username);
        setIsDropdownOpen(false);
        if (pinInputRef.current) pinInputRef.current.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex(prev => (prev + 1) % (filteredUsers.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex(prev => (prev - 1 + filteredUsers.length) % (filteredUsers.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && filteredUsers[highlightedIndex]) {
        handleSelectStaff(filteredUsers[highlightedIndex]);
      } else if (autofillSuggestion && matchedUser) {
        setUsername(matchedUser.username);
        setIsDropdownOpen(false);
        if (pinInputRef.current) pinInputRef.current.focus();
      } else {
        setIsDropdownOpen(false);
        if (pinInputRef.current) pinInputRef.current.focus();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectStaff = (selected: User) => {
    setUsername(selected.username);
    setPin('');
    setErrorMessage('');
    setIsDropdownOpen(false);
    if (pinInputRef.current) pinInputRef.current.focus();
  };

  return (
    // Bluish-white background to eliminate glaring bright white
    <div className="h-screen w-screen overflow-hidden bg-[#E1E9F1] flex items-center justify-center p-4 sm:p-6 select-none antialiased">
      {/* Background ambient soothing cool-blue illumination */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      {/* Main Enterprise Sign-In Container */}
      <div
        className={`relative z-10 w-full max-w-3xl max-h-[92vh] bg-[#EEF4F8] rounded-2xl border border-slate-300/80 shadow-2xl overflow-hidden flex flex-col md:flex-row transition-transform duration-150 ${
          isShaking ? 'translate-x-[-6px] animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* Left Clinical Context Panel (Deep Hospital Blue) */}
        <div className="md:w-5/12 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Hospital Brand & Logo with prominent white backing */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-white p-2 flex items-center justify-center border-2 border-white/95 shadow-xl shadow-black/20 shrink-0">
                <HospitalLogo className="w-9 h-9" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                  Abhinavas Eye Care
                </h1>
                <p className="text-[11px] text-sky-300 font-medium tracking-wide">
                  IP Management
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="mt-12 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{currentDateTime.date || 'Today'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 text-sm font-mono mt-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{currentDateTime.time || '--:--:--'}</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Panel (Soft Bluish White Surface) */}
        <div className="md:w-7/12 bg-[#EEF4F8] p-8 md:p-10 flex flex-col justify-between">
          <div className="my-auto">
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-100/80 border border-rose-300/80 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <div className="space-y-5">
              {/* Username Input with Icon alone & ghost autofill & under-input dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative flex items-center">
                  {/* Left Icon Alone */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-30">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>

                  {/* Main Input Field */}
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                      setIsDropdownOpen(true);
                      setHighlightedIndex(0);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleUsernameKeyDown}
                    className="w-full pl-10 pr-10 py-3 text-sm bg-[#DFE8F0] hover:bg-[#D8E3EB] focus:bg-[#FAFBFD] border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600/80 transition-all font-medium text-slate-800 placeholder:text-slate-400 relative z-10"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Username"
                  />

                  {/* Inline Ghost Autofill Suffix (Tab to complete) */}
                  {autofillSuggestion && (
                    <div className="absolute inset-y-0 left-0 pl-10 pr-10 flex items-center pointer-events-none z-20 overflow-hidden">
                      <span className="text-transparent font-medium text-sm whitespace-pre select-none">
                        {username}
                      </span>
                      <span className="text-slate-400 font-medium text-sm whitespace-pre select-none">
                        {autofillSuggestion}
                      </span>
                      <span className="ml-2.5 text-[10px] font-mono font-medium text-slate-600 bg-slate-300/80 px-1.5 py-0.5 rounded border border-slate-400/50 inline-flex items-center gap-1 shadow-xs select-none">
                        <span>Tab</span>
                        <span>⇥</span>
                      </span>
                    </div>
                  )}

                  {/* Dropdown Chevron Button Alone */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Toggle username list"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Minimalist Dropdown: ONLY usernames, NO @, NO full names, NO roles, NO header text */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#F4F8FA] border border-slate-300/90 rounded-xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
                    <div className="divide-y divide-slate-200/70">
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-3 text-center text-xs text-slate-400">
                          No matching username
                        </div>
                      ) : (
                        filteredUsers.map((u, idx) => {
                          const isSelected = u.username.toLowerCase() === username.trim().toLowerCase();
                          const isHighlighted = idx === highlightedIndex;
                          return (
                            <div
                              key={u.id}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onClick={() => handleSelectStaff(u)}
                              className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-sm font-medium ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 font-semibold'
                                  : isHighlighted
                                  ? 'bg-[#E3ECF3] text-slate-900'
                                  : 'hover:bg-[#EAF1F6] text-slate-700'
                              }`}
                            >
                              <span>{u.username}</span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PIN Input with Icon alone (no text label) & immediate 4-digit authentication */}
              <div>
                <div className="relative flex items-center">
                  {/* Left Lock Icon Alone */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-20">
                    <Lock className="w-4.5 h-4.5" />
                  </div>

                  {/* Keyboard-First 4-Digit Input Container */}
                  <input
                    ref={pinInputRef}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={e => handlePinChange(e.target.value)}
                    disabled={isLoading}
                    aria-label="Security PIN"
                    className="w-full pl-10 pr-12 py-3 text-center tracking-[0.75em] text-xl font-mono font-bold bg-[#DFE8F0] hover:bg-[#D8E3EB] focus:bg-[#FAFBFD] border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600/80 transition-all text-slate-800 disabled:opacity-50"
                  />

                  {/* Show/Hide Toggle Button on the right */}
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors z-20 cursor-pointer"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Inline subtle spinner during check */}
                  {isLoading && (
                    <div className="absolute inset-y-0 right-10 flex items-center z-20">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Visual Segmented 4-Digit Indicator */}
                <div className="mt-2.5 flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map(index => {
                    const filled = pin.length > index;
                    return (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                          filled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="mt-8 pt-4 border-t border-slate-300/70 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveServerMode ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
              />
              <span>
                {isLiveServerMode
                  ? 'Connected to Live LAN Backend'
                  : 'Hospital Clinical Workstation · Local Storage'}
              </span>
            </div>
            <span className="font-mono text-slate-400">v2.4-IP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
