
import React, { useState, useEffect } from 'react';
import { MarketplaceCourse, User } from '../types';
import { DatabaseService } from '../services/db';
import { 
    AlertCircle,
    CheckCircle, 
    Clock, 
    Globe, 
    Linkedin, 
    Award, 
    Info, 
    Share2, 
    BookOpen, 
    Target, 
    ShieldCheck, 
    FileText,
    Zap,
    ArrowRight,
    Users,
    Mail,
    ChevronRight,
    Book
} from 'lucide-react';
import { APP_BRAND } from '../constants';

interface PublicMarketplaceCourseViewProps {
    id: string;
}

const PublicMarketplaceCourseView: React.FC<PublicMarketplaceCourseViewProps> = ({ id }) => {
    const [course, setCourse] = useState<MarketplaceCourse | null>(null);
    const [instructor, setInstructor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const c = await DatabaseService.getMarketplaceCourseById(id);
                if (c) {
                    setCourse(c);
                    const inst = await DatabaseService.getUserById(c.instructorId);
                    setInstructor(inst);
                }
            } catch (e) {
                console.error("Error loading public academic site:", e);
            } finally {
                setLoading(false);
                window.scrollTo(0, 0);
            }
        };
        loadData();
    }, [id]);

    const handleWhatsApp = () => {
        if (!course) return;
        const phone = (course.instructorWhatsapp || "593987654321").replace(/\D/g, '');
        const msg = encodeURIComponent(`Hola ${course.instructor}, he revisado el brochure académico de "${course.title}" en QLASE y deseo iniciar mi proceso de inscripción. ¿Me podría indicar los pasos?`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                    <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse"/>
                </div>
                <div className="text-center">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Entorno Académico QLASE</p>
                    <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest animate-pulse">Generando Programa Oficial...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6 text-center">
                <div className="p-6 bg-red-500/10 rounded-full mb-8 border border-red-500/20">
                    <AlertCircle className="w-16 h-16 text-red-500"/>
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Programa no disponible</h1>
                <p className="text-zinc-500 max-w-sm mb-10 text-lg font-medium">El brochure solicitado ha sido archivado o el enlace ha caducado.</p>
                <button onClick={() => window.location.href = window.location.origin} className="px-12 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95">
                    Volver al Portal QLASE
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
            
            {/* NAVEGACIÓN INSTITUCIONAL */}
            <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-3xl border-b border-zinc-900 px-6 md:px-16 py-6 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center">
                        <img src={APP_BRAND.logo} alt="QLASE" className="h-full w-full object-cover scale-125"/>
                    </div>
                    <div>
                        <span className="font-black text-xl tracking-tighter block leading-none text-white uppercase">QLASE Academy</span>
                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-1 block">Oficina de Registro Académico</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Enlace compartido copiado.");
                        }}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-white border border-zinc-800 hidden sm:flex"
                    >
                        <Share2 className="w-5 h-5"/>
                    </button>
                    <button onClick={handleWhatsApp} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 border border-white">
                        Inscribirse al Programa
                    </button>
                </div>
            </nav>

            {/* HERO ACADÉMICO */}
            <header className="relative pt-48 pb-32 px-6 md:px-16 border-b border-zinc-900 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-12 animate-in slide-in-from-left duration-1000">
                        <div className="inline-flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 px-6 py-2.5 rounded-full backdrop-blur-md">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Programa Académico Oficial 2024</span>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.85] text-white uppercase">
                            {course.title}
                        </h1>
                        
                        <p className="text-zinc-400 text-xl md:text-3xl font-medium leading-relaxed max-w-3xl border-l-8 border-emerald-500 pl-10">
                            {course.detailedDescription || "Un programa intensivo de alto impacto diseñado para el dominio técnico y la especialización profesional."}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-6">
                            <div className="space-y-2">
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Dedicación</p>
                                <p className="text-white font-bold text-2xl flex items-center gap-3"><Clock className="w-6 h-6 text-emerald-500"/> {course.durationInfo || '40h'}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Certificación</p>
                                <p className="text-white font-bold text-2xl flex items-center gap-3"><Award className="w-6 h-6 text-emerald-500"/> Oficial</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Idioma</p>
                                <p className="text-white font-bold text-2xl flex items-center gap-3"><Globe className="w-6 h-6 text-emerald-500"/> Español</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nivel</p>
                                <p className="text-white font-bold text-2xl flex items-center gap-3"><Zap className="w-6 h-6 text-emerald-500"/> Experto</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 animate-in zoom-in duration-1000 delay-200">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-[4rem] blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-[2000ms] opacity-50"></div>
                            <div className="relative bg-zinc-900 border border-zinc-800 p-2.5 rounded-[4.5rem] shadow-[0_0_80px_-10px_rgba(0,0,0,1)]">
                                <div className="aspect-[4/5] rounded-[4rem] overflow-hidden bg-black relative border border-white/5">
                                    <img src={course.image} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[4000ms]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                    <div className="absolute bottom-16 left-10 right-10">
                                        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl shadow-emerald-500/5">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Arancel del Programa</p>
                                            <div className="flex items-baseline gap-3 mb-8">
                                                <span className="text-7xl font-black text-white tracking-tighter">${course.price}</span>
                                                <span className="text-zinc-500 font-bold text-lg">USD</span>
                                            </div>
                                            <button onClick={handleWhatsApp} className="w-full bg-emerald-500 text-black py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-400 transition-all shadow-2xl active:scale-95 group/btn">
                                                Inscribirme Ahora <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENIDO ACADÉMICO */}
            <main className="max-w-7xl mx-auto px-6 md:px-16 py-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 xl:gap-32">
                    
                    <div className="lg:col-span-8 space-y-32">
                        
                        {/* PERFIL DE EGRESO */}
                        <section className="space-y-16 animate-in slide-in-from-bottom-10 duration-700">
                            <div className="space-y-6">
                                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Perfil de Egreso <span className="text-emerald-500">.</span></h2>
                                <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-2xl">Resultados de aprendizaje garantizados al finalizar el programa.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(course.objectives || ["Dominio de herramientas técnicas avanzadas", "Desarrollo de pensamiento crítico aplicado", "Implementación de estrategias de alto nivel", "Liderazgo en gestión de proyectos"]).map((obj, i) => (
                                    <div key={i} className="flex gap-8 bg-zinc-900/40 p-10 rounded-[3rem] border border-zinc-900 group hover:border-emerald-500/30 transition-all shadow-sm">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                            <CheckCircle className="w-7 h-7 text-emerald-500 group-hover:text-black"/>
                                        </div>
                                        <p className="text-zinc-300 font-bold text-lg leading-snug group-hover:text-white transition-colors">{obj}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* PENSUM (Módulos Dinámicos) */}
                        <section className="space-y-16">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Estructura Curricular</h2>
                                <span className="text-zinc-700 font-black text-[10px] uppercase tracking-widest mb-2">Plan de Estudios Oficial</span>
                            </div>
                            <div className="space-y-6">
                                {course.modules && course.modules.length > 0 ? (
                                    course.modules.map((mod, i) => (
                                        <div key={i} className="flex items-center gap-10 p-10 bg-zinc-900/20 border border-zinc-900 rounded-[3rem] group hover:bg-zinc-900/50 transition-all">
                                            <span className="text-6xl font-black text-zinc-800 group-hover:text-emerald-500/20 transition-colors duration-500">{i + 1 < 10 ? `0${i+1}` : i+1}</span>
                                            <div className="flex-1">
                                                <h4 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">{mod.title}</h4>
                                                <p className="text-zinc-500 text-base font-medium leading-relaxed">{mod.description}</p>
                                            </div>
                                            <div className="hidden md:flex w-16 h-16 bg-zinc-950 rounded-2xl items-center justify-center text-zinc-700 border border-zinc-900 group-hover:border-zinc-700 transition-all">
                                                <FileText className="w-6 h-6"/>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    [
                                        { title: "Módulo I: Fundamentación Estratégica", desc: "Introducción a los conceptos base y marcos metodológicos del área." },
                                        { title: "Módulo II: Desarrollo de Capacidades Técnicas", desc: "Laboratorios prácticos y uso de herramientas profesionales de vanguardia." },
                                        { title: "Módulo III: Proyecto de Aplicación Profesional", desc: "Integración de conocimientos para la resolución de un reto real." },
                                        { title: "Módulo de Certificación QLASE", desc: "Examen final de competencias y entrega del diploma académico." }
                                    ].map((mod, i) => (
                                        <div key={i} className="flex items-center gap-10 p-10 bg-zinc-900/20 border border-zinc-900 rounded-[3rem] group hover:bg-zinc-900/50 transition-all">
                                            <span className="text-6xl font-black text-zinc-800 group-hover:text-emerald-500/20 transition-colors duration-500">0{i+1}</span>
                                            <div className="flex-1">
                                                <h4 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">{mod.title}</h4>
                                                <p className="text-zinc-500 text-base font-medium leading-relaxed">{mod.desc}</p>
                                            </div>
                                            <div className="hidden md:flex w-16 h-16 bg-zinc-950 rounded-2xl items-center justify-center text-zinc-700 border border-zinc-900 group-hover:border-zinc-700 transition-all">
                                                <FileText className="w-6 h-6"/>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* METODOLOGÍA */}
                        <section className="bg-emerald-500/5 border border-emerald-500/10 p-16 rounded-[4rem] space-y-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><BookOpen className="w-40 h-40 text-emerald-500"/></div>
                            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-6 relative z-10">
                                <Book className="w-12 h-12 text-emerald-500"/> Modelo Educativo QLASE
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                                <div className="space-y-4">
                                    <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Síncrona</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">Clases en vivo con interacción directa docente-estudiante vía QLASE Live Rooms.</p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Ubicuidad</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">Acceso 24/7 a materiales, grabaciones y lecturas de apoyo desde cualquier dispositivo.</p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Praxis</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">Evaluación basada en la resolución de casos reales y proyectos prácticos supervisados.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: DOCENTE Y ADMISIÓN */}
                    <div className="lg:col-span-4 space-y-16">
                        
                        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[3.5rem] p-12 space-y-10 sticky top-40 shadow-2xl backdrop-blur-xl">
                            <div className="flex flex-col items-center text-center space-y-8">
                                <div className="relative group/avatar">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl group-hover/avatar:bg-emerald-500/40 transition-all"></div>
                                    <img src={instructor?.avatar || 'https://ui-avatars.com/api/?name=Director&background=random'} className="w-40 h-40 rounded-full border-4 border-zinc-800 shadow-2xl object-cover relative z-10" />
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-full border-4 border-zinc-900 shadow-xl z-20"><ShieldCheck className="w-6 h-6 text-black"/></div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">Director Académico</p>
                                    <h3 className="text-3xl font-black text-white tracking-tighter">{course.instructor}</h3>
                                    <p className="text-zinc-500 text-base font-bold uppercase tracking-widest">{instructor?.title || "Experto Académico Certificado"}</p>
                                </div>
                                <p className="text-zinc-400 text-base leading-relaxed font-medium italic">
                                    "{instructor?.bio || "Docente senior con enfoque en el desarrollo de competencias de alto rendimiento para el mercado global."}"
                                </p>
                                <div className="flex gap-4 w-full pt-6">
                                    {instructor?.socialProfiles?.linkedIn && (
                                        <a href={instructor.socialProfiles.linkedIn} target="_blank" className="flex-1 py-4 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500"><Linkedin className="w-6 h-6"/></a>
                                    )}
                                    <a href={`mailto:${instructor?.email}`} className="flex-1 py-4 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500 text-[10px] font-black uppercase tracking-widest">Contactar</a>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-zinc-800 space-y-8">
                                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-4"><Target className="w-5 h-5"/> Admisión Directa</h4>
                                <ul className="space-y-6">
                                    <li className="flex items-center gap-5 text-base font-bold text-zinc-400 hover:text-zinc-200 transition-colors"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Pago Directo al Catedrático</li>
                                    <li className="flex items-center gap-5 text-base font-bold text-zinc-400 hover:text-zinc-200 transition-colors"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Sin Intermediarios Bancarios</li>
                                    <li className="flex items-center gap-5 text-base font-bold text-zinc-400 hover:text-zinc-200 transition-colors"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Soporte de QLASE Academy</li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* CERTIFICACIÓN */}
            <section className="bg-zinc-950 py-48 px-6 md:px-16 border-t border-zinc-900 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[150px] translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="max-w-5xl mx-auto text-center space-y-16 relative z-10">
                    <div className="relative inline-block">
                        <Award className="w-32 h-32 text-emerald-500 mx-auto mb-10 animate-bounce-slow relative z-10"/>
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">Acreditación Académica <br/> <span className="text-emerald-500">Verificable</span></h2>
                    <p className="text-zinc-500 text-2xl font-medium leading-relaxed max-w-3xl mx-auto">
                        Al completar los requerimientos satisfactoriamente, se emitirá una credencial digital con validez internacional alojada en el ecosistema GO | Academic Suite.
                    </p>
                    <div className="flex flex-wrap gap-6 justify-center pt-10">
                        <div className="px-10 py-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-4 backdrop-blur-md"><ShieldCheck className="w-5 h-5 text-emerald-500"/> Registro QLASE</div>
                        <div className="px-10 py-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-4 backdrop-blur-md"><Globe className="w-5 h-5 text-emerald-500"/> Validez Profesional</div>
                        <div className="px-10 py-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-4 backdrop-blur-md"><Zap className="w-5 h-5 text-emerald-500"/> Entrega Inmediata</div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-black border-t border-zinc-900 py-32 px-6 md:px-16 text-center">
                <div className="max-w-6xl mx-auto space-y-10 opacity-30">
                    <div className="flex items-center justify-center gap-6">
                        <img src={APP_BRAND.logo} className="h-12 w-12 rounded-full" />
                        <span className="font-black text-3xl tracking-tighter text-white">QLASE ACADEMY</span>
                    </div>
                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-[0.5em]">Red de Formación Profesional Superior • © 2024</p>
                </div>
            </footer>

            {/* MOBILE ACTION BAR */}
            <div className="fixed bottom-0 w-full lg:hidden bg-black/90 backdrop-blur-3xl border-t border-zinc-800 p-8 z-[60] flex items-center justify-between shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.8)]">
                <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-1">Inversión Total</p>
                    <p className="text-3xl font-black text-white tracking-tighter">${course.price} <span className="text-zinc-600 text-xs font-bold uppercase">USD</span></p>
                </div>
                <button onClick={handleWhatsApp} className="bg-emerald-500 text-black px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 border border-emerald-400">
                    Inscribirse
                </button>
            </div>
        </div>
    );
};

export default PublicMarketplaceCourseView;
