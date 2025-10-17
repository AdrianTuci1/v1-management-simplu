import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker înregistrat:', r);
    },
    onRegisterError(error) {
      console.log('Eroare la înregistrarea Service Worker:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {offlineReady ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Aplicația este gata offline!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Puteți folosi aplicația și fără conexiune la internet.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Actualizare disponibilă
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      O versiune nouă a aplicației este disponibilă.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateServiceWorker(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Actualizează acum
                      </button>
                      <button
                        onClick={close}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Mai târziu
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {offlineReady && (
                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

