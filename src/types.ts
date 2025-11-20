export interface PrintedCard {
  id: string;
  text: string;
  timestamp: string;
  x: number;
  y: number;
  rotation: number;
  dueDate?: string; // ISO string
  isCompleted?: boolean;
}

export interface BeeperState {
  status: 'idle' | 'typing' | 'processing' | 'printing';
  message: string;
}