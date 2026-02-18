
import React, { useState } from 'react';
import { User, UserRole, BankAccount, SocialProfiles } from '../types';
import { DatabaseService } from '../services/db';
import { generateAIBio } from '../services/geminiService';
import { AI_COSTS } from '../constants';
import { MapPin, Globe, Briefcase, Award, Edit2, Save, CheckCircle, GraduationCap, Book, Loader2, Phone, User as UserIcon, MessageCircle, CreditCard, ExternalLink, Link as LinkIcon, Linkedin, Twitter, Sparkles, Mail, Plus, X, Zap } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  readOnly?: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Form State
  const [bio, setBio] = useState(user.bio || '');
  const [title, setTitle] = useState(user.title || '');
  const [titles, setTitles] = useState<string[]>(user.titles || []);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  
  // Social Profiles State
  const [researchGate, setResearchGate] = useState(user.socialProfiles?.researchGate || '');
  const [googleScholar, setGoogleScholar] = useState(user.socialProfiles?.googleScholar || '');
  const [linkedIn, setLinkedIn] = useState(user.socialProfiles?.linkedIn || '');
  const [twitter, setTwitter] = useState(user.socialProfiles?.twitter || '');

  const handleSave = async () => {
    setIsLoading(true);
    const updatedUser: User = {
        ...user,
        bio,
        title,
        titles,
        location,
        website,
        whatsapp,
        socialProfiles: {
            researchGate,
            googleScholar,
            linkedIn,
            twitter
        }
    };
    try {
        await DatabaseService.updateUserProfile(updatedUser);
        onUpdateUser(updatedUser);
        setIsEditing(false);
    } catch (e) { console.error("Error updating profile", e); } finally { setIsLoading(false); }
  };

  const handleGenerateBioWithAI = async () => {
      const currentCredits = user.aiCredits || 0;
      if (currentCredits < AI_COSTS.BIO_GENERATION) {
          alert("Créditos insuficientes. Sube al plan PRO para 50 créditos diarios.");
          return;
      }

      setIsGeneratingBio(true);
      try {
          const aiBio = await generateAIBio(user.name, title || "Académico", location || "el mundo");
          if (aiBio) {
              setBio(aiBio);
              await DatabaseService.deductCredits(user.id, AI_COSTS.BIO_GENERATION);
              onUpdateUser({ ...user, aiCredits: currentCredits - AI_COSTS.BIO_GENERATION });
          }
      } catch (e) {
          console.error("AI Bio Error", e);
      } finally {
          setIsGeneratingBio(false);
      }
  };

  const addTitle = () => {
      if (newTitleInput.trim()) {
          setTitles([...titles, newTitleInput.trim()]);
          setNewTitleInput('');
      }
  };

  const removeTitle = (index: number) => {
      setTitles(titles.filter((_, i) => i !== index));
  };

  const socialLinks = [
      { id: 'researchGate', label: 'ResearchGate', url: user.socialProfiles?.researchGate, icon: GraduationCap, color: 'text-blue-400' },
      { id: 'googleScholar', label: 'Google Scholar', url: user.socialProfiles?.googleScholar, icon: Sparkles, color: 'text-blue-500' },
      { id: 'linkedIn', label: 'LinkedIn', url: user.socialProfiles?.linkedIn, icon: Linkedin, color: 'text-sky-600' },
      { id: 'twitter', label: 'X / Twitter', url: user.socialProfiles?.twitter, icon: Twitter, color: 'text-white' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-10 px-4 md:px-0">
         <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden shadow-2xl flex-shrink-0">
             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
         </div>
         <div className="flex-1 w-full">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-2">
                 <div>
                     <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">{user.name}{<CheckCircle className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />}</h1>
                     <div className="flex flex-col gap-2">
                         {isEditing ? (
                             <div className="space-y-3">
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm w-full md:w-80" placeholder="Título Principal (ej: PhD in Science)"/>
                                <div className="flex gap-2">
                                    <input type="text" value={newTitleInput} onChange={(e) => setNewTitleInput(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs flex-1" placeholder="Añadir otro título académico..."/>
                                    <button onClick={addTitle} className="p-2 bg-white text-black rounded-lg"><Plus className="w-4 h-4"/></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {titles.map((t, idx) => (
                                        <span key={idx} className="bg-zinc-800 text-[10px] text-zinc-400 px-2 py-1 rounded flex items-center gap-2 border border-zinc-700">
                                            {t} <button onClick={() => removeTitle(idx)}><X className="w-3 h-3 hover:text-red-500"/></button>
                                        </span>
                                    ))}
                                </div>
                             </div>
                         ) : (
                             <div className="space-y-1">
                                <p className="text-zinc-400 text-lg font-medium">{title || "Sin título académico principal"}</p>
                                <div className="flex flex-wrap gap-2">
                                    {titles.map((t, idx) => (
                                        <span key={idx} className="text-xs text-zinc-500 italic bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">{t}</span>
                                    ))}
                                </div>
                             </div>
                         )}
                     </div>
                 </div>
                 {!readOnly && (
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            {isEditing ? (
                                <div className="flex gap-2"><button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white">Cancelar</button><button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 flex items-center gap-2 shadow-lg">{isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Guardar</button></div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 border border-zinc-800 bg-black hover:bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"><Edit2 className="w-4 h-4"/> Editar Perfil</button>
                            )}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                            <Zap className="w-3 h-3 text-amber-500"/> {user.aiCredits || 0} Créditos IA
                        </div>
                    </div>
                 )}
             </div>
             
             {/* Clickable Social Hub */}
             <div className="flex flex-wrap gap-4 mt-6">
                 {socialLinks.map(link => link.url ? (
                     <a 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener" 
                        className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 hover:border-zinc-500 hover:bg-zinc-800 transition-all group"
                     >
                         <link.icon className={`w-4 h-4 ${link.color} transition-transform group-hover:scale-110`}/>
                         <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{link.label}</span>
                         <ExternalLink className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                     </a>
                 ) : null)}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
          <div className="lg:col-span-2 space-y-8">
              <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Book className="w-4 h-4"/> Biografía Académica</h3>
                      {isEditing && (
                          <button 
                            onClick={handleGenerateBioWithAI}
                            disabled={isGeneratingBio || (user.aiCredits || 0) < AI_COSTS.BIO_GENERATION}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                                (user.aiCredits || 0) < AI_COSTS.BIO_GENERATION 
                                ? 'bg-zinc-900 text-zinc-700 border-zinc-800 cursor-not-allowed' 
                                : 'bg-amber-600/10 text-amber-500 border-amber-600/20 hover:bg-amber-600 hover:text-white'
                            }`}
                          >
                              {isGeneratingBio ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                              {(user.aiCredits || 0) < AI_COSTS.BIO_GENERATION && !user.isPremium ? "Sube a PRO para IA" : "Generar con IA (1 Cred)"}
                          </button>
                      )}
                  </div>
                  {isEditing ? <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white min-h-[150px] focus:outline-none text-sm leading-relaxed" placeholder="Describe tu trayectoria académica, áreas de investigación y pasiones..."/> : <p className="text-zinc-300 leading-relaxed text-sm md:text-base whitespace-pre-line">{bio || "Este docente aún no ha completado su biografía académica."}</p>}
              </section>
              
              {isEditing && (
                  <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-8 animate-in fade-in">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2"><Globe className="w-4 h-4"/> Enlaces Académicos y Sociales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">ResearchGate (URL)</label><input type="text" value={researchGate} onChange={(e) => setResearchGate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                          <div><label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Google Scholar (URL)</label><input type="text" value={googleScholar} onChange={(e) => setGoogleScholar(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                          <div><label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">LinkedIn (URL)</label><input type="text" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                          <div><label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">X / Twitter (URL)</label><input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs"/></div>
                      </div>
                  </section>
              )}
          </div>
          <div className="space-y-6">
               <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6">Detalles de Contacto</h3>
                   <div className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white" placeholder="Ciudad, País"/>
                                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white" placeholder="WhatsApp (Ej: 593987654321)"/>
                                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white" placeholder="Sitio Web Personal / Portafolio"/>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between text-xs items-center"><span className="text-zinc-500 font-bold uppercase tracking-tighter">Ubicación</span><span className="text-white font-medium flex items-center gap-2"><MapPin className="w-3 h-3 text-zinc-600"/> {location || 'No definida'}</span></div>
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tighter">WhatsApp</span>
                                    {whatsapp ? (
                                        <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-emerald-400 font-bold hover:underline flex items-center gap-2">
                                            <MessageCircle className="w-3 h-3"/> {whatsapp}
                                        </a>
                                    ) : <span className="text-zinc-700">No definido</span>}
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tighter">Correo Oficial</span>
                                    <a href={`mailto:${user.email}`} className="text-blue-400 font-bold hover:underline flex items-center gap-2 truncate max-w-[150px]">
                                        <Mail className="w-3 h-3"/> {user.email}
                                    </a>
                                </div>
                                {website && (
                                     <div className="flex justify-between text-xs items-center"><span className="text-zinc-500 font-bold uppercase tracking-tighter">Web</span><a href={website} target="_blank" className="text-white font-medium hover:text-emerald-400 flex items-center gap-2 truncate max-w-[150px]"><LinkIcon className="w-3 h-3"/> {website.replace('https://','')}</a></div>
                                )}
                            </>
                        )}
                   </div>
               </div>
               
               {/* Badges and Ranking */}
               <div className="bg-zinc-900/10 border border-zinc-800/30 rounded-2xl p-6 text-center">
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mb-4">Rango Académico QLASE</p>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-xs font-black border border-emerald-500/20">
                        {user.isPremium ? <Sparkles className="w-3 h-3"/> : null}
                        {user.isPremium ? "Docente Verificado PRO" : "Miembro Activo"}
                    </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default ProfileView;
