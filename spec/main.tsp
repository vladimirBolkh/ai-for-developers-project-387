import "@typespec/http";

using Http;

@service(#{ title: "Calls Calendar API" })
namespace CallsCalendar;

// --- Типы событий ---

enum MeetingFormat {
  online: "online",
  offline: "offline",
}

model EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
  format: MeetingFormat;
}

model EventTypeCreate {
  name: string;
  description: string;
  durationMinutes: int32;
  format: MeetingFormat;
}

model EventTypeUpdate {
  name?: string;
  description?: string;
  durationMinutes?: int32;
  format?: MeetingFormat;
}

// --- Рабочие часы ---

model DayHours {
  start: string;
  end: string;
}

model WorkingHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

// --- Запись / Встреча ---

model BookingRequest {
  eventTypeId: string;
  startDateTime: string;
  guestName: string;
  guestEmail?: string;
}

model Meeting {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  eventTypeDescription: string;
  eventTypeDurationMinutes: int32;
  eventTypeFormat: MeetingFormat;
  startDateTime: string;
  guestName: string;
  guestEmail?: string;
}

// --- Слоты доступности ---

// Статус слота в сетке дня: свободен для записи, занят (уже записались),
// недоступен по времени (момент уже наступил).
enum SlotStatus {
  free: "free",
  busy: "busy",
  unavailable: "unavailable",
}

model Slot {
  startDateTime: string;
  status: SlotStatus;
}

// --- Ошибки ---

@error
model NotFoundError {
  @statusCode statusCode: 404;
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 400;
  message: string;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  message: string;
}

model CreatedMeeting {
  @statusCode statusCode: 201;
  @body meeting: Meeting;
}

// --- Операции ---

@route("/event-types")
interface EventTypes {
  @get list(): EventType[];
  @post create(@body body: EventTypeCreate): EventType | ValidationError;
  @get read(@path id: string): EventType | NotFoundError;
  @patch update(
    @path id: string,
    @body body: EventTypeUpdate,
  ): EventType | NotFoundError | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;
}

@route("/working-hours")
interface WorkingHoursOperations {
  @get get(): WorkingHours;
  @put set(@body body: WorkingHours): WorkingHours | ValidationError;
}

@route("/availability")
interface Availability {
  @get get(@query eventTypeId: string): Slot[] | NotFoundError;
}

@route("/bookings")
interface Bookings {
  @post create(@body body: BookingRequest): CreatedMeeting | ValidationError | ConflictError | NotFoundError;
  @get list(): Meeting[];
}
