import React, { useState, useEffect } from 'react';
import { reportsAPI, clientsAPI, tasksAPI, activitiesAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AdaptiveDashboard from '../components/AdaptiveDashboard';

const EmployeeDashboard = () => {
  const { user } = useUser();
  const [summary, setSummary] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      const results = await Promise.allSettled([
        reportsAPI.getEmployeeQuickStats(),
        reportsAPI.getSummary(),
        clientsAPI.getClients({ limit: 5 }),
        tasksAPI.getMyTasks({ limit: 5 }),
        tasksAPI.getTaskStats(),
        reportsAPI.getActivityReport('week'),
        reportsAPI.getRevenueReport('month'),
        activitiesAPI.getAllActivities()
      ]);

      const [quickRes, summaryRes, clientsRes, tasksRes, taskStatsRes, activityRes, revenueRes, allActsRes] = results.map(r => r.status === 'fulfilled' ? r.value : { data: {} });

      console.log('Dashboard API responses:', {
        quick: quickRes.data,
        summary: summaryRes.data,
        clients: clientsRes.data,
        tasks: tasksRes.data,
        taskStats: taskStatsRes?.data,
        activity: activityRes?.data,
        revenue: revenueRes?.data,
        activitiesList: allActsRes?.data
      });

      if (quickRes.data && quickRes.data.success && quickRes.data.summary) {
        setSummary(quickRes.data.summary);
      } else if (summaryRes.data && summaryRes.data.success) {
        const raw = summaryRes.data.summary || {};
        const tasksCompleted = taskStatsRes?.data?.data?.completedTasks || 0;
        const activitiesTotal = (activityRes?.data?.activityStats || []).reduce((acc, a) => acc + (a.count || 0), 0);
        const totalRevenue = revenueRes?.data?.revenue?.totalRevenue ?? raw.totalValue ?? 0;
        const rebuilt = {
          clients: { total: raw.totalClients || 0 },
          tasks: { completed: tasksCompleted },
          activities: { total: activitiesTotal },
          revenue: { total: totalRevenue }
        };
        setSummary(rebuilt);
      } else {
        setSummary({
          clients: { total: 0 },
          tasks: { completed: 0 },
          activities: { total: 0 },
          revenue: { total: 0 }
        });
      }

      if (clientsRes.data && clientsRes.data.success) {
        setRecentClients(clientsRes.data.clients);
      }

      if (tasksRes.data && tasksRes.data.success) {
        console.log('Tasks data received:', tasksRes.data.tasks);
        setRecentTasks(tasksRes.data.tasks || []);
      } else {
        console.log('Tasks API failed:', tasksRes.data);
        setRecentTasks([]);
      }

      if (allActsRes.data && allActsRes.data.success) {
        setRecentActivities(allActsRes.data.activities || []);
      } else {
        setRecentActivities([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <AdaptiveDashboard
      user={user}
      summary={summary}
      recentClients={recentClients}
      recentTasks={recentTasks}
      recentActivities={recentActivities}
    />
  );
};

export default EmployeeDashboard;