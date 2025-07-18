import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Upload, FileVideo, Languages, Download, Clock, CheckCircle, AlertCircle, Loader2, Volume2, Music } from 'lucide-react';
import { NotificationCenter } from './components/NotificationCenter';
import { AlertDialog } from './components/AlertDialog';
import { useNotifications } from './hooks/useNotifications';
import { TranscriptionService } from './services/transcriptionService';

interface TranscriptionJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'processing' | 'transcribing' | 'translating' | 'completed' | 'error';
  progress: number;
  originalLanguage?: string;
  targetLanguage?: string;
  audioUrl?: string;
  error?: string;
  file?: File;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface AlertState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
}

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
];

function App() {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [dragActive, setDragActive] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const { showSuccess, showError, showWarning, showInfo, showProcessingToast } = useNotifications();

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showAlert = (type: AlertState['type'], title: string, message: string, onConfirm?: () => void) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        showError('Por favor, selecciona solo archivos de video');
        addNotification('error', 'Tipo de archivo inválido', `${file.name} no es un archivo de video válido`);
        return;
      }

      // Validate file size (1GB = 1024 * 1024 * 1024 bytes)
      if (file.size > 1024 * 1024 * 1024) {
        showError('El archivo es demasiado grande. Máximo 1GB permitido.');
        addNotification('error', 'Archivo demasiado grande', `${file.name} excede el límite de 1GB`);
        return;
      }

      const newJob: TranscriptionJob = {
        id: Date.now().toString() + Math.random(),
        fileName: file.name,
        fileSize: file.size,
        status: 'uploading',
        progress: 0,
        targetLanguage,
      };

      setJobs(prev => [...prev, newJob]);
      showInfo(`Iniciando procesamiento de ${file.name}`);
      addNotification('info', 'Nuevo archivo agregado', `${file.name} se ha agregado a la cola de procesamiento`);
      simulateProcessing(newJob.id);
    });
  };

  const simulateProcessing = async (jobId: string) => {
    try {
      const stages = [
        { status: 'uploading' as const, duration: 2000, progressEnd: 100 },
        { status: 'processing' as const, duration: 3000, progressEnd: 100 },
        { status: 'transcribing' as const, duration: 8000, progressEnd: 100 },
        { status: 'translating' as const, duration: 5000, progressEnd: 100 },
        { status: 'completed' as const, duration: 0, progressEnd: 100 },
      ];

      let currentStage = 0;
      const job = jobs.find(j => j.id === jobId);
      const fileName = job?.fileName || 'archivo';
      
      // Add random chance of error for demonstration (10% chance)
      if (Math.random() < 0.1) {
        setTimeout(() => {
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, status: 'error', error: 'Error de conexión con el servidor de IA' }
              : job
          ));
          showError(`Error procesando ${fileName}`);
          addNotification('error', 'Error de procesamiento', `Falló el procesamiento de ${fileName}`);
        }, 3000);
        return;
      }
      
      const processStage = () => {
        if (currentStage >= stages.length) return;

        const stage = stages[currentStage];
        
        // Show processing notification
        showProcessingToast(stage.status, fileName);
        
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: stage.status, progress: 0, originalLanguage: stage.status === 'transcribing' ? 'es' : job.originalLanguage }
            : job
        ));

        if (stage.status === 'completed') {
          showSuccess(`¡${fileName} completado con éxito!`);
          addNotification('success', 'Transcripción completada', `${fileName} ha sido transcrito y traducido correctamente`);
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, audioUrl: 'https://example.com/translated-audio.mp3' }
              : job
          ));
          return;
        }

        const interval = setInterval(() => {
          setJobs(prev => prev.map(job => {
            if (job.id !== jobId) return job;
            
            const newProgress = Math.min(job.progress + 10, stage.progressEnd);
            
            if (newProgress >= stage.progressEnd) {
              clearInterval(interval);
              currentStage++;
              setTimeout(processStage, 500);
            }
            
            return { ...job, progress: newProgress };
          }));
        }, stage.duration / 10);
      };

      processStage();
    } catch (error) {
      const job = jobs.find(j => j.id === jobId);
      const fileName = job?.fileName || 'archivo';
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'error', error: 'Error inesperado durante el procesamiento' }
          : job
      ));
      showError(`Error procesando ${fileName}`);
      addNotification('error', 'Error de procesamiento', `Falló el procesamiento de ${fileName}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDeleteJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    showAlert(
      'warning',
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${job.fileName}"?`,
      () => {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        showSuccess('Archivo eliminado correctamente');
        addNotification('info', 'Archivo eliminado', `${job.fileName} ha sido eliminado`);
      }
    );
  };

  const handleDownload = (job: TranscriptionJob) => {
    if (!job.audioUrl) return;
    
    showSuccess(`Descargando ${job.fileName}...`);
    addNotification('success', 'Descarga iniciada', `Descargando audio traducido de ${job.fileName}`);
    
    // Simulate download
    setTimeout(() => {
      showInfo('Descarga completada');
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'processing':
        return <FileVideo className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'transcribing':
        return <Volume2 className="w-5 h-5 text-purple-500 animate-pulse" />;
      case 'translating':
        return <Languages className="w-5 h-5 text-indigo-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Subiendo archivo...';
      case 'processing':
        return 'Extrayendo audio...';
      case 'transcribing':
        return 'Transcribiendo con IA...';
      case 'translating':
        return 'Traduciendo y sintetizando...';
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
      default:
        return 'Esperando...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VideoTranscribe AI</h1>
                <p className="text-sm text-gray-600">Transcripción y traducción inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markNotificationAsRead}
                onClearAll={clearAllNotifications}
              />
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4 text-gray-500" />
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Arrastra tus videos aquí o haz click para seleccionar
                </h3>
                <p className="text-gray-600 mb-4">
                  Soporta archivos de video hasta 1GB. Formatos: MP4, AVI, MOV, MKV
                </p>
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
                >
                  <FileVideo className="w-5 h-5" />
                  <span>Seleccionar Videos</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Transcripciones en Proceso
            </h2>
            
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{job.fileName}</h3>
                      <p className="text-sm text-gray-600">{formatFileSize(job.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {job.originalLanguage && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {languages.find(l => l.code === job.originalLanguage)?.name}
                        </span>
                        <span>→</span>
                        <span className="bg-blue-100 px-2 py-1 rounded">
                          {languages.find(l => l.code === job.targetLanguage)?.name}
                        </span>
                      </div>
                    )}
                    {job.status === 'completed' && job.audioUrl && (
                      <button 
                        onClick={() => handleDownload(job)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar MP3</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      {getStatusText(job.status)}
                    </span>
                    <span className="text-gray-600">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        job.status === 'completed' 
                          ? 'bg-green-500' 
                          : job.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {job.status === 'completed' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        ¡Transcripción completada con éxito!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      El audio ha sido transcrito, traducido y sintetizado manteniendo las características originales de voz.
                    </p>
                  </div>
                )}

                {job.status === 'error' && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">
                        Error en el procesamiento
                      </span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      {job.error || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Features Section */}
        {jobs.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Volume2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Preservación de Voz</h3>
              <p className="text-gray-600 text-sm">
                Mantiene el tono, acento y características únicas de la voz original
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Languages className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Múltiples Idiomas</h3>
              <p className="text-gray-600 text-sm">
                Traduce a más de 10 idiomas con precisión y naturalidad
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <FileVideo className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Archivos Grandes</h3>
              <p className="text-gray-600 text-sm">
                Procesa videos de hasta 1GB con tecnología avanzada de IA
              </p>
            </div>
          </div>
        )}
      </main>

      <AlertDialog
        isOpen={alert.isOpen}
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;