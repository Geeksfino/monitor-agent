import { PrismaClient } from '@prisma/client';

export interface MonitorTriggerStrategy {
  /**
   * Called when a new segment is persisted.
   * Return true if the session should be sent to the monitor agent now.
   */
  onSegmentPersisted(sessionId: string, agentId: string, db: PrismaClient): Promise<boolean>;

  /**
   * Called periodically for timeout triggers, etc.
   * Return a list of session IDs to send.
   */
  onPeriodicCheck(db: PrismaClient): Promise<Array<{ sessionId: string, agentId: string }>>;

  /**
   * Optionally configure the strategy with custom config.
   */
  configure?(config: any): void;

  /**
   * Select which messages to send based on segments and config.
   */
  getMessagesToSend(segments: any[]): any[];
}
