import { CalendarWorkspace } from "@/features/calendar/components/CalendarWorkspace";
import {
  getTodayDateKey,
  getViewRange,
  isValidDateKey,
} from "@/features/calendar/date-utils";
import { getCalendarData } from "@/features/calendar/loaders";
import {
  CalendarViewModeSchema,
  type CalendarCustomerOption,
  type CalendarServiceOption,
} from "@/features/calendar/schemas";
import { getCatalog } from "@/features/catalog/loaders";
import { getCustomers } from "@/features/crm/loaders";
import { getOrganization } from "@/features/organizations/loaders";
import type { BusinessHours } from "@/features/organizations/schemas";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    personId?: string;
    customerId?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const parsedView = CalendarViewModeSchema.safeParse(params.view);
  const view = parsedView.success ? parsedView.data : "day";

  const [organization, catalog, customerPage] = await Promise.all([
    getOrganization().catch(() => null),
    getCatalog(),
    getCustomers({ page: 1, pageSize: 100 }),
  ]);

  const timezone = organization?.timezone || "UTC";
  const businessHours: BusinessHours | null = organization?.business_hours ?? null;
  const todayKey = getTodayDateKey(timezone);
  const dateKey =
    params.date && isValidDateKey(params.date) ? params.date : todayKey;
  const personId = params.personId || undefined;
  const customerId = params.customerId || undefined;

  const { from, to } = getViewRange(view, dateKey, timezone);
  const { people, appointments } = await getCalendarData({
    from,
    to,
  });

  const services: CalendarServiceOption[] = catalog.flatMap((category) =>
    category.services.map((service) => ({
      id: service.id,
      name: service.name,
      duration_minutes: service.duration_minutes,
      category_name: category.name,
    })),
  );

  const customers: CalendarCustomerOption[] = customerPage.items.map(
    (customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    }),
  );

  return (
    <CalendarWorkspace
      key={`${view}:${dateKey}`}
      initialView={view}
      initialDate={dateKey}
      todayKey={todayKey}
      timezone={timezone}
      businessHours={businessHours}
      initialSelectedPersonId={personId}
      initialCustomerId={customerId}
      people={people}
      initialAppointments={appointments}
      customers={customers}
      services={services}
    />
  );
}
