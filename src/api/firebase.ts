import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DevComment } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const COMMENTS_COLLECTION = 'dev_comments';

// Connection test on boot as required by Firestore integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice: client is running in offline mode.');
    }
  }
}
testConnection();

export const FirebaseService = {
  /**
   * Listen to real-time changes to the dev comments collection
   */
  subscribeToComments(
    onUpdate: (comments: DevComment[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    const colRef = collection(db, COMMENTS_COLLECTION);
    return onSnapshot(
      colRef,
      snapshot => {
        const comments: DevComment[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as DevComment;
          comments.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort newest first
        comments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        onUpdate(comments);
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, COMMENTS_COLLECTION);
        } catch (e) {
          if (onError && e instanceof Error) onError(e);
        }
      }
    );
  },

  /**
   * Fetch all comments once
   */
  async getComments(): Promise<DevComment[]> {
    try {
      const colRef = collection(db, COMMENTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const list: DevComment[] = [];
      snapshot.forEach(d => {
        list.push({ ...(d.data() as DevComment), id: d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COMMENTS_COLLECTION);
    }
  },

  /**
   * Add a new feedback comment
   */
  async addComment(
    data: Omit<DevComment, 'id' | 'createdAt'>
  ): Promise<DevComment> {
    const id = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newComment: DevComment = {
      id,
      content: data.content.trim(),
      authorName: data.authorName.trim(),
      authorRole: data.authorRole || 'Staff',
      tab: data.tab,
      targetDescription: data.targetDescription || 'Application screen',
      xPercent: Math.min(100, Math.max(0, Number(data.xPercent.toFixed(2)))),
      yPercent: Math.min(100, Math.max(0, Number(data.yPercent.toFixed(2)))),
      createdAt: now,
      updatedAt: now,
    };

    const docPath = `${COMMENTS_COLLECTION}/${id}`;
    try {
      await setDoc(doc(db, COMMENTS_COLLECTION, id), newComment);
      return newComment;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  /**
   * Update an existing comment's text
   */
  async updateComment(id: string, newContent: string): Promise<void> {
    const docPath = `${COMMENTS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, COMMENTS_COLLECTION, id);
      await updateDoc(docRef, {
        content: newContent.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(id: string): Promise<void> {
    const docPath = `${COMMENTS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, COMMENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },
};
