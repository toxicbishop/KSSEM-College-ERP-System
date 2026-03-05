import { MainHeader } from "@/components/layout/main-header";
import { Vote, Trophy, Clock, ChevronRight } from "lucide-react";

const activeElections = [
  {
    id: "elec1",
    title: "Student Body President Election",
    description: "Vote for the next president.",
    closingDate: "2024-09-15",
  },
  {
    id: "elec2",
    title: "Engineering Club Lead Election",
    description: "Choose the new club leader.",
    closingDate: "2024-09-20",
  },
];

const pastElections = [
  {
    id: "elec3",
    title: "Library Committee Representative",
    description: "Results are available.",
    closingDate: "2024-05-10",
    result: "Jane Smith Elected",
  },
];

export default function VotingSystemPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-8 pt-8">
        <div className="border-b border-kssem-border pb-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-kssem-navy">
            Voting System
          </h1>
          <p className="text-kssem-text-muted text-sm mt-1">
            Participate in campus elections and view results.
          </p>
        </div>

        {/* Active Elections */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Vote className="h-5 w-5 text-kssem-gold" />
            <h2 className="font-serif font-bold text-xl text-kssem-text">
              Active Elections
            </h2>
          </div>
          {activeElections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeElections.map((election) => (
                <div
                  key={election.id}
                  className="card-prestige group hover:-translate-y-1 transition-transform duration-300">
                  <div className="mb-4">
                    <h3 className="font-bold text-kssem-navy text-lg group-hover:text-kssem-gold transition-colors">
                      {election.title}
                    </h3>
                    <p className="text-kssem-text-muted text-sm mt-1">
                      {election.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-kssem-text-muted text-xs mb-4">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Closes on:{" "}
                      <strong className="text-kssem-text">
                        {election.closingDate}
                      </strong>
                    </span>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-kssem-navy hover:bg-kssem-navy-light text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors">
                    <Vote className="h-4 w-4" /> Cast Your Vote{" "}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-prestige rounded-sm p-8 text-center">
              <p className="text-kssem-text-muted text-sm">
                No active elections at the moment.
              </p>
            </div>
          )}
        </section>

        {/* Past Elections */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5 text-kssem-text-muted" />
            <h2 className="font-serif font-bold text-xl text-kssem-text">
              Past Elections & Results
            </h2>
          </div>
          {pastElections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastElections.map((election) => (
                <div
                  key={election.id}
                  className="bg-kssem-bg border border-kssem-border rounded-sm p-5">
                  <h3 className="font-bold text-kssem-text">
                    {election.title}
                  </h3>
                  <p className="text-kssem-text-muted text-sm mt-1">
                    {election.description}
                  </p>
                  <div className="mt-3 bg-status-bg-success text-status-success inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-status-success/20">
                    <Trophy className="h-3 w-3" /> {election.result}
                  </div>
                  <p className="text-kssem-text-muted text-xs mt-2">
                    Closed on: {election.closingDate}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-prestige rounded-sm p-8 text-center">
              <p className="text-kssem-text-muted text-sm">
                No past election history.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
