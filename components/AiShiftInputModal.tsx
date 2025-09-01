import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, Type } from "@google/genai";
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { MicrophoneIcon } from './icons/MicrophoneIcon.tsx';
import { XMarkIcon } from './icons/XMarkIcon.tsx';
import { WorkShift } from '../types.ts';

interface AiShiftInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (shifts: { shift1: WorkShift; shift2?: WorkShift }) => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const AiShiftInputModal: React.FC<AiShiftInputModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { addNotification } = useNotifications();

  const isApiReady = !!process.env.API_KEY && !!SpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition || !isOpen) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.lang = i18n.language;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processTranscript(finalTranscript);
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      addNotification(t('notifications.aiVoiceError', { error: event.error }), 'error');
      setIsRecording(false);
    };
  }, [isOpen, i18n.language]);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e: any) {
        addNotification(t('notifications.aiRecordingError'), 'error');
      }
    }
  };

  const processTranscript = async (text: string) => {
    if (!text) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
      
      const schema = {
        type: Type.OBJECT,
        properties: {
          shift1: {
            type: Type.OBJECT,
            description: "First work shift. Mandatory.",
            properties: {
              start: { type: Type.STRING, description: 'The start time in HH:MM format (e.g., 09:00, 14:30)' },
              end: { type: Type.STRING, description: 'The end time in HH:MM format (e.g., 13:00, 22:15)' },
            },
            required: ['start', 'end'],
          },
          shift2: {
            type: Type.OBJECT,
            nullable: true,
            description: "Second work shift. Optional, only if explicitly mentioned.",
            properties: {
              start: { type: Type.STRING, description: 'The start time of the second shift in HH:MM format' },
              end: { type: Type.STRING, description: 'The end time of the second shift in HH:MM format' },
            },
          },
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following sentence and extract the work shifts. If there is only one shift, the "shift2" field must be null. Sentence: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      
      const parsedJson = JSON.parse(response.text);

      if (parsedJson.shift1 && parsedJson.shift1.start && parsedJson.shift1.end) {
        onComplete({
            shift1: parsedJson.shift1,
            shift2: parsedJson.shift2,
        });
        addNotification(t('notifications.aiShiftsUpdated'), 'success');
        onClose();
      } else {
         throw new Error(t('notifications.aiInvalidShiftError'));
      }
    } catch (error: any) {
      addNotification(`${t('notifications.errorImportingData', { error: 'IA' })}: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all text-center relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('modals.aiShiftInput.title')}</h2>
        
        {!isApiReady ? (
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-4">
              {t('modals.aiShiftInput.apiNotReady')}
            </p>
        ) : (
        <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6" dangerouslySetInnerHTML={{ __html: t('modals.aiShiftInput.description') }} />

            <button
              onClick={handleToggleRecording}
              disabled={isProcessing}
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-600
                ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-sky-600 hover:bg-sky-700'}
                ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : ''}
              `}
              aria-label={isRecording ? t('modals.aiShiftInput.stopRecording') : t('modals.aiShiftInput.startRecording')}
            >
              <MicrophoneIcon className="w-10 h-10 text-white" />
            </button>
            
            <div className="mt-6 h-12 flex items-center justify-center">
            {isProcessing ? (
                <p className="text-sky-600 dark:text-sky-400 animate-pulse">{t('modals.aiShiftInput.processing')}</p>
            ) : (
                <p className="text-slate-700 dark:text-slate-300 italic">"{transcript || t('modals.aiShiftInput.waiting')}"</p>
            )}
            </div>
        </>
        )}
      </div>
    </div>
  );
};