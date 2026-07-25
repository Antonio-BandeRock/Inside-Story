import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// Thin wrapper around expo-calendar -- talks to whichever calendar app is
// already on the device (iOS Calendar / Android Calendar), which is also
// where any Outlook or Google account the person has already added in
// their phone's own Settings already syncs its events to. That's the
// entire integration: no separate Google/Microsoft sign-in, no API keys,
// no new cloud service this app talks to -- consistent with the rest of
// the app's "no server holds your health data" design. See the
// Appointments lens in app/(tabs)/schedule.tsx for how this is used.

export type DeviceCalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string | null;
  notes: string | null;
  calendarTitle: string;
};

export async function hasCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted';
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// The calendar new events get written into. iOS has a real notion of "the
// default calendar" for an account; Android doesn't, so the first calendar
// that actually accepts new events (allowsModifications) is used instead --
// typically the person's main Google-account calendar, since that's
// usually the one already marked as the device's own default.
export async function getWritableCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return defaultCalendar.id;
    } catch {
      // Falls through to the generic search below if there's no default
      // (e.g. no calendar account configured yet).
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((calendar) => calendar.allowsModifications);
  return writable?.id ?? null;
}

export async function listUpcomingDeviceEvents(startDate: Date, endDate: Date): Promise<DeviceCalendarEvent[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) {
    return [];
  }
  const calendarTitleById = new Map(calendars.map((calendar) => [calendar.id, calendar.title]));

  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    startDate,
    endDate,
  );

  return events
    .filter((event) => !event.allDay)
    .map((event) => ({
      id: event.id,
      title: event.title || 'Untitled event',
      // expo-calendar returns startDate/endDate as a string on iOS but a
      // Date on Android -- normalized to a real ISO string either way
      // rather than trusting either shape blindly.
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
      location: event.location || null,
      notes: event.notes || null,
      calendarTitle: calendarTitleById.get(event.calendarId) ?? 'Calendar',
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function createDeviceCalendarEvent(input: {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}): Promise<string | null> {
  const calendarId = await getWritableCalendarId();
  if (!calendarId) {
    return null;
  }
  return Calendar.createEventAsync(calendarId, {
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate,
    location: input.location,
    notes: input.notes,
  });
}

export async function updateDeviceCalendarEvent(
  eventId: string,
  input: { title: string; startDate: Date; endDate: Date; location?: string; notes?: string },
): Promise<void> {
  await Calendar.updateEventAsync(eventId, {
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate,
    location: input.location,
    notes: input.notes,
  });
}

// Swallows "already gone" failures -- if the person deleted the event
// directly in their calendar app, unlinking it here should still succeed
// rather than blocking removal of the in-app appointment over it.
export async function deleteDeviceCalendarEvent(eventId: string): Promise<void> {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // Already deleted on the device side, or the calendar it belonged to
    // was removed -- either way, nothing left to do here.
  }
}
