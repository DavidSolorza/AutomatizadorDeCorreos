/**
 * API local — toda la lógica que antes vivía en FastAPI corre en el navegador.
 * Casos, Gmail, reglas, métricas, auth y persistencia demo.
 */
export { handleMockRequest as handleLocalRequest } from '../mock/handler';
export {
  initDemoEngine,
  runDemoWelcomeSync,
  resetDemoEngine,
  persistDemoState,
  processDemoFullSync,
  processDemoMailboxSync,
  connectAllDemoMailboxes,
  simulateCustomEmail,
  simulateRandomDemoEmails,
} from '../mock/demo-engine';
