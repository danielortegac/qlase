
import React, { useState, useEffect } from 'react';
import { Users, Upload, Plus, Search, CheckCircle, AlertCircle, Sparkles, Save, RefreshCw, Mail, Download, Copy, MessageSquare, GraduationCap, School, X } from 'lucide-react';
import { User, UserRole, Course } from '../types';
import { DatabaseService } from '../services/db';

interface StudentsManagerProps {
    onNavigateToChat?: (user: User) => void;
}

const StudentsManager: React.FC<StudentsManagerProps> = ({ onNavigateToChat }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewFilter, setViewFilter] = useState<'student' | 'teacher'>('student');
  
  // Detailed View Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load students on mount
  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      setIsLoading(true);
      const [allUsers, courses] = await Promise.all([
          DatabaseService.getAllUsers(),
          DatabaseService.getCourses()
      ]);
      
      setStudents(allUsers.filter(u => u.role !== UserRole.ADMIN)); 
      setAllCourses(courses);
      setIsLoading(false);
  };

  const getCourseNames = (courseIds: string[] | undefined) => {
      if (!courseIds || courseIds.length === 0) return '—';
      return courseIds.map(id => allCourses.find(c => c.id === id)?.title || 'Curso Desconocido').join(', ');
  };

  const filteredUsers = students.filter(s => 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      s.role === viewFilter
  );

  const handleSelectAll = () => {
      if (selectedIds.size === filteredUsers.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredUsers.map(s => s.id)));
      }
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleCopyEmails = () => {
      const emails = filteredUsers.filter(s => selectedIds.has(s.id)).map(s => s.email).join(', ');
      navigator.clipboard.writeText(emails);
      alert(`${selectedIds.size} correos copiados al portapapeles.`);
  };

  const handleDownloadCSV = () => {
      const headers = "Nombre,Email,Telefono,Rol,Estado,Cursos\n";
      const rows = filteredUsers
        .filter(s => selectedIds.size === 0 || selectedIds.has(s.id))
        .map(s => `${s.name},${s.email},${s.phone || 'N/A'},${s.role},${s.status},"${getCourseNames(s.ownedCourseIds)}"`).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'usuarios_qlase_admin.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleChatOpen = (user: User) => {
      if (onNavigateToChat) {
          onNavigateToChat(user);
      }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-20 lg:pb-0">
      
      {/* Header Actions - Responsive Layout */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-lg">
          <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-500"/> QLASE LMS Admin
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Gestión global de perfiles, matrículas y base de datos.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
               {/* View Toggle */}
               <div className="flex bg-black p-1 rounded-xl border border-zinc-800 w-full md:w-auto">
                   <button 
                    onClick={() => setViewFilter('student')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all ${viewFilter === 'student' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                   >
                       <GraduationCap className="w-4 h-4"/> Alumnos
                   </button>
                   <button 
                    onClick={() => setViewFilter('teacher')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all ${viewFilter === 'teacher' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                   >
                       <School className="w-4 h-4"/> Docentes
                   </button>
               </div>

               <div className="flex gap-3 w-full md:w-auto">
                   <div className="relative group flex-1 md:flex-none">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                       <input 
                          type="text" 
                          placeholder="Buscar usuario..." 
                          className="w-full md:w-64 bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-zinc-600 transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                   </div>
                   <button onClick={loadData} className="p-2.5 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white shrink-0">
                       <RefreshCw className="w-4 h-4"/>
                   </button>
               </div>
          </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-white hover:text-black transition-colors whitespace-nowrap">
              <Download className="w-4 h-4"/> Descargar CSV
          </button>
          <button onClick={handleCopyEmails} disabled={selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap">
              <Copy className="w-4 h-4"/> Copiar Emails ({selectedIds.size})
          </button>
          <button disabled={selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap">
              <Mail className="w-4 h-4"/> Mensaje Masivo ({selectedIds.size})
          </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-black text-zinc-500 text-[10px] uppercase tracking-wider font-bold sticky top-0 z-10">
                    <tr>
                        <th className="p-4 w-10">
                            <input type="checkbox" checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} className="rounded border-zinc-700 bg-zinc-900"/>
                        </th>
                        <th className="p-4">Usuario / Rol</th>
                        <th className="p-4">Contacto (Real)</th>
                        <th className="p-4">Historial Académico</th>
                        <th className="p-4 text-right">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {isLoading ? (
                        <tr><td colSpan={6} className="p-10 text-center text-zinc-500"><Sparkles className="w-6 h-6 animate-spin mx-auto mb-2"/> Cargando Base de Datos...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                         <tr><td colSpan={6} className="p-10 text-center text-zinc-500">No se encontraron usuarios.</td></tr>
                    ) : (
                        filteredUsers.map(student => (
                            <tr key={student.id} className={`hover:bg-zinc-800/30 transition-colors ${selectedIds.has(student.id) ? 'bg-zinc-800/20' : ''}`}>
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleSelection(student.id)} className="rounded border-zinc-700 bg-zinc-900"/>
                                </td>
                                <td className="p-4 cursor-pointer" onClick={() => setSelectedUser(student)}>
                                    <div className="flex items-center gap-3">
                                        <img src={student.avatar} className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0" alt=""/>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm hover:text-blue-400 transition-colors truncate max-w-[150px]">{student.name}</p>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${student.role === UserRole.TEACHER ? 'bg-purple-950/30 text-purple-400 border-purple-900/50' : 'bg-blue-950/30 text-blue-400 border-blue-900/50'}`}>
                                                {student.role === UserRole.TEACHER ? 'Docente' : 'Alumno'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col text-xs">
                                        <span className="text-zinc-300 font-mono mb-1 truncate max-w-[180px]">{student.email}</span>
                                        <span className="text-zinc-500 flex items-center gap-1 truncate">
                                            {student.phone ? `📞 ${student.phone}` : 'Sin teléfono'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-xs text-zinc-400 max-w-[200px] truncate leading-relaxed" title={getCourseNames(student.ownedCourseIds)}>
                                        {getCourseNames(student.ownedCourseIds)}
                                    </p>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${student.status === 'invited' ? 'bg-amber-950/20 text-amber-400 border-amber-900/50' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'}`}>
                                        {student.status === 'invited' ? 'Pendiente' : 'Activo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleChatOpen(student)}
                                        className="p-2 hover:bg-blue-900/20 rounded-lg text-zinc-500 hover:text-blue-400 transition-colors" 
                                        title="Enviar Mensaje"
                                    >
                                        <MessageSquare className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-8 animate-in zoom-in duration-200 shadow-2xl relative">
                  <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full"><X className="w-4 h-4"/></button>
                  
                  <div className="flex flex-col items-center mb-6">
                      <img src={selectedUser.avatar} alt="" className="w-24 h-24 rounded-full border-4 border-zinc-800 mb-4 object-cover shadow-xl"/>
                      <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                      <p className="text-zinc-500 text-sm mb-2">{selectedUser.email}</p>
                      <span className="text-xs font-bold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-wider text-zinc-400">
                          {selectedUser.role}
                      </span>
                  </div>

                  <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 mb-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-zinc-500 text-[10px] uppercase font-bold">Título</p>
                              <p className="text-white font-medium">{selectedUser.title || 'No definido'}</p>
                          </div>
                          <div>
                              <p className="text-zinc-500 text-[10px] uppercase font-bold">Ubicación</p>
                              <p className="text-white font-medium">{selectedUser.location || 'No definida'}</p>
                          </div>
                      </div>
                      <div>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Biografía</p>
                          <p className="text-zinc-300 text-xs leading-relaxed">{selectedUser.bio || 'Sin biografía.'}</p>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors text-sm">Cerrar</button>
                      <button 
                        onClick={() => {
                            handleChatOpen(selectedUser);
                            setSelectedUser(null);
                        }}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
                      >
                          <MessageSquare className="w-4 h-4"/> Abrir Chat
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentsManager;
