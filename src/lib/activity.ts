import { prisma } from './prisma';

export interface CreateActivityParams {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'EXECUTED' | 'COMMENTED' | 'ATTACHED' | 'VERSION_CREATED';
  entityType: 'TEST_CASE' | 'TEST_RUN' | 'TEST_PLAN' | 'TEST_CYCLE';
  entityId: string;
  userId: string;
  details?: Record<string, any>;
}

export async function createActivity(params: CreateActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    // Don't throw - activity logging shouldn't break the main operation
  }
}
