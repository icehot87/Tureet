'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  PlayCircle, 
  MessageSquare, 
  Paperclip,
  FileText 
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  details: any;
  createdAt: string;
}

interface ActivityLogProps {
  entityType?: 'TEST_CASE' | 'TEST_RUN' | 'TEST_PLAN' | 'TEST_CYCLE';
  entityId?: string;
  limit?: number;
}

export function ActivityLog({
  entityType,
  entityId,
  limit = 50,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      if (entityId) params.append('entityId', entityId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATED':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETED':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'EXECUTED':
        return <PlayCircle className="h-4 w-4 text-purple-600" />;
      case 'COMMENTED':
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case 'ATTACHED':
        return <Paperclip className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity): string => {
    const userName = activity.user.name || activity.user.email;
    const entityName = activity.entityType.toLowerCase().replace('_', ' ');

    switch (activity.type) {
      case 'CREATED':
        return `${userName} created ${entityName}`;
      case 'UPDATED':
        return `${userName} updated ${entityName}`;
      case 'DELETED':
        return `${userName} deleted ${entityName}`;
      case 'EXECUTED':
        return `${userName} executed test`;
      case 'COMMENTED':
        return `${userName} commented on ${entityName}`;
      case 'ATTACHED':
        return `${userName} attached a file`;
      case 'VERSION_CREATED':
        return `${userName} created a new version`;
      default:
        return `${userName} performed ${activity.type.toLowerCase()}`;
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading activity...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No activity yet
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-gray-50"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getActivityText(activity)}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {JSON.stringify(activity.details)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
