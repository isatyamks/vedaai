import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';

export interface IQuestion {
  _id?: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface ISection {
  _id?: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  additionalInstructions?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  sections: ISection[];
  sets?: { setName: string; sections: ISection[] }[];
  setCount?: number;
  chapters?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ISectionConfig {
  title: string;
  type: 'MCQ' | 'Short' | 'Long';
  count: number;
  marksPerQuestion: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface IActiveJob {
  assignmentId: string;
  status: IAssignment['status'];
  progress: number;
  message?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  additionalInstructions: string;
  sections: ISectionConfig[];
  setCount?: number;
  chapters?: string[];
}

interface AssignmentStore {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  isLoading: boolean;
  activeJob: IActiveJob | null;
  errorMessage: string | null;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'name';
  setSearchQuery: (q: string) => void;
  setSortBy: (s: 'newest' | 'oldest' | 'name') => void;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (payload: CreateAssignmentPayload) => Promise<string | null>;
  regenerateAssignment: (id: string, customSections?: ISectionConfig[]) => Promise<void>;
  editAssignment: (id: string, userPrompt: string) => Promise<void>;
  selectAssignment: (assignment: IAssignment | null) => void;
  clearActiveJob: () => void;
  setupSocketListener: (assignmentId: string) => void;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://vedaai-backend.vercel.app');
let socket: Socket | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  isLoading: false,
  activeJob: null,
  errorMessage: null,
  searchQuery: '',
  sortBy: 'newest',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),
  toast: null,

  showToast: (message, type = 'info') => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { message, type } });
    toastTimer = setTimeout(() => set({ toast: null }), 3000);
  },

  hideToast: () => {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    set({ toast: null });
  },

  fetchAssignments: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${API}/api/assignments`);
      if (!res.ok) throw new Error('Failed to load assignments.');
      const data: IAssignment[] = await res.json();
      set({ assignments: data });
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Error loading assignments.' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAssignmentDetails: async (id) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${API}/api/assignments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch assignment details.');
      const data: IAssignment = await res.json();
      set({ activeAssignment: data });
      return data;
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Error fetching details.' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createAssignment: async (payload) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${API}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to create assignment.');
      }

      const assignment: IAssignment = await res.json();

      set((state) => ({
        assignments: [assignment, ...state.assignments],
        activeJob: {
          assignmentId: assignment._id,
          status: assignment.status,
          progress: assignment.progress,
          message: assignment.status === 'completed'
            ? 'Test paper created successfully!'
            : 'Assignment queued for generation...',
        },
      }));

      get().setupSocketListener(assignment._id);
      return assignment._id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creating assignment.';
      set({ errorMessage: msg });
      get().showToast(msg, 'error');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  regenerateAssignment: async (id, customSections) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${API}/api/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: customSections ?? [] }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to trigger regeneration.');
      }

      const updated: IAssignment = await res.json();

      set((state) => ({
        activeAssignment: updated,
        assignments: state.assignments.map((a) => (a._id === id ? updated : a)),
        activeJob: {
          assignmentId: id,
          status: updated.status,
          progress: updated.progress,
          message: updated.status === 'completed'
            ? 'Regeneration completed successfully!'
            : 'Regeneration queued...',
        },
      }));

      get().setupSocketListener(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error during regeneration.';
      set({ errorMessage: msg });
      get().showToast(msg, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  editAssignment: async (id, userPrompt) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${API}/api/assignments/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to trigger AI edit.');
      }

      const updated: IAssignment = await res.json();

      set((state) => ({
        activeAssignment: updated,
        assignments: state.assignments.map((a) => (a._id === id ? updated : a)),
        activeJob: {
          assignmentId: id,
          status: updated.status,
          progress: updated.progress,
          message: updated.status === 'completed'
            ? 'AI Edit completed successfully!'
            : 'AI Edit queued...',
        },
      }));

      get().setupSocketListener(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error during AI edit.';
      set({ errorMessage: msg });
      get().showToast(msg, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  selectAssignment: (assignment) => {
    set({ activeAssignment: assignment, errorMessage: null });
  },

  clearActiveJob: () => {
    disconnectSocket();
    set({ activeJob: null });
  },

  setupSocketListener: (assignmentId) => {
    disconnectSocket();

    socket = io(API);

    socket.on('connect', () => {
      socket?.emit('join_assignment', assignmentId);
    });

    socket.on('progress_update', (data: IActiveJob) => {
      if (data.assignmentId !== assignmentId) return;

      set({ activeJob: data });

      if (data.status === 'completed' || data.status === 'failed') {
        disconnectSocket();
        get().fetchAssignments();
        get().fetchAssignmentDetails(assignmentId);
      }
    });
  },
}));
