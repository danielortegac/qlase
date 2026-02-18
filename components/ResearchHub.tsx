
import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Download, Upload, Tag, Book, GraduationCap, Loader2, CheckCircle, X, Trash2, Link as LinkIcon, Database, HardDrive, AlertTriangle, Share2, Copy, AlertCircle, Flag, Sparkles, UserCircle } from 'lucide-react';
import { Publication, User, UserRole } from '../types';
import { DatabaseService } from '../services/db';
import { STORAGE_LIMITS } from '../constants';
import ProfileView from './ProfileView';

const ResearchHub: React.FC<{ user: User }> = ({ user }) => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Paper' | 'Thesis' | 'Article'>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'link' | 'pdf'>('link');

  // Author Detail View State
  const [targetAuthor, setTargetAuthor] = useState<User | null>(null);

  // Formulario
  const [pubTitle, setPubTitle] = useState('');
  const [pubAbstract, setPubAbstract] = useState('');
  const [pubType, setPubType] = useState<'Paper' | 'Thesis' | 'Article'>('Paper');
  const [pubTags, setPubTags] = useState('');
  const [pubLink, setPubLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPubs();
  }, []);

  const loadPubs = async () => {
      const data = await DatabaseService.getPublications();
      setPublications(data);
  };

  const handleAuthorClick = async (authorId: string) => {
      const author = await DatabaseService.getUserById(authorId);
      if (author) {
          setTargetAuthor(author);
      } else {
          alert("El perfil de este autor no está disponible en este momento.");
      }
  };

  const resetForm = () => {
      setPubTitle('');
      setPubAbstract('');
      setPubTags('');
      setPubLink('');
      setPubType('Paper');
      setSelectedFile(null);
      setUploadMode('link');
      setIsUploadModalOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const checkUploadLimits = () => {
      if (user.isPremium) return true;
      
      const myPubs = publications.filter(p => p.authorId === user.id);
      if (myPubs.length >= 1) {
          alert("Límite alcanzado: El plan gratuito solo permite 1 publicación de investigación. Mejora a PRO para publicaciones ilimitadas.");
          return false;
      }
      return true;
  };

  const handleUpload = async () => {
    if (!pubTitle || !pubAbstract) return;
    if (!checkUploadLimits()) return;

    setIsUploading(true);
    
    let finalUrl = pubLink;
    let fileSize = 0;

    if (uploadMode === 'pdf' && selectedFile) {
        await new Promise(r => setTimeout(r, 1500));
        finalUrl = `https://storage.qlase.edu/research/${user.id}/${selectedFile.name}`;
        fileSize = selectedFile.size;
    }

    const tagsArray = pubTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const newPub: Publication = {
        id: `pub_${Date.now()}`, 
        title: pubTitle,
        authorId: user?.id || 'anon',
        author: user?.name || 'Académico QLASE',
        abstract: pubAbstract,
        date: new Date().toISOString().split('T')[0],
        tags: tagsArray.length > 0 ? tagsArray : ["Investigación"],
        downloads: 0,
        type: pubType,
        fileUrl: finalUrl || "https://storage.qlase.edu/papers/generic.pdf",
        timestamp: Date.now()
    };

    await DatabaseService.uploadPaper(newPub, fileSize);
    await loadPubs(); 
    setIsUploading(false);
    resetForm();
  };

  const handleReport = async (pub: Publication) => {
      const reason = window.prompt("Por favor, describe el motivo de la denuncia (plagio, contenido inapropiado, etc.):");
      if (reason) {
          await DatabaseService.sendReport({
              itemId: pub.id,
              itemType: 'publication',
              reason: reason,
              reportedBy: user.id
          });
          alert("Denuncia enviada al Administrador Académico de QLASE para revisión.");
      }
  };

  const handleShare = (pub: Publication) => {
      const publicLink = `${window.location.origin}${window.location.pathname}?view=research&id=${pub.id}`;
      navigator.clipboard.writeText(publicLink);
      alert("Enlace público copiado. Ahora cualquiera puede ver tu investigación.");
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("¿Eliminar esta publicación de QLASE permanentemente?")) {
          await DatabaseService.deletePublication(id);
          await loadPubs();
      }
  };

  const filteredPubs = publications.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            pub.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pub.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'All' || pub.type === filterType;
      return matchesSearch && matchesFilter;
  });

  const storageLimit = user?.isPremium ? STORAGE_LIMITS.PREMIUM : STORAGE_LIMITS.FREE;
  const storagePercentage = Math.min(((user?.storageUsed || 0) / storageLimit) * 100, 100);
  const storageFormatted = ((user?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2);
  const limitFormatted = (storageLimit / (1024 * 1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* PUBLIC AUTHOR PROFILE MODAL */}
      {targetAuthor && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[90] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar p-10 animate-in zoom-in duration-300 relative shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                       <h2 className="text-xl font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                           <UserCircle className="w-5 h-5 text-emerald-500"/> Perfil del Investigador
                       </h2>
                       <button onClick={() => setTargetAuthor(null)} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all">
                           <X className="w-6 h-6"/>
                       </button>
                  </div>
                  <ProfileView user={targetAuthor} onUpdateUser={() => {}} readOnly={true} />
                  <div className="mt-12 text-center">
                      <button onClick={() => setTargetAuthor(null)} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:bg-zinc-200 transition-all">Cerrar Perfil</button>
                  </div>
              </div>
          </div>
      )}

      <div className="relative rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800/50 overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl text-center md:text-left">
             <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                <div className="p-3 bg-white text-black rounded-2xl shadow-xl shadow-white/5 group-hover:scale-110 transition-transform"><GraduationCap className="w-6 h-6"/></div>
                <span className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">Centro de Investigación QLASE</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">Investigación Académica</h1>
             <p className="text-zinc-400 text-sm md:text-lg leading-relaxed font-medium max-w-xl">
                 Publica tus hallazgos académicos y comparte tu conocimiento con la red global de QLASE. Plan gratuito limitado a 1 publicación.
             </p>
        </div>
        <div className="relative z-10 flex flex-col gap-6 items-center">
            <button onClick={() => setIsUploadModalOpen(true)} className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-[2rem] hover:bg-zinc-200 transition-all shadow-[0_0_40px_-5px_rgba(255,255,255,0.2)] flex items-center gap-3 active:scale-95">
                <Upload className="w-4 h-4"/> Publicar Tesis / Paper
            </button>
            <div className="w-56 bg-black/60 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><HardDrive className="w-3 h-3"/> Nube QLASE</span>
                    <span className="text-[9px] font-black text-zinc-400">{storageFormatted} / {limitFormatted} GB</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${storagePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{width: `${storagePercentage}%`}}></div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative md:sticky md:top-0 z-20 bg-black/80 backdrop-blur-xl p-4 rounded-[2rem] border border-zinc-800 shadow-2xl">
         <div className="flex-1 relative group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-white transition-colors"/>
             <input type="text" placeholder="Buscar por título, autor, o palabras clave..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-zinc-600 transition-all font-bold text-sm uppercase tracking-wider"/>
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar bg-black/40 p-1 rounded-2xl border border-zinc-900">
             {['All', 'Paper', 'Thesis', 'Article'].map((type) => (
                 <button key={type} onClick={() => setFilterType(type as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type ? 'bg-white text-black shadow-lg' : 'text-zinc-600 hover:text-white'}`}>{type === 'All' ? 'Ver Todo' : type}</button>
             ))}
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {filteredPubs.length === 0 ? (
              <div className="text-center py-24 bg-zinc-900/10 border border-zinc-900 rounded-[3rem] border-dashed text-zinc-700"><Book className="w-16 h-16 mx-auto mb-6 opacity-5"/><p className="font-black uppercase tracking-[0.3em] text-xs">No se encontraron registros académicos</p></div>
          ) : (
              filteredPubs.map((pub) => (
                  <div key={pub.id} className="bg-[#070707] border border-zinc-900 p-8 rounded-[2.5rem] hover:border-zinc-600 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl">
                      <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
                          <div className="flex-1">
                              <div className="flex items-center gap-4 mb-5">
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${pub.type === 'Paper' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' : pub.type === 'Thesis' ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'}`}>{pub.type}</span>
                                  <span className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">{pub.date}</span>
                              </div>
                              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors leading-tight tracking-tight">{pub.title}</h3>
                              <p className="text-sm text-zinc-500 mb-8 leading-relaxed max-w-4xl line-clamp-3 font-medium">{pub.abstract}</p>
                              <div className="flex flex-wrap gap-3 items-center">
                                  <button 
                                    onClick={() => handleAuthorClick(pub.authorId)}
                                    className="text-xs font-black text-white mr-6 flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:bg-white hover:text-black transition-all group/author"
                                  >
                                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black border border-zinc-700 group-hover/author:border-black">{pub.author.charAt(0)}</div>
                                      <div className="text-left">
                                          <p className="text-[10px] text-zinc-500 uppercase tracking-tighter leading-none mb-0.5 group-hover/author:text-zinc-700">Ver Perfil</p>
                                          <p>{pub.author}</p>
                                      </div>
                                  </button>
                                  <div className="flex gap-2">
                                    {pub.tags.map(tag => ( <span key={tag} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-600 bg-black px-3 py-1.5 rounded-lg border border-zinc-900 tracking-tighter"><Tag className="w-3 h-3"/> {tag}</span> ))}
                                  </div>
                              </div>
                          </div>
                          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                              <a href={pub.fileUrl} target="_blank" className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl hover:bg-zinc-200 transition-all font-black text-xs uppercase tracking-widest shadow-xl"><Download className="w-4 h-4"/> Leer Documento</a>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleShare(pub)} className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-xl hover:text-white transition-all font-black text-[9px] uppercase tracking-widest"><Share2 className="w-3 h-3"/> Compartir</button>
                                <button onClick={() => handleReport(pub)} className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-xl hover:text-red-400 hover:border-red-900 transition-all font-black text-[9px] uppercase tracking-widest"><Flag className="w-3 h-3"/> Reportar</button>
                              </div>
                              {(pub.authorId === user?.id || user?.role === UserRole.ADMIN) && (
                                  <button onClick={() => handleDelete(pub.id)} className="flex items-center justify-center gap-2 px-8 py-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-2xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] mt-2 shadow-lg"><Trash2 className="w-4 h-4"/> Eliminar</button>
                              )}
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

      {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] w-full max-w-2xl p-10 animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-8 relative z-10"><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Publicar Investigación</h3><button onClick={resetForm} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button></div>
                  {!isUploading ? (
                    <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] text-center">
                            {user.isPremium ? "Modo Académico Pro Activo: Publicaciones Ilimitadas" : "Modo Gratuito: Límite de 1 investigación total."}
                        </div>
                        <div><label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-3 ml-1">Título de la Obra</label><input type="text" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:border-white transition-all font-bold text-sm" placeholder="Ej: Análisis Cuantitativo de Mercados..."/></div>
                        <div><label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-3 ml-1">Tipo de Publicación</label><div className="flex bg-black p-1 rounded-2xl border border-zinc-900">{['Paper', 'Thesis', 'Article'].map(type => (<button key={type} onClick={() => setPubType(type as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pubType === type ? 'bg-white text-black shadow-xl' : 'text-zinc-600 hover:text-white'}`}>{type === 'Paper' ? 'Ensayo' : type === 'Thesis' ? 'Tesis' : 'Artículo'}</button>))}</div></div>
                        <div><label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-3 ml-1">Resumen (Abstract)</label><textarea value={pubAbstract} onChange={(e) => setPubAbstract(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:border-white transition-all font-medium text-sm min-h-[120px] resize-none leading-relaxed" placeholder="Describe brevemente tu investigación..."/></div>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-1 ml-1">Archivo de Investigación</label>
                            <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                                <button onClick={() => setUploadMode('link')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'link' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>Enlace Externo</button>
                                <button onClick={() => setUploadMode('pdf')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'pdf' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>Subir PDF</button>
                            </div>
                            
                            {uploadMode === 'link' ? (
                                <div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600"/><input type="text" value={pubLink} onChange={(e) => setPubLink(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-white transition-all font-bold text-sm" placeholder="URL de Google Drive, Dropbox, etc."/></div>
                            ) : (
                                <div onClick={() => fileInputRef.current?.click()} className={`p-10 border-2 border-dashed rounded-[2rem] text-center cursor-pointer transition-all ${selectedFile ? 'border-emerald-500 bg-emerald-950/10 shadow-inner' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'}`}>
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center gap-3"><div className="p-3 bg-emerald-500 text-black rounded-2xl shadow-xl"><CheckCircle className="w-8 h-8"/></div><p className="text-emerald-400 font-black text-xs uppercase tracking-widest">{selectedFile.name}</p></div>
                                    ) : (
                                        <div className="text-zinc-600 text-xs font-black uppercase tracking-widest flex flex-col items-center gap-4"><Upload className="w-10 h-10 opacity-20"/><p>Arrastra tu tesis o paper en formato PDF</p></div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-6"><button onClick={resetForm} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:text-white hover:bg-zinc-800 transition-all">Cancelar</button><button onClick={handleUpload} disabled={!pubTitle || !pubAbstract || (uploadMode === 'pdf' && !selectedFile)} className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-all shadow-2xl disabled:opacity-50 active:scale-95">Publicar Ahora</button></div>
                    </div>
                  ) : (<div className="flex flex-col items-center justify-center py-20 space-y-8 animate-pulse"><div className="relative"><div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full"></div><div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div><Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-500"/></div><p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Certificando Publicación en QLASE...</p></div>)}
              </div>
          </div>
      )}
    </div>
  );
};

export default ResearchHub;
