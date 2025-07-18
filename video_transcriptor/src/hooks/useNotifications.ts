import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle, Upload, FileVideo, Languages, Volume2 } from 'lucide-react';

export const useNotifications = () => {
  const showSuccess = useCallback((message: string, options?: any) => {
    toast.success(message, {
      duration: 4000,
      icon: '✅',
      style: {
        background: '#10B981',
        color: 'white',
        fontWeight: '500',
      },
      ...options,
    });
  }, []);

  const showError = useCallback((message: string, options?: any) => {
    toast.error(message, {
      duration: 6000,
      icon: '❌',
      style: {
        background: '#EF4444',
        color: 'white',
        fontWeight: '500',
      },
      ...options,
    });
  }, []);

  const showWarning = useCallback((message: string, options?: any) => {
    toast(message, {
      duration: 5000,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: 'white',
        fontWeight: '500',
      },
      ...options,
    });
  }, []);

  const showInfo = useCallback((message: string, options?: any) => {
    toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: 'white',
        fontWeight: '500',
      },
      ...options,
    });
  }, []);

  const showProcessingToast = useCallback((stage: string, fileName: string) => {
    const icons = {
      uploading: '📤',
      processing: '🎬',
      transcribing: '🎤',
      translating: '🌐',
      completed: '✅',
    };

    const messages = {
      uploading: `Subiendo ${fileName}...`,
      processing: `Extrayendo audio de ${fileName}...`,
      transcribing: `Transcribiendo ${fileName} con IA...`,
      translating: `Traduciendo y sintetizando ${fileName}...`,
      completed: `¡${fileName} completado con éxito!`,
    };

    toast(messages[stage as keyof typeof messages] || `Procesando ${fileName}...`, {
      duration: stage === 'completed' ? 4000 : 2000,
      icon: icons[stage as keyof typeof icons] || '⏳',
      style: {
        background: stage === 'completed' ? '#10B981' : '#3B82F6',
        color: 'white',
        fontWeight: '500',
      },
    });
  }, []);

  const showCustomToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const config = {
      success: { icon: '✅', bg: '#10B981' },
      error: { icon: '❌', bg: '#EF4444' },
      warning: { icon: '⚠️', bg: '#F59E0B' },
      info: { icon: 'ℹ️', bg: '#3B82F6' },
    };

    toast(message, {
      duration: 4000,
      icon: config[type].icon,
      style: {
        background: config[type].bg,
        color: 'white',
        fontWeight: '500',
      },
    });
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProcessingToast,
    showCustomToast,
  };
};