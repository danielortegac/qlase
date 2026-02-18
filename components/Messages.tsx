
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole, Course } from '../types';
import { DatabaseService } from '../services/db';
import { Send, Search, MoreVertical, Phone, Video, User as UserIcon, MessageSquare, Loader2, Users } from 'lucide-react';

interface MessagesProps {
  currentUser: User;
  initialChatUser?: User | null;
}

const Messages: React.FC<MessagesProps> = ({ currentUser, initialChatUser }) => {
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(initialChatUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      loadInitialData();
  }, []);

  useEffect(() => {
      if (initialChatUser) {
          setActiveChatUser(initialChatUser);
      }
  }, [initialChatUser]);

  useEffect(() => {
      if (activeChatUser) {
          loadMessagesForChat(activeChatUser.id);
          const interval = setInterval(() => loadMessagesForChat(activeChatUser.id), 5000);
          return () => clearInterval(interval);
      }
  }, [activeChatUser]);

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
      setIsLoading(true);
      try {
          const [allUsers, allCourses] = await Promise.all([
              DatabaseService.getAllUsers(),
              DatabaseService.getCourses()
          ]);

          let relevantUserIds = new Set<string>();

          if (currentUser.role === UserRole.TEACHER) {
              // Docente: ver alumnos de sus cursos
              const myCourses = allCourses.filter(c => c.instructorId === currentUser.id);
              myCourses.forEach(c => {
                  c.students?.forEach(sId => relevantUserIds.add(sId));
              });
          } else {
              // Estudiante: ver docentes de sus cursos
              const myCourses = allCourses.filter(c => c.students?.includes(currentUser.id));
              myCourses.forEach(c => {
                  if (c.instructorId) relevantUserIds.add(c.instructorId);
              });
          }

          // Super Admin override (opcional si quieres que ellos hablen con todos)
          const SUPER_ADMIN_EMAILS = ['deoc29@me.com', 'vaoc93@hotmail.com'];
          if (SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim())) {
              allUsers.forEach(u => relevantUserIds.add(u.id));
          }

          const filtered = allUsers.filter(u => u.id !== currentUser.id && relevantUserIds.has(u.id));
          setConversations(filtered);
      } catch (e) {
          console.error("Error loading chat data", e);
      } finally {
          setIsLoading(false);
      }
  };

  const loadMessagesForChat = async (otherUserId: string) => {
      const allMsgs = await DatabaseService.getMessages(currentUser.id);
      const relevant = allMsgs.filter(m => 
          (m.senderId === currentUser.id && m.receiverId === otherUserId) ||
          (m.senderId === otherUserId && m.receiverId === currentUser.id)
      );
      setMessages(relevant);
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !activeChatUser) return;
      
      const msgText = newMessage;
      setNewMessage('');
      
      const tempMsg: Message = {
          id: 'temp_' + Date.now(),
          senderId: currentUser.id,
          receiverId: activeChatUser.id,
          content: msgText,
          timestamp: Date.now(),
          read: false
      };
      setMessages(prev => [...prev, tempMsg]);

      await DatabaseService.sendMessage(currentUser.id, activeChatUser.id, msgText);
      await loadMessagesForChat(activeChatUser.id);
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayedUsers = conversations.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[85vh] flex bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
       {/* Sidebar */}
       <div className="w-full md:w-80 border-r border-zinc-900 flex flex-col bg-black">
           <div className="p-5 border-b border-zinc-900">
               <h2 className="text-xl font-bold text-white mb-4">Chat Académico</h2>
               <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3">Red de mis cursos</p>
               <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white"/>
                   <input 
                      type="text" 
                      placeholder="Buscar contacto..." 
                      className="w-full bg-zinc-900 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
               </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
               {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-10 gap-3">
                       <Loader2 className="w-5 h-5 text-zinc-500 animate-spin"/>
                       <span className="text-[10px] text-zinc-600 font-bold uppercase">Cargando Red...</span>
                   </div>
               ) : displayedUsers.length > 0 ? (
                   displayedUsers.map(user => (
                       <button 
                          key={user.id}
                          onClick={() => setActiveChatUser(user)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-900 transition-colors text-left border-b border-zinc-900/50 ${activeChatUser?.id === user.id ? 'bg-zinc-900 border-l-2 border-l-emerald-500' : ''}`}
                       >
                           <div className="relative">
                               <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-zinc-800" alt=""/>
                               <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${user.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
                           </div>
                           <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline mb-0.5">
                                   <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                                   <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${user.role === UserRole.TEACHER ? 'text-blue-400 border-blue-900/50 bg-blue-950/20' : 'text-zinc-500 border-zinc-800 bg-zinc-900'}`}>{user.role === UserRole.TEACHER ? 'Docente' : 'Alumno'}</span>
                               </div>
                               <p className="text-[10px] text-zinc-600 truncate uppercase tracking-tighter">Click para conversar</p>
                           </div>
                       </button>
                   ))
               ) : (
                   <div className="p-10 text-center">
                       <Users className="w-8 h-8 text-zinc-800 mx-auto mb-4"/>
                       <p className="text-zinc-600 text-xs font-medium leading-relaxed">No tienes contactos disponibles en tus cursos actuales.</p>
                   </div>
               )}
           </div>
       </div>

       {/* Chat Area */}
       {activeChatUser ? (
           <div className="flex-1 flex flex-col bg-zinc-950">
               <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-black/50 backdrop-blur-md">
                   <div className="flex items-center gap-3">
                       <img src={activeChatUser.avatar} className="w-10 h-10 rounded-full object-cover border border-zinc-800" alt=""/>
                       <div>
                           <h3 className="font-bold text-white text-sm">{activeChatUser.name}</h3>
                           <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Conectado
                           </p>
                       </div>
                   </div>
                   <div className="flex gap-2">
                       <button className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800"><Phone className="w-4 h-4"/></button>
                       <button className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800"><Video className="w-4 h-4"/></button>
                       <button className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800"><MoreVertical className="w-4 h-4"/></button>
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-black to-zinc-950">
                   {messages.map(msg => {
                       const isMe = msg.senderId === currentUser.id;
                       return (
                           <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm font-medium' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'}`}>
                                   {msg.content}
                                   <p className={`text-[9px] mt-2 text-right ${isMe ? 'text-emerald-200/50' : 'text-zinc-600'} font-mono uppercase`}>
                                       {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </p>
                               </div>
                           </div>
                       );
                   })}
                   <div ref={messagesEndRef} />
               </div>

               <div className="p-4 bg-black border-t border-zinc-900">
                   <div className="flex gap-3 items-center max-w-4xl mx-auto">
                       <input 
                          type="text" 
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder-zinc-700"
                          placeholder="Escribe un mensaje seguro..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                       />
                       <button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="p-4 bg-white text-black rounded-2xl hover:bg-emerald-500 hover:text-black disabled:opacity-30 transition-all active:scale-95 shadow-xl"
                       >
                           <Send className="w-5 h-5"/>
                       </button>
                   </div>
               </div>
           </div>
       ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-[#050505]">
               <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                   <MessageSquare className="w-10 h-10 opacity-10 text-white"/>
               </div>
               <h3 className="text-white font-bold mb-1">Tus Conversaciones</h3>
               <p className="text-xs font-medium">Selecciona un contacto de tus cursos para chatear</p>
           </div>
       )}
    </div>
  );
};

export default Messages;
