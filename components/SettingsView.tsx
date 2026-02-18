
import React, { useState } from 'react';
import { Bell, Lock, Shield, Smartphone, Mail, User, Save, Loader2 } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock Settings State
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert("Configuración guardada en el servidor seguro.");
      }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20 md:pb-0 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Configuración</h1>

      <div className="space-y-8">
          {/* Notifications */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-zinc-400"/> Notificaciones
              </h2>
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4">
                          <Mail className="w-5 h-5 text-zinc-500"/>
                          <div>
                              <p className="text-white font-bold text-sm">Correos Electrónicos</p>
                              <p className="text-zinc-500 text-xs">Recibir actualizaciones de cursos y notas.</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4">
                          <Smartphone className="w-5 h-5 text-zinc-500"/>
                          <div>
                              <p className="text-white font-bold text-sm">Notificaciones Push</p>
                              <p className="text-zinc-500 text-xs">Alertas en tiempo real en la app.</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                  </div>
              </div>
          </section>

          {/* Security */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-zinc-400"/> Seguridad y Cuenta
              </h2>
              <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4">
                          <Lock className="w-5 h-5 text-zinc-500"/>
                          <div>
                              <p className="text-white font-bold text-sm">Autenticación de Dos Pasos (2FA)</p>
                              <p className="text-zinc-500 text-xs">Añade una capa extra de seguridad.</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                  </div>
                  
                  <button className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-left hover:border-zinc-600 transition-colors">
                      <p className="text-white font-bold text-sm">Cambiar Contraseña</p>
                      <p className="text-zinc-500 text-xs">Se enviará un enlace a tu correo.</p>
                  </button>
              </div>
          </section>

          <div className="flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
              >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  Guardar Cambios
              </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsView;
