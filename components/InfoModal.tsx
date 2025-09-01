import React from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from './icons/XMarkIcon.tsx';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Guía Rápida de la Aplicación
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar guía rápida"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-500 mb-2">Pestaña Jornada (Principal)</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Visualiza y edita los turnos del día seleccionado.</li>
              <li>Usa el selector de fecha (con calendario) para cambiar de día.</li>
              <li>Registra hasta dos turnos por día (inicio y fin).</li>
              <li>Botones "Actual" para rellenar rápidamente la hora actual (redondeada a 15 min).</li>
              <li>Marca si el "Pago Pendiente" para la jornada actual.</li>
              <li>Ve un resumen de horas y ganancias del día.</li>
              <li>Botón "Siguiente" guarda la jornada actual y avanza al día siguiente.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-500 mb-2">Pestaña Pagos</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Muestra una lista de todas las jornadas con pagos pendientes.</li>
              <li>Indica el total acumulado de todos los pagos pendientes.</li>
              <li>Permite marcar individualmente cada jornada como "Pagada".</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-500 mb-2">Pestaña Gráficos</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Resumen de Ganancias del Mes:</strong> Gráfico de barras diarias.
                <ul className="list-circle list-inside pl-4">
                    <li>Navega entre meses con las flechas.</li>
                    <li>Muestra el total ganado en el mes visualizado.</li>
                    <li>Compara las ganancias diarias con tu meta diaria (si está configurada).</li>
                </ul>
              </li>
              <li><strong>Resumen de Ganancias por Mes:</strong> Gráfico de barras horizontales con el total de cada mes.
                <ul className="list-circle list-inside pl-4">
                    <li>Compara las ganancias mensuales con tu meta mensual (si está configurada).</li>
                </ul>
              </li>
              <li><strong>Informe Anual:</strong> Tabla y gráfico de barras con ganancias mensuales para un año específico.
                <ul className="list-circle list-inside pl-4">
                    <li>Navega entre años.</li>
                </ul>
              </li>
              <li>Todos los gráficos te permiten cambiar el tamaño (S, M, L) para una mejor visualización.</li>
            </ul>
          </section>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-semibold rounded-lg transition-colors duration-150"
            >
                {t('modals.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

// FIX: Add default export to comply with React.lazy expectation in WorkerView.tsx
export default InfoModal;
