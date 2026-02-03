import { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventContentArg, EventClickArg } from "@fullcalendar/core";
import useLocationsApi, { LocationDto, FloorplanMarker } from '../../hooks/api/useLocationsApi';
import useReservationsApi, { MarkerAvailability, ReservationDto, AvailabilityResponse } from '../../hooks/api/useReservationsApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';

import { EventInput } from "@fullcalendar/core";

type BookingModalData = {
  date: string;
  locationId: string;
  locationName: string;
  floorplanPath?: string;
};

export default function ReservationsPage() {
  const { listTree, getMarkers } = useLocationsApi();
  const { getMarkerAvailability, createReservation, getReservations, deleteReservation } = useReservationsApi();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalData, setBookingModalData] = useState<BookingModalData | null>(null);
  const [markerAvailability, setMarkerAvailability] = useState<MarkerAvailability[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [showMarkerConfirmModal, setShowMarkerConfirmModal] = useState(false);
  const [markerToConfirm, setMarkerToConfirm] = useState<MarkerAvailability | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [colleagueReservations, setColleagueReservations] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar events state
  const [events, setEvents] = useState<EventInput[]>([]);
  // reservation selected from calendar for actions
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);

  // Get user's company ID from localStorage
  const getUserCompanyId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const user = JSON.parse(raw);
      return user.companyId;
    } catch {
      return undefined;
    }
  };

  // Get current user id from localStorage
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const user = JSON.parse(raw);
      return user.id as string | undefined;
    } catch {
      return undefined;
    }
  };
  const currentUserId = getCurrentUserId();

  // stable ref for getReservations to avoid effect loops
  const getReservationsRef = useRef(getReservations);
  useEffect(() => { getReservationsRef.current = getReservations; }, [getReservations]);
  // Stable refs for marker APIs to avoid effect/callback identity loops
  const getMarkersRef = useRef(getMarkers);
  useEffect(() => { getMarkersRef.current = getMarkers; }, [getMarkers]);
  const getMarkerAvailabilityRef = useRef(getMarkerAvailability);
  useEffect(() => { getMarkerAvailabilityRef.current = getMarkerAvailability; }, [getMarkerAvailability]);

  // Fetch locations on mount
  useEffect(() => {
    (async () => {
      try {
        const companyId = getUserCompanyId();
        const data = await listTree(companyId);
        // Flatten the tree to get all locations
        const flattenLocations = (locs: LocationDto[]): LocationDto[] => {
          return locs.flatMap(loc => [loc, ...flattenLocations(loc.children || [])]);
        };
        const allLocations = flattenLocations(data);
        // Filter only locations with floorplan
        const locationsWithFloorplan = allLocations.filter(loc => loc.floorplanPath);
        setLocations(locationsWithFloorplan);
        if (locationsWithFloorplan.length > 0) {
          setSelectedLocationId(locationsWithFloorplan[0].id);
          setSelectedLocation(locationsWithFloorplan[0]);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
        setError('Failed to load locations');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reservations for selected location and map to calendar events
  const fetchAndMapReservations = useCallback(async () => {
    if (!selectedLocationId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const reservations = await getReservationsRef.current({ locationId: selectedLocationId });
      // map to FullCalendar events (with color level)
      const mapped = (reservations || []).map((r) => {
          const date = r.date;
          const normalizeTime = (t?: string) => {
            if (!t) return undefined;
            // if already an ISO datetime, return as-is
            if (t.includes('T')) return t;
            // if time-only, combine with date
            if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return `${date}T${t}`;
            return `${date}T${t}`;
          };

          const start = normalizeTime(r.startTime ?? r.start ?? r.Start) ?? date;
          const end = normalizeTime(r.endTime ?? r.end ?? r.End);

          // choose calendar color level
          let level = 'Success';
          if (r.userId && currentUserId && r.userId === currentUserId) level = 'Primary';
          else if (r.status && String(r.status).toLowerCase() === 'cancelled') level = 'Danger';
          else if (r.markerName && /room|meeting/i.test(r.markerName)) level = 'Warning';

          return {
            id: r.id,
            title: r.markerName || r.locationName || 'Reservation',
            start,
            end,
            allDay: !r.startTime && !r.start && !r.Start,
            extendedProps: { userName: r.userName, markerId: r.markerId, calendar: level, reservation: r },
          } as EventInput;
        });
      setEvents(mapped);
    } catch (err: unknown) {
      console.error('Failed to load reservations for calendar:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, currentUserId]);

  useEffect(() => {
    // load when location changes
    fetchAndMapReservations();
  }, [fetchAndMapReservations]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location || null);
  };

  const getMinimumTime = (dateStr: string): string => {
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // If selected date is today, minimum time is current time (rounded up to next hour)
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Round up to next hour if past the hour
      const nextHour = currentMinute > 0 ? currentHour + 1 : currentHour;
      return `${nextHour.toString().padStart(2, '0')}:00`;
    }
    
    // For future dates, no minimum restriction
    return '00:00';
  };

  const handleDateClick = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (!selectedLocation) return;

    // Set minimum start time based on selected date
    const minTime = getMinimumTime(dateStr);
    setStartTime(minTime < '09:00' ? '09:00' : minTime);
    
    // Ensure end time is exactly 1 hour after start time
    const [sHour, sMinute] = (minTime < '09:00' ? '09:00' : minTime).split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(sHour, sMinute, 0, 0);
    endDate.setHours(endDate.getHours() + 1);
    const endHH = endDate.getHours().toString().padStart(2, '0');
    const endMM = endDate.getMinutes().toString().padStart(2, '0');
    setEndTime(`${endHH}:${endMM}`);

    setBookingModalData({
      date: dateStr,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      floorplanPath: selectedLocation.floorplanPath || undefined,
    });
    
    setLoading(true);
    try {
      // Fetch all markers first
      const markers: FloorplanMarker[] = await getMarkers(selectedLocation.id);
      
      // Then fetch availability for the selected time
      const availability = await getMarkerAvailability(
        selectedLocation.id, 
        dateStr,
        startTime,
        endTime
      );
      
      // Merge markers with availability data
      const mergedData: MarkerAvailability[] = markers.map(marker => {
        const availData = availability.find((a: AvailabilityResponse) => a.markerId === marker.id);
        const isBooked = availData?.booked ?? false;
        return {
          markerId: marker.id,
          markerName: marker.name,
          type: marker.type,
          xPosition: marker.xPosition,
          yPosition: marker.yPosition,
          active: marker.active,
          isAvailable: !isBooked,
          isMyBooking: false,
          isOccupied: isBooked,
          reservations: [],
        };
      });
      
      setMarkerAvailability(mergedData);
      setShowBookingModal(true);
    } catch (err) {
      console.error('Failed to load availability:', err);
      alert('Failed to load seat availability');
    } finally {
      setLoading(false);
    }
  };

  // Derived scalar deps to avoid object identity in hooks
  const bookingDate = bookingModalData?.date;
  const selectedLocId = selectedLocation?.id;

  const updateMarkerAvailabilityByTime = useCallback(async () => {
    if (!bookingDate || !selectedLocId) return;
    
    setLoading(true);
    try {
      // Fetch all markers
      const markers: FloorplanMarker[] = await getMarkersRef.current(selectedLocId);
      
      // Fetch availability for the selected time
      const availability = await getMarkerAvailabilityRef.current(
        selectedLocId,
        bookingDate,
        startTime,
        endTime
      );
      
      // Merge markers with availability data
      const mergedData: MarkerAvailability[] = markers.map(marker => {
        const availData = availability.find((a: AvailabilityResponse) => a.markerId === marker.id);
        const isBooked = availData?.booked ?? false;
        return {
          markerId: marker.id,
          markerName: marker.name,
          type: marker.type,
          xPosition: marker.xPosition,
          yPosition: marker.yPosition,
          active: marker.active,
          isAvailable: !isBooked,
          isMyBooking: false,
          isOccupied: isBooked,
          reservations: [],
        };
      });
      
      setMarkerAvailability(mergedData);
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingDate, selectedLocId, startTime, endTime]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDate = new Date(selectInfo.startStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Prevent selection of past dates
    if (selectedDate < today) {
      alert('Cannot book seats for past dates');
      return;
    }
    
    handleDateClick(selectedDate);
  };

  // Recompute marker availability whenever start or end time changes
  useEffect(() => {
    if (!bookingDate || !selectedLocId) return;
    updateMarkerAvailabilityByTime();
  }, [startTime, endTime, bookingDate, selectedLocId, updateMarkerAvailabilityByTime]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const ev = clickInfo.event;
    const res = ev.extendedProps?.reservation as ReservationDto | undefined;
    if (!res) return;
    setSelectedReservation(res);
    setShowEventModal(true);
  };

  const canCancelReservation = (r: ReservationDto) => {
    if (!r) return false;
    if (r.status && r.status !== 'Confirmed') return false;
    const checkedInAt = (r as unknown as Record<string, unknown>).checkedInAt as string | undefined;
    if (checkedInAt) return false;
    // compute start
    const time = r.startTime ?? r.start ?? r.Start ?? '00:00:00';
    let start: Date;
    if (/^\d{2}:\d{2}$/.test(time)) {
      start = new Date(`${r.date}T${time}:00Z`);
    } else if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      start = new Date(`${r.date}T${time}Z`);
    } else if (time.includes('T')) {
      start = new Date(time);
    } else {
      start = new Date(`${r.date}T00:00:00Z`);
    }
    return Date.now() < start.getTime();
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    setLoading(true);
    try {
      await deleteReservation(selectedReservation.id);
      alert('Reservation cancelled');
      setShowEventModal(false);
      setSelectedReservation(null);
      await fetchAndMapReservations();
    } catch (err: unknown) {
      let msg = 'Failed to cancel reservation';
      if (typeof err === 'object' && err !== null) {
        const maybe = err as { response?: { data?: { title?: string } }; message?: unknown };
        if (maybe.response && maybe.response.data && typeof maybe.response.data.title === 'string') msg = maybe.response.data.title;
        else if (typeof maybe.message === 'string') msg = maybe.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchColleague = async () => {
    if (!searchQuery.trim() || !bookingModalData) return;
    
    setLoading(true);
    try {
      const reservations = await getReservations({
        locationId: bookingModalData.locationId,
        date: bookingModalData.date,
      });
      const filtered = reservations.filter(r => 
        r.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setColleagueReservations(filtered);
    } catch (err) {
      console.error('Failed to search colleague:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker: MarkerAvailability) => {
    if (marker.isMyBooking) {
      alert('This is your existing booking');
      return;
    }
    if (marker.isOccupied || !marker.isAvailable) {
      alert('This seat is already booked for the selected time');
      return;
    }
    setSelectedMarkerId(marker.markerId);
    setMarkerToConfirm(marker);
    setShowMarkerConfirmModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!selectedMarkerId || !bookingModalData || !selectedLocation) return;

    // Validate times
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    // Validate start time is not in the past for today
    const selectedDate = new Date(bookingModalData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      if (startDateTime < now) {
        alert('Start time cannot be in the past');
        return;
      }
    }

    setLoading(true);
    try {
      // Refresh availability before submitting to ensure seat is still available
      const availability = await getMarkerAvailability(
        selectedLocation.id,
        bookingModalData.date,
        startTime,
        endTime
      );

      const selectedMarkerData = availability.find((a: AvailabilityResponse) => a.markerId === selectedMarkerId);
      const isBooked = selectedMarkerData?.booked ?? false;
      if (isBooked) {
        alert('This seat is no longer available for the selected time. Please choose another seat.');
        await updateMarkerAvailabilityByTime();
        setSelectedMarkerId(null);
        return;
      }

      await createReservation(selectedLocation.id, {
        markerId: selectedMarkerId,
        date: bookingModalData.date,
        startTime,
        endTime,
      });
      setShowBookingModal(false);
      setSelectedMarkerId(null);
    } catch (err: unknown) {
      console.error('Failed to create booking:', err);
      
      // Extract error message from API response
      let errorMessage = 'Failed to create booking';
      const error = err as { response?: { data?: { title?: string; errors?: Record<string, string | string[]> } }; message?: string };
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.title) {
          errorMessage = errorData.title;
        }
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage += '\n\n' + errorDetails;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      
      // Refresh availability after error
      await updateMarkerAvailabilityByTime();
    } finally {
      setLoading(false);
    }
  };

  const resolveImageSrc = (p?: string) => {
    const isProd = (import.meta.env as unknown as Record<string, unknown>).ASPNETCORE_ENVIRONMENT === 'Production' || import.meta.env.PROD;
      const baseUrl = 'https://haiibo-backend-api.azurewebsites.net';
                  const path = p ?? '';
    if (!path) return undefined;
    if (!isProd) return path;
    return /^https?:\/\//.test(path) ? path : `${baseUrl}${path}`;
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Reserve a Seat">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6">
          <Label>Select Location</Label>
          <select
            value={selectedLocationId}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {locations.length === 0 && (
              <option value="">No locations with floorplans available</option>
            )}
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mt-6">
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={new Date()}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              eventClick={handleEventClick}
              selectable={true}
              select={handleDateSelect}
              eventContent={renderEventContent}
              selectAllow={(selectInfo) => {
                const selectedDate = new Date(selectInfo.startStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate >= today;
              }}
              validRange={{
                start: new Date(),
              }}
              showNonCurrentDates={false}
              dayCellClassNames={(arg) => {
                const cellDate = new Date(arg.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                cellDate.setHours(0, 0, 0, 0);
                
                if (cellDate < today) {
                  return ['opacity-30', 'pointer-events-none', 'cursor-not-allowed'];
                }
                return [];
              }}
            />
          </div>
        </div>
      </ComponentCard>

      {showBookingModal && bookingModalData && (
        <div className="modal fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-5">
          <div className="modal-close-btn fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] dark:bg-gray-900/70" onClick={() => setShowBookingModal(false)}></div>
          <div className="relative w-full max-w-[900px] rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-3 right-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:top-6 sm:right-6 sm:h-11 sm:w-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill=""></path>
              </svg>
            </button>

            <div>
              <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
                Book a Seat - {bookingModalData.locationName}
              </h4>
              <p className="mb-5 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Date: {new Date(bookingModalData.date).toLocaleDateString()}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Search Colleague
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter colleague name..."
                      className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <button
                      onClick={handleSearchColleague}
                      disabled={loading}
                      className="bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                    >
                      Search
                    </button>
                  </div>
                  {colleagueReservations.length > 0 && (
                    <div className="mt-2 p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <p className="text-sm font-medium mb-2">Found {colleagueReservations.length} reservation(s)</p>
                      {colleagueReservations.map((res) => (
                        <div key={res.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {res.userName} - {res.markerName} ({res.startTime} - {res.endTime})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Start Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={startTime}
                        min={bookingModalData ? getMinimumTime(bookingModalData.date) : undefined}
                        onClick={(e) => e.currentTarget.showPicker()}
                        onChange={(e) => {
                          const newStartTime = e.target.value;
                          const minTime = bookingModalData ? getMinimumTime(bookingModalData.date) : '00:00';
                          
                          if (newStartTime < minTime) {
                            alert('Start time cannot be in the past');
                            return;
                          }
                          
                          setStartTime(newStartTime);
                          // Always set end time to exactly 1 hour after start time
                          const [hour, minute] = newStartTime.split(':').map(Number);
                          const end = new Date();
                          end.setHours(hour, minute, 0, 0);
                          end.setHours(end.getHours() + 1);
                          const hh = end.getHours().toString().padStart(2, '0');
                          const mm = end.getMinutes().toString().padStart(2, '0');
                          setEndTime(`${hh}:${mm}`);
                          
                          updateMarkerAvailabilityByTime();
                        }}
                        className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                      />
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.99984C3.04175 6.15686 6.1571 3.0415 10.0001 3.0415C13.8431 3.0415 16.9584 6.15686 16.9584 9.99984C16.9584 13.8428 13.8431 16.9582 10.0001 16.9582C6.1571 16.9582 3.04175 13.8428 3.04175 9.99984ZM10.0001 1.5415C5.32867 1.5415 1.54175 5.32843 1.54175 9.99984C1.54175 14.6712 5.32867 18.4582 10.0001 18.4582C14.6715 18.4582 18.4584 14.6712 18.4584 9.99984C18.4584 5.32843 14.6715 1.5415 10.0001 1.5415ZM9.99998 10.7498C9.58577 10.7498 9.24998 10.4141 9.24998 9.99984V5.4165C9.24998 5.00229 9.58577 4.6665 9.99998 4.6665C10.4142 4.6665 10.75 5.00229 10.75 5.4165V9.24984H13.3334C13.7476 9.24984 14.0834 9.58562 14.0834 9.99984C14.0834 10.4141 13.7476 10.7498 13.3334 10.7498H10.0001H9.99998Z" fill=""></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      End Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={endTime}
                        readOnly
                        className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                      />
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.99984C3.04175 6.15686 6.1571 3.0415 10.0001 3.0415C13.8431 3.0415 16.9584 6.15686 16.9584 9.99984C16.9584 13.8428 13.8431 16.9582 10.0001 16.9582C6.1571 16.9582 3.04175 13.8428 3.04175 9.99984ZM10.0001 1.5415C5.32867 1.5415 1.54175 5.32843 1.54175 9.99984C1.54175 14.6712 5.32867 18.4582 10.0001 18.4582C14.6715 18.4582 18.4584 14.6712 18.4584 9.99984C18.4584 5.32843 14.6715 1.5415 10.0001 1.5415ZM9.99998 10.7498C9.58577 10.7498 9.24998 10.4141 9.24998 9.99984V5.4165C9.24998 5.00229 9.58577 4.6665 9.99998 4.6665C10.4142 4.6665 10.75 5.00229 10.75 5.4165V9.24984H13.3334C13.7476 9.24984 14.0834 9.58562 14.0834 9.99984C14.0834 10.4141 13.7476 10.7498 13.3334 10.7498H10.0001H9.99998Z" fill=""></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

      

              {bookingModalData.floorplanPath && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Select a Seat (Click on available markers)
                  </label>
        <div className="mt-3 mb-1 flex gap-4 items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🪑</span>
            Available Desk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">👥</span>
            Available Meeting Room
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✕</span>
            Booked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">⊘</span>
            Occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
            My Booking
          </span>
        </div>
                  <div className="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                    <img
                      src={resolveImageSrc(bookingModalData.floorplanPath)}
                      alt="Floorplan"
                      className="w-full h-auto select-none"
                      draggable={false}
                    />
                    {markerAvailability.map((marker) => {
                      const getMarkerStatus = () => {
                        if (marker.isMyBooking) return 'My Booking';
                        if (marker.isOccupied) return 'Occupied';
                        if (!marker.isAvailable) return 'Booked';
                        return 'Available';
                      };
                      
                      const getMarkerColor = () => {
                        if (marker.isMyBooking) return 'bg-blue-500 hover:bg-blue-600';
                        if (marker.isOccupied) return 'bg-orange-500';
                        if (!marker.isAvailable) return 'bg-red-500';
                        return marker.type === 0 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-yellow-500 hover:bg-yellow-600';
                      };

                      return (
                        <div
                          key={marker.markerId}
                          onClick={() => handleMarkerClick(marker)}
                          className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                            !marker.active ? 'opacity-40' : marker.isAvailable || marker.isMyBooking ? 'opacity-100' : 'opacity-60'
                          }`}
                          style={{
                            left: `${marker.xPosition}%`,
                            top: `${marker.yPosition}%`,
                          }}
                          title={`${marker.markerName} - ${getMarkerStatus()}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 ${
                            selectedMarkerId === marker.markerId
                              ? 'border-blue-600 scale-125'
                              : 'border-transparent'
                          } ${getMarkerColor()}`}>
                            {marker.type === 0 ? '🪑' : '👥'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              )}

              
            </div>
          </div>
        </div>
      )}

      {showEventModal && selectedReservation && (
        <div className="modal fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-5">
          <div className="modal-close-btn fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] dark:bg-gray-900/70" onClick={() => setShowEventModal(false)}></div>
          <div className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 lg:p-8 dark:bg-gray-900">
            <button
              onClick={() => setShowEventModal(false)}
              className="absolute top-3 right-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:top-6 sm:right-6 sm:h-11 sm:w-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              ✕
            </button>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Cancel Reservation</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Seat: {selectedReservation.markerName || selectedReservation.markerId}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Date: {new Date(selectedReservation.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Time: {selectedReservation.startTime ?? selectedReservation.start ?? selectedReservation.Start ?? '-'} - {selectedReservation.endTime ?? selectedReservation.end ?? selectedReservation.End ?? '-'}</p>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {canCancelReservation(selectedReservation) ? (
                  <span>Are you sure you want to cancel this reservation?</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">This reservation cannot be cancelled (status, checked-in, or already started).</span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEventModal(false); setSelectedReservation(null); }}
                  className="shadow-theme-xs flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  disabled={!canCancelReservation(selectedReservation) || loading}
                  className="bg-red-500 shadow-theme-xs hover:bg-red-600 flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMarkerConfirmModal && markerToConfirm && (
        <div className="modal fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-5">
          <div className="modal-close-btn fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] dark:bg-gray-900/70" onClick={() => setShowMarkerConfirmModal(false)}></div>
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 lg:p-8 dark:bg-gray-900">
            <button
              onClick={() => setShowMarkerConfirmModal(false)}
              className="absolute top-3 right-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:top-6 sm:right-6 sm:h-11 sm:w-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              ✕
            </button>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Confirm Booking</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Seat: {markerToConfirm.markerName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date: {bookingModalData ? new Date(bookingModalData.date).toLocaleDateString() : '-'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Time: {startTime} - {endTime}</p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowMarkerConfirmModal(false); setSelectedMarkerId(null); }}
                  className="shadow-theme-xs flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => { setShowMarkerConfirmModal(false); await handleSubmitBooking(); }}
                  disabled={!selectedMarkerId}
                  className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const renderEventContent = (eventInfo: EventContentArg) => {
  const level = eventInfo.event.extendedProps?.calendar || 'Primary';
  const colorClass = `fc-bg-${String(level).toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};
