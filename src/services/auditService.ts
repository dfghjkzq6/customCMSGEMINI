import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum AuditAction {
  CREATE_POST = 'CREATE_POST',
  UPDATE_POST = 'UPDATE_POST',
  DELETE_POST = 'DELETE_POST',
  
  CREATE_MODEL = 'CREATE_MODEL',
  UPDATE_MODEL = 'UPDATE_MODEL',
  DELETE_MODEL = 'DELETE_MODEL',
  
  CREATE_CONNECTION = 'CREATE_CONNECTION',
  UPDATE_CONNECTION = 'UPDATE_CONNECTION',
  DELETE_CONNECTION = 'DELETE_CONNECTION',
  
  CREATE_PAGE = 'CREATE_PAGE',
  UPDATE_PAGE = 'UPDATE_PAGE',
  DELETE_PAGE = 'DELETE_PAGE',
  
  API_CALL = 'API_CALL',
  
  DYNAMIC_CREATE = 'DYNAMIC_CREATE',
  DYNAMIC_UPDATE = 'DYNAMIC_UPDATE',
  DYNAMIC_DELETE = 'DYNAMIC_DELETE',
}

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details: string;
  metadata?: any;
}

export const logAction = async (entry: AuditLogEntry) => {
  try {
    const user = auth.currentUser;
    const logData = {
      ...entry,
      timestamp: serverTimestamp(),
      userEmail: user?.email || 'anonymous@system.com',
      userId: user?.uid || 'anonymous',
    };

    await addDoc(collection(db, 'auditLogs'), logData);
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // We don't throw here to avoid breaking the main UI flow if logging fails
  }
};
