
import React, { useState, useEffect, useRef } from 'react';
import { Course, User, UserRole, Assignment, Material, Recording, RubricItem, CourseModule } from '../types';
import { ArrowLeft, FileText, Video, Upload, Calendar, Users, Download, CheckCircle, Clock, Play, Plus, X, Loader2, Link as LinkIcon, GraduationCap, Trash2, Save, Search, AlertCircle, Mail, ExternalLink, File, AlertTriangle, Paperclip, CloudUpload, Globe, MapPin, Settings, Sparkles, ListChecks, Image, Award, Copy, List, Eye, MessageCircle, BarChart3, TrendingUp, TrendingDown, Paperclip as AttachmentIcon, HardDrive, Zap, File as GenericFileIcon } from 'lucide-react';
import { DatabaseService } from '../services/db';
import { generateRubric, generateAIDescription, generateCourseRubric } from '../services/geminiService';
import { AI_COSTS } from '../constants';

/**
 * Componente profesional para visualizar archivos con icono y preview inteligente.
 */
const FileDisplayCard: React.FC<{ url: string; index: number; showPreview?: boolean }> = ({ url, index, showPreview = true }) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
    const isPdf = /\.pdf$/i.test(url.split('?')[0]);
    const fileName = url.split('/').pop()?.split('_').pop() || `Archivo_${index + 1}`;

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex flex-col bg-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all group w-full sm:w-48 shadow-xl active:scale-95"
        >
            {isImage && showPreview ? (
                <div className="h-28 w-full overflow-hidden bg-zinc-900 flex items-center justify-center relative">
                    <img src={url} alt={fileName} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>
            ) : (
                <div className="h-28 w-full bg-zinc-900/50 flex flex-col items-center justify-center gap-3">
                    {isPdf ? <FileText className="w-10 h-10 text-red-500"/> : <GenericFileIcon className="w-10 h-10 text-emerald-500"/>}
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{isPdf ? 'Documento PDF' : 'Recurso Académico'}</span>
                </div>
            )}
            <div className="p-4 flex items-center justify-between gap-3 bg-zinc-950/80 backdrop-blur-sm">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate uppercase tracking-tighter" title={fileName}>{fileName}</p>
                    <p className="text-[8px] text-zinc-600 font-black uppercase mt-0.5">Click para ver</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-white transition-colors">
                    <Download className="w-3.5 h-3.5" />
                </div>
            </div>
        </a>
    );
};

interface CourseViewProps {
  course: Course; 
  user: User;
  onBack: () => void;
}

const CourseView: React.FC<CourseViewProps> = ({ course: initialCourse, user: initialUser, onBack }) => {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<'content' | 'assignments' | 'recordings' | 'students' | 'diplomas'>('content');
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  
  // Modal States
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showGlobalGradesTable, setShowGlobalGradesTable] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Student Submission State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Data for Grading/Submission
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [tempGrades, setTempGrades] = useState<Record<string, number>>({});
  const [tempComments, setTempComments] = useState<Record<string, string>>({});

  // Data for Adding Student
  const [newStudentInput, setNewStudentInput] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  // Form States
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDate, setNewItemDate] = useState('');
  const [newItemType, setNewItemType] = useState<'pdf' | 'video' | 'link'>('pdf');
  const [newItemUrl, setNewItemUrl] = useState('');
  
  // AI Rubric State
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [generatedRubric, setGeneratedRubric] = useState<RubricItem[]>([]);
  
  // Edit Course Expanded Form State
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDesc, setEditDesc] = useState(course.description);
  const [editSchedule, setEditSchedule] = useState(course.schedule);
  const [editStartDate, setEditStartDate] = useState(course.startDate || '');
  const [editEndDate, setEditEndDate] = useState(course.endDate || '');
  const [editModality, setEditModality] = useState(course.modality || 'virtual');
  const [editLink, setEditLink] = useState(course.meetingUrl || '');
  const [editLocation, setEditLocation] = useState(course.locationDetails || { building: '', room: '' });
  const [editInstitutionLogo, setEditInstitutionLogo] = useState(course.institutionLogo || '');
  const [editObjectives, setEditObjectives] = useState(course.objectives?.join('\n') || '');
  const [editRequirements, setEditRequirements] = useState(course.requirements?.join('\n') || '');
  const [editTarget, setEditTarget] = useState(course.targetAudience || '');
  const [editModules, setEditModules] = useState<CourseModule[]>(course.modules || []);
  const [editRubric, setEditRubric] = useState<RubricItem[]>(course.rubric || []);
  const [isGeneratingConfigAI, setIsGeneratingConfigAI] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordingMode, setRecordingMode] = useState<'upload' | 'link'>('link'); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  // DIPLOMA STATE
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([]);
  const diplomaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      refreshCourseData();
      const unsubscribe = DatabaseService.subscribeToUser(initialUser.id, (updatedUser) => {
          setUser(updatedUser);
      });
      return () => unsubscribe();
  }, [initialCourse.id, initialUser.id]);

  useEffect(() => {
      if (course.students && course.students.length > 0) {
          loadEnrolledStudents();
      } else {
          setEnrolledStudents([]);
      }
  }, [course]);

  const refreshCourseData = async () => {
      const freshData = await DatabaseService.getCourseById(initialCourse.id);
      if (freshData) {
          setCourse(freshData);
      }
  };

  const loadEnrolledStudents = async () => {
      setIsLoadingStudents(true);
      const students = await DatabaseService.getUsersByIds(course.students);
      setEnrolledStudents(students);
      setIsLoadingStudents(false);
  };

  const resetForms = () => {
      setNewItemTitle('');
      setNewItemDesc('');
      setNewItemDate('');
      setNewItemType('pdf');
      setNewItemUrl('');
      setNewStudentInput('');
      setInviteStatus('');
      setSelectedFile(null);
      setSubmissionFiles([]);
      setIsSubmitting(false);
      setShowMaterialModal(false);
      setShowAssignmentModal(false);
      setShowRecordingModal(false);
      setShowAddStudentModal(false);
      setShowGradingModal(false);
      setShowSubmitModal(false);
      setShowEditCourseModal(false);
      setShowGlobalGradesTable(false);
      setGeneratedRubric([]);
      setDiplomaFiles([]);
      setSelectedAssignment(null);
      setTempGrades({});
      setTempComments({});
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditInstitutionLogo(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleSubmissionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setSubmissionFiles(Array.from(e.target.files));
      }
  };

  const handleDiplomaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setDiplomaFiles(Array.from(e.target.files));
      }
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  const getAssignmentStatusInfo = (assign: Assignment, userId: string) => {
    const now = new Date();
    const due = new Date(assign.dueDate);
    const submissionDateStr = assign.submissionDate?.[userId];
    
    if (submissionDateStr) {
        const subDate = new Date(submissionDateStr);
        const diff = due.getTime() - subDate.getTime();
        if (diff >= 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return {
                label: `Entregado faltando ${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m`,
                color: 'text-emerald-500',
                isClosed: false,
                submitted: true
            };
        } else {
            return {
                label: 'Entregado con retraso',
                color: 'text-orange-500',
                isClosed: false,
                submitted: true
            };
        }
    }

    const diff = due.getTime() - now.getTime();
    if (diff <= 0) {
        return {
            label: 'Plazo Cerrado',
            color: 'text-red-500',
            isClosed: true,
            submitted: false
        };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
        label: `Faltan ${days}d ${hours}h para el cierre`,
        color: 'text-amber-500',
        isClosed: false,
        submitted: false
    };
  };

  const handleDeleteCourse = async () => {
      const confirmDelete = window.confirm("PELIGRO: ¿Estás seguro de que quieres ELIMINAR este curso permanentemente? Esto borrará todos los materiales, notas y el acceso de los estudiantes. Esta acción no se puede deshacer.");
      if (confirmDelete) {
          setIsSubmitting(true);
          await DatabaseService.deleteCourse(course.id);
          onBack(); 
      }
  };

  const handleEditCourse = async () => {
      setIsSubmitting(true);
      const objArray = editObjectives.split('\n').filter(o => o.trim());
      const reqArray = editRequirements.split('\n').filter(r => r.trim());

      await DatabaseService.updateCourseDetails(course.id, {
          title: editTitle,
          description: editDesc,
          schedule: editSchedule,
          startDate: editStartDate,
          endDate: editEndDate,
          modality: editModality,
          meetingUrl: editModality === 'virtual' ? editLink : undefined,
          locationDetails: editModality === 'in-person' ? editLocation : undefined,
          institutionLogo: editInstitutionLogo,
          objectives: objArray,
          requirements: reqArray,
          targetAudience: editTarget,
          modules: editModules,
          rubric: editRubric
      });
      await refreshCourseData();
      resetForms();
  };

  const addModule = () => setEditModules([...editModules, { title: '', description: '' }]);
  const removeModule = (index: number) => setEditModules(editModules.filter((_, i) => i !== index));
  const updateModule = (index: number, field: keyof CourseModule, value: string) => {
      const updated = [...editModules];
      updated[index][field] = value;
      setEditModules(updated);
  };

  const addRubricItem = () => setEditRubric([...editRubric, { criteria: '', description: '', points: 25 }]);
  const removeRubricItem = (index: number) => setEditRubric(editRubric.filter((_, i) => i !== index));
  const updateRubricItem = (index: number, field: keyof RubricItem, value: any) => {
      const updated = [...editRubric];
      updated[index] = { ...updated[index], [field]: value };
      setEditRubric(updated);
  };

  const useDefaultRubricTemplate = () => {
    setEditRubric([
      { criteria: "Asistencia y Participación", description: "Participación activa en foros y sesiones en vivo.", points: 15 },
      { criteria: "Trabajos Prácticos", description: "Ejecución técnica de las tareas semanales.", points: 25 },
      { criteria: "Examen Parcial", description: "Evaluación teórica de los primeros módulos.", points: 25 },
      { criteria: "Proyecto Integrador Final", description: "Aplicación global de conocimientos en un reto real.", points: 35 }
    ]);
  };

  const useGenericAssignmentRubric = () => {
      setGeneratedRubric([
          { criteria: "Calidad Técnica", description: "Cumplimiento de requisitos técnicos.", points: 30 },
          { criteria: "Profundidad de Análisis", description: "Nivel de investigación y razonamiento.", points: 30 },
          { criteria: "Presentación y Orden", description: "Estructura profesional del documento.", points: 20 },
          { criteria: "Puntualidad", description: "Entrega dentro de los plazos establecidos.", points: 20 }
      ]);
  };

  const handleAIConfigFill = async () => {
    if (!editTitle) { alert("Ingresa un tema."); return; }
    setIsGeneratingConfigAI(true);
    try {
        const aiData = await generateAIDescription(editTitle);
        const aiRubric = await generateCourseRubric(editTitle, aiData.description);
        setEditDesc(aiData.description);
        setEditObjectives(aiData.objectives.join('\n'));
        setEditRequirements(aiData.requirements.join('\n'));
        setEditTarget(aiData.targetAudience);
        setEditModules(aiData.modules);
        setEditRubric(aiRubric);
    } catch (e) {
        console.error("AI Config Error", e);
        useDefaultRubricTemplate();
    } finally {
        setIsGeneratingConfigAI(false);
    }
  };

  const handleAddMaterial = async () => {
      if(!newItemTitle) return;
      setIsSubmitting(true);
      
      let finalUrl = newItemUrl;
      let fileSize = 0;
      if ((newItemType === 'pdf' || newItemType === 'video') && selectedFile) {
          finalUrl = `https://storage.qlase.edu/materials/${course.id}/${Date.now()}_${selectedFile.name}`;
          fileSize = selectedFile.size;
      } else if (!finalUrl) {
          finalUrl = '#';
      }

      const newMaterial: Material = {
          id: `mat_${Date.now()}`,
          title: newItemTitle,
          type: newItemType,
          url: finalUrl
      };
      await DatabaseService.addMaterial(course.id, newMaterial, fileSize);
      await refreshCourseData();
      resetForms();
  };

  const handleGenerateRubric = async () => {
      if (!newItemTitle) {
          alert("Por favor ingresa al menos el título de la tarea.");
          return;
      }
      setIsGeneratingRubric(true);
      const desc = newItemDesc || "Tarea estándar del curso.";
      const rubric = await generateRubric(newItemTitle, desc, 100);
      setGeneratedRubric(rubric);
      setIsGeneratingRubric(false);
  };

  const handleAddAssignment = async () => {
      if(!newItemTitle || !newItemDate) return;
      setIsSubmitting(true);
      
      const finalRubric = generatedRubric.length > 0 ? generatedRubric : [
          { criteria: "Cumplimiento General", description: "El trabajo cumple con los requisitos básicos.", points: 100 }
      ];

      const newAssign: Assignment = {
          id: `asg_${Date.now()}`,
          title: newItemTitle,
          description: newItemDesc,
          dueDate: newItemDate,
          status: 'pending',
          maxGrade: 100,
          rubric: finalRubric, 
          grades: {},
          teacherComments: {},
          submissions: {},
          submissionContent: {},
          submissionDate: {},
          viewedBy: []
      };
      await DatabaseService.addAssignment(course.id, newAssign);
      await refreshCourseData();
      resetForms();
  };

  const handleAddRecording = async () => {
      if(!newItemTitle) return;
      if (recordingMode === 'link' && !newItemUrl) { alert("Por favor ingresa el link."); return; }
      if (recordingMode === 'upload' && !selectedFile) { alert("Por favor selecciona un archivo de video."); return; }

      setIsSubmitting(true);
      let videoUrl = '#';
      let fileSize = 0;
      if (recordingMode === 'link') {
          videoUrl = newItemUrl;
          if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) videoUrl = 'https://' + videoUrl;
      } else if (recordingMode === 'upload' && selectedFile) {
          videoUrl = `https://storage.qlase.edu/recordings/${Date.now()}_${selectedFile.name}`;
          fileSize = selectedFile.size;
      }

      const newRec: Recording = {
          id: `rec_${Date.now()}`,
          title: newItemTitle,
          date: new Date().toLocaleDateString(),
          duration: '', 
          thumbnail: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2000&auto=format&fit=crop',
          url: videoUrl,
          views: 0
      };
      await DatabaseService.addRecording(course.id, newRec, fileSize);
      await refreshCourseData();
      resetForms();
  };

  const handleAddStudent = async () => {
      if (!newStudentInput.trim()) return;
      setIsSubmitting(true);
      setInviteStatus('');
      const lines = newStudentInput.split('\n').filter(l => l.trim().length > 0);
      const { validUsers, ignoredEmails } = await DatabaseService.batchAddStudentsToCourse(course.id, lines);
      let msg = `${validUsers.length} invitaciones procesadas.`;
      if (ignoredEmails.length > 0) msg += ` ${ignoredEmails.length} ignorados.`;
      setInviteStatus(msg);
      setTimeout(async () => {
          await refreshCourseData();
          if (ignoredEmails.length === 0) resetForms();
          else setIsSubmitting(false); 
      }, 2000);
  };

  const handleRemoveStudent = async (studentId: string) => {
      if (!window.confirm("¿Estás seguro de que deseas eliminar a este estudiante del curso?")) return;
      await DatabaseService.removeStudentFromCourse(course.id, studentId);
      await refreshCourseData();
  };

  const openGradingModal = (assignment: Assignment) => {
      setSelectedAssignment(assignment);
      setTempGrades({ ...(assignment.grades || {}) });
      setTempComments({ ...(assignment.teacherComments || {}) });
      setShowGradingModal(true);
  };

  const handleSaveGrades = async () => {
      if (!selectedAssignment) return;
      setIsSubmitting(true);
      try {
          await DatabaseService.updateAssignmentGrade(course.id, selectedAssignment.id, tempGrades, tempComments);
          await refreshCourseData();
          setIsSubmitting(false);
          setShowGradingModal(false);
          setSelectedAssignment(null);
          alert("Calificaciones y feedback publicados correctamente.");
      } catch (err) {
          console.error("Error saving grades:", err);
          setIsSubmitting(false);
          alert("Error al guardar calificaciones.");
      }
  };

  const handleUploadDiplomas = async () => {
      if (diplomaFiles.length === 0) return;
      setIsSubmitting(true);
      await DatabaseService.addDiplomasToCourse(course.id, diplomaFiles);
      await refreshCourseData();
      setDiplomaFiles([]);
      setIsSubmitting(false);
  };

  // --- STUDENT ACTIONS ---

  const openSubmitModal = (assignment: Assignment) => {
      const status = getAssignmentStatusInfo(assignment, user.id);
      if (status.isClosed && !status.submitted) {
          alert("El plazo de entrega ha expirado. Contacta con tu docente.");
          return;
      }
      setSelectedAssignment(assignment);
      setShowSubmitModal(true);
  };

  const handleStudentSubmit = async () => {
      if (!selectedAssignment || submissionFiles.length === 0) {
          alert("Por favor selecciona al menos un archivo para entregar.");
          return;
      }
      setIsSubmitting(true);
      try {
          // El almacenamiento del alumno descuenta del plan del docente instructor
          const urls = submissionFiles.map(f => `https://storage.qlase.edu/submissions/${course.id}/${user.id}/${Date.now()}_${f.name}`);
          const totalSize = submissionFiles.reduce((acc, f) => acc + f.size, 0);
          await DatabaseService.submitAssignment(course.id, selectedAssignment.id, user.id, urls, totalSize);
          await refreshCourseData();
          resetForms();
          alert("Tarea enviada satisfactoriamente.");
      } catch (err) {
          console.error(err);
          alert("Error al entregar la tarea.");
          setIsSubmitting(false);
      }
  };

  const handleViewAssignment = async (assignId: string) => {
      if (user.role === UserRole.STUDENT) {
          await DatabaseService.trackAssignmentView(course.id, assignId, user.id);
          refreshCourseData();
      }
  };

  const isVideoUrl = (url: string) => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return lower.includes('youtube') || lower.includes('vimeo') || lower.endsWith('.mp4') || lower.endsWith('.mov');
  };

  const storageLimit = user.isPremium ? 50 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024;
  const storagePercentage = Math.min(((user.storageUsed || 0) / storageLimit) * 100, 100);
  const storageUsedGB = ((user.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2);
  const storageLimitGB = (storageLimit / (1024 * 1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0 relative">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-8">
        <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide"><ArrowLeft className="w-4 h-4" /> Volver</button>
            <div className="flex items-center gap-4">
                {course.institutionLogo && (
                    <div className="h-10 md:h-12 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden"><img src={course.institutionLogo} alt="Institution Logo" className="h-full w-auto object-contain" /></div>
                )}
                {user.role === UserRole.TEACHER && (
                    <div className="flex gap-3">
                        {/* Monitor de Almacenamiento Condicional en Tarjeta de Curso */}
                        <div className="flex flex-col items-end gap-1.5 mr-4 px-4 border-r border-zinc-800">
                             <div className="flex justify-between w-32 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                 <span>Capacidad LMS</span>
                                 <span>{storageUsedGB}GB</span>
                             </div>
                             <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                 <div className={`h-full transition-all duration-1000 ${storagePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${storagePercentage}%`}}></div>
                             </div>
                             {!user.isPremium && (
                                 <button onClick={() => setShowPremiumModal(true)} className="text-[7px] font-black text-emerald-500 hover:text-white uppercase tracking-[0.2em] animate-pulse">Subir a PRO</button>
                             )}
                        </div>

                        <button onClick={() => setShowGlobalGradesTable(true)} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-emerald-900/30"><BarChart3 className="w-4 h-4"/> Resumen de Notas Global</button>
                        <button onClick={() => {
                                setEditTitle(course.title);
                                setEditDesc(course.description);
                                setEditSchedule(course.schedule);
                                setEditStartDate(course.startDate || '');
                                setEditEndDate(course.endDate || '');
                                setEditModality(course.modality || 'virtual');
                                setEditLink(course.meetingUrl || '');
                                setEditLocation(course.locationDetails || { building: '', room: '' });
                                setEditInstitutionLogo(course.institutionLogo || '');
                                setEditObjectives(course.objectives?.join('\n') || '');
                                setEditRequirements(course.requirements?.join('\n') || '');
                                setEditTarget(course.targetAudience || '');
                                setEditModules(course.modules || []);
                                setEditRubric(course.rubric || []);
                                setShowEditCourseModal(true);
                            }}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900 px-3 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wide"
                        ><Settings className="w-4 h-4" /> Configurar</button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded">En Curso</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border flex items-center gap-2 ${course.modality === 'in-person' ? 'bg-orange-950/30 text-orange-400 border-orange-900/50' : 'bg-blue-950/30 text-blue-400 border-blue-900/50'}`}>
                         {course.modality === 'in-person' ? <MapPin className="w-3 h-3"/> : <Video className="w-3 h-3"/>}{course.modality === 'in-person' ? 'Presencial' : 'Virtual'}
                    </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">{course.title}</h1>
                <p className="text-zinc-300 flex items-center gap-2 text-base md:text-lg font-light"><span className="text-zinc-500">Instructor Principal:</span> {course.instructor}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 md:gap-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-left md:text-right">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Horario Académico</p>
                    <div className="flex items-center gap-2 text-white text-sm md:text-base font-medium"><Calendar className="w-4 h-4 text-white"/> {course.schedule}</div>
                </div>
                <div className="w-px bg-zinc-800 hidden md:block"></div>
                <div className="text-left md:text-right">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Matrícula Activa</p>
                    <div className="flex items-center gap-2 text-white text-sm md:text-base font-medium"><Users className="w-4 h-4 text-zinc-400"/> {course.students?.length || 0} Estudiantes</div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-8 border-b border-zinc-800 overflow-x-auto no-scrollbar">
        {[
            { id: 'content', label: 'Repositorio Didáctico' },
            { id: 'assignments', label: 'Tareas y Calificaciones' },
            { id: 'recordings', label: 'Clases / Links Síncronos' },
            { id: 'students', label: 'Libro de Matrícula', hidden: user.role === UserRole.STUDENT },
            { id: 'diplomas', label: 'Egresados / Títulos', hidden: user.role === UserRole.STUDENT }
        ].filter(t => !t.hidden).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 md:px-0 text-sm md:text-base font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{tab.label}{activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4"/> Recursos del Programa</h3></div>
                    {course.materials?.map(material => (
                        <a key={material.id} href={material.url} target="_blank" rel="noopener noreferrer" className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 rounded-xl flex items-center gap-5 transition-all cursor-pointer group shadow-sm">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border border-zinc-700 bg-zinc-800 text-zinc-200`}>{material.type === 'video' ? <Video className="w-6 h-6"/> : material.type === 'link' ? <LinkIcon className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-base">{material.title}</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">{material.type}</p>
                            </div>
                            <div className="p-3 text-zinc-500 hover:text-white transition-colors bg-zinc-950 rounded-lg border border-zinc-800 group-hover:border-zinc-600"><Download className="w-5 h-5" /></div>
                        </a>
                    ))}
                     {(!course.materials || course.materials.length === 0) && (
                        <div className="text-center py-16 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800"><p className="text-zinc-500 font-medium">No se han cargado recursos didácticos aún.</p></div>
                    )}
                </div>
                <div className="space-y-6">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Información del Curso</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed font-medium">{course.description}</p>
                    </div>
                    {user.role === UserRole.TEACHER && (
                        <button onClick={() => setShowMaterialModal(true)} className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors text-sm uppercase tracking-wide shadow-lg flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Añadir Nuevo Material</button>
                    )}
                </div>
            </div>
        )}
        {activeTab === 'recordings' && (
            <div className="space-y-6 animate-in fade-in">
                {user.role === UserRole.TEACHER && (
                    <div className="flex justify-end"><button onClick={() => setShowRecordingModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"><Plus className="w-4 h-4" /> Subir Grabación / Link de Clase</button></div>
                )}
                {(!course.recordings || course.recordings.length === 0) ? (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed"><Video className="w-12 h-12 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-500 font-medium">No hay grabaciones de clases disponibles.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {course.recordings.map(rec => {
                            const isVideo = isVideoUrl(rec.url);
                            return (
                            <a key={rec.id} href={rec.url} target="_blank" rel="noopener noreferrer" className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-600 transition-all cursor-pointer flex flex-col h-full hover:-translate-y-1 shadow-lg">
                                {isVideo ? (
                                    <div className="relative h-48 bg-black">
                                        <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Play className="w-5 h-5 text-white fill-white" /></div></div>
                                        {rec.duration && <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">{rec.duration}</div>}
                                    </div>
                                ) : (
                                    <div className="relative h-48 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-6 flex flex-col justify-center items-center text-center group-hover:from-zinc-800 group-hover:to-zinc-900 transition-all">
                                        <div className="absolute top-0 right-0 p-3 opacity-50"><ExternalLink className="w-5 h-5 text-zinc-500"/></div>
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-white/10 transition-all shadow-inner"><Globe className="w-8 h-8 text-blue-400" /></div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded border border-zinc-800">Recurso Externo</span>
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col bg-black">
                                    <h4 className="text-white font-bold mb-2 line-clamp-2 leading-snug text-sm group-hover:text-blue-400 transition-colors">{rec.title}</h4>
                                    <div className="flex items-center justify-between mt-auto pt-3 text-xs text-zinc-500 border-t border-zinc-900"><span>{rec.date}</span><span className="flex items-center gap-1">{isVideo ? <Users className="w-3 h-3"/> : <LinkIcon className="w-3 h-3"/>}{isVideo ? `${rec.views} vistas` : 'Abrir Link'}</span></div>
                                </div>
                            </a>
                        )})}
                    </div>
                )}
            </div>
        )}
        {activeTab === 'assignments' && (
            <div className="space-y-4 animate-in fade-in">
                 {user.role === UserRole.TEACHER && (
                    <div className="flex justify-end mb-6"><button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm transition-all hover:bg-zinc-200 shadow-lg"><Plus className="w-4 h-4" /> Crear Nuevo Reto Académico</button></div>
                )}
                {course.assignments?.map(assign => {
                    const submissionsCount = Object.keys(assign.submissions || {}).length;
                    const viewersCount = (assign.viewedBy || []).length;
                    const totalStudents = course.students?.length || 0;
                    
                    const statusInfo = getAssignmentStatusInfo(assign, user.id);
                    const myStatus = user.role === UserRole.TEACHER ? assign.status : (assign.submissions?.[user.id] || 'pending');
                    const myGrade = user.role === UserRole.TEACHER ? null : assign.grades?.[user.id];
                    const myComment = user.role === UserRole.TEACHER ? null : assign.teacherComments?.[user.id];
                    const submissionFilesList = user.role === UserRole.STUDENT ? (assign.submissionContent?.[user.id] || []) : [];
                    const isGraded = myGrade !== undefined && myGrade !== null;
                    const submissionDate = assign.submissionDate?.[user.id];
                    
                    return (
                    <div key={assign.id} onMouseEnter={() => handleViewAssignment(assign.id)} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-zinc-600 transition-colors shadow-sm">
                        <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h4 className="font-bold text-white text-xl">{assign.title}</h4>
                                {user.role === UserRole.STUDENT && (
                                    <span className={`text-[10px] px-3 py-1 rounded-full border uppercase tracking-wider font-bold flex items-center gap-1 ${isGraded ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : myStatus === 'submitted' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' : 'bg-amber-950/30 text-amber-500 border-amber-900/50'}`}>
                                        {isGraded ? <CheckCircle className="w-3 h-3"/> : myStatus === 'submitted' ? <Clock className="w-3 h-3"/> : null}{isGraded ? 'Calificado' : myStatus === 'submitted' ? 'En Revisión' : 'Entrega Pendiente'}
                                    </span>
                                )}
                                {user.role === UserRole.TEACHER && (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-1 rounded font-black flex items-center gap-1 uppercase tracking-widest ${assign.status === 'graded' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}><Users className="w-3 h-3"/> {assign.status === 'graded' ? 'Calificado' : 'Evaluando'} {submissionsCount}/{totalStudents} Alumnos</span>
                                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-black flex items-center gap-1 uppercase tracking-widest"><Eye className="w-3 h-3"/> {viewersCount} Vistas</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-zinc-400 text-sm mb-3 font-medium">{assign.description}</p>
                            
                            {/* Visualización de archivos del Alumno en la tarjeta - COMPONENTE MEJORADO */}
                            {user.role === UserRole.STUDENT && submissionFilesList.length > 0 && (
                                <div className="flex flex-wrap gap-4 mb-6">
                                    {submissionFilesList.map((url, i) => (
                                        <FileDisplayCard key={i} url={url} index={i} />
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 w-fit flex items-center gap-2">
                                        <Clock className="w-3 h-3"/> Plazo Máximo: {new Date(assign.dueDate).toLocaleString()}
                                    </p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ml-1 ${statusInfo.color}`}>{statusInfo.label}</p>
                                </div>
                                {submissionDate && (
                                    <p className="text-xs text-emerald-500 font-mono bg-emerald-950/10 px-2 py-1 rounded border border-emerald-900/20 w-fit h-fit mt-1">
                                        Fecha Envío: {new Date(submissionDate).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            {myComment && (
                                <div className="mt-4 p-4 bg-blue-950/10 border border-blue-900/30 rounded-xl">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-2"><MessageCircle className="w-3 h-3"/> Feedback del Evaluador</p>
                                    <p className="text-zinc-300 text-xs italic">"{myComment}"</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                            {myGrade !== undefined && myGrade !== null && (<div className="text-right px-4 border-r border-zinc-800"><p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Puntaje</p><p className="text-2xl font-black text-white">{myGrade}<span className="text-zinc-600 text-sm font-medium">/{assign.maxGrade}</span></p></div>)}
                            {user.role === UserRole.STUDENT && !isGraded && (
                                <button 
                                    onClick={() => openSubmitModal(assign)} 
                                    disabled={statusInfo.isClosed && !statusInfo.submitted}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-bold text-sm shadow-lg ${statusInfo.isClosed && !statusInfo.submitted ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800' : myStatus === 'submitted' ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-black hover:bg-zinc-200 active:scale-95'}`}
                                >
                                    <Upload className="w-4 h-4" />
                                    {statusInfo.isClosed && !statusInfo.submitted ? 'Plazo Expirado' : myStatus === 'submitted' ? 'Actualizar Entrega' : 'Entregar Tarea'}
                                </button>
                            )}
                            {user.role === UserRole.TEACHER && (<button onClick={() => openGradingModal(assign)} className="px-6 py-3 border border-zinc-700 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors font-medium text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Gestionar Notas</button>)}
                        </div>
                    </div>
                )})}
                {(!course.assignments || course.assignments.length === 0) && (<div className="text-center py-16 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800"><p className="text-zinc-500 font-medium">No se han programado entregas para este curso.</p></div>)}
            </div>
        )}
        
        {activeTab === 'students' && (
             <div className="space-y-4 animate-in fade-in">
                 <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                         <div className="flex items-center gap-4"><h3 className="text-white font-bold text-lg">Alumnos Matriculados</h3><span className="text-emerald-400 text-xs font-bold bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-900/50 flex items-center gap-2"><CheckCircle className="w-3 h-3" />{course.students?.length || 0} Matriculados</span></div>
                         {user.role === UserRole.TEACHER && (<button onClick={() => setShowAddStudentModal(true)} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-colors"><Plus className="w-4 h-4"/> Matricular Alumno</button>)}
                     </div>
                     {isLoadingStudents ? (<div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>) : enrolledStudents.length === 0 ? (<p className="text-zinc-500 italic text-center py-10">No hay estudiantes registrados en este programa.</p>) : (
                         <div className="overflow-hidden rounded-xl border border-zinc-800">
                            <table className="w-full text-left">
                                <thead className="bg-black text-zinc-500 text-xs uppercase font-bold"><tr><th className="p-4">Estudiante</th><th className="p-4 hidden md:table-cell">Contacto Académico</th><th className="p-4 text-right">Estado</th>{user.role === UserRole.TEACHER && <th className="p-4 text-right">Acciones</th>}</tr></thead>
                                <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                                    {enrolledStudents.map((student, idx) => {
                                        const isInvited = student.status === 'invited';
                                        return (
                                        <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-3"><img src={student.avatar} className={`w-8 h-8 rounded-full border border-zinc-700 object-cover ${isInvited ? 'grayscale opacity-50' : ''}`} alt="" /><div><p className="text-white font-bold text-sm">{student.name}</p></div></div></td>
                                            <td className="p-4 text-zinc-500 text-xs font-mono hidden md:table-cell"><div className="flex flex-col"><span>{student.email}</span><span className="text-zinc-600 mt-0.5">{student.phone || '—'}</span></div></td>
                                            <td className="p-4 text-right"><span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border ${isInvited ? 'bg-amber-950/20 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{isInvited ? 'Invitado' : 'Matriculado'}</span></td>
                                            {user.role === UserRole.TEACHER && (<td className="p-4 text-right"><button onClick={() => handleRemoveStudent(student.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors" title="Retirar"><Trash2 className="w-4 h-4"/></button></td>)}
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                         </div>
                     )}
                 </div>
             </div>
        )}

        {activeTab === 'diplomas' && user.role === UserRole.TEACHER && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <div className="flex items-start justify-between mb-6">
                         <div><h3 className="text-white font-bold text-xl mb-1 flex items-center gap-2"><Award className="w-6 h-6 text-amber-500"/> Certificación de Egresados</h3><p className="text-zinc-400 text-sm">Carga los diplomas oficiales para generar links de verificación pública.</p></div>
                         <button onClick={handleUploadDiplomas} disabled={diplomaFiles.length === 0 || isSubmitting} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}Emitir Títulos</button>
                    </div>
                    <div onClick={() => diplomaInputRef.current?.click()} className="border-2 border-dashed border-zinc-800 bg-black/50 hover:bg-zinc-900/50 hover:border-zinc-600 rounded-xl p-10 text-center cursor-pointer transition-all group mb-8"><CloudUpload className="w-12 h-12 mx-auto mb-4 text-zinc-600 group-hover:text-white transition-colors"/><h4 className="text-white font-bold mb-2">Seleccionar archivos PDF</h4><p className="text-zinc-500 text-xs mb-4">El nombre del archivo será el nombre del alumno en el diploma</p>{diplomaFiles.length > 0 && (<div className="flex flex-wrap justify-center gap-2">{diplomaFiles.map((f, i) => (<span key={i} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs flex items-center gap-2"><FileText className="w-3 h-3"/> {f.name}</span>))}</div>)}<input type="file" multiple accept="application/pdf" ref={diplomaInputRef} className="hidden" onChange={handleDiplomaSelect}/></div>
                    {course.diplomas && course.diplomas.length > 0 && (
                        <div className="border border-zinc-800 rounded-xl overflow-hidden"><table className="w-full text-left"><thead className="bg-black text-zinc-500 text-xs uppercase font-bold"><tr><th className="p-4">Estudiante</th><th className="p-4">Fecha Emisión</th><th className="p-4 text-right">Enlace de Verificación</th></tr></thead><tbody className="divide-y divide-zinc-800 bg-zinc-900/30">{course.diplomas.map(dip => (<tr key={dip.id} className="hover:bg-zinc-800/50 transition-colors"><td className="p-4 font-medium text-white">{dip.studentName}</td><td className="p-4 text-zinc-500 text-xs font-mono">{dip.issueDate}</td><td className="p-4 text-right"><div className="flex justify-end items-center"><a href={dip.publicLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-white hover:bg-zinc-800 transition-all mr-2"><ExternalLink className="w-3 h-3"/> Ver Título</a><button onClick={() => { navigator.clipboard.writeText(dip.publicLink); alert("Link de verificación copiado."); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:border-emerald-900 transition-all"><Copy className="w-3 h-3"/> Link</button></div></td></tr>))}</tbody></table></div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* GLOBAL GRADES TABLE (SUMMARY VIEW) */}
      {showGlobalGradesTable && user.role === UserRole.TEACHER && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-7xl flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in duration-300">
                  <div className="p-10 border-b border-zinc-900 flex justify-between items-center bg-black/50">
                      <div>
                          <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                              <BarChart3 className="w-8 h-8 text-emerald-500"/> Libro de Calificaciones Académicas
                          </h3>
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">{course.title} • Seguimiento de Rendimiento Global</p>
                      </div>
                      <button onClick={() => setShowGlobalGradesTable(false)} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all border border-zinc-800 shadow-lg"><X className="w-6 h-6"/></button>
                  </div>

                  <div className="flex-1 overflow-auto p-8 md:p-12 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                          <thead>
                              <tr className="bg-zinc-900/50 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800">
                                  <th className="p-6 sticky left-0 bg-zinc-950 z-20">Estudiante</th>
                                  {course.assignments.map(asg => (
                                      <th key={asg.id} className="p-6 text-center border-l border-zinc-800/30">
                                          <div className="flex flex-col gap-1 items-center">
                                              <span className="truncate max-w-[120px]">{asg.title}</span>
                                              <span className="text-[8px] text-zinc-700">Máx: {asg.maxGrade}</span>
                                          </div>
                                      </th>
                                  ))}
                                  <th className="p-6 text-center border-l-2 border-zinc-700 bg-emerald-500/5">Cumplimiento %</th>
                                  <th className="p-6 text-right border-l border-zinc-800/30 bg-emerald-500/5">Dictamen</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                              {enrolledStudents.map(student => {
                                  let totalPointsObtained = 0;
                                  let totalPointsPossible = 0;
                                  
                                  return (
                                      <tr key={student.id} className="hover:bg-zinc-900/30 transition-colors group">
                                          <td className="p-6 sticky left-0 bg-zinc-950 group-hover:bg-zinc-900/50 z-20 border-r border-zinc-900 shadow-xl">
                                              <div className="flex items-center gap-4">
                                                  <img src={student.avatar} className="w-10 h-10 rounded-xl border border-zinc-800 shadow-sm" alt=""/>
                                                  <div>
                                                      <p className="text-white font-black text-sm">{student.name}</p>
                                                      <p className="text-[9px] text-zinc-600 font-bold uppercase truncate max-w-[150px]">{student.email}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          {course.assignments.map(asg => {
                                              const grade = asg.grades?.[student.id];
                                              const hasGrade = grade !== undefined && grade !== null;
                                              const hasSubmission = asg.submissions?.[student.id] === 'submitted';
                                              if (hasGrade) totalPointsObtained += grade;
                                              totalPointsPossible += asg.maxGrade;

                                              return (
                                                  <td key={asg.id} className="p-6 text-center border-l border-zinc-800/30">
                                                      {hasGrade ? (
                                                          <div className="flex flex-col items-center">
                                                              <span className={`text-sm font-black ${grade >= (asg.maxGrade * 0.7) ? 'text-emerald-400' : 'text-red-400'}`}>{grade}</span>
                                                              <div className="w-8 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                                                  <div className={`h-full ${grade >= (asg.maxGrade * 0.7) ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${(grade/asg.maxGrade)*100}%`}}></div>
                                                              </div>
                                                          </div>
                                                      ) : hasSubmission ? (
                                                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Revisando</span>
                                                      ) : (
                                                          <span className="text-xs text-zinc-800 font-bold">—</span>
                                                      )}
                                                  </td>
                                              );
                                          })}
                                          <td className="p-6 text-center border-l-2 border-zinc-700 bg-zinc-900/10">
                                              <div className="flex flex-col items-center gap-1">
                                                  <span className="text-lg font-black text-white">
                                                      {totalPointsPossible > 0 ? Math.round((totalPointsObtained / totalPointsPossible) * 100) : 0}%
                                                  </span>
                                                  <div className="flex gap-0.5">
                                                      {[...Array(5)].map((_, i) => {
                                                          const perc = (totalPointsObtained / totalPointsPossible) * 100;
                                                          return <div key={i} className={`w-3 h-1 rounded-full ${perc >= (i + 1) * 20 ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>;
                                                      })}
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-6 text-right bg-zinc-900/10">
                                              {totalPointsPossible > 0 ? (
                                                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${ (totalPointsObtained / totalPointsPossible) >= 0.7 ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' : 'bg-red-950/20 text-red-400 border-red-900/50'}`}>
                                                      {(totalPointsObtained / totalPointsPossible) >= 0.7 ? <div className="flex items-center gap-2 inline-flex"><TrendingUp className="w-3 h-3"/> APTO (APROBADO)</div> : <div className="flex items-center gap-2 inline-flex"><TrendingDown className="w-3 h-3"/> INSUFICIENTE</div>}
                                                  </span>
                                              ) : <span className="text-zinc-700 font-bold uppercase text-[9px]">Sin Evaluación</span>}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-10 border-t border-zinc-900 bg-black/30 flex justify-between items-center rounded-b-[3rem]">
                      <div className="flex gap-8">
                          <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Cumplimiento Académico &gt; 70%</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Riesgo de Reprobación</span>
                          </div>
                      </div>
                      <button onClick={() => window.print()} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95 flex items-center gap-3"><Download className="w-4 h-4"/> Exportar Reporte Final</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Add Student Modal */}
      {showAddStudentModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 animate-in zoom-in duration-200 shadow-2xl relative">
                  <button onClick={resetForms} className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full"><X className="w-4 h-4"/></button>
                  <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tighter">Matricular Alumnos</h3>
                  <p className="text-zinc-500 text-sm mb-6">Pega los correos electrónicos para invitar alumnos masivamente.</p>
                  
                  <textarea 
                    value={newStudentInput} 
                    onChange={(e) => setNewStudentInput(e.target.value)} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-mono text-xs h-40 focus:border-white focus:outline-none mb-4" 
                    placeholder="alumno1@qlase.edu&#10;alumno2@qlase.edu"
                  />
                  
                  {inviteStatus && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-bold mb-4 animate-in fade-in">
                          {inviteStatus}
                      </div>
                  )}

                  <button 
                    onClick={handleAddStudent} 
                    disabled={isSubmitting || !newStudentInput.trim()} 
                    className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 flex justify-center items-center gap-2 shadow-lg transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Procesar Matrícula Global
                  </button>
              </div>
          </div>
      )}

      {/* Configuration Modal */}
      {showEditCourseModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 sticky top-0 z-10 rounded-t-3xl">
                      <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Editar Configuración del Programa</h3>
                      <div className="flex items-center gap-4">
                        <button onClick={handleAIConfigFill} disabled={isGeneratingConfigAI} className="bg-blue-600/10 border border-blue-600/20 text-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                          {isGeneratingConfigAI ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Sincronizar IA
                        </button>
                        <button onClick={resetForms}><X className="w-6 h-6 text-zinc-500 hover:text-white"/></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar bg-[#050505]">
                      {/* Básico */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Título del Curso</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm font-bold"/></div>
                          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Sinopsis</label><textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs h-24"/></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Fecha Inicio</label><input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                            <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Fecha Fin</label><input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Horario Académico</label><input type="text" value={editSchedule} onChange={(e) => setEditSchedule(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                          <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Logo Institución (PNG)</label>
                            <div className="flex gap-4 items-center">
                                <button 
                                    onClick={() => logoUploadRef.current?.click()} 
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-700"
                                >
                                    Sustituir Logo
                                </button>
                                <input type="file" ref={logoUploadRef} onChange={handleLogoUpload} accept="image/png" className="hidden" />
                                {editInstitutionLogo && (
                                    <div className="h-10 w-10 bg-white rounded border border-zinc-800 overflow-hidden">
                                        <img src={editInstitutionLogo} className="h-full w-full object-contain" alt="Logo Preview" />
                                    </div>
                                )}
                            </div>
                          </div>
                          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Modalidad</label><div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800"><button onClick={() => setEditModality('virtual')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${editModality === 'virtual' ? 'bg-white text-black' : 'text-zinc-600'}`}>Virtual</button><button onClick={() => setEditModality('in-person')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${editModality === 'in-person' ? 'bg-white text-black' : 'text-zinc-600'}`}>Presencial</button></div></div>
                        </div>
                      </section>

                      {/* Académico */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-900">
                        <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Objetivos de Aprendizaje</label><textarea value={editObjectives} onChange={(e) => setEditObjectives(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs h-32" placeholder="Uno por línea..."/></div>
                        <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Requisitos Previos</label><textarea value={editRequirements} onChange={(e) => setEditRequirements(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-xs h-32" placeholder="Uno por línea..."/></div>
                      </section>

                      {/* Módulos & Rúbricas */}
                      <section className="space-y-8 pt-8 border-t border-zinc-900">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2"><List className="w-4 h-4"/> Pensum Académico</h3><button onClick={addModule} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"><Plus className="w-3 h-3"/> Nuevo Módulo</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{editModules.map((mod, idx) => (<div key={idx} className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 relative group"><button onClick={() => removeModule(idx)} className="absolute top-4 right-4 text-zinc-700 hover:text-red-500"><X className="w-4 h-4"/></button><input value={mod.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} className="w-full bg-transparent border-b border-zinc-800 py-1 text-white font-black text-sm mb-3 focus:outline-none"/><textarea value={mod.description} onChange={(e) => updateModule(idx, 'description', e.target.value)} className="w-full bg-black border border-zinc-900 rounded-lg p-2 text-zinc-500 text-[10px] h-16 resize-none"/></div>))}</div>
                      </section>

                      <section className="space-y-8 pt-8 border-t border-zinc-900">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2"><ListChecks className="w-4 h-4"/> Rúbrica de Evaluación Global</h3><div className="flex gap-2">{editRubric.length === 0 && (<button onClick={useDefaultRubricTemplate} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">Usar Plantilla</button>)}<button onClick={addRubricItem} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"><Plus className="w-3 h-3"/> Añadir Criterio</button></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{editRubric.map((item, idx) => (<div key={idx} className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800"><div className="flex justify-between items-center mb-3"><input value={item.criteria} onChange={(e) => updateRubricItem(idx, 'criteria', e.target.value)} className="bg-transparent border-b border-zinc-800 py-1 text-white font-bold text-sm focus:outline-none w-2/3" placeholder="Ej: Participación"/><input type="number" value={item.points} onChange={(e) => updateRubricItem(idx, 'points', parseInt(e.target.value))} className="bg-black border border-zinc-800 rounded-lg p-1.5 text-emerald-500 font-black text-xs w-14 text-center"/></div><textarea value={item.description} onChange={(e) => updateRubricItem(idx, 'description', e.target.value)} className="w-full bg-black border border-zinc-900 rounded-lg p-2 text-zinc-500 text-[10px] h-12 resize-none"/></div>))}</div>
                      </section>
                  </div>

                  <div className="p-8 border-t border-zinc-900 bg-zinc-950 flex justify-end items-center rounded-b-3xl">
                      <button onClick={handleEditCourse} disabled={isSubmitting} className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95 flex items-center gap-3">
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} GUARDAR TODA LA CONFIGURACIÓN
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Virtual Class Integration */}
      <div className="grid grid-cols-1 gap-8">
          {course.modality === 'virtual' && course.meetingUrl && (
              <div className="bg-blue-950/10 border border-blue-900/30 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"><div className="flex items-center gap-4"><div className="p-4 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20 animate-pulse"><Video className="w-6 h-6 text-white"/></div><div><h3 className="text-lg font-bold text-white mb-1">Sala Virtual Síncrona</h3><p className="text-zinc-400 text-sm">Sesión en vivo vía Google Meet / QLASE Video</p></div></div><div className="flex flex-col items-end gap-2"><a href={course.meetingUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg flex items-center gap-2">{user.role === UserRole.TEACHER ? 'Iniciar Sesión' : 'Unirse Ahora'} <ExternalLink className="w-4 h-4"/></a><p className="text-[10px] text-zinc-500">Se abrirá en una nueva ventana cifrada.</p></div></div>
          )}

          {course.modality === 'in-person' && course.locationDetails && (
              <div className="bg-orange-950/10 border border-orange-900/30 p-6 rounded-2xl flex items-center gap-6 shadow-sm"><div className="p-4 bg-orange-600 rounded-full shadow-lg shadow-orange-600/20"><MapPin className="w-6 h-6 text-white"/></div><div><h3 className="text-lg font-bold text-white mb-1">Ubicación Física de Clase</h3><div className="flex flex-wrap gap-4 text-sm text-zinc-300"><span className="font-bold">{course.locationDetails.campus || 'Campus Matriz'}</span><span>•</span><span>Bloque: {course.locationDetails.building || '—'}</span><span>•</span><span>Aula: {course.locationDetails.room || '—'}</span></div></div></div>
          )}
      </div>

      {/* Add Material Modal */}
      {showMaterialModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 shadow-2xl">
                  <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-lg">Subir Material Didáctico</h3><button onClick={resetForms}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button></div>
                  
                  {/* Advertencia de Almacenamiento */}
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-emerald-500"/>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Capacidad Docente: {storageUsedGB} / {storageLimitGB} GB
                      </div>
                  </div>

                  <div className="space-y-4"><input type="text" placeholder="Título descriptivo del recurso" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-white focus:outline-none text-sm transition-colors font-medium" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}/><select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-white focus:outline-none text-sm transition-colors font-medium" value={newItemType} onChange={(e) => setNewItemType(e.target.value as any)}><option value="pdf">Documento PDF / Archivo</option><option value="video">Grabación / Video Externo</option><option value="link">Enlace Académico Web</option></select>
                  {newItemType === 'link' ? (<div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input type="text" placeholder="https://" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-white focus:outline-none text-sm transition-colors font-medium" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)}/></div>) : (<><div onClick={triggerFileSelect} className={`p-8 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer bg-black/50 ${selectedFile ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-zinc-800 hover:border-zinc-500 hover:text-white text-zinc-500'}`}>{selectedFile ? (<><CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500"/><p className="text-xs font-bold text-white">{selectedFile.name}</p><p className="text-[10px] text-emerald-400 mt-1">Listo para procesar</p></>) : (<><Upload className="w-8 h-8 mx-auto mb-2"/><p className="text-xs font-medium">Click para cargar archivo del curso</p></>)}</div><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect}/></>)}
                  <button onClick={handleAddMaterial} disabled={isSubmitting} className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 flex justify-center items-center gap-2 shadow-lg transition-all mt-2 uppercase tracking-widest text-xs">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Guardar Recurso en la Nube"}</button></div>
              </div>
          </div>
      )}

      {/* Add Assignment Modal */}
      {showAssignmentModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                   <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-lg uppercase tracking-tighter">Nuevo Reto Académico</h3><button onClick={resetForms}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button></div>
                  <div className="space-y-4">
                      <input type="text" placeholder="Título de la tarea o examen" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-white focus:outline-none text-sm transition-colors font-bold" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}/>
                      <textarea placeholder="Descripción del reto, instrucciones y recursos necesarios..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-white focus:outline-none text-sm min-h-[100px] resize-none transition-colors font-medium" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)}/>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-zinc-500 ml-1 tracking-[0.2em]">Cierre Máximo (Fecha y Hora)</label>
                          <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white z-10"/>
                              <input 
                                type="datetime-local" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-white focus:outline-none text-sm transition-colors font-bold [&::-webkit-calendar-picker-indicator]:invert shadow-inner" 
                                value={newItemDate} 
                                onChange={(e) => setNewItemDate(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                              />
                          </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rúbrica de Calificación</h4>
                              <div className="flex gap-2">
                                <button onClick={useGenericAssignmentRubric} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded border border-zinc-700 transition-colors uppercase font-bold">Plantilla</button>
                                <button onClick={handleGenerateRubric} disabled={isGeneratingRubric} className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">{isGeneratingRubric ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} IA</button>
                              </div>
                          </div>
                          {generatedRubric.length > 0 ? (
                              <div className="space-y-2">
                                  {generatedRubric.map((item, idx) => (
                                      <div key={idx} className="text-xs bg-black p-2 rounded border border-zinc-800">
                                          <div className="flex justify-between font-bold text-white mb-1">
                                              <span>{item.criteria}</span>
                                              <span className="text-emerald-400">{item.points} pts</span>
                                          </div>
                                          <p className="text-zinc-500 leading-tight">{item.description}</p>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-[10px] text-zinc-600 text-center py-2 italic">Define criterios para orientar al alumno.</p>
                          )}
                      </div>
                      <button onClick={handleAddAssignment} disabled={isSubmitting} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 flex items-center justify-center gap-3 shadow-2xl transition-all mt-2 uppercase tracking-[0.3em] text-xs">
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} ASIGNAR RETO AL GRUPO
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Student Submit Modal */}
      {showSubmitModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <button onClick={resetForms} className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full"><X className="w-4 h-4"/></button>
                  <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Entregar Reto Académico</h3>
                  <p className="text-zinc-500 text-sm mb-6">{selectedAssignment.title}</p>
                  
                  <div className="space-y-6">
                      <div onClick={() => fileInputRef.current?.click()} className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${submissionFiles.length > 0 ? 'border-emerald-500 bg-emerald-950/10' : 'border-zinc-800 hover:border-zinc-600 bg-black/50'}`}>
                          {submissionFiles.length > 0 ? (
                              <>
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500"/>
                                <p className="text-sm font-bold text-white">{submissionFiles.length} archivos para envío</p>
                                <div className="mt-2 space-y-1">
                                    {submissionFiles.map((f, i) => (
                                        <p key={i} className="text-[10px] text-emerald-400 truncate">{f.name}</p>
                                    ))}
                                </div>
                              </>
                          ) : (
                              <>
                                <Upload className="w-10 h-10 mx-auto mb-2 text-zinc-600"/>
                                <p className="text-sm text-zinc-500 font-bold">Seleccionar archivos (ZIP, PDF, Docs...)</p>
                                <p className="text-[9px] text-zinc-700 uppercase mt-1">Se descontará del plan de almacenamiento del Docente</p>
                              </>
                          )}
                          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleSubmissionFileSelect}/>
                      </div>

                      <button 
                        onClick={handleStudentSubmit} 
                        disabled={isSubmitting || submissionFiles.length === 0}
                        className="w-full bg-emerald-500 text-black font-black py-4 rounded-xl hover:bg-emerald-400 flex justify-center items-center gap-2 shadow-lg transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                      >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4"/>} Confirmar y Enviar Reto
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 sticky top-0 z-10 rounded-t-3xl">
                      <div>
                        <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Módulo de Evaluación y Feedback</h3>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Calificando: {selectedAssignment.title}</p>
                      </div>
                      <button onClick={resetForms} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6"/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
                      {isLoadingStudents ? (
                          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                      ) : enrolledStudents.length === 0 ? (
                          <p className="text-zinc-500 italic text-center py-10">No hay estudiantes por calificar.</p>
                      ) : (
                          <div className="space-y-4">
                              {enrolledStudents.map(student => {
                                  const status = selectedAssignment.submissions?.[student.id] || 'pending';
                                  const contentUrls = selectedAssignment.submissionContent?.[student.id] || [];
                                  const subInfo = getAssignmentStatusInfo(selectedAssignment, student.id);
                                  
                                  return (
                                      <div key={student.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-6 hover:bg-zinc-900 transition-colors">
                                          <div className="flex items-center justify-between gap-6">
                                              <div className="flex items-center gap-4 flex-1">
                                                  <img src={student.avatar} className="w-12 h-12 rounded-xl object-cover border border-zinc-800" alt=""/>
                                                  <div>
                                                      <p className="text-white font-black text-sm">{student.name}</p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${status === 'submitted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-600 border-zinc-800'}`}>
                                                              {status === 'submitted' ? 'Entregado' : 'Pendiente'}
                                                          </span>
                                                          {status === 'submitted' && (
                                                              <span className={`text-[8px] font-bold uppercase ${subInfo.color}`}>{subInfo.label}</span>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                              
                                              {/* ARCHIVOS LADO A LADO EN GESTION DE NOTAS - CON PREVIEW */}
                                              <div className="flex items-center gap-4">
                                                  {contentUrls.length > 0 && (
                                                      <div className="flex flex-wrap gap-3">
                                                          {contentUrls.map((url, i) => (
                                                              <FileDisplayCard key={i} url={url} index={i} showPreview={true} />
                                                          ))}
                                                      </div>
                                                  )}
                                                  <div className="flex items-center gap-2 bg-black border border-zinc-800 p-4 rounded-2xl shadow-inner">
                                                      <input 
                                                          type="number" 
                                                          min="0" 
                                                          max={selectedAssignment.maxGrade}
                                                          className="bg-transparent text-white font-black text-center w-16 focus:outline-none text-2xl"
                                                          value={tempGrades[student.id] !== undefined ? tempGrades[student.id] : ''}
                                                          onChange={(e) => {
                                                              const val = e.target.value;
                                                              const newGrades = { ...tempGrades };
                                                              if (val === '') {
                                                                  delete newGrades[student.id];
                                                              } else {
                                                                  newGrades[student.id] = parseInt(val) || 0;
                                                              }
                                                              setTempGrades(newGrades);
                                                          }}
                                                          placeholder="—"
                                                      />
                                                      <span className="text-zinc-700 font-bold text-xs">/ {selectedAssignment.maxGrade}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="bg-black/30 rounded-xl p-4 border border-zinc-800 shadow-inner">
                                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block flex items-center gap-2"><MessageCircle className="w-3 h-3"/> Feedback Académico</label>
                                              <textarea 
                                                className="w-full bg-transparent border-none text-zinc-300 text-xs focus:ring-0 resize-none h-16 leading-relaxed"
                                                placeholder="Indica puntos fuertes y áreas de mejora para el estudiante..."
                                                value={tempComments[student.id] || ''}
                                                onChange={(e) => setTempComments({...tempComments, [student.id]: e.target.value})}
                                              />
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>

                  <div className="p-8 border-t border-zinc-900 bg-zinc-950 flex justify-end rounded-b-3xl">
                      <button 
                        onClick={handleSaveGrades} 
                        disabled={isSubmitting} 
                        className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                      >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} PUBLICAR TODAS LAS NOTAS
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default CourseView;
