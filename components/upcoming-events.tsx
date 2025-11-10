"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  scheduleId: string;
  title: string;
  description?: string;
  eventType: string;
  location?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isVirtual: boolean;
  virtualLink?: string;
  isPaid: boolean;
  ticketPrice?: number;
  currency: string;
  startTime: string;
  endTime?: string;
  organizer?: {
    id: string;
    name: string;
  };
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events?upcoming=true&limit=3');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    
    if (endTime) {
      const end = new Date(endTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      return `${start} - ${end}`;
    }
    
    return start;
  };

  const getEventCategory = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="bg-gray-200 p-4 h-16"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3 mb-6">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card
          key={event.id}
          className="overflow-hidden hover:shadow-md transition-all"
        >
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-4">
            <span className="text-xs font-medium text-white bg-white/20 px-2 py-1 rounded-full">
              {getEventCategory(event.eventType)}
            </span>
          </div>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">{event.title}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatDate(event.startTime)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatTime(event.startTime, event.endTime)}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {event.isVirtual 
                    ? "Virtual Event" 
                    : event.venue || event.location || `${event.city}, ${event.state}` || "Location TBA"
                  }
                </span>
              </div>
              {event.organizer && (
                <div className="text-xs text-muted-foreground">
                  Organized by {event.organizer.name}
                </div>
              )}
            </div>
            <Button className="w-full bg-brand-600 hover:bg-brand-700">
              {event.isPaid ? `$${event.ticketPrice} - Register` : "Register Now"}
            </Button>
          </CardContent>
        </Card>
      ))}
      {events.length === 0 && !isLoading && (
        <div className="col-span-3 text-center py-8">
          <p className="text-muted-foreground">No upcoming events at this time.</p>
        </div>
      )}
    </div>
  );
}
