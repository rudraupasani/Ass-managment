"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    Download,
    Trash2,
    CloudUpload,
    Loader2,
    Search,
    Filter,
    X,
    FileCode,
    BookOpen,
    ClipboardList,
    ChevronRight,
    Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const CATEGORIES = [
    { id: 'all', label: 'All Resources', icon: FileText },
    { id: 'material', label: 'Material', icon: BookOpen },
    { id: 'question-bank', label: 'Question Bank', icon: ClipboardList },
    { id: 'assignment', label: 'Assignment', icon: FileCode },
];

export default function Home() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [uploadCategory, setUploadCategory] = useState('material');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminPasscode, setAdminPasscode] = useState('');
    const [pendingAction, setPendingAction] = useState(null);

    useEffect(() => {
        const adminStatus = localStorage.getItem('is_admin') === 'true';
        setIsAdmin(adminStatus);
        fetchFiles();
    }, []);

    const handleAdminLogin = () => {
        if (adminPasscode === 'Rudra309030') {
            setIsAdmin(true);
            localStorage.setItem('is_admin', 'true');
            setShowAdminModal(false);
            setAdminPasscode('');

            // Execute the action that triggered the modal
            if (pendingAction === 'upload') {
                setShowUploadModal(true);
            } else if (pendingAction?.type === 'delete') {
                deleteFile(pendingAction.fileName);
            }
            setPendingAction(null);
        } else {
            alert('Incorrect passcode!');
        }
    };

    const handleAdminLogout = () => {
        setIsAdmin(false);
        localStorage.removeItem('is_admin');
    };

    const triggerAdminAction = (action) => {
        if (isAdmin) {
            if (action === 'upload') setShowUploadModal(true);
            else if (action.type === 'delete') deleteFile(action.fileName);
        } else {
            setPendingAction(action);
            setShowAdminModal(true);
        }
    };

    async function fetchFiles() {
        try {
            setLoading(true);
            const { data, error } = await supabase.storage.from('materials').list('uploads', {
                sortBy: { column: 'created_at', order: 'desc' },
            });
            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error fetching files:', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function uploadFile(event) {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            // Store category in filename prefix for easy filtering without metadata
            const fileName = `${uploadCategory}:::${Date.now()}_${file.name}`;
            const filePath = `uploads/${fileName}`;

            const { error } = await supabase.storage.from('materials').upload(filePath, file);

            if (error) throw error;

            await fetchFiles();
            setShowUploadModal(false);
        } catch (error) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
    }

    async function deleteFile(fileName) {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            const { error } = await supabase.storage.from('materials').remove([`uploads/${fileName}`]);
            if (error) throw error;
            await fetchFiles();
        } catch (error) {
            alert('Error deleting file: ' + error.message);
        }
    }

    const getPublicUrl = (fileName) => {
        const { data } = supabase.storage.from('materials').getPublicUrl(`uploads/${fileName}`);
        return data.publicUrl;
    };

    const filteredFiles = useMemo(() => {
        return files.filter(file => {
            const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Extract category from filename prefix
            const fileCategory = file.name.includes(':::') ? file.name.split(':::')[0] : 'all';
            const matchesCategory = selectedCategory === 'all' || fileCategory === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [files, searchQuery, selectedCategory]);

    const getFileInfo = (fileName) => {
        const parts = fileName.split(':::');
        const hasCategory = parts.length > 1;
        const categoryId = hasCategory ? parts[0] : 'all';
        const rawName = hasCategory ? parts[1] : parts[0];
        const displayName = rawName.includes('_') ? rawName.split('_').slice(1).join('_') : rawName;

        const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

        return { displayName, category };
    };

    return (
        <main className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-x-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(2,6,23,1)_100%)]" />
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation / Header */}
            <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tight bg-linear-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent font-bold">
                                Material Hub
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <button
                                onClick={handleAdminLogout}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                            >
                                Admin Mode
                                <span className="ml-2 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </button>
                        )}
                        <button
                            onClick={() => triggerAdminAction('upload')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>Share Item</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by subject, code, or title..."
                            className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-slate-200 placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                    selectedCategory === cat.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <cat.icon size={14} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Content */}
                <div className="space-y-16">
                    {/* Latest Uploaded Section */}
                    {!loading && files.length > 0 && searchQuery === '' && selectedCategory === 'all' && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Plus className="text-blue-400" size={20} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight uppercase tracking-widest text-white/80">Latest Arrivals</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {files.slice(0, 3).map((file, index) => {
                                        const { displayName, category } = getFileInfo(file.name);
                                        return (
                                            <motion.div
                                                key={`latest-${file.name}`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="group relative bg-linear-to-br from-blue-600/10 via-white/5 to-transparent p-6 rounded-4xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
                                            >
                                                <div className="absolute inset-0 bg-blue-500/5 rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                                                            <category.icon size={28} className="text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 shadow-sm">
                                                                {category.label}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Newest</span>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-xl text-white line-clamp-2 mb-3 group-hover:text-blue-100 transition-colors">
                                                        {displayName}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                                        <span className="text-xs font-medium text-slate-500">{new Date(file.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <a
                                                            href={getPublicUrl(file.name)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-full text-xs font-bold transition-all duration-300 border border-blue-500/20 hover:border-blue-500"
                                                        >
                                                            Open File
                                                        </a>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {/* All Materials Section */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-white/80">
                                    Browse Materials
                                    <span className="text-[10px] font-black text-blue-400 px-3 py-1 bg-blue-400/10 rounded-full border border-blue-400/20 uppercase tracking-widest">
                                        {filteredFiles.length} Items found
                                    </span>
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-colors shadow-inner">
                                    <Filter size={18} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Scanning Database...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredFiles.map((file, index) => {
                                        const { displayName, category } = getFileInfo(file.name);
                                        return (
                                            <motion.div
                                                key={file.name}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: index * 0.05
                                                }}
                                                className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.05] hover:border-blue-500/30 transition-all duration-700 p-8 flex flex-col gap-8 hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.15)] ring-1 ring-white/5"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="p-4 bg-white/5 rounded-3xl group-hover:bg-blue-500/10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 border border-white/5 shadow-inner">
                                                        <category.icon size={26} className="text-slate-400 group-hover:text-blue-400" />
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                                        <button
                                                            onClick={() => triggerAdminAction({ type: 'delete', fileName: file.name })}
                                                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="font-black text-xl text-slate-100 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                                                        {displayName}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                            {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                        <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" />
                                                        <span className="text-blue-400/80">{category.label}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                                                    <div className="flex -space-x-3">
                                                        {[1, 2, 3].map((i) => (
                                                            <div key={i} className="w-10 h-10 rounded-full border-4 border-[#020617] bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 overflow-hidden ring-1 ring-white/10 shadow-2xl">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${file.name + i}`} alt="user" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        <div className="w-10 h-10 rounded-full border-4 border-[#020617] bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shadow-2xl ring-1 ring-blue-400/40">
                                                            +12
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={getPublicUrl(file.name)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-3 text-blue-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all group/link bg-blue-500/10 hover:bg-blue-600 px-6 py-3 rounded-2xl border border-blue-500/20 hover:border-blue-500"
                                                    >
                                                        Access Vault
                                                        <ChevronRight size={18} className="group-hover/link:translate-x-1.5 transition-transform" />
                                                    </a>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}

                        {!loading && filteredFiles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/10 space-y-6">
                                <div className="p-8 bg-white/5 rounded-full ring-1 ring-white/10">
                                    <Search size={48} className="text-slate-700" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No encrypted data found</p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-blue-500 hover:text-blue-400 font-bold text-xs uppercase tracking-tighter transition-colors"
                                    >
                                        Deactivate Search Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        <p>© {new Date().getFullYear()} Material Hub </p>
                        <div className="flex gap-10">
                            {!isAdmin && (
                                <button onClick={() => setShowAdminModal(true)} className="hover:text-blue-400 transition-colors">Admin Terminal</button>
                            )}
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Manifesto</a>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUploadModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 p-8 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-600 via-purple-600 to-emerald-600" />

                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">Resource Injection</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Contribute to the collective intelligence.</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 text-center">Material Class</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setUploadCategory(cat.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-500 group",
                                                uploadCategory === cat.id
                                                    ? "bg-blue-600 text-white border-blue-400 shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] scale-105"
                                                    : "bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.08] hover:border-white/10"
                                            )}
                                        >
                                            <cat.icon size={20} className={cn("transition-all duration-500", uploadCategory === cat.id ? "text-white scale-110" : "text-slate-600 group-hover:text-slate-400")} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block p-10 border-4 border-dashed border-white/5 hover:border-blue-500/40 rounded-[2rem] transition-all duration-700 group cursor-pointer bg-white/[0.02] hover:bg-blue-500/[0.05] relative overflow-hidden">
                                    <input type="file" className="hidden" onChange={uploadFile} />
                                    <div className="flex flex-col items-center gap-4 relative z-10">
                                        <div className="p-6 bg-blue-500/10 rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ring-4 ring-blue-500/5 shadow-xl">
                                            {uploading ? <Loader2 className="animate-spin text-blue-400" size={32} /> : <CloudUpload size={40} className="text-blue-400" />}
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-[0.2em] text-[10px]">{uploading ? "Broadcasting..." : "Synchronize locally"}</p>
                                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">MAX: 50MB</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-center gap-3 px-6 py-3 bg-white/[0.02] rounded-2xl border border-white/5 text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">
                                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    Core Link: Stable
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Admin Passcode Modal */}
            < AnimatePresence >
                {showAdminModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowAdminModal(false);
                                setPendingAction(null);
                            }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-md bg-[#0a0f1e] border-2 border-white/10 p-12 rounded-[4rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 via-purple-600 to-emerald-600" />

                            <div className="text-center space-y-6">
                                <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center ring-2 ring-blue-500/20 mb-8 group shadow-2xl">
                                    <Trash2 size={40} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Security Required</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                                    Authorized personal only. <br /> enter credential to unlock terminal.
                                </p>
                            </div>

                            <div className="space-y-6 mt-12">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-2">Access Passcode</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={adminPasscode}
                                        onChange={(e) => setAdminPasscode(e.target.value)}
                                        className="w-full bg-white/[0.03] border-2 border-white/5 rounded-3xl px-8 py-6 text-white text-center text-3xl font-black tracking-[0.6em] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800 placeholder:tracking-normal shadow-inner"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleAdminLogin}
                                    className="w-full bg-linear-to-br from-blue-600 via-blue-500 to-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white font-black uppercase tracking-[0.3em] py-6 rounded-3xl transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] text-sm border-t border-white/20"
                                >
                                    Verify Identity
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setPendingAction(null);
                                    }}
                                    className="w-full text-slate-700 hover:text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] transition-colors py-2"
                                >
                                    Terminate Request
                                </button>
                            </div>

                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl opacity-50" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </main >
    );
}
