import { MainHeader } from "@/components/layout/main-header";
import {
  CalendarPlus,
  CalendarCheck,
  CalendarClock,
  Clock,
  User,
} from "lucide-react";

const upcomingAppointments = [
  {
    id: "appt1",
    date: "2024-09-10",
    time: "10:00 AM",
    with: "Prof. Smith",
    reason: "Project Discussion",
  },
  {
    id: "appt2",
    date: "2024-09-12",
    time: "02:30 PM",
    with: "Advisor Jones",
    reason: "Course Selection",
  },
];

const pastAppointments = [
  {
    id: "appt3",
    date: "2024-08-15",
    time: "11:00 AM",
    with: "Career Services",
    reason: "Resume Review",
  },
];

export default function AppointmentsPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-kssem-border pb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-kssem-navy">
              Appointments
            </h1>
            <p className="text-kssem-text-muted text-sm mt-1">
              Schedule and manage your academic appointments.
            </p>
          </div>
          <button className="mt-4 md:mt-0 flex items-center gap-2 bg-kssem-gold hover:bg-[#c4a030] text-kssem-navy px-5 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wider transition-colors shadow-sm">
            <CalendarPlus className="h-4 w-4" /> Schedule New
          </button>
        </div>

        {/* Upcoming */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CalendarClock className="h-5 w-5 text-kssem-gold" />
            <h2 className="font-serif font-bold text-xl text-kssem-text">
              Upcoming Appointments
            </h2>
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="card-prestige group hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-kssem-navy text-white p-3 rounded-sm text-center min-w-[56px]">
                      <p className="text-lg font-bold font-serif leading-none">
                        {appt.date.split("-")[2]}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider mt-0.5 text-gray-300">
                        {new Date(appt.date).toLocaleString("en", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-kssem-navy text-base">
                        {appt.reason}
                      </h3>
                      <div className="flex items-center gap-1.5 text-kssem-text-muted text-sm mt-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{appt.with}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-kssem-text-muted text-sm mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{appt.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-prestige rounded-sm p-8 text-center">
              <p className="text-kssem-text-muted text-sm">
                No upcoming appointments scheduled.
              </p>
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CalendarCheck className="h-5 w-5 text-kssem-text-muted" />
            <h2 className="font-serif font-bold text-xl text-kssem-text">
              Past Appointments
            </h2>
          </div>
          {pastAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-kssem-bg border border-kssem-border rounded-sm p-5 opacity-70">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 text-kssem-text-muted p-3 rounded-sm text-center min-w-[56px]">
                      <p className="text-lg font-bold font-serif leading-none">
                        {appt.date.split("-")[2]}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider mt-0.5">
                        {new Date(appt.date).toLocaleString("en", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-kssem-text text-base">
                        {appt.reason}
                      </h3>
                      <div className="flex items-center gap-1.5 text-kssem-text-muted text-sm mt-1">
                        <User className="h-3.5 w-3.5" />{" "}
                        <span>{appt.with}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-kssem-text-muted text-sm mt-0.5">
                        <Clock className="h-3.5 w-3.5" />{" "}
                        <span>{appt.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-prestige rounded-sm p-8 text-center">
              <p className="text-kssem-text-muted text-sm">
                No past appointment history.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
