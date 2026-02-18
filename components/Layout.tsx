
import React, { useState, useEffect } from 'react';
import { User, UserRole, Course, Notification } from '../types';
import { APP_BRAND } from '../constants';
import { DatabaseService } from '../services/db';
import { 
  LayoutDashboard, 
  Languages, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  Users,
  Menu,
  X,
  ShoppingBag,
  GraduationCap,
  FileText,
  Trash2,
  AlertTriangle,
  UserCircle,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Zap,
  Check,
  Crown,
  Info,
  DollarSign,
  Clock,
  HardDrive,
  GraduationCap as AcademyIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  onNavigateToCourse?: (course: Course) => void; 
}

const SUPER_ADMIN_EMAILS = ['deoc29@me.com', 'vaoc93@hotmail.com'];

const Layout: React.FC<LayoutProps> = ({ children, user: initialUser, currentView, onChangeView, onLogout, onNavigateToCourse }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Reloj institucional
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuchar cambios reales en el usuario (almacenamiento, créditos, etc.)
  useEffect(() => {
      const unsubscribe = DatabaseService.subscribeToUser(initialUser.id, (updatedUser) => {
          setUser(updatedUser);
      });
      return () => unsubscribe();
  }, [initialUser.id]);

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
  const isStudent = user.role === UserRole.STUDENT;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  useEffect(() => {
      const unsubscribe = DatabaseService.subscribeToNotifications(user.id, (notifs) => {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
      });
      return () => unsubscribe();
  }, [user.id]);

  const handleDeleteAccount = async () => {
      await DatabaseService.deleteAccount(user.id);
      onLogout();
  };

  const handleNotificationClick = async (notif: Notification) => {
      await DatabaseService.markNotificationRead(notif.id);
      setShowNotifs(false);
      if (notif.actionLink && onNavigateToCourse) {
          const course = await DatabaseService.getCourseById(notif.actionLink);
          if (course) onNavigateToCourse(course);
          else onChangeView('dashboard');
      }
  };

  const navItems = [
    { id: 'dashboard', label: 'Gestión de Clases', icon: AcademyIcon, role: 'all' },
    { id: 'messages', label: 'Mensajes Directos', icon: MessageSquare, role: 'all' },
    { id: 'profile', label: 'Mi Perfil Académico', icon: UserCircle, role: 'all' },
    { id: 'research', label: 'Centro de Investigación', icon: FileText, role: 'all' },
    { id: 'marketplace', label: isStudent ? 'Cursos Disponibles' : 'Vende tu Curso', icon: ShoppingBag, role: 'all' },
    { id: 'students_manage', label: 'QLASE LMS Admin', icon: Users, role: 'superadmin' },
    { id: 'languages', label: 'Idiomas QLASE', icon: Languages, role: 'all' },
    { id: 'settings', label: 'Configuración', icon: Settings, role: 'all' },
  ];

  const filteredNavItems = navItems.filter(item => {
      if (item.role === 'all') return true;
      if (item.role === 'superadmin') return isSuperAdmin;
      return item.role === user.role;
  });

  const storageLimit = user.isPremium ? 50 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024;
  const storagePercentage = Math.min(((user.storageUsed || 0) / storageLimit) * 100, 100);
  const storageUsedGB = ((user.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2);
  const storageLimitGB = (storageLimit / (1024 * 1024 * 1024)).toFixed(0);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-out transform ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8">
          <div className="flex items-center gap-4 pb-8 border-b border-zinc-900">
             <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-900 flex items-center justify-center p-0 border border-zinc-800 shadow-xl">
                    <img src={APP_BRAND.logo} alt="QLASE" className="h-full w-full object-cover"/>
                 </div>
                 <div>
                     <span className="font-black text-xl tracking-tighter block leading-none text-white">QLASE</span>
                     <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em] block mt-1">{APP_BRAND.subtitle}</span>
                 </div>
             </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-8 md:hidden p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4 mt-2 opacity-50">Plataforma Educativa</p>
          {filteredNavItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => onChangeView(item.id)} 
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[11px] font-bold transition-all duration-200 group relative overflow-hidden uppercase tracking-wider ${currentView === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}
            >
              <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
              {currentView === item.id && <div className="absolute right-4 w-1 h-1 bg-white rounded-full"></div>}
            </button>
          ))}
          
          <div 
            onClick={() => setShowPremiumModal(true)}
            className="mt-6 mx-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/50 flex items-center gap-3 relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-all shadow-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg group-hover:animate-pulse shrink-0"><Crown className="w-4 h-4 text-black" /></div>
            <div className="flex-1">
                <h4 className="text-white font-black text-[10px] uppercase tracking-tight">{isStudent ? 'Ser Docente' : 'QLASE Pro'}</h4>
                <p className="text-[9px] text-zinc-500 font-bold">Ventas ilimitadas</p>
            </div>
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-emerald-500/5 to-transparent"></div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-900">
          <div onClick={() => onChangeView('profile')} className="flex items-center gap-3.5 mb-4 p-2.5 rounded-xl hover:bg-zinc-900/50 transition-colors cursor-pointer group">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-zinc-800 group-hover:border-zinc-600 transition-colors object-cover" />
            <div className="overflow-hidden">
              <p className="text-[12px] font-black text-white truncate">{user.name}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1">{user.role === UserRole.TEACHER ? 'Docente' : 'Alumno'}<span className="w-1 h-1 rounded-full bg-emerald-500"></span></p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onLogout} className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-[9px] font-black uppercase py-2.5 transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-lg"><LogOut className="w-3 h-3" /> Salir</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 text-zinc-500 hover:text-red-400 text-[9px] font-black uppercase py-2.5 transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-lg"><Trash2 className="w-3 h-3" /> Borrar</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <header className="bg-black/60 backdrop-blur-xl border-b border-zinc-800 h-24 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">{navItems.find(i => i.id === currentView)?.label || 'Panel'}</h1>
          </div>
          <div className="flex items-center gap-6">
            
            {/* Monitor de Almacenamiento Global */}
            <div className="hidden lg:flex flex-col gap-1.5 w-48 mr-4">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em]">
                    <span className="text-zinc-600 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5 text-emerald-500"/> Nube Académica</span>
                    <span className={storagePercentage > 85 ? 'text-red-500' : 'text-zinc-400'}>{storageUsedGB} / {storageLimitGB} GB</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                    <div className={`h-full transition-all duration-1000 ${storagePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} style={{width: `${storagePercentage}%`}}></div>
                </div>
            </div>

            {/* Reloj y Créditos IA */}
            <div className="flex items-center gap-4 border-l border-zinc-900 pl-6 h-10">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-300 font-mono text-[11px] shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-black">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className="text-white font-black text-[11px] tracking-widest">{user.aiCredits || 0}</span>
                </div>

                {/* Botón Mejorar a PRO (Solo si no es PRO) */}
                {!user.isPremium && (
                    <button 
                        onClick={() => setShowPremiumModal(true)} 
                        className="hidden md:flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-black transition-all shadow-lg active:scale-95 animate-in fade-in slide-in-from-right-4 duration-1000"
                    >
                        <Crown className="w-3 h-3 text-amber-600"/> Subir a PRO
                    </button>
                )}
            </div>

            <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className={`relative p-2.5 rounded-xl transition-colors border ${showNotifs ? 'bg-zinc-800 border-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent hover:border-zinc-800'}`}>
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg border border-black animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </button>
                {showNotifs && (
                    <div className="absolute top-full right-0 mt-4 w-80 max-h-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-zinc-900 bg-black flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notificaciones Académicas</span>
                            <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-zinc-600 hover:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell className="w-8 h-8 text-zinc-900 mx-auto mb-4 opacity-50"/>
                                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Sin notificaciones</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <button 
                                        key={notif.id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full p-4 text-left border-b border-zinc-900 hover:bg-zinc-900 transition-colors relative ${!notif.read ? 'bg-emerald-600/5' : ''}`}
                                    >
                                        {!notif.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full"></div>}
                                        <div className="flex flex-col gap-1">
                                            <p className="text-white font-bold text-[11px] uppercase tracking-tight">{notif.title}</p>
                                            <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">{notif.message}</p>
                                            <span className="text-[9px] text-zinc-700 font-black mt-1 uppercase">{notif.date}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0 custom-scrollbar"><div className="max-w-[1400px] mx-auto min-h-full pb-20 md:pb-0">{children}</div></div>
      </main>

      {showPremiumModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl p-8 md:p-12 animate-in zoom-in duration-300 relative overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <button onClick={() => setShowPremiumModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full transition-all z-[110]"><X className="w-5 h-5"/></button>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 mb-4">
                            <HardDrive className="w-2.5 h-2.5"/> 50GB DISPONIBLES EN PRO
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Eleva tu Potencial</h2>
                        <p className="text-zinc-500 max-w-xl mx-auto text-sm font-medium">Amplía tu almacenamiento para materiales, grabaciones y entregas de alumnos sin límites.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/40 border border-zinc-900 p-8 rounded-3xl flex flex-col h-full opacity-60">
                            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Plan Gratis</h3>
                            <div className="text-4xl font-black text-white mb-8">$0<span className="text-xs text-zinc-600 font-bold ml-1">/SIEMPRE</span></div>
                            <ul className="space-y-4 mb-10 flex-1 text-xs font-bold text-zinc-400">
                                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-600"/> 1GB ALMACENAMIENTO CLOUD</li>
                                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-600"/> 1 CURSO AL MES EN TIENDA</li>
                                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-600"/> 0% COMISIÓN POR VENTA</li>
                            </ul>
                            <div className="w-full py-4 bg-zinc-800 text-zinc-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-center">Plan Actual</div>
                        </div>
                        <div className="bg-emerald-500 p-0.5 rounded-3xl h-full shadow-2xl">
                            <div className="bg-zinc-950 h-full w-full rounded-[1.7rem] p-8 flex flex-col">
                                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">QLASE PRO</h3>
                                <div className="text-5xl font-black text-white mb-8">$6<span className="text-xs text-zinc-600 font-bold ml-1">/MES</span></div>
                                <ul className="space-y-4 mb-10 flex-1 text-xs font-black text-zinc-200">
                                    <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500"/> 50GB ALMACENAMIENTO CLOUD</li>
                                    <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500"/> IA QLASE CORE ILIMITADA</li>
                                    <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500"/> HUB DE INVESTIGACIÓN FULL</li>
                                </ul>
                                <button className="w-full py-4 bg-emerald-500 text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all">Mejorar Ahora</button>
                            </div>
                        </div>
                    </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Layout;
