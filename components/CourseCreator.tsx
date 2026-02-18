
import React, { useState, useRef, useEffect } from 'react';
/* Added ChevronRight and Plus to the imports */
import { Upload, Users, Save, X, BookOpen, Calendar, Clock, Loader2, CheckCircle, ArrowRight, ArrowLeft, Video, MapPin, Link as LinkIcon, AlertTriangle, Image, Sparkles, ListChecks, Zap, Trash2, List, ChevronRight, Plus } from 'lucide-react';
import { DatabaseService } from '../services/db';
import { Course, RubricItem, User, CourseModule } from '../types';
import { generateCourseRubric, generateAIDescription } from '../services/geminiService';
import { AI_COSTS } from '../constants';

interface CourseCreatorProps {
  onClose: () => void;
  onCourseCreated: (course?: Course) => void; 
  teacherId: string;
  teacherName: string;
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ onClose, onCourseCreated, teacherId, teacherName }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [creationStatus, setCreationStatus] = useState(''); 
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentListRaw, setStudentListRaw] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Advanced Academic Data
  const [objectives, setObjectives] = useState('');
  const [requirements, setRequirements] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [rubric, setRubric] = useState<RubricItem[]>([]);

  // Modality Data
  const [modality, setModality] = useState<'virtual' | 'in-person'>('virtual');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);
  
  const [campus, setCampus] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');

  // Schedule Logic
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  
  const days = [
      { id: 'Lun', label: 'L' },
      { id: 'Mar', label: 'M' },
      { id: 'Mie', label: 'M' },
      { id: 'Jue', label: 'J' },
      { id: 'Vie', label: 'V' },
      { id: 'Sab', label: 'S' },
      { id: 'Dom', label: 'D' },
  ];

  useEffect(() => {
      loadUserData();
  }, []);

  const loadUserData = async () => {
      const u = await DatabaseService.getUserById(teacherId);
      setCurrentUser(u);
  };

  const isScheduleSet = selectedDays.length > 0 && !!startTime && !!endTime;

  const toggleDay = (dayId: string) => {
      if (selectedDays.includes(dayId)) {
          setSelectedDays(selectedDays.filter(d => d !== dayId));
      } else {
          setSelectedDays([...selectedDays, dayId]);
      }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setLogoFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogoPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const addModule = () => setModules([...modules, { title: '', description: '' }]);
  const removeModule = (index: number) => setModules(modules.filter((_, i) => i !== index));
  const updateModule = (index: number, field: keyof CourseModule, value: string) => {
      const updated = [...modules];
      updated[index][field] = value;
      setModules(updated);
  };

  const addRubricItem = () => setRubric([...rubric, { criteria: '', description: '', points: 25 }]);
  const removeRubricItem = (index: number) => setRubric(rubric.filter((_, i) => i !== index));
  const updateRubricItem = (index: number, field: keyof RubricItem, value: any) => {
      const updated = [...rubric];
      updated[index] = { ...updated[index], [field]: value };
      setRubric(updated);
  };

  const useDefaultRubricTemplate = () => {
    setRubric([
      { criteria: "Asistencia y Participación", description: "Participación activa en foros y sesiones en vivo.", points: 15 },
      { criteria: "Trabajos Prácticos", description: "Ejecución técnica de las tareas semanales.", points: 25 },
      { criteria: "Examen Parcial", description: "Evaluación teórica de los primeros módulos.", points: 25 },
      { criteria: "Proyecto Integrador Final", description: "Aplicación global de conocimientos en un reto real.", points: 35 }
    ]);
  };

  const handleAIAutoFill = async () => {
      const currentCredits = currentUser?.aiCredits ?? 0;
      if (currentCredits < AI_COSTS.COURSE_GENERATION) {
          alert("Créditos insuficientes. Usando plantilla de rúbrica estándar.");
          useDefaultRubricTemplate();
          return;
      }

      if (!title) {
          alert("Ingresa un tema o título.");
          return;
      }

      setIsGeneratingWithAI(true);
      try {
          const aiData = await generateAIDescription(title);
          const aiRubric = await generateCourseRubric(title, aiData.description);
          if (aiData) {
              setTitle(aiData.title);
              setDescription(aiData.description);
              setModules(aiData.modules);
              setObjectives(aiData.objectives.join('\n'));
              setRequirements(aiData.requirements.join('\n'));
              setTargetAudience(aiData.targetAudience);
              setRubric(aiRubric);
              
              await DatabaseService.deductCredits(teacherId, AI_COSTS.COURSE_GENERATION);
              await loadUserData();
          }
      } catch (e) {
          console.error("AI Course Generation failed", e);
          useDefaultRubricTemplate();
      } finally {
          setIsGeneratingWithAI(false);
      }
  };

  const formatTime = (timeStr: string) => {
      const [hour, minute] = timeStr.split(':');
      const hourInt = parseInt(hour);
      const ampm = hourInt >= 12 ? 'PM' : 'AM';
      const hour12 = hourInt % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
  };

  const generateMeetLink = () => {
      if (!isScheduleSet) return;
      setIsGeneratingMeet(true);
      setTimeout(() => {
          const chars = 'abcdefghijklmnopqrstuvwxyz';
          const r = () => Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
          setMeetingUrl(`https://meet.google.com/${r()}-${r()}-${r()}`);
          setIsGeneratingMeet(false);
      }, 1000);
  };
  
  const handleSubmit = async () => {
    if (!title || !description || selectedDays.length === 0) return;
    setIsLoading(true);
    setCreationStatus('saving');

    const daysStr = selectedDays.join(', ');
    const finalSchedule = `${daysStr} ${formatTime(startTime)} - ${formatTime(endTime)}`;

    try {
        const coursePayload: Omit<Course, 'id'> = {
            title,
            description,
            schedule: finalSchedule,
            startDate,
            endDate,
            instructor: teacherName,
            instructorId: teacherId,
            students: [], 
            assignments: [],
            materials: [],
            recordings: [],
            image: `https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2000&auto=format&fit=crop`,
            modality,
            meetingUrl: modality === 'virtual' ? meetingUrl : undefined,
            locationDetails: modality === 'in-person' ? { campus, building, room } : undefined,
            institutionLogo: logoPreview || undefined,
            rubric: rubric.length > 0 ? rubric : undefined,
            modules,
            objectives: objectives.split('\n').filter(o => o.trim()),
            requirements: requirements.split('\n').filter(r => r.trim()),
            targetAudience,
            durationInfo: `${selectedDays.length} días por semana`,
            createdAt: Date.now()
        };
        
        const newCourseId = await DatabaseService.createCourse(coursePayload); 

        if (newCourseId && studentListRaw.trim()) {
            const lines = studentListRaw.split('\n').filter(n => n.trim().length > 0);
            await DatabaseService.batchAddStudentsToCourse(newCourseId, lines);
        }

        setCreationStatus('done');
        setSuccessMsg("Clase oficial configurada con Pensum y Rúbrica IA.");
        
        const newCourse = await DatabaseService.getCourseById(newCourseId);
        setTimeout(() => {
            if (newCourse) onCourseCreated(newCourse);
            else onCourseCreated(); 
        }, 1500);

    } catch (error) {
        console.error("Error creating class:", error);
        setIsLoading(false);
        setCreationStatus('');
    }
  };

  if (successMsg || isLoading) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
            <div className="bg-zinc-950 p-10 rounded-3xl border border-zinc-800 text-center animate-in zoom-in duration-300 max-w-md w-full">
                {successMsg ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20"><CheckCircle className="w-10 h-10 text-black" /></div>
                        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">¡Éxito!</h2>
                        <p className="text-zinc-400 mb-4">{successMsg}</p>
                    </>
                ) : (
                    <>
                        <div className="relative w-20 h-20 mx-auto mb-6">
                             <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                             <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                             <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse"/>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Configurando Entorno QLASE...</h2>
                        <p className="text-zinc-500 text-xs">Sincronizando sílabo, módulos y base de datos académica.</p>
                    </>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 w-full max-w-4xl rounded-[3rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-zinc-900 flex justify-between items-start bg-zinc-950 sticky top-0 z-10">
             <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Configurar Programa LMS</h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
                    <span className={`px-3 py-1 rounded-full transition-all ${step === 1 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600'}`}>1. Sílabo</span>
                    <ChevronRight className="w-3 h-3 text-zinc-800"/>
                    <span className={`px-3 py-1 rounded-full transition-all ${step === 2 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600'}`}>2. Pensum y Rúbrica</span>
                    <ChevronRight className="w-3 h-3 text-zinc-800"/>
                    <span className={`px-3 py-1 rounded-full transition-all ${step === 3 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600'}`}>3. Estudiantes</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">IA QLASE</span>
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1"><Zap className="w-3 h-3"/> {currentUser?.aiCredits ?? 0}</span>
                </div>
                <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button>
            </div>
        </div>

        {/* Body */}
        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar bg-[#050505]">
            {step === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título del Curso / Especialización</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-bold focus:border-white focus:outline-none" placeholder="Ej. Arquitectura Sostenible v2.0"/>
                        </div>
                        <button onClick={handleAIAutoFill} disabled={isGeneratingWithAI} className="h-14 bg-blue-600/10 border border-blue-600/20 text-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                            {isGeneratingWithAI ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Generar Programa con IA
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Logo Institución (PNG)</label>
                            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-all">Subir Logo</button>
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/png" onChange={handleLogoChange} />
                                {logoPreview && (
                                    <div className="h-10 w-10 bg-white rounded-lg p-1 overflow-hidden border border-zinc-800">
                                        <img src={logoPreview} className="h-full w-full object-contain" alt="Logo Preview"/>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fecha Inicio</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-bold focus:border-white focus:outline-none"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fecha Fin</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-bold focus:border-white focus:outline-none"/>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descripción y Metodología</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm h-32 resize-none" placeholder="Describe los alcances académicos..."/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Objetivos de Aprendizaje</label>
                            <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm h-32 resize-none" placeholder="Un objetivo por línea..."/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Días de Clase</label>
                            <div className="flex gap-2">
                                {days.map(d => (
                                    <button key={d.id} onClick={() => toggleDay(d.id)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all border ${selectedDays.includes(d.id) ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>{d.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hora Inicio</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-bold"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hora Fin</label>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-bold"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modalidad Académica</label>
                            <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                                <button onClick={() => setModality('virtual')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${modality === 'virtual' ? 'bg-white text-black' : 'text-zinc-600'}`}>Virtual</button>
                                <button onClick={() => setModality('in-person')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${modality === 'in-person' ? 'bg-white text-black' : 'text-zinc-600'}`}>Presencial</button>
                            </div>
                        </div>
                        {modality === 'virtual' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sala Live (Link)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-xs text-blue-400 font-mono" placeholder="https://meet.google.com/..."/>
                                    <button onClick={generateMeetLink} disabled={!isScheduleSet} className="p-4 bg-zinc-800 rounded-2xl text-white hover:bg-zinc-700 disabled:opacity-30"><Video className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Edificio</label><input type="text" value={building} onChange={(e) => setBuilding(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-xs"/></div>
                                <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Aula</label><input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-xs"/></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-12 animate-in slide-in-from-right duration-300">
                    {/* Modules Section */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2"><List className="w-4 h-4"/> Pensum Académico (Módulos)</h3>
                            <button onClick={addModule} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"><Plus className="w-3 h-3"/> Nuevo Módulo</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {modules.map((mod, idx) => (
                                <div key={idx} className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800 relative group">
                                    <button onClick={() => removeModule(idx)} className="absolute top-4 right-4 text-zinc-700 hover:text-red-500"><X className="w-4 h-4"/></button>
                                    <input value={mod.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} className="w-full bg-transparent border-b border-zinc-800 py-1 text-white font-black text-sm mb-4 focus:outline-none" placeholder="Nombre del Módulo"/>
                                    <textarea value={mod.description} onChange={(e) => updateModule(idx, 'description', e.target.value)} className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-zinc-400 text-xs h-20 resize-none" placeholder="Contenidos mínimos..."/>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Rubric Section */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2"><ListChecks className="w-4 h-4"/> Rúbrica de Evaluación del Curso</h3>
                            <div className="flex gap-2">
                              {rubric.length === 0 && (
                                <button onClick={useDefaultRubricTemplate} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">Usar Plantilla</button>
                              )}
                              <button onClick={addRubricItem} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"><Plus className="w-3 h-3"/> Añadir Criterio</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {rubric.map((item, idx) => (
                                <div key={idx} className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <input value={item.criteria} onChange={(e) => updateRubricItem(idx, 'criteria', e.target.value)} className="bg-transparent border-b border-zinc-800 py-1 text-white font-bold text-sm focus:outline-none w-2/3" placeholder="Ej: Proyecto Final"/>
                                        <input type="number" value={item.points} onChange={(e) => updateRubricItem(idx, 'points', parseInt(e.target.value))} className="bg-black border border-zinc-800 rounded-lg p-2 text-emerald-500 font-black text-xs w-14 text-center"/>
                                    </div>
                                    <textarea value={item.description} onChange={(e) => updateRubricItem(idx, 'description', e.target.value)} className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-zinc-500 text-xs h-16 resize-none" placeholder="Definición del criterio..."/>
                                </div>
                            ))}
                        </div>
                        <div className="text-center py-4 bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-800 text-[10px] font-black uppercase text-zinc-500">
                            Puntaje Total del Curso: <span className={rubric.reduce((s, i) => s + i.points, 0) === 100 ? 'text-emerald-500' : 'text-amber-500'}>{rubric.reduce((s, i) => s + i.points, 0)}/100</span>
                        </div>
                    </section>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                     <div className="p-8 bg-emerald-600/5 border border-emerald-500/10 rounded-[2.5rem] flex gap-6 items-center">
                        <Users className="w-12 h-12 text-emerald-500 shrink-0"/>
                        <div>
                            <h4 className="text-white font-black text-lg uppercase tracking-tighter">Matriculación Global</h4>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Pega la lista de correos. Si el alumno no existe, se creará una invitación automática.</p>
                        </div>
                     </div>
                     <textarea value={studentListRaw} onChange={(e) => setStudentListRaw(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-white font-mono text-sm h-64 focus:border-white focus:outline-none leading-loose" placeholder={`estudiante1@univ.edu\nestudiante2@univ.edu\n...`}/>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center sticky bottom-0 z-10">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><ArrowLeft className="w-4 h-4"/> Atrás</button>
            ) : <div></div>}

            {step < 3 ? (
                <button onClick={() => setStep(step + 1)} disabled={!title || !description || selectedDays.length === 0} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 disabled:opacity-30">Siguiente Fase <ArrowRight className="w-4 h-4"/></button>
            ) : (
                <button onClick={handleSubmit} disabled={isLoading} className="px-12 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Finalizar Creación
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
