/**
 * Minimal in-memory database adapter for ElizaOS.
 * Satisfies IDatabaseAdapter with no-op implementations.
 * Our actual data (tasks, logs, whale events) goes through store.ts/store.json.
 */
import type {
  IDatabaseAdapter,
  UUID,
  Account,
  Memory,
  Goal,
  GoalStatus,
  Actor,
  Participant,
  Relationship,
  RAGKnowledgeItem,
} from "@elizaos/core";

export class InMemoryDatabaseAdapter implements IDatabaseAdapter {
  db: any = null;

  async init(): Promise<void> {}
  async close(): Promise<void> {}
  async getAccountById(userId: UUID): Promise<Account | null> { return null; }
  async createAccount(account: Account): Promise<boolean> { return false; }
  async getMemories(_params: any): Promise<Memory[]> { return []; }
  async getMemoryById(_id: UUID): Promise<Memory | null> { return null; }
  async getMemoriesByIds(_ids: UUID[], _tableName?: string): Promise<Memory[]> { return []; }
  async getMemoriesByRoomIds(_params: any): Promise<Memory[]> { return []; }
  async getCachedEmbeddings(_params: any): Promise<any[]> { return []; }
  async log(_params: any): Promise<void> {}
  async getActorDetails(_params: any): Promise<Actor[]> { return []; }
  async searchMemories(_params: any): Promise<Memory[]> { return []; }
  async updateGoalStatus(_params: any): Promise<void> {}
  async searchMemoriesByEmbedding(_embedding: number[], _params: any): Promise<Memory[]> { return []; }
  async createMemory(_memory: Memory, _tableName: string, _unique?: boolean): Promise<void> {}
  async removeMemory(_memoryId: UUID, _tableName: string): Promise<void> {}
  async removeAllMemories(_roomId: UUID, _tableName: string): Promise<void> {}
  async countMemories(_roomId: UUID, _unique?: boolean, _tableName?: string): Promise<number> { return 0; }
  async getGoals(_params: any): Promise<Goal[]> { return []; }
  async updateGoal(_goal: Goal): Promise<void> {}
  async createGoal(_goal: Goal): Promise<void> {}
  async removeGoal(_goalId: UUID): Promise<void> {}
  async removeAllGoals(_roomId: UUID): Promise<void> {}
  async getRoom(_roomId: UUID): Promise<UUID | null> { return null; }
  async createRoom(_roomId?: UUID): Promise<UUID> { return crypto.randomUUID() as UUID; }
  async removeRoom(_roomId: UUID): Promise<void> {}
  async getRoomsForParticipant(_userId: UUID): Promise<UUID[]> { return []; }
  async getRoomsForParticipants(_userIds: UUID[]): Promise<UUID[]> { return []; }
  async addParticipant(_userId: UUID, _roomId: UUID): Promise<boolean> { return false; }
  async removeParticipant(_userId: UUID, _roomId: UUID): Promise<boolean> { return false; }
  async getParticipantsForAccount(_userId: UUID): Promise<Participant[]> { return []; }
  async getParticipantsForRoom(_roomId: UUID): Promise<UUID[]> { return []; }
  async getParticipantUserState(_roomId: UUID, _userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> { return null; }
  async setParticipantUserState(_roomId: UUID, _userId: UUID, _state: "FOLLOWED" | "MUTED" | null): Promise<void> {}
  async createRelationship(_params: any): Promise<boolean> { return false; }
  async getRelationship(_params: any): Promise<Relationship | null> { return null; }
  async getRelationships(_params: any): Promise<Relationship[]> { return []; }
  async getKnowledge(_params: any): Promise<RAGKnowledgeItem[]> { return []; }
  async searchKnowledge(_params: any): Promise<RAGKnowledgeItem[]> { return []; }
  async createKnowledge(_knowledge: RAGKnowledgeItem): Promise<void> {}
  async removeKnowledge(_id: UUID): Promise<void> {}
}

export function initializeDatabase(_dataDir: string): IDatabaseAdapter {
  return new InMemoryDatabaseAdapter();
}
