import type { Logger } from "../../logger.js";

export class Poller {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly intervalMs: number,
    private readonly task: () => Promise<void>,
    private readonly logger: Logger,
  ) {}

  start() {
    this.stop();
    this.timer = setInterval(() => {
      void this.task().catch((error) => {
        this.logger.error({ error }, "background refresh failed");
      });
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
