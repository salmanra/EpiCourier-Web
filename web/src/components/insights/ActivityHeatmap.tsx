"use client";
import { useEffect, useState } from "react";

interface ActivityData {
  date: string;
  total: number;
  completed: number;
}

export default function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch("/api/insights/activity");
        if (response.ok) {
          const data = await response.json();
          setActivityData(data);
        }
      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  // Create a map for quick lookup
  const activityMap = new Map(
    activityData.map((item) => [item.date, item])
  );

  // Generate last 52 weeks
  const weeks: Date[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364); // ~52 weeks

  // Adjust to start on Sunday
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  for (let week = 0; week < 53; week++) {
    const weekDays: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + week * 7 + day);
      if (date <= today) {
        weekDays.push(date);
      }
    }
    if (weekDays.length > 0) {
      weeks.push(weekDays);
    }
  }

  // Get color based on completed meal count
  const getColor = (completed: number) => {
    if (completed === 0) return "bg-gray-100";
    if (completed === 1) return "bg-green-200";
    if (completed === 2) return "bg-green-400";
    return "bg-green-600";
  };

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-center text-gray-500">Loading activity data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Meal Completion Activity
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Your meal completion history for the past year (similar to GitHub contributions)
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="mb-2 flex gap-[3px] pl-8">
            {weeks.map((week, weekIndex) => {
              const firstDay = week[0];
              const showMonth = firstDay.getDate() <= 7;
              return (
                <div
                  key={weekIndex}
                  className="w-[11px] text-xs text-gray-600"
                  style={{ fontSize: "10px" }}
                >
                  {showMonth ? monthLabels[firstDay.getMonth()] : ""}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px]">
              {dayLabels.map((label, index) => (
                <div
                  key={index}
                  className="flex h-[11px] items-center text-xs text-gray-600"
                  style={{ fontSize: "10px" }}
                >
                  {index % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((date, dayIndex) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const activity = activityMap.get(dateStr);
                  const completed = activity?.completed || 0;
                  const total = activity?.total || 0;

                  return (
                    <div
                      key={dayIndex}
                      className={`h-[11px] w-[11px] rounded-sm border border-gray-200 ${getColor(completed)}`}
                      title={`${dateStr}: ${completed}/${total} meals completed`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-600">
            <span>Less</span>
            <div className="h-[11px] w-[11px] rounded-sm border border-gray-200 bg-gray-100" />
            <div className="h-[11px] w-[11px] rounded-sm border border-gray-200 bg-green-200" />
            <div className="h-[11px] w-[11px] rounded-sm border border-gray-200 bg-green-400" />
            <div className="h-[11px] w-[11px] rounded-sm border border-gray-200 bg-green-600" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
