'use client';

import React, { useEffect, useState } from 'react';
import { WalkInStats } from '@/lib/types';

interface WalkInStatsProps {
    refreshTrigger?: number;
    hideFullStats?: boolean;
}

export default function WalkInStatsCard({ refreshTrigger = 0, hideFullStats = false }: WalkInStatsProps) {
    const [stats, setStats] = useState<WalkInStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError('');

                // Get auth token
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Authentication token not found');
                    return;
                }

                const response = await fetch('/api/walk-ins/reports?type=stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch statistics');
                }

                const data = await response.json();
                setStats(data.data);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to load statistics';
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [refreshTrigger]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-200 animate-pulse h-24 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (error || !stats) {
        return null;
    }

    const statCards = [
        {
            label: 'Today',
            value: stats.today,
            sublabel: `${stats.todayCompleted} completed`,
            color: 'blue',
            icon: '📅',
        },
        // Hide weekly, monthly, and duration stats from receptionists
        ...(hideFullStats ? [] : [
            {
                label: 'This Week',
                value: stats.thisWeek,
                sublabel: 'walk-ins',
                color: 'purple',
                icon: '📊',
            },
            {
                label: 'This Month',
                value: stats.thisMonth,
                sublabel: 'walk-ins',
                color: 'green',
                icon: '📈',
            },
            {
                label: 'Avg Duration',
                value: `${stats.averageTimeToComplete}m`,
                sublabel: `${stats.completionRate}% completed`,
                color: 'orange',
                icon: '⏱️',
            },
        ]),
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue':
                return 'bg-blue-50 border-blue-200 text-blue-900';
            case 'purple':
                return 'bg-purple-50 border-purple-200 text-purple-900';
            case 'green':
                return 'bg-green-50 border-green-200 text-green-900';
            case 'orange':
                return 'bg-orange-50 border-orange-200 text-orange-900';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-900';
        }
    };

    return (
        <div className={`grid gap-4 ${hideFullStats
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
            {statCards.map((card) => (
                <div
                    key={card.label}
                    className={`p-4 rounded-lg border ${getColorClasses(card.color)} transition-transform hover:shadow-md`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                            <p className="text-3xl font-bold">{card.value}</p>
                            <p className="text-xs text-gray-600 mt-2">{card.sublabel}</p>
                        </div>
                        <span className="text-2xl">{card.icon}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
