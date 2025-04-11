import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  {
    id: 1,
    title: "Live Podcast Recording: Tech Trends 2023",
    date: "Oct 15, 2023",
    time: "6:00 PM - 8:00 PM",
    location: "Studio One, Downtown",
    category: "Live Recording",
  },
  {
    id: 2,
    title: "Meet & Greet with Podcast Hosts",
    date: "Oct 22, 2023",
    time: "3:00 PM - 5:00 PM",
    location: "Central Park Pavilion",
    category: "Community",
  },
  {
    id: 3,
    title: "Audiobook Launch: 'The Silent Echo'",
    date: "Nov 5, 2023",
    time: "7:00 PM - 9:00 PM",
    location: "City Library Auditorium",
    category: "Book Launch",
  },
];

export default function UpcomingEvents() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card
          key={event.id}
          className="overflow-hidden hover:shadow-md transition-all"
        >
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-4">
            <span className="text-xs font-medium text-white bg-white/20 px-2 py-1 rounded-full">
              {event.category}
            </span>
          </div>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">{event.title}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            </div>
            <Button className="w-full bg-brand-600 hover:bg-brand-700">
              Register Now
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
