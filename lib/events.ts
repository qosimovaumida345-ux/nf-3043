import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var globalNotificationEmitter: EventEmitter | undefined;
}

export interface NewSubmissionEvent {
  submissionId: string;
  studentId: string;
  studentName: string;
  taskTitle: string;
  submittedAt: string;
  imageUrl: string;
}

export const notificationEmitter =
  globalThis.globalNotificationEmitter || new EventEmitter();

// Node.js jarayoni davomida yagona emitter nusxasini saqlash
globalThis.globalNotificationEmitter = notificationEmitter;
