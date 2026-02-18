
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, MarketplaceCourse, BankAccount, CourseModule, Course, RubricItem } from '../types';
import { DatabaseService } from '../services/db';
import { generateAIDescription, generateCourseRubric } from '../services/geminiService';
import { AI_COSTS } from '../constants';
import { DollarSign, Plus, Check, Loader2, X, ArrowRight, Tag, Image as ImageIcon, MessageCircle, Edit3, Landmark as BankIcon, Globe, CreditCard, Share2, Info, User as UserIcon, ExternalLink, Zap, ShieldCheck, Sparkles, Filter, ChevronRight, Copy, Trash2, Upload, List, Layout, Save, Settings, ListChecks } from 'lucide-react';

interface MarketplaceProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const CATEGORIES = ["Tecnología", "Negocios", "Idiomas", "Marketing", "Desarrollo Personal", "Ciencia", "Arte", "Otros"];

const Marketplace: React.FC<MarketplaceProps> = ({ user, onUpdateUser }) => {
  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'creator'>('browse');
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState<MarketplaceCourse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MarketplaceCourse | null>(null);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState<User | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');

  // Imagen Portada
  const [imageSource, setImageSource] = useState<'link' | 'file'>('link');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario nuevo curso
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [newCourseImage, setNewCourseImage] = useState('');
  const [newCourseTags, setNewCourseTags] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState(CATEGORIES[0]);
  const [newCoursePaymentLink, setNewCoursePaymentLink] = useState('');
  const [newCourseAllowBank, setNewCourseAllowBank] = useState(true);
  const [newCourseAllowCard, setNewCourseAllowCard] = useState(false);
  
  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Datos Recaudo
  const [newCourseBankName, setNewCourseBankName] = useState(user.bankAccount?.bankName || '');
  const [newCourseAccNumber, setNewCourseAccNumber] = useState(user.bankAccount?.accountNumber || '');
  const [newCourseAccType, setNewCourseAccType] = useState<'ahorros' | 'corriente'>(user.bankAccount?.accountType || 'ahorros');

  const [newCourseCustomUrl, setNewCourseCustomUrl] = useState('');
  const [newCourseDetailedDesc, setNewCourseDetailedDesc] = useState('');
  const [newCourseObjectives, setNewCourseObjectives] = useState('');
  const [newCourseRequirements, setNewCourseRequirements] = useState('');
  const [newCourseTarget, setNewCourseTarget] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');
  
  // Módulos
  const [numModulesRequested, setNumModulesRequested] = useState(4);
  const [modules, setModules] = useState<CourseModule[]>([]);

  // Rubrica del Curso
  const [rubric, setRubric] = useState<RubricItem[]>([]);

  useEffect(() => {
      loadItems();
  }, []);

  const loadItems = async () => {
      const items = await DatabaseService.getMarketplaceItems();
      setCourses(items);
  };

  const useDefaultRubricTemplate = () => {
    setRubric([
      { criteria: "Asistencia y Participación", description: "Participación activa en foros y sesiones en vivo.", points: 15 },
      { criteria: "Trabajos Prácticos", description: "Ejecución técnica de las tareas semanales.", points: 25 },
      { criteria: "Examen Parcial", description: "Evaluación teórica de los primeros módulos.", points: 25 },
      { criteria: "Proyecto Integrador Final", description: "Aplicación global de conocimientos en un reto real.", points: 35 }
    ]);
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (window.confirm("¿Seguro que deseas eliminar este curso de la tienda permanentemente?")) {
          await DatabaseService.deleteMarketplaceCourse(courseId);
          await loadItems();
      }
  };

  const handleSyncToLMS = async (mpCourse: MarketplaceCourse) => {
      setIsPublishing(true);
      try {
          const allLmsCourses = await DatabaseService.getCourses();
          const alreadyExists = allLmsCourses.some(c => c.title === mpCourse.title && c.instructorId === mpCourse.instructorId);

          if (alreadyExists) {
              alert("Este curso ya se encuentra en tu Gestión de Clases (LMS).");
              setIsPublishing(false);
              return;
          }

          const lmsCourse: Omit<Course, 'id'> = {
              title: mpCourse.title,
              description: mpCourse.detailedDescription || "Programa académico oficial.",
              instructor: mpCourse.instructor,
              instructorId: mpCourse.instructorId,
              schedule: mpCourse.durationInfo || "Horario por definir",
              startDate: mpCourse.startDate,
              endDate: mpCourse.endDate,
              image: mpCourse.image,
              price: mpCourse.price,
              students: [],
              assignments: [],
              materials: [],
              recordings: [],
              modality: 'virtual',
              modules: mpCourse.modules,
              objectives: mpCourse.objectives,
              requirements: mpCourse.requirements,
              targetAudience: mpCourse.targetAudience,
              durationInfo: mpCourse.durationInfo,
              rubric: mpCourse.rubric,
              createdAt: Date.now()
          };

          await DatabaseService.createCourse(lmsCourse);
          alert("¡Curso sincronizado exitosamente! Ahora puedes gestionarlo en 'Gestión de Clases'.");
      } catch (error) {
          console.error("Sync to LMS failed", error);
          alert("Error al sincronizar con el LMS.");
      } finally {
          setIsPublishing(false);
      }
  };

  const handleAIAutoFill = async () => {
      const currentCredits = user.aiCredits ?? 0;
      if (currentCredits < AI_COSTS.COURSE_GENERATION) {
          alert("Créditos insuficientes. Usando plantilla de rúbrica estándar.");
          useDefaultRubricTemplate();
          return;
      }

      if (!newCourseTitle) {
          alert("Ingresa un tema o título.");
          return;
      }

      setIsGeneratingWithAI(true);
      try {
          const aiData = await generateAIDescription(newCourseTitle, numModulesRequested);
          const aiRubric = await generateCourseRubric(newCourseTitle, aiData.description);
          
          if (aiData) {
              setNewCourseTitle(aiData.title);
              setNewCourseDetailedDesc(aiData.description);
              setNewCourseObjectives(aiData.objectives.join('\n'));
              setNewCourseRequirements(aiData.requirements.join('\n'));
              setNewCourseTarget(aiData.targetAudience);
              setNewCourseDuration(aiData.durationInfo);
              setModules(aiData.modules);
              setRubric(aiRubric);
              
              await DatabaseService.deductCredits(user.id, AI_COSTS.COURSE_GENERATION);
              const updatedUser = await DatabaseService.getUserById(user.id);
              if (updatedUser) onUpdateUser(updatedUser);
          }
      } catch (e) {
          console.error("AI Course Generation failed", e);
          useDefaultRubricTemplate();
      } finally {
          setIsGeneratingWithAI(false);
      }
  };

  const handlePublishOrUpdate = async () => {
      if(!newCourseTitle || !newCoursePrice) return;
      if (!editingCourse && !checkUploadLimits()) return;

      setIsPublishing(true);

      if (newCourseAllowBank && newCourseBankName && newCourseAccNumber) {
          await DatabaseService.updateUserProfile({
              ...user,
              bankAccount: {
                  bankName: newCourseBankName,
                  accountNumber: newCourseAccNumber,
                  accountType: newCourseAccType,
                  holderName: user.name
              }
          });
      }

      let finalImageUrl = newCourseImage;
      if (imageSource === 'file' && coverFile) {
          finalImageUrl = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop`;
      }

      const tagsArray = newCourseTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const objectivesArray = newCourseObjectives.split('\n').map(t => t.trim()).filter(t => t.length > 0);
      const requirementsArray = newCourseRequirements.split('\n').map(t => t.trim()).filter(t => t.length > 0);
      
      const courseData: MarketplaceCourse = {
          id: editingCourse ? editingCourse.id : `mp_${Date.now()}`,
          title: newCourseTitle,
          instructor: editingCourse ? editingCourse.instructor : user.name,
          instructorId: editingCourse ? editingCourse.instructorId : user.id,
          instructorWhatsapp: editingCourse ? editingCourse.instructorWhatsapp : (user.whatsapp || "593987654321"),
          price: parseFloat(newCoursePrice),
          rating: editingCourse ? editingCourse.rating : 0,
          students: editingCourse ? editingCourse.students : 0,
          image: finalImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
          tags: tagsArray.length > 0 ? tagsArray : ['Nuevo'],
          category: newCourseCategory,
          paymentLink: newCoursePaymentLink,
          allowBankTransfer: newCourseAllowBank,
          allowPaymentLink: newCourseAllowCard,
          customWebsiteUrl: newCourseCustomUrl,
          detailedDescription: newCourseDetailedDesc,
          objectives: objectivesArray,
          requirements: requirementsArray,
          targetAudience: newCourseTarget,
          durationInfo: newCourseDuration,
          startDate,
          endDate,
          publishedMonth: editingCourse ? editingCourse.publishedMonth : new Date().toISOString().slice(0, 7),
          createdAt: editingCourse ? editingCourse.createdAt : Date.now(),
          instructorIsPremium: user.isPremium,
          modules: modules,
          rubric: rubric
      };

      if (editingCourse) {
          await DatabaseService.updateMarketplaceCourse(editingCourse.id, courseData);
      } else {
          await DatabaseService.addMarketplaceCourse(courseData);
      }
      
      await loadItems();
      setIsPublishing(false);
      setIsCreateModalOpen(false);
      setEditingCourse(null);
      resetForm();
  };

  const checkUploadLimits = () => {
      if (user.isPremium) return true;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const myCoursesThisMonth = courses.filter(c => c.instructorId === user.id && c.publishedMonth === currentMonth);
      if (myCoursesThisMonth.length >= 2) { 
          alert("Plan Gratuito: Límite de 2 cursos al mes.");
          return false;
      }
      return true;
  };

  const openEditModal = (course: MarketplaceCourse) => {
      setEditingCourse(course);
      setNewCourseTitle(course.title);
      setNewCoursePrice(course.price.toString());
      setNewCourseImage(course.image);
      setNewCourseTags(course.tags.join(', '));
      setNewCourseCategory(course.category || CATEGORIES[0]);
      setNewCoursePaymentLink(course.paymentLink || '');
      setNewCourseAllowBank(course.allowBankTransfer ?? true);
      setNewCourseAllowCard(course.allowPaymentLink ?? false);
      setNewCourseCustomUrl(course.customWebsiteUrl || '');
      setNewCourseDetailedDesc(course.detailedDescription || '');
      setNewCourseObjectives(course.objectives?.join('\n') || '');
      setNewCourseRequirements(course.requirements?.join('\n') || '');
      setNewCourseTarget(course.targetAudience || '');
      setNewCourseDuration(course.durationInfo || '');
      setStartDate(course.startDate || '');
      setEndDate(course.endDate || '');
      setModules(course.modules || []);
      setRubric(course.rubric || []);
      setNumModulesRequested(course.modules?.length || 4);
      setImageSource('link');
      setIsCreateModalOpen(true);
  };

  const resetForm = () => {
      setNewCourseTitle('');
      setNewCoursePrice('');
      setNewCourseImage('');
      setNewCourseTags('');
      setNewCoursePaymentLink('');
      setNewCourseAllowBank(true);
      setNewCourseAllowCard(false);
      setNewCourseCustomUrl('');
      setNewCourseDetailedDesc('');
      setNewCourseObjectives('');
      setNewCourseRequirements('');
      setNewCourseTarget('');
      setNewCourseDuration('');
      setStartDate('');
      setEndDate('');
      setModules([]);
      setRubric([]);
      setNumModulesRequested(4);
      setCoverFile(null);
  };

  const handleWhatsAppEnroll = (course: MarketplaceCourse) => {
      const cleanPhone = (course.instructorWhatsapp || "593987654321").replace(/\D/g, '');
      const msg = encodeURIComponent(`Hola ${course.instructor}, me interesa inscribirme al curso "${course.title}" de QLASE.`);
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleViewDetails = (course: MarketplaceCourse) => {
      const publicLink = `${window.location.origin}${window.location.pathname}?view=marketplace_course&id=${course.id}`;
      window.open(publicLink, '_blank');
  };

  const handleRequestBankDetails = async (course: MarketplaceCourse) => {
      const instructor = await DatabaseService.getUserById(course.instructorId);
      if (instructor && instructor.bankAccount) {
          setShowBankDetailsModal(instructor);
      } else {
          alert("El docente no ha configurado sus datos.");
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

  const sortedCourses = [...courses]
    .sort((a, b) => {
        if (a.instructorIsPremium && !b.instructorIsPremium) return -1;
        if (!a.instructorIsPremium && b.instructorIsPremium) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .filter(c => filterCategory === 'Todas' || c.category === filterCategory);

  const myCoursesInMarket = courses.filter(c => c.instructorId === user.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
      
      {/* Banner */}
      <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-3xl p-6 flex items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-500 rounded-2xl text-black shadow-lg shadow-emerald-500/20"><DollarSign className="w-6 h-6"/></div>
              <div>
                  <h4 className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em] mb-1">Mercado QLASE</h4>
                  <p className="text-zinc-400 text-sm font-medium">0% Comisiones. Todo el ingreso es directo para ti.</p>
              </div>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Créditos IA</span>
              <span className="text-sm font-black text-amber-500 flex items-center gap-2 bg-black px-3 py-1 rounded-full border border-zinc-800"><Zap className="w-3 h-3"/> {user.aiCredits ?? 0}</span>
          </div>
      </div>

      <div className="relative rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 overflow-hidden p-8 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none uppercase">Venta de Cursos</h1>
                <p className="text-zinc-400 max-w-xl text-lg font-medium leading-relaxed">Publica tus brochures académicos y monetiza tu talento hoy mismo.</p>
            </div>
            {user.role === UserRole.TEACHER && (
                <div className="flex bg-black/60 backdrop-blur-md p-1.5 rounded-[2rem] border border-zinc-800 shadow-2xl">
                    <button onClick={() => setActiveTab('browse')} className={`px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'browse' ? 'bg-white text-black shadow-2xl' : 'text-zinc-600'}`}>Explorar</button>
                    <button onClick={() => setActiveTab('creator')} className={`px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'creator' ? 'bg-white text-black shadow-2xl' : 'text-zinc-600'}`}>Instructor</button>
                </div>
            )}
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto no-scrollbar bg-zinc-950 p-2 rounded-2xl border border-zinc-900">
                {['Todas', ...CATEGORIES].map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-emerald-600 text-white' : 'text-zinc-600 hover:text-white'}`}>{cat}</button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {sortedCourses.map((course) => (
                    <div key={course.id} className="group bg-[#070707] border border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-zinc-500 transition-all hover:-translate-y-2 shadow-xl flex flex-col h-full relative">
                        <div className="relative h-52 overflow-hidden shrink-0">
                            <img src={course.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" />
                            <div className="absolute top-4 right-4 bg-emerald-500 text-black text-[10px] font-black px-4 py-2 rounded-full shadow-2xl">${course.price}</div>
                        </div>
                        <div className="p-7 flex flex-col flex-1">
                            <h3 className="text-xl font-black text-white mb-3 line-clamp-2 leading-tight uppercase tracking-tight">{course.title}</h3>
                            <p className="text-zinc-500 text-[10px] mb-6 font-black uppercase tracking-widest truncate">{course.instructor}</p>
                            <div className="flex flex-col gap-2 mt-auto">
                                <button onClick={() => setSelectedCourseForPayment(course)} className="w-full font-black py-4 rounded-2xl bg-white text-black text-[10px] uppercase tracking-widest hover:bg-zinc-200">Inscribirse</button>
                                <button onClick={() => handleViewDetails(course)} className="w-full font-black py-4 rounded-2xl bg-zinc-900 text-zinc-500 text-[10px] uppercase tracking-widest hover:text-white border border-zinc-800">Detalles</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'creator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-zinc-900/30 hover:border-emerald-500 transition-all min-h-[350px]" onClick={() => { if(!checkUploadLimits()) return; resetForm(); setIsCreateModalOpen(true); }}>
                <Plus className="w-12 h-12 text-zinc-700 group-hover:text-emerald-500 transition-all mb-4"/>
                <h3 className="text-xl font-black text-white mb-2">Crear Brochure</h3>
                <p className="text-zinc-500 text-xs font-medium">Publica un programa profesional para vender.</p>
            </div>
            {myCoursesInMarket.map(course => (
                <div key={course.id} className="bg-[#070707] border border-zinc-900 rounded-[3rem] overflow-hidden p-6 flex flex-col h-full relative group">
                    <img src={course.image} className="h-32 w-full object-cover rounded-2xl opacity-50 mb-4" />
                    <h4 className="text-lg font-black text-white mb-4 line-clamp-1">{course.title}</h4>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => openEditModal(course)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase border border-zinc-700">Editar</button>
                        <button onClick={() => handleSyncToLMS(course)} className="flex-1 py-3 bg-emerald-600/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20">LMS Sync</button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-5xl p-10 md:p-14 animate-in zoom-in duration-300 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-12">
                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{editingCourse ? 'Actualizar Brochure' : 'Generar Nuevo Brochure'}</h3>
                      <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-600 hover:text-white bg-zinc-900 p-2.5 rounded-full"><X className="w-6 h-6"/></button>
                  </div>

                  <div className="space-y-12">
                      {/* Basicos */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2"><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Título del Programa</label><input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)}/></div>
                          <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Precio ($)</label><input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={newCoursePrice} onChange={(e) => setNewCoursePrice(e.target.value)}/></div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fecha Inicio</label><input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={startDate} onChange={(e) => setStartDate(e.target.value)}/></div>
                          <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fecha Cierre</label><input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={endDate} onChange={(e) => setEndDate(e.target.value)}/></div>
                      </div>

                      {/* AI integration */}
                      <div className="bg-blue-600/10 border border-blue-600/20 p-8 rounded-[2.5rem] flex items-center justify-between gap-8">
                          <div className="flex items-center gap-5"><Sparkles className="w-10 h-10 text-blue-500"/><p className="text-white font-bold">Autocompletar Brochure y Pensum con IA QLASE Core</p></div>
                          <button onClick={handleAIAutoFill} disabled={isGeneratingWithAI} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200">
                                {isGeneratingWithAI ? <Loader2 className="animate-spin w-4 h-4"/> : "Generar Programa con IA"}
                          </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-8">
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] border-b border-zinc-900 pb-2">Información del Programa</p>
                              <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">Sinopsis</label><textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm h-32" value={newCourseDetailedDesc} onChange={(e) => setNewCourseDetailedDesc(e.target.value)}/></div>
                              <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">Objetivos (uno por línea)</label><textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-xs h-24" value={newCourseObjectives} onChange={(e) => setNewCourseObjectives(e.target.value)}/></div>
                              <div><label className="block text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">Duración (Ej: 60h)</label><input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-xs" value={newCourseDuration} onChange={(e) => setNewCourseDuration(e.target.value)}/></div>
                          </div>

                          <div className="space-y-8">
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] border-b border-zinc-900 pb-2">Módulos del Pensum</p>
                              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                  {modules.map((mod, idx) => (
                                      <div key={idx} className="p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 relative group">
                                          <button onClick={() => removeModule(idx)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                          <input value={mod.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} placeholder="Título del Módulo" className="w-full bg-transparent border-b border-zinc-800 py-1 text-white text-sm font-bold mb-2 focus:outline-none"/>
                                          <textarea value={mod.description} onChange={(e) => updateModule(idx, 'description', e.target.value)} placeholder="Descripción..." className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2 text-white text-xs h-16"/>
                                      </div>
                                  ))}
                                  <button onClick={addModule} className="w-full py-4 border border-dashed border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Añadir Módulo</button>
                              </div>
                          </div>
                      </div>

                      {/* RUBRICA EDITOR */}
                      <div className="space-y-8">
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] border-b border-zinc-900 pb-2 flex items-center gap-2"><ListChecks className="w-4 h-4"/> Rúbrica de Evaluación Académica</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {rubric.map((item, idx) => (
                                  <div key={idx} className="p-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800 relative">
                                      <button onClick={() => removeRubricItem(idx)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500"><X className="w-4 h-4"/></button>
                                      <div className="flex justify-between items-center mb-4">
                                          <input value={item.criteria} onChange={(e) => updateRubricItem(idx, 'criteria', e.target.value)} placeholder="Criterio (Ej: Examen Final)" className="bg-transparent border-b border-zinc-800 py-1 text-white font-bold text-sm focus:outline-none w-2/3"/>
                                          <input type="number" value={item.points} onChange={(e) => updateRubricItem(idx, 'points', parseInt(e.target.value))} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-emerald-500 font-black text-xs w-16 text-center" />
                                      </div>
                                      <textarea value={item.description} onChange={(e) => updateRubricItem(idx, 'description', e.target.value)} placeholder="¿Qué se evalúa?" className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-white text-xs h-20"/>
                                  </div>
                              ))}
                              {rubric.length === 0 && (
                                <button onClick={useDefaultRubricTemplate} className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-zinc-800 rounded-[2rem] text-blue-600 hover:text-blue-500 hover:border-blue-500 transition-all">
                                    <Sparkles className="w-6 h-6"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Usar Plantilla Estándar</span>
                                </button>
                              )}
                              <button onClick={addRubricItem} className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-600 hover:text-white hover:border-zinc-500 transition-all">
                                  <Plus className="w-6 h-6"/>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Añadir Criterio de Evaluación</span>
                              </button>
                          </div>
                          {rubric.length > 0 && (
                              <div className="text-center text-[10px] font-black text-zinc-500 uppercase">
                                  Suma Total: <span className={rubric.reduce((s, i) => s + i.points, 0) === 100 ? 'text-emerald-500' : 'text-amber-500'}>{rubric.reduce((s, i) => s + i.points, 0)} pts</span> (Recomendado 100)
                              </div>
                          )}
                      </div>

                      <div className="pt-12">
                          <button onClick={handlePublishOrUpdate} disabled={isPublishing} className="w-full bg-white text-black font-black py-8 rounded-[2.5rem] uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-zinc-200 transition-all active:scale-95">
                              {isPublishing ? "PROCESANDO..." : (editingCourse ? "GUARDAR CAMBIOS EN EL BROCHURE" : "PUBLICAR OFERTA EN QLASE ACADEMY")}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {selectedCourseForPayment && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-xl p-10 animate-in zoom-in duration-300 shadow-2xl relative text-center">
                  <button onClick={() => setSelectedCourseForPayment(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X className="w-6 h-6"/></button>
                  <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">Inscripción Directa</h2>
                  <p className="text-zinc-500 text-sm mb-10">Costo del Programa: <span className="text-white font-black">${selectedCourseForPayment.price} USD</span></p>
                  <div className="space-y-4">
                      {selectedCourseForPayment.allowPaymentLink && selectedCourseForPayment.paymentLink && (
                          <a href={selectedCourseForPayment.paymentLink} target="_blank" className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest block">Pagar con Tarjeta</a>
                      )}
                      <button onClick={handleWhatsAppEnroll(selectedCourseForPayment)} className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">Inscribirse por WhatsApp</button>
                      <button onClick={handleRequestBankDetails(selectedCourseForPayment)} className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border border-zinc-800">Ver Datos Bancarios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Marketplace;
