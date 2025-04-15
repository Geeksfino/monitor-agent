import { PrismaClient } from '@prisma/client';
import type { MonitorTriggerStrategy } from './MonitorTriggerStrategy';

let TURNS_THRESHOLD = 4;
let SEND_MODE: 'all' | 'delta' | 'window' = 'all';
let WINDOW_SIZE = 8;

const strategy: MonitorTriggerStrategy = {
  configure(config: any) {
    if (config && typeof config.turnsThreshold === 'number') {
      TURNS_THRESHOLD = config.turnsThreshold;
      console.log(`[Strategy] turnsThreshold set to ${TURNS_THRESHOLD} from config`);
    } else {
      console.log(`[Strategy] turnsThreshold defaulting to ${TURNS_THRESHOLD}`);
    }
    if (config && typeof config.sendMode === 'string') {
      SEND_MODE = config.sendMode as 'all' | 'delta' | 'window';
      console.log(`[Strategy] sendMode set to ${SEND_MODE} from config`);
    }
    if (config && typeof config.windowSize === 'number') {
      WINDOW_SIZE = config.windowSize;
      console.log(`[Strategy] windowSize set to ${WINDOW_SIZE} from config`);
    }
  },
  async onSegmentPersisted(sessionId, agentId, db) {
    const segments = await db.segment.findMany({ where: { sessionId, agentId } });
    const totalTurns = segments.reduce(
      (sum, seg) => sum + (Array.isArray(seg.messages) ? seg.messages.length : 0),
      0
    );
    console.log(`[Strategy] Session ${sessionId} for agent ${agentId} has ${totalTurns} turns (sendMode: ${SEND_MODE})`);
    return totalTurns >= TURNS_THRESHOLD;
  },

  // This method will be called by Monitor.ts to determine what messages to send
  getMessagesToSend(segments: any[]): any[] {
    if (SEND_MODE === 'all') {
      // Send all messages in all segments
      return segments.flatMap(seg => Array.isArray(seg.messages) ? seg.messages : []);
    } else if (SEND_MODE === 'delta') {
      // Send only messages in unsent segments
      return segments.filter(seg => seg.sent === false).flatMap(seg => Array.isArray(seg.messages) ? seg.messages : []);
    } else if (SEND_MODE === 'window') {
      // Send last WINDOW_SIZE messages (across all segments, ordered by timestamp)
      const allMessages = segments.flatMap(seg =>
        (Array.isArray(seg.messages) ? seg.messages.map((msg: any) => ({ ...msg, _ts: seg.timestamp })) : [])
      );
      allMessages.sort((a, b) => new Date(a._ts).getTime() - new Date(b._ts).getTime());
      return allMessages.slice(-WINDOW_SIZE).map(({ _ts, ...msg }) => msg);
    }
    // Default fallback: send all
    return segments.flatMap(seg => Array.isArray(seg.messages) ? seg.messages : []);
  },
  async onPeriodicCheck(db) {
    // No-op for this strategy
    return [];
  }
};

export default strategy;
