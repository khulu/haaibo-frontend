import { useState, useEffect, useRef } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg } from "@fullcalendar/core";
import useLocationsApi, { LocationDto, FloorplanMarker } from '../../hooks/api/useLocationsApi';
import useReservationsApi, { MarkerAvailability, ReservationDto, AvailabilityResponse } from '../../hooks/api/useReservationsApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';

type BookingModalData = {
  date: string;
  locationId: string;
  locationName: string;
  floorplanPath?: string;
};

export default function ReservationsPage() {
  const { listTree, getMarkers } = useLocationsApi();
  const { getMarkerAvailability, createReservation, getReservations } = useReservationsApi();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalData, setBookingModalData] = useState<BookingModalData | null>(null);
  const [markerAvailability, setMarkerAvailability] = useState<MarkerAvailability[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [colleagueReservations, setColleagueReservations] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    // Ensure end time is 1 hour after start time
    const startHour = parseInt(minTime < '09:00' ? '09:00' : minTime);
    const endHour = Math.min(startHour + 1, 23);
    setEndTime(`${endHour.toString().padStart(2, '0')}:00`);

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

  const updateMarkerAvailabilityByTime = async () => {
    if (!bookingModalData || !selectedLocation) return;
    
    setLoading(true);
    try {
      // Fetch all markers
      const markers: FloorplanMarker[] = await getMarkers(selectedLocation.id);
      
      // Fetch availability for the selected time
      const availability = await getMarkerAvailability(
        selectedLocation.id, 
        bookingModalData.date,
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
  };

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
      alert('Booking created successfully!');
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

  const getStaticFileUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const staticBaseUrl = baseUrl.replace(/\/api\/?$/, '');
    return `${staticBaseUrl}${path}`;
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
              selectable={true}
              select={handleDateSelect}
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
                          
                          // Auto-adjust end time if it's before or too close to start time
                          if (endTime <= newStartTime) {
                            const [hour, minute] = newStartTime.split(':').map(Number);
                            const newEndHour = Math.min(hour + 1, 23);
                            setEndTime(`${newEndHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                          }
                          
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
                        min={startTime}
                        onClick={(e) => e.currentTarget.showPicker()}
                        onChange={(e) => {
                          const newEndTime = e.target.value;
                          
                          if (newEndTime <= startTime) {
                            alert('End time must be after start time');
                            return;
                          }
                          
                          setEndTime(newEndTime);
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
                </div>
              </div>

              <div className="mb-4">
                <button
                  onClick={updateMarkerAvailabilityByTime}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Availability'}
                </button>
              </div>

              {bookingModalData.floorplanPath && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Select a Seat (Click on available markers)
                  </label>
                  <div className="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                    <img
                      src={getStaticFileUrl(bookingModalData.floorplanPath)}
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
                  <div className="mt-3 flex gap-4 items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap">
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
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="shadow-theme-xs flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={!selectedMarkerId || loading}
                  className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex justify-center rounded-lg px-4 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
