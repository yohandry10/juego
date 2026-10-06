export type EventHandler<T> = (event: T) => void;

export class EventBus<Events extends { [K in keyof Events]: unknown }> {
  private readonly handlers = new Map<keyof Events, Set<EventHandler<unknown>>>();

  on<Key extends keyof Events>(type: Key, handler: EventHandler<Events[Key]>): () => void {
    let listeners = this.handlers.get(type);
    if (!listeners) {
      listeners = new Set<EventHandler<unknown>>();
      this.handlers.set(type, listeners);
    }
    listeners.add(handler as EventHandler<unknown>);
    return () => listeners?.delete(handler as EventHandler<unknown>);
  }

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void {
    for (const handler of this.handlers.get(type) ?? []) handler(event);
  }
}
