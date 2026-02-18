
import React, { useState, useEffect } from 'react';
import { User, Course, UserRole, Assignment, MarketplaceCourse } from '../types';
import { DatabaseService } from '../services/db';
import { Clock, Book, Activity, ArrowUpRight, Calendar, Plus, X, ChevronDown, Loader2, AlertTriangle, Video, ExternalLink, MonitorPlay, Sparkles, ShoppingBag } from 'lucide-react';
import CalendarView from './CalendarView';
import CourseCreator from './CourseCreator';

interface DashboardProps {
  user: User;
  onCourseSelect: (course: Course) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onCourseSelect }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [urgentAssignments, setUrgentAssignments] = useState<{assign: Assignment, course: Course, hoursLeft: number}[]>([]);
  
  // Next Class State
  const [nextClass, setNextClass] = useState<{course: Course, date: Date} | null>(null);
  const [timeToNextClass, setTimeToNextClass] = useState<string>('');

  const loadCourses = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const allCourses = await DatabaseService.getCourses();
        // FILTRADO ROBUSTO: Por ID de instructor o por Email (por si hubo cambios de sesión)
        const filtered = allCourses.filter(c => 
            user.role === UserRole.TEACHER 
            ? (c.instructorId === user.id || c.instructor === user.name)
            : c.students.includes(user.id)
        );
        setCourses(filtered);
        checkUrgency(filtered);
        calculateNextClass(filtered);
      } catch (e) {
          console.error("Error loading courses:", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handlePublishToMarketplace = async (course: Course) => {
      if (!window.confirm("¿Deseas publicar este programa en el Marketplace de QLASE para venderlo externamente?")) return;
      
      const mpData: MarketplaceCourse = {
          id: `mp_sync_${course.id}`,
          title: course.title,
          instructor: course.instructor,
          instructorId: course.instructorId,
          instructorWhatsapp: user.whatsapp || "593987654321",
          price: course.price || 49.99,
          rating: 5,
          students: course.students?.length || 0,
          image: course.image,
          tags: ["Académico", "Sincronizado"],
          category: "Tecnología",
          detailedDescription: course.description,
          modules: course.modules || [],
          objectives: course.objectives || [],
          requirements: course.requirements || [],
          targetAudience: course.targetAudience || "Público General",
          durationInfo: course.durationInfo || course.schedule,
          publishedMonth: new Date().toISOString().slice(0, 7),
          createdAt: Date.now(),
          instructorIsPremium: user.isPremium
      };

      try {
          await DatabaseService.addMarketplaceCourse(mpData);
          alert("¡Publicado en el Marketplace con éxito!");
      } catch (e) {
          console.error("Publish sync error", e);
          alert("Error al sincronizar con Marketplace.");
      }
  };

  // Re-cargar cuando el ID del usuario cambie o el componente se monte
  useEffect(() => {
      loadCourses();
  }, [user.id]);

  useEffect(() => {
      const interval = setInterval(() => {
          if (nextClass) {
              updateCountdown(nextClass.date);
          }
      }, 60000); 
      return () => clearInterval(interval);
  }, [nextClass]);

  const calculateNextClass = (userCourses: Course[]) => {
      let closestClass: {course: Course, date: Date} | null = null;
      const now = new Date();
      const dayMap: Record<string, number> = { 'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6 };

      userCourses.forEach(c => {
          if (c.modality === 'virtual') {
              const dayMatches = c.schedule.match(/(Dom|Lun|Mar|Mie|Jue|Vie|Sab)/g);
              const timeMatch = c.schedule.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i);

              if (dayMatches && timeMatch) {
                  const timeStr = timeMatch[0];
                  const [tTime, tMod] = timeStr.split(' ');
                  let [tHour, tMin] = tTime.split(':').map(Number);
                  if (tMod?.toUpperCase() === 'PM' && tHour < 12) tHour += 12;
                  if (tMod?.toUpperCase() === 'AM' && tHour === 12) tHour = 0;

                  dayMatches.forEach(dayStr => {
                      const targetDay = dayMap[dayStr];
                      const today = now.getDay();
                      let diff = targetDay - today;
                      if (diff === 0) {
                          const classTime = new Date(now);
                          classTime.setHours(tHour, tMin, 0, 0);
                          if (classTime < now) diff = 7;
                      } else if (diff < 0) {
                          diff += 7;
                      }
                      const classDate = new Date(now);
                      classDate.setDate(now.getDate() + diff);
                      classDate.setHours(tHour, tMin, 0, 0);
                      if (!closestClass || classDate < closestClass.date) {
                          closestClass = { course: c, date: classDate };
                      }
                  });
              }
          }
      });
      setNextClass(closestClass);
      if (closestClass) updateCountdown(closestClass.date);
  };

  const updateCountdown = (target: Date) => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
          setTimeToNextClass('¡En curso ahora!');
          return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeToNextClass(`${days}d ${hours % 24}h`);
      } else {
          setTimeToNextClass(`${hours}h ${minutes}m`);
      }
  };

  const checkUrgency = (userCourses: Course[]) => {
      if (user.role !== UserRole.STUDENT) return;
      const urgent: {assign: Assignment, course: Course, hoursLeft: number}[] = [];
      const now = new Date();
      const warningThreshold = 24 * 60 * 60 * 1000;
      userCourses.forEach(c => {
          c.assignments.forEach(a => {
              if (a.dueDate && a.status !== 'submitted' && !a.submissions?.[user.id]) {
                  const due = new Date(a.dueDate);
                  const diff = due.getTime() - now.getTime();
                  if (diff > 0 && diff < warningThreshold) {
                      urgent.push({
                          assign: a,
                          course: c,
                          hoursLeft: Math.ceil(diff / (1000 * 60 * 60))
                      });
                  }
              }
          });
      });
      setUrgentAssignments(urgent);
  };

  const toggleCalendar = () => {
      const newState = !showCalendar;
      setShowCalendar(newState);
      if (newState) {
          setTimeout(() => {
              document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
      }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-10">
      
      {showCreator && (
          <CourseCreator 
            teacherId={user.id}
            teacherName={user.name}
            onClose={() => setShowCreator(false)}
            onCourseCreated={(newCourse) => {
                loadCourses(); 
                setShowCreator(false);
                if (newCourse) {
                    onCourseSelect(newCourse);
                }
            }}
          />
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[3rem] bg-zinc-900 border border-zinc-800 p-8 md:p-12 shadow-2xl group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-[2000ms]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-full tracking-widest shadow-xl">PANEL OFICIAL</span>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Gestión Académica</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
                    Hola, {user.name.split(' ')[0]}
                </h2>
                <p className="text-zinc-400 text-lg md:text-xl max-w-lg font-medium leading-relaxed">
                    {user.role === UserRole.TEACHER 
                        ? `Tienes ${courses.length} cursos bajo tu dirección académica actualmente.` 
                        : `Tienes ${urgentAssignments.length} entregas urgentes pendientes en tus cursos.`}
                </p>
            </div>
            <button 
                onClick={toggleCalendar}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl active:scale-95 border ${showCalendar ? 'bg-white text-black border-white' : 'bg-zinc-950 text-white border-zinc-800 hover:border-zinc-500'}`}
            >
                <Calendar className="w-4 h-4"/> 
                {showCalendar ? 'Ocultar Agenda' : 'Ver Calendario Académico'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${showCalendar ? 'rotate-180' : ''}`}/>
            </button>
        </div>
      </div>
      
      {nextClass && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 md:p-8 flex items-center justify-between gap-6 animate-in slide-in-from-top-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><MonitorPlay className="w-32 h-32 text-emerald-500"/></div>
              <div className="flex items-center gap-6 relative z-10">
                  <div className="p-5 bg-emerald-500 rounded-2xl shadow-2xl shadow-emerald-500/20 animate-pulse text-black">
                      {user.role === UserRole.TEACHER ? <MonitorPlay className="w-8 h-8"/> : <Video className="w-8 h-8"/>}
                  </div>
                  <div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Siguiente Clase en Vivo</p>
                      <h3 className="text-white font-black text-2xl md:text-3xl tracking-tight">{nextClass.course.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium flex items-center gap-3 mt-2">
                         <Clock className="w-4 h-4 text-emerald-500"/> Comienza en <span className="text-white font-black bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">{timeToNextClass}</span>
                      </p>
                  </div>
              </div>
              {nextClass.course.meetingUrl && (
                  <a 
                    href={nextClass.course.meetingUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-white text-black px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl flex items-center gap-3 whitespace-nowrap active:scale-95 relative z-10"
                  >
                      {user.role === UserRole.TEACHER ? 'Iniciar Sesión' : 'Unirse a Clase'} <ExternalLink className="w-4 h-4"/>
                  </a>
              )}
          </div>
      )}

      {urgentAssignments.length > 0 && (
          <div className="bg-red-950/10 border border-red-900/30 p-6 rounded-3xl animate-in slide-in-from-top-4 shadow-lg">
              <h3 className="text-red-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5"/> Prioridad Académica: Entregas Próximas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urgentAssignments.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => onCourseSelect(item.course)}
                        className="bg-black/40 border border-red-900/20 p-4 rounded-2xl flex justify-between items-center group hover:border-red-500/50 transition-all text-left"
                      >
                          <div>
                              <p className="text-white font-black text-sm group-hover:text-red-400 transition-colors">{item.assign.title}</p>
                              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">{item.course.title}</p>
                          </div>
                          <span className="text-[10px] font-black bg-red-600 text-white px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-600/20">
                              {item.hoursLeft}H RESTANTES
                          </span>
                      </button>
                  ))}
              </div>
          </div>
      )}

      <div 
          id="calendar-section"
          className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${showCalendar ? 'max-h-[1200px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}
      >
         <div className="border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
             <CalendarView courses={courses} onClose={() => setShowCalendar(false)} isInline={true} onCourseSelect={onCourseSelect} />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
            onClick={() => document.getElementById('courses-list')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#070707] border border-zinc-900 p-8 rounded-[2.5rem] hover:border-emerald-500/50 transition-all group cursor-pointer hover:shadow-2xl active:scale-[0.98] relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Book className="w-20 h-20 text-emerald-500"/></div>
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-300 group-hover:bg-emerald-500 group-hover:text-black transition-all shadow-xl"><Book className="w-6 h-6"/></div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/30 tracking-widest uppercase">Activos</span>
            </div>
            <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{courses.length}</h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-emerald-500 transition-colors">
                {user.role === UserRole.TEACHER ? 'Clases bajo tu Dirección' : 'Cursos Matriculados'}
            </p>
        </div>
        
        <div 
            className="bg-[#070707] border border-zinc-900 p-8 rounded-[2.5rem] hover:border-blue-500/50 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="w-20 h-20 text-blue-500"/></div>
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-300 group-hover:bg-blue-500 group-hover:text-black transition-all shadow-xl"><Activity className="w-6 h-6"/></div>
                <span className="text-[10px] font-black text-blue-400 bg-blue-950/30 px-3 py-1 rounded-full border border-blue-900/30 tracking-widest uppercase">Global</span>
            </div>
            <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">9.9</h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">Rendimiento Académico</p>
        </div>

        <div className="bg-[#070707] border border-zinc-900 p-8 rounded-[2.5rem] hover:border-amber-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Clock className="w-20 h-20 text-amber-500"/></div>
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-300 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-xl"><Clock className="w-6 h-6"/></div>
                <span className="text-[10px] font-black text-amber-400 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-900/30 tracking-widest uppercase">Racha</span>
            </div>
            <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">12h</h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-amber-500 transition-colors">Dedicación Semanal</p>
        </div>
      </div>

      <div id="courses-list" className="space-y-8 pt-6">
        <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 uppercase">
                {user.role === UserRole.TEACHER ? 'Tus Programas Académicos' : 'Tu Aula Virtual'} 
                <span className="px-4 py-1.5 rounded-full bg-zinc-900 text-zinc-500 text-[10px] font-black border border-zinc-800 tracking-widest">{courses.length} TOTAL</span>
            </h3>
        </div>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse"/>
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Base de Datos...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {user.role === UserRole.TEACHER && (
                    <button 
                        className="group border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 text-zinc-600 hover:text-white transition-all min-h-[280px] hover:bg-zinc-900/30 active:scale-[0.98] shadow-sm hover:shadow-2xl"
                        onClick={() => setShowCreator(true)}
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform border border-zinc-800 shadow-xl group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400">
                            <Plus className="w-10 h-10"/>
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-black uppercase tracking-[0.3em] block mb-2">Crear Nueva Clase</span>
                            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Entorno LMS Dedicado</p>
                        </div>
                    </button>
                )}

                {courses.map(course => (
                    <div 
                        key={course.id} 
                        onClick={() => onCourseSelect(course)}
                        className="group bg-[#070707] border border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-zinc-500 transition-all cursor-pointer flex flex-col hover:shadow-2xl hover:shadow-black/50 overflow-hidden active:scale-[0.99] relative"
                    >
                        <div className="h-48 overflow-hidden relative bg-zinc-900">
                            <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                <span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-white"/> {course.schedule.split(' ')[0]}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-8 flex flex-col flex-1">
                            <h4 className="font-black text-white text-xl mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors tracking-tight">
                                {course.title}
                            </h4>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6 border-l-2 border-zinc-800 pl-3">
                                {course.instructor}
                            </p>
                            
                            <div className="mt-auto pt-6 border-t border-zinc-900/50 flex flex-col gap-3">
                                {user.role === UserRole.TEACHER && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePublishToMarketplace(course); }}
                                        className="w-full py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-black transition-all"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5"/> Vender en Marketplace
                                    </button>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        <MonitorPlay className="w-3.5 h-3.5"/> LMS ACTIVO
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-zinc-700 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {!isLoading && courses.length === 0 && user.role === UserRole.STUDENT && (
                    <div className="col-span-full py-32 text-center bg-zinc-900/10 rounded-[3rem] border border-zinc-900 border-dashed">
                         <Book className="w-20 h-20 text-zinc-900 mx-auto mb-6 opacity-20"/>
                         <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">No estás matriculado en ningún curso actualmente</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
