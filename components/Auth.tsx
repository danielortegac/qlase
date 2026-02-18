
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { DatabaseService } from '../services/db';
import { APP_BRAND } from '../constants';
import { Lock, ArrowRight, User as UserIcon, Mail, ShieldCheck, Globe, Loader2, GraduationCap, School, ArrowLeft, Check, AlertTriangle, Sparkles, HelpCircle, BookOpen, Zap, Target, BarChart, Rocket, Info, X } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
      setSelectedRole(role);
      setError('');
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setIsRegistering(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
        if (!selectedRole) throw new Error("Rol no seleccionado.");

        let user;
        if (isRegistering) {
            if (!name || !cleanEmail || !password || !confirmPassword) {
                throw new Error("Todos los campos son obligatorios.");
            }
            if (password.length < 6) {
                throw new Error("La contraseña debe tener al menos 6 caracteres.");
            }
            if (password !== confirmPassword) {
                throw new Error("Las contraseñas no coinciden.");
            }
            user = await DatabaseService.registerUser(cleanEmail, password, name, selectedRole);
        } else {
            if (!cleanEmail || !password) {
                throw new Error("Ingresa tu correo y contraseña.");
            }
            user = await DatabaseService.loginUser(cleanEmail, password);
            if (user.role !== selectedRole && user.role !== 'admin') {
                 throw new Error(`Esta cuenta no está registrada como ${selectedRole === 'teacher' ? 'Docente' : 'Estudiante'}.`);
            }
        }
        onLogin(user);
    } catch (err: any) {
        let errorMessage = err.message || "Error de autenticación.";
        if (errorMessage.includes('auth/invalid-credential')) errorMessage = "Credenciales incorrectas.";
        setError(errorMessage);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row font-sans text-white overflow-x-hidden">
        
        {/* Brand Section (Left) */}
        <div className="w-full md:w-5/12 bg-zinc-900 p-6 md:p-16 flex flex-col items-center md:items-start justify-between relative overflow-hidden shrink-0 border-b md:border-b-0 border-zinc-800">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center md:items-start w-full">
                {/* LOGO CIRCULAR - NO WHITE BOX */}
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-zinc-800 mb-8 shadow-2xl bg-zinc-950 flex items-center justify-center p-0">
                    <img src={APP_BRAND.logo} alt="QLASE" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-2 text-white">
                        QLASE
                    </h1>
                    {/* GESTION ACADEMICA EN UNA SOLA FILA */}
                    <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 mb-8 whitespace-nowrap uppercase tracking-[0.2em]">
                        GESTION ACADEMICA
                    </h2>
                    <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-sm font-medium mb-10 text-center md:text-left">
                        La suite tecnológica definitiva para la gestión de aprendizaje, investigación y monetización de conocimiento profesional.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button 
                            onClick={() => setShowHowItWorks(true)}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            <HelpCircle className="w-5 h-5" />
                            ¿CÓMO FUNCIONA QLASE?
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-12 hidden md:grid grid-cols-2 gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Seguridad Cifrada</div>
                <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500"/> Acceso Global</div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-500"/> IA QLASE Core</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500"/> 0% Comisiones</div>
            </div>
        </div>

        {/* Form Section (Right) */}
        <div className="w-full md:w-7/12 flex items-center justify-center p-6 md:p-12 bg-black relative flex-1">
            <div className="max-w-md w-full">
                
                {!selectedRole ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-4xl font-black text-white mb-2">Empezar Ahora</h2>
                            <p className="text-zinc-500 font-medium">Selecciona tu perfil académico para acceder a la suite.</p>
                        </div>

                        <div className="grid gap-5">
                            <button 
                                onClick={() => handleRoleSelect(UserRole.STUDENT)}
                                className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-emerald-500 transition-all text-left hover:bg-zinc-800 active:scale-[0.98] shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-4 bg-black rounded-2xl border border-zinc-800 text-white group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                        <GraduationCap className="w-10 h-10" />
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-zinc-700 group-hover:text-emerald-500 transition-all"/>
                                </div>
                                <h3 className="text-3xl font-black text-white">Soy Estudiante</h3>
                                <p className="text-sm text-zinc-500 mt-2 font-medium">Accede a tus cursos, tareas, calificaciones y tutoría IA 24/7.</p>
                            </button>

                            <button 
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-emerald-500 transition-all text-left hover:bg-zinc-800 active:scale-[0.98] shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-4 bg-black rounded-2xl border border-zinc-800 text-white group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                        <School className="w-10 h-10" />
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-zinc-700 group-hover:text-emerald-500 transition-all"/>
                                </div>
                                <h3 className="text-3xl font-black text-white">Soy Docente</h3>
                                <p className="text-sm text-zinc-500 mt-2 font-medium">Gestiona clases, sube cursos, califica con IA y monetiza tu talento.</p>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <button 
                            onClick={() => setSelectedRole(null)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver a perfiles
                        </button>

                        <div className="mb-8">
                            <h2 className="text-4xl font-black text-white mb-2">
                                {isRegistering ? 'Crear Perfil' : 'Ingresar'}
                            </h2>
                            <p className="text-zinc-500 flex items-center gap-2 font-medium">
                                Acceso para <span className="text-white font-black capitalize bg-emerald-600 px-3 py-1 rounded-full text-[10px] tracking-widest">{selectedRole === 'teacher' ? 'Docente' : 'Estudiante'}</span>
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-400 font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegistering && (
                                <div>
                                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-bold"
                                            placeholder="Tu nombre aquí"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-bold"
                                        placeholder="correo@ejemplo.com" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {isRegistering && (
                                <div>
                                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-bold"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-white text-black font-black text-xs py-5 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 mt-6 shadow-xl active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRegistering ? <Rocket className="w-4 h-4"/> : <ArrowRight className="w-4 h-4"/>)}
                                {isLoading ? 'Procesando...' : (isRegistering ? 'Crear mi Cuenta QLASE' : 'Entrar a QLASE')}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-zinc-500 text-sm font-medium">
                                {isRegistering ? '¿Ya tienes perfil?' : '¿Aún no tienes perfil?'}
                                <button 
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="ml-2 text-white font-black hover:underline"
                                >
                                    {isRegistering ? 'Entrar ahora' : 'Regístrate aquí'}
                                </button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* HOW IT WORKS MODAL - TRADUCIDO Y A DETALLE */}
        {showHowItWorks && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <button 
                        onClick={() => setShowHowItWorks(false)}
                        className="absolute top-8 right-8 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="p-8 md:p-16 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-6">
                                <Info className="w-3 h-3"/> Guía Completa QLASE
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">Bienvenido a QLASE</h2>
                            <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-3xl mx-auto">La plataforma académica impulsada por IA diseñada para transformar la educación y la investigación global.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LMS Detalle */}
                            <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 hover:border-emerald-500/50 transition-all group">
                                <div className="p-4 bg-emerald-500 text-black w-fit rounded-3xl mb-8 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-10 h-10"/>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4">Gestión Académica (LMS)</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">
                                    Sube cursos, organiza materiales didácticos, asigna tareas y gestiona grabaciones de clases. Los docentes pueden inscribir alumnos masivamente y generar enlaces de Google Meet automáticos.
                                </p>
                            </div>

                            {/* IA Core Detalle */}
                            <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 hover:border-blue-500/50 transition-all group">
                                <div className="p-4 bg-blue-500 text-white w-fit rounded-3xl mb-8 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-10 h-10"/>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4">QLASE IA Core</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">
                                    Nuestra IA genera rúbricas de calificación profesionales basadas en tus sílabos. Además, ofrece un tutor avanzado 24/7 que asiste a los estudiantes en dudas académicas y gramática de idiomas.
                                </p>
                            </div>

                            {/* Investigación Detalle */}
                            <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 hover:border-purple-500/50 transition-all group">
                                <div className="p-4 bg-purple-500 text-white w-fit rounded-3xl mb-8 shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                    <Target className="w-10 h-10"/>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4">Centro de Investigación</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">
                                    Un repositorio global para publicar Tesis, Papers y Artículos. Cada publicación cuenta con un enlace público único para que el mundo conozca tus hallazgos académicos.
                                </p>
                            </div>

                            {/* Marketplace Detalle */}
                            <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 hover:border-amber-500/50 transition-all group">
                                <div className="p-4 bg-amber-500 text-black w-fit rounded-3xl mb-8 shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                    <Zap className="w-10 h-10"/>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4">Tienda de Habilidades</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">
                                    Vende tus propios cursos y monetiza tu conocimiento. QLASE es la única suite que cobra 0% comisiones. Recibe tus pagos directamente vía WhatsApp o Link de Pago externo.
                                </p>
                            </div>
                        </div>

                        <div className="mt-16 bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/20 p-12 rounded-[3rem] text-center">
                            <h3 className="text-3xl font-black text-white mb-4">¿Estás listo para dar el siguiente paso?</h3>
                            <p className="text-zinc-400 mb-10 max-w-2xl mx-auto font-medium">Únete a miles de académicos y profesionales que ya están usando QLASE para elevar su nivel educativo.</p>
                            <button 
                                onClick={() => setShowHowItWorks(false)}
                                className="bg-white text-black px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
                            >
                                EMPEZAR AHORA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Auth;
