
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon, X, ArrowRight, Bookmark } from 'lucide-react';
import { Course } from '../types';

interface CalendarViewProps {
  courses: Course[];
  onClose: () => void;
  isInline?: boolean;
  onCourseSelect?: (course: Course) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ courses, onClose, isInline = false, onCourseSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Paleta de colores distintivos para cursos
  const COURSE_PALETTE = [
    { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', accent: 'bg-emerald-500' },
    { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400', accent: 'bg-blue-500' },
    { border: 'border-indigo-500/50', bg: 'bg-indigo-500/10', text: 'text-indigo-400', accent: 'bg-indigo-500' },
    { border: 'border-rose-500/50', bg: 'bg-rose-500/10', text: 'text-rose-400', accent: 'bg-rose-500' },
    { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400', accent: 'bg-amber-500' },
    { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-400', accent: 'bg-cyan-500' },
    { border: 'border-fuchsia-500/50', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', accent: 'bg-fuchsia-500' },
  ];

  const getEventsForDay = (day: number) => {
    const events: { type: 'assignment' | 'class', title: string, course: string, status?: string, color: typeof COURSE_PALETTE[0], time?: string, courseData: Course }[] = [];
    
    courses.forEach((c, idx) => {
        const courseColor = COURSE_PALETTE[idx % COURSE_PALETTE.length];
        
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const currentDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
        const currentDayName = dayNames[currentDayOfWeek];
        
        // Clases Programadas
        if (c.schedule.includes(currentDayName)) {
             const timeMatch = c.schedule.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i);
             const time = timeMatch ? timeMatch[0] : "09:00 AM";
             
             events.push({ 
                 type: 'class', 
                 title: 'Sesión Académica', 
                 course: c.title, 
                 color: courseColor, 
                 time, 
                 courseData: c 
             });
        }

        // Tareas / Entregas
        c.assignments.forEach(a => {
            if (a.dueDate) {
                const due = new Date(a.dueDate);
                if (due.getDate() === day && due.getMonth() === currentDate.getMonth() && due.getFullYear() === currentDate.getFullYear()) {
                     events.push({ 
                         type: 'assignment', 
                         title: a.title, 
                         course: c.title, 
                         status: a.status, 
                         color: courseColor, 
                         time: '23:59', 
                         courseData: c 
                     });
                }
            }
        });
    });
    return events;
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day: number, events: any[]) => {
      if (events.length > 0) {
          setSelectedDay(day);
          setSelectedDayEvents(events);
      }
  };

  const handleNavigate = (course: Course) => {
      if (onCourseSelect) {
          onCourseSelect(course);
          if (!isInline) onClose();
      }
  };

  const WrapperClass = isInline 
    ? "w-full flex flex-col bg-black rounded-3xl overflow-hidden h-[800px]" 
    : "bg-zinc-950 w-full max-w-6xl h-[85vh] rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden relative";

  return (
    <div className={WrapperClass}>
        {/* Header */}
        <div className={`px-6 md:px-10 py-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 relative z-10`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white capitalize tracking-tight flex items-baseline gap-2">
                        {monthNames[currentDate.getMonth()]} 
                        <span className="text-zinc-700 text-2xl font-medium">{currentDate.getFullYear()}</span>
                    </h2>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1 flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3"/> Agenda Académica Distintiva
                    </p>
                </div>
                
                <div className="flex items-center bg-black border border-zinc-800 rounded-xl p-1.5 shadow-lg">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2 text-xs font-bold text-white hover:bg-zinc-800 rounded-lg transition-colors uppercase tracking-wider border-x border-zinc-900 mx-1">Hoy</button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronRight className="w-5 h-5"/></button>
                </div>
            </div>
            
            {!isInline && (
                <button onClick={onClose} className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors border border-zinc-800">
                    <X className="w-6 h-6"/>
                </button>
            )}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden relative">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-zinc-900 bg-zinc-950/50">
                {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
            
            {/* Days Body */}
            <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto custom-scrollbar">
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-zinc-900/20 border-b border-r border-zinc-900/50 min-h-[120px]"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                    const events = getEventsForDay(day);
                    const hasEvents = events.length > 0;

                    return (
                        <div 
                            key={day} 
                            onClick={() => handleDayClick(day, events)}
                            className={`min-h-[140px] p-3 border-b border-r border-zinc-900/50 relative group transition-all flex flex-col ${
                                isToday ? 'bg-zinc-900/30' : ''
                            } ${hasEvents ? 'cursor-pointer hover:bg-zinc-900/50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-white text-black shadow-lg scale-110' : 'text-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-800'}`}>
                                    {day}
                                </span>
                            </div>
                            
                            <div className="space-y-1.5 flex-1">
                                {events.map((evt, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold truncate flex items-center gap-1.5 ${evt.color.bg} ${evt.color.border} ${evt.color.text} shadow-sm`}
                                    >
                                        <div className={`w-1 h-3 rounded-full ${evt.color.accent} shrink-0`}></div>
                                        <span className="truncate">{evt.course}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Day Detail Overlay */}
            {selectedDay && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex justify-end animate-in slide-in-from-right duration-300 z-20">
                    <div className="w-full md:w-96 bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black">
                            <div>
                                <h3 className="text-2xl font-black text-white">{selectedDay} de {monthNames[currentDate.getMonth()]}</h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{selectedDayEvents.length} eventos para hoy</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-black to-zinc-950">
                             {selectedDayEvents.map((evt, idx) => (
                                 <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                                     {/* Color indicator stripe */}
                                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${evt.color.accent}`}></div>
                                     
                                     <div className="flex items-start justify-between mb-3">
                                         <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${evt.color.bg} ${evt.color.border} ${evt.color.text}`}>
                                             {evt.type === 'class' ? 'Clase' : 'Entrega'}
                                         </span>
                                         <span className="text-zinc-400 font-mono text-xs font-bold">{evt.time}</span>
                                     </div>
                                     
                                     <h4 className="text-white font-bold text-lg mb-1 leading-tight">{evt.title}</h4>
                                     <p className="text-zinc-500 text-sm mb-5 flex items-center gap-2">
                                         <Bookmark className="w-3 h-3"/> {evt.course}
                                     </p>
                                     
                                     <button 
                                        onClick={() => handleNavigate(evt.courseData)}
                                        className="w-full py-3 bg-black border border-zinc-800 hover:bg-white hover:text-black hover:border-white text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all group"
                                     >
                                         Ir al Curso <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>
                                     </button>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default CalendarView;
