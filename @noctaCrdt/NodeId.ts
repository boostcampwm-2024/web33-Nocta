// NodeId.ts
export abstract class NodeId {
  clock: number;
  client: number;

  constructor(clock: number, client: number) {
    this.clock = clock;
    this.client = client;
  }

  equals(other: NodeId): boolean {
    return this.clock === other.clock && this.client === other.client;
  }

  serialize(): any {
    return {
      clock: this.clock,
      client: this.client,
    };
  }

  static deserialize(data: any): NodeId {
    throw new Error("Deserialize method should be implemented by subclasses");
  }
}

export class BlockId extends NodeId {
  constructor(clock: number, client: number) {
    super(clock, client);
  }

  static deserialize(data: any): BlockId {
    return new BlockId(data.clock, data.client);
  }
}

export class CharId extends NodeId {
  constructor(clock: number, client: number) {
    super(clock, client);
  }

  static deserialize(data: any): CharId {
    return new CharId(data.clock, data.client);
  }
}
