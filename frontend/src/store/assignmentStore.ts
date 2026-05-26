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

interface IActiveJob {
  assignmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

interface AssignmentState {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  isLoading: boolean;
  activeJob: IActiveJob | null;
  showCreationForm: boolean;
  errorMessage: string | null;
  
  // Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (data: {
    title: string;
    subject: string;
    grade: string;
    dueDate: string;
    additionalInstructions: string;
    sections: ISectionConfig[];
  }) => Promise<string | null>;
  regenerateAssignment: (id: string, customSections?: ISectionConfig[]) => Promise<void>;
  selectAssignment: (assignment: IAssignment | null) => void;
  setCreationForm: (show: boolean) => void;
  clearActiveJob: () => void;
  setupSocketListener: (assignmentId: string) => void;
}

const BACKEND_URL = 'http://localhost:5000';
let socket: Socket | null = null;

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  isLoading: false,
  activeJob: null,
  showCreationForm: false,
  errorMessage: null,

  fetchAssignments: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments`);
      if (!res.ok) throw new Error('Failed to load assignments.');
      const data = await res.json();
      set({ assignments: data, isLoading: false });
    } catch (err: any) {
      set({ errorMessage: err.message || 'Error loading list.', isLoading: false });
    }
  },

  fetchAssignmentDetails: async (id: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch details.');
      const data = await res.json();
      set({ activeAssignment: data, isLoading: false });
      return data as IAssignment;
    } catch (err: any) {
      set({ errorMessage: err.message || 'Error fetching details.', isLoading: false });
      return null;
    }
  },

  createAssignment: async (formData) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit assignment creation.');
      }

      const assignment: IAssignment = await res.json();
      
      // Update state
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        activeJob: {
          assignmentId: assignment._id,
          status: 'queued',
          progress: 0,
          message: 'Assignment job added to server-side queue...',
        },
        showCreationForm: false,
        isLoading: false,
      }));

      // Bind Socket Connection immediately
      get().setupSocketListener(assignment._id);

      return assignment._id;
    } catch (err: any) {
      set({ errorMessage: err.message || 'Error saving assignment.', isLoading: false });
      return null;
    }
  },

  regenerateAssignment: async (id, customSections) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: customSections }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to trigger regeneration.');
      }

      const updatedAssignment = await res.json();

      set((state) => ({
        activeAssignment: updatedAssignment,
        assignments: state.assignments.map((a) => (a._id === id ? updatedAssignment : a)),
        activeJob: {
          assignmentId: id,
          status: 'queued',
          progress: 0,
          message: 'Regeneration job pushed to background queue...',
        },
        isLoading: false,
      }));

      get().setupSocketListener(id);
    } catch (err: any) {
      set({ errorMessage: err.message || 'Error during regeneration request.', isLoading: false });
    }
  },

  selectAssignment: (assignment) => {
    set({ activeAssignment: assignment, showCreationForm: false, errorMessage: null });
  },

  setCreationForm: (show) => {
    set({ showCreationForm: show, activeAssignment: null, errorMessage: null });
  },

  clearActiveJob: () => {
    set({ activeJob: null });
    // Clean socket listener
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  setupSocketListener: (assignmentId: string) => {
    // Terminate existing socket if open
    if (socket) {
      socket.disconnect();
    }

    console.log(`[Zustand Store] Establishing Socket connection to ${BACKEND_URL}`);
    socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log(`[Zustand Store] Socket connected. Joining room: ${assignmentId}`);
      socket?.emit('join_assignment', assignmentId);
    });

    socket.on('progress_update', (data: IActiveJob) => {
      console.log('[Zustand Store] Received websocket event:', data);
      
      if (data.assignmentId === assignmentId) {
        set({ activeJob: data });

        if (data.status === 'completed' || data.status === 'failed') {
          // Re-fetch assignments and active document details on completion
          get().fetchAssignments();
          get().fetchAssignmentDetails(assignmentId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('[Zustand Store] WebSocket disconnected.');
    });
  },
}));
