
import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/db';
import { Publication } from '../types';
import { Download, ExternalLink, Loader2, Book, Tag, User as UserIcon, Calendar } from 'lucide-react';
import { APP_BRAND } from '../constants';

interface PublicPublicationViewProps {
    id: string;
}

const PublicPublicationView: React.FC<PublicPublicationViewProps> = ({ id }) => {
    const [pub, setPub] = useState<Publication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const result = await DatabaseService.getPublicationById(id);
            setPub(result);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin"/>
            </div>
        );
    }

    if (!pub) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <Book className="w-16 h-16 text-zinc-600 mb-4"/>
                <h1 className="text-2xl font-bold mb-2">Investigación No Encontrada</h1>
                <p className="text-zinc-500">Este documento puede haber sido removido o el enlace es incorrecto.</p>
                <a href="/" className="mt-8 px-6 py-2 bg-white text-black rounded-lg font-bold">Ir a GO Suite</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center py-12 px-4 md:px-10">
            
            {/* Logo GO Header */}
            <div className="mb-12 flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-zinc-800 bg-black shadow-2xl flex items-center justify-center">
                    <img src={APP_BRAND.logo} alt="GO Logo" className="h-full w-full object-cover scale-[1.4]" />
                </div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">GO Research Public Link</span>
            </div>

            <main className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Visual Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
                
                <div className="p-8 md:p-16">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${pub.type === 'Paper' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' : 'bg-purple-950/30 text-purple-400 border-purple-900/50'}`}>
                            {pub.type}
                        </span>
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                            <Calendar className="w-3 h-3"/> {pub.date}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter leading-tight">
                        {pub.title}
                    </h1>

                    <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 mb-10 group transition-all hover:border-zinc-700">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 font-black">
                            {pub.author.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Autor de Investigación</p>
                            <h3 className="text-white font-bold text-lg">{pub.author}</h3>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Book className="w-4 h-4"/> Resumen Académico
                        </h4>
                        <p className="text-zinc-300 text-base md:text-lg leading-relaxed font-medium">
                            {pub.abstract}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-12">
                        {pub.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 px-4 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-zinc-400 font-bold uppercase tracking-wider">
                                <Tag className="w-3 h-3"/> {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-zinc-900">
                        <a 
                            href={pub.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-3 bg-white text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                        >
                            <Download className="w-5 h-5"/> Ver / Descargar Investigación
                        </a>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="px-8 py-5 border border-zinc-800 bg-zinc-950 text-zinc-400 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:text-white hover:border-zinc-600 transition-all"
                        >
                            Unirse a GO Suite
                        </button>
                    </div>
                </div>
                
                <div className="p-6 bg-zinc-900/30 border-t border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">Red Académica GO • 2024 • Acceso Global Libre</p>
                </div>
            </main>
        </div>
    );
};

export default PublicPublicationView;
