'use client';

import React, { useEffect, useState } from 'react';

interface DailyReport {
  period: string;
  date: string;
  totalWalkIns: number;
  completedWalkIns: number;
  averageTimeMinutes: number;
  maxTimeMinutes: number;
  minTimeMinutes: number;
  commonTests: { testName: string; count: number }[];
}

export default function WalkInReports() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `/api/walk-ins/reports?type=${reportType}`;

      if (reportType === 'daily') {
        url += `&startDate=${selectedDate}`;
      }

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReport(data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load report';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderDailyReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Walk-ins</p>
            <p className="text-2xl font-bold text-blue-900">{report.totalWalkIns}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-900">{report.completedWalkIns}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-orange-900">{report.averageTimeMinutes}m</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Max Duration</p>
            <p className="text-2xl font-bold text-purple-900">{report.maxTimeMinutes}m</p>
          </div>
        </div>

        {/* Common Tests */}
        {report.commonTests && report.commonTests.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Most Recommended Tests</h3>
            <div className="space-y-2">
              {report.commonTests.map((test: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{test.testName}</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {test.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWeeklyReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Walk-ins</p>
            <p className="text-2xl font-bold text-blue-900">{report.totalWalkIns}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-900">{report.completedWalkIns}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-orange-900">{report.averageTimeMinutes}m</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-purple-900">
              {report.totalWalkIns > 0 ? Math.round((report.completedWalkIns / report.totalWalkIns) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Daily Breakdown */}
        {report.dailyBreakdown && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Daily Breakdown</h3>
            <div className="space-y-3">
              {report.dailyBreakdown.map((day: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{day.completed} completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{day.total}</p>
                    <p className="text-xs text-gray-600">walk-ins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Walk-ins</p>
            <p className="text-2xl font-bold text-blue-900">{report.totalWalkIns}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-900">{report.completedWalkIns}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-orange-900">{report.averageTimeMinutes}m</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg/Week</p>
            <p className="text-2xl font-bold text-purple-900">
              {report.weeklyBreakdown ? Math.round(report.totalWalkIns / report.weeklyBreakdown.length) : 0}
            </p>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {report.weeklyBreakdown && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Weekly Breakdown</h3>
            <div className="space-y-3">
              {report.weeklyBreakdown.map((week: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Week {week.week}</p>
                    <p className="text-sm text-gray-600">{week.completed} completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{week.total}</p>
                    <p className="text-xs text-gray-600">walk-ins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderYearlyReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Walk-ins</p>
            <p className="text-2xl font-bold text-blue-900">{report.totalWalkIns}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-900">{report.completedWalkIns}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-orange-900">{report.averageTimeMinutes}m</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg/Month</p>
            <p className="text-2xl font-bold text-purple-900">
              {report.monthlyBreakdown ? Math.round(report.totalWalkIns / report.monthlyBreakdown.length) : 0}
            </p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {report.monthlyBreakdown && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Breakdown</h3>
            <div className="space-y-3">
              {report.monthlyBreakdown.map((month: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.completed} completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{month.total}</p>
                    <p className="text-xs text-gray-600">walk-ins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Walk-in Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    reportType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker (only for daily) */}
          {reportType === 'daily' && (
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading report...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <>
          {reportType === 'daily' && renderDailyReport()}
          {reportType === 'weekly' && renderWeeklyReport()}
          {reportType === 'monthly' && renderMonthlyReport()}
          {reportType === 'yearly' && renderYearlyReport()}
        </>
      )}
    </div>
  );
}
