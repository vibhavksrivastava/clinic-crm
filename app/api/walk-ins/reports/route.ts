import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'stats'; // stats, daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (reportType === 'stats') {
      return getWalkInStats(userContext);
    } else if (reportType === 'daily') {
      return getDailyReport(userContext, startDate || new Date().toISOString().split('T')[0]);
    } else if (reportType === 'weekly') {
      return getWeeklyReport(userContext, startDate, endDate);
    } else if (reportType === 'monthly') {
      return getMonthlyReport(userContext, startDate, endDate);
    } else if (reportType === 'yearly') {
      return getYearlyReport(userContext, startDate, endDate);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error generating walk-in report:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report', details: errorMessage },
      { status: 500 }
    );
  }
}

async function getWalkInStats(userContext: any) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Get today's count
    const todayData = await supabase
      .from('walk_ins')
      .select('id, status, check_in_time, check_out_time', { count: 'exact' })
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', today.toISOString())
      .lt('check_in_time', new Date(today.getTime() + 86400000).toISOString());

    const todayCount = todayData.count || 0;
    const todayCompleted = (todayData.data || []).filter((w: any) => w.status === 'completed').length;

    // Get this week's count
    const weekData = await supabase
      .from('walk_ins')
      .select('id, status, check_in_time, check_out_time', { count: 'exact' })
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', weekStart.toISOString())
      .lt('check_in_time', new Date(today.getTime() + 86400000).toISOString());

    const weekCount = weekData.count || 0;

    // Get this month's count
    const monthData = await supabase
      .from('walk_ins')
      .select('id, status, check_in_time, check_out_time', { count: 'exact' })
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', monthStart.toISOString())
      .lt('check_in_time', new Date(today.getTime() + 86400000).toISOString());

    const monthCount = monthData.count || 0;

    // Get this year's count
    const yearData = await supabase
      .from('walk_ins')
      .select('id, status, check_in_time, check_out_time', { count: 'exact' })
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', yearStart.toISOString())
      .lt('check_in_time', new Date(today.getTime() + 86400000).toISOString());

    const yearCount = yearData.count || 0;

    // Calculate average time to completion (in minutes)
    const completedWalkIns = await supabase
      .from('walk_ins')
      .select('check_in_time, check_out_time')
      .eq('organization_id', userContext.organizationId)
      .eq('status', 'completed')
      .gte('check_in_time', monthStart.toISOString())
      .not('check_out_time', 'is', null);

    let averageTime = 0;
    if (completedWalkIns.data && completedWalkIns.data.length > 0) {
      const totalTime = completedWalkIns.data.reduce((sum: number, w: any) => {
        const checkIn = new Date(w.check_in_time);
        const checkOut = new Date(w.check_out_time);
        return sum + (checkOut.getTime() - checkIn.getTime()) / 60000;
      }, 0);
      averageTime = Math.round(totalTime / completedWalkIns.data.length);
    }

    return NextResponse.json({
      success: true,
      data: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        thisYear: yearCount,
        todayCompleted,
        averageTimeToComplete: averageTime,
        completionRate: todayCount > 0 ? Math.round((todayCompleted / todayCount) * 100) : 0,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function getDailyReport(userContext: any, date: string) {
  try {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate.getTime() + 86400000);

    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', reportDate.toISOString())
      .lt('check_in_time', nextDay.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) throw error;

    const walkIns = (data || []) as any[];
    const completed = walkIns.filter((w) => w.status === 'completed');
    
    let totalTime = 0;
    let maxTime = 0;
    let minTime = Infinity;

    completed.forEach((w: any) => {
      if (w.check_out_time) {
        const time = new Date(w.check_out_time).getTime() - new Date(w.check_in_time).getTime();
        const timeInMinutes = time / 60000;
        totalTime += timeInMinutes;
        maxTime = Math.max(maxTime, timeInMinutes);
        minTime = Math.min(minTime, timeInMinutes);
      }
    });

    // Aggregate additional tests
    const testMap = new Map<string, number>();
    walkIns.forEach((w: any) => {
      if (w.additional_tests && Array.isArray(w.additional_tests)) {
        w.additional_tests.forEach((test: any) => {
          const testName = test.name || test;
          testMap.set(testName, (testMap.get(testName) || 0) + 1);
        });
      }
    });

    const commonTests = Array.from(testMap.entries())
      .map(([testName, count]) => ({ testName, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        period: 'daily',
        date: reportDate,
        totalWalkIns: walkIns.length,
        completedWalkIns: completed.length,
        averageTimeMinutes: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
        maxTimeMinutes: maxTime === Infinity ? 0 : Math.round(maxTime),
        minTimeMinutes: minTime === Infinity ? 0 : Math.round(minTime),
        commonTests,
        walkIns: walkIns.slice(0, 20), // Return top 20 for display
      },
    });
  } catch (error) {
    throw error;
  }
}

async function getWeeklyReport(userContext: any, startDate?: string, endDate?: string) {
  try {
    let start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    let end = new Date(start.getTime() + 7 * 86400000);

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', start.toISOString())
      .lt('check_in_time', end.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) throw error;

    const walkIns = (data || []) as any[];
    const completed = walkIns.filter((w) => w.status === 'completed');

    let totalTime = 0;
    completed.forEach((w: any) => {
      if (w.check_out_time) {
        totalTime += (new Date(w.check_out_time).getTime() - new Date(w.check_in_time).getTime()) / 60000;
      }
    });

    // Group by day
    const byDay = new Map<string, any[]>();
    walkIns.forEach((w: any) => {
      const day = new Date(w.check_in_time).toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(w);
    });

    const dailyBreakdown = Array.from(byDay.entries()).map(([day, items]) => ({
      date: day,
      total: items.length,
      completed: items.filter((i) => i.status === 'completed').length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period: 'weekly',
        startDate: start,
        endDate: end,
        totalWalkIns: walkIns.length,
        completedWalkIns: completed.length,
        averageTimeMinutes: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
        dailyBreakdown,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function getMonthlyReport(userContext: any, startDate?: string, endDate?: string) {
  try {
    let start = new Date();
    start = new Date(start.getFullYear(), start.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    let end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', start.toISOString())
      .lt('check_in_time', end.toISOString());

    if (error) throw error;

    const walkIns = (data || []) as any[];
    const completed = walkIns.filter((w) => w.status === 'completed');

    let totalTime = 0;
    completed.forEach((w: any) => {
      if (w.check_out_time) {
        totalTime += (new Date(w.check_out_time).getTime() - new Date(w.check_in_time).getTime()) / 60000;
      }
    });

    // Group by week
    const byWeek = new Map<number, any[]>();
    walkIns.forEach((w: any) => {
      const date = new Date(w.check_in_time);
      const week = Math.ceil((date.getDate()) / 7);
      if (!byWeek.has(week)) byWeek.set(week, []);
      byWeek.get(week)!.push(w);
    });

    const weeklyBreakdown = Array.from(byWeek.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, items]) => ({
        week,
        total: items.length,
        completed: items.filter((i) => i.status === 'completed').length,
      }));

    return NextResponse.json({
      success: true,
      data: {
        period: 'monthly',
        startDate: start,
        endDate: end,
        totalWalkIns: walkIns.length,
        completedWalkIns: completed.length,
        averageTimeMinutes: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
        weeklyBreakdown,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function getYearlyReport(userContext: any, startDate?: string, endDate?: string) {
  try {
    let start = new Date(new Date().getFullYear(), 0, 1);
    let end = new Date(new Date().getFullYear() + 1, 0, 1);

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('organization_id', userContext.organizationId)
      .gte('check_in_time', start.toISOString())
      .lt('check_in_time', end.toISOString());

    if (error) throw error;

    const walkIns = (data || []) as any[];
    const completed = walkIns.filter((w) => w.status === 'completed');

    let totalTime = 0;
    completed.forEach((w: any) => {
      if (w.check_out_time) {
        totalTime += (new Date(w.check_out_time).getTime() - new Date(w.check_in_time).getTime()) / 60000;
      }
    });

    // Group by month
    const byMonth = new Map<number, any[]>();
    walkIns.forEach((w: any) => {
      const month = new Date(w.check_in_time).getMonth();
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push(w);
    });

    const monthlyBreakdown = Array.from(byMonth.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([month, items]) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: monthNames[month],
          total: items.length,
          completed: items.filter((i) => i.status === 'completed').length,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        period: 'yearly',
        startDate: start,
        endDate: end,
        totalWalkIns: walkIns.length,
        completedWalkIns: completed.length,
        averageTimeMinutes: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
        monthlyBreakdown,
      },
    });
  } catch (error) {
    throw error;
  }
}
