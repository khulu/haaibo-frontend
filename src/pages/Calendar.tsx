import { useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import PageMeta from "../components/common/PageMeta";
import useReservations from "../hooks/reservations/useReservations";
import useBookings from "../hooks/bookings/useBookings";
import useFeatureFlags from "../hooks/useFeatureFlags";
import useAuthApi from "../hooks/api/useAuthApi";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    type: "reservation" | "booking";
  };
}

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const { assetTracking, deskBooking } = useFeatureFlags();
  const auth = useAuthApi();
  const companyId = auth.getCompanyId() ?? undefined;

  // Fetch desk/room reservations
  const { useUpcomingReservations } = useReservations();
  const { data: reservations = [] } = useUpcomingReservations(
    deskBooking ? { companyId } : undefined
  );

  // Fetch asset bookings
  const { useMyBookings } = useBookings();
  const { data: bookings = [] } = useMyBookings(
    assetTracking ? { companyId, includeAssigned: true, includeCreated: true } : undefined
  );

  // Merge both data sets into unified calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const merged: CalendarEvent[] = [];

    if (deskBooking) {
      reservations.forEach((r) => {
        const start = r.startTime || r.Start || r.start || r.date;
        const end = r.endTime || r.End || r.end || undefined;
        merged.push({
          id: `res-${r.id}`,
          title: r.markerName
            ? `${r.markerName} — ${r.userName || "Reserved"}`
            : r.locationName || "Desk/Room Booking",
          start,
          end,
          extendedProps: { calendar: "Primary", type: "reservation" },
        });
      });
    }

    if (assetTracking) {
      bookings.forEach((b) => {
        merged.push({
          id: `book-${b.id}`,
          title: b.assigneeUserName
            ? `Asset checkout — ${b.assigneeUserName}`
            : b.externalContactName
            ? `Asset checkout — ${b.externalContactName}`
            : "Asset Booking",
          start: b.startDate,
          end: b.endDate,
          extendedProps: { calendar: "Warning", type: "booking" },
        });
      });
    }

    return merged;
  }, [reservations, bookings, deskBooking, assetTracking]);

  return (
    <>
      <PageMeta
        title="Calendar | Haiibo Admin"
        description="Unified calendar view of desk/room reservations and asset bookings"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Legend */}
        <div className="flex items-center gap-6 px-6 pt-5">
          {deskBooking && (
            <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-block h-3 w-3 rounded-full bg-brand-500" />
              Desk/Room Bookings
            </span>
          )}
          {assetTracking && (
            <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
              Asset Bookings
            </span>
          )}
        </div>

        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventContent={renderEventContent}
          />
        </div>
      </div>
    </>
  );
}

const renderEventContent = (eventInfo: { event: { extendedProps: { calendar: string }; title: string }; timeText: string }) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

