
import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/db';
import { Course, Diploma } from '../types';
import { Download, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { APP_BRAND } from '../constants';

interface PublicDiplomaViewProps {
    id: string;
}

const PublicDiplomaView: React.FC<PublicDiplomaViewProps> = ({ id }) => {
    const [data, setData] = useState<{diploma: Diploma, course: Course} | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const result = await DatabaseService.getDiplomaById(id);
            setData(result);
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

    if (!data) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <ShieldCheck className="w-16 h-16 text-zinc-600 mb-4"/>
                <h1 className="text-2xl font-bold mb-2">Certificado No Encontrado</h1>
                <p className="text-zinc-500">El enlace puede haber expirado o no es válido.</p>
            </div>
        );
    }

    const { diploma, course } = data;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center px-4 py-12">
            
            {/* Header Logo */}
            <div className="mb-12">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-full overflow-hidden flex items-center justify-center shadow-2xl border-2 border-zinc-800 bg-black">
                    <img src={APP_BRAND.logo} alt="GO Logo" className="h-full w-full object-cover scale-[1.4]" />
                </div>
            </div>

            {/* Satisfactory Completion Message - MANDATORY */}
            <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center gap-3 bg-emerald-950/30 border border-emerald-900/50 px-6 py-3 rounded-full mb-4 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
                    <CheckCircle className="w-5 h-5 text-emerald-400"/> 
                    <span className="text-emerald-400 text-sm font-bold uppercase tracking-wide">Curso Completado Satisfactoriamente</span>
                </div>
                <h2 className="text-zinc-400 text-sm font-medium max-w-md mx-auto leading-relaxed">
                    Se confirma oficialmente que el estudiante ha superado todos los requisitos académicos del programa.
                </h2>
            </div>

            {/* Diploma Content */}
            <div className="bg-white text-black rounded-xl overflow-hidden shadow-2xl animate-in zoom-in duration-500 relative w-full max-w-3xl border-8 border-zinc-900">
                {/* Minimalist Decor */}
                <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900"></div>

                <div className="p-10 md:p-20 text-center relative z-10">
                    {course.institutionLogo && (
                        <img src={course.institutionLogo} alt="Institution" className="h-20 md:h-24 mx-auto mb-10 object-contain" />
                    )}

                    <div className="mb-10">
                        <h2 className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-[0.4em] mb-6">Diploma de Certificación</h2>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-zinc-900 mb-6 tracking-tight">{diploma.studentName}</h1>
                        <div className="w-16 h-1 bg-zinc-900 mx-auto mb-6"></div>
                        <p className="text-zinc-600 text-base md:text-lg font-medium max-w-lg mx-auto">
                            Ha completado satisfactoriamente el curso:
                        </p>
                    </div>

                    <div className="mb-16">
                            <h3 className="text-3xl md:text-4xl font-bold text-black mb-3">{course.title}</h3>
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Impartido por {course.instructor}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-end gap-8 pt-8 border-t-2 border-zinc-100">
                        <div className="text-left">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Fecha</p>
                            <p className="text-zinc-900 font-bold font-mono text-lg">{diploma.issueDate}</p>
                        </div>
                            <div className="text-right">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Credencial ID</p>
                            <p className="text-zinc-900 font-bold font-mono text-xs tracking-widest">{diploma.id}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Action - Only Download */}
                <div className="bg-zinc-50 px-8 py-6 border-t border-zinc-200 flex justify-center items-center">
                    <a 
                        href={diploma.fileUrl} 
                        download={`${diploma.studentName}-diploma.pdf`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg uppercase tracking-widest"
                    >
                        <Download className="w-4 h-4"/> Descargar Archivo Original
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PublicDiplomaView;
