"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [date, setDate] = useState<Date>();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle form submission here
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have questions, feedback, or want to work with us? We'd love to hear
          from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-brand-600 dark:text-brand-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Call Us</h3>
            <p className="text-muted-foreground mb-4">
              Mon-Fri from 8am to 5pm
            </p>
            <p className="font-medium">+1 (555) 123-4567</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-brand-600 dark:text-brand-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-muted-foreground mb-4">
              We'll respond within 24 hours
            </p>
            <p className="font-medium">contact@wavestream.example</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-brand-600 dark:text-brand-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
            <p className="text-muted-foreground mb-4">
              Come say hello at our office
            </p>
            <p className="font-medium">
              123 Broadcast Ave, Suite 200
              <br />
              Media City, CA 90210
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>

          <Tabs defaultValue="message">
            <TabsList className="mb-6">
              <TabsTrigger value="message">Send a Message</TabsTrigger>
              <TabsTrigger value="appointment">Book an Appointment</TabsTrigger>
              <TabsTrigger value="advertise">Advertise With Us</TabsTrigger>
            </TabsList>

            <TabsContent value="message">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="partnership">
                        Partnership Opportunity
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Your message here..."
                    className="min-h-[150px]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  Send Message
                </Button>

                {formSubmitted && (
                  <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>
                      Your message has been sent! We'll get back to you soon.
                    </span>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="appointment">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment-name">Full name</Label>
                    <Input
                      id="appointment-name"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-email">Email</Label>
                    <Input
                      id="appointment-email"
                      type="email"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-type">Appointment Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio-tour">Studio Tour</SelectItem>
                      <SelectItem value="podcast-guest">
                        Podcast Guest Appearance
                      </SelectItem>
                      <SelectItem value="business-meeting">
                        Business Meeting
                      </SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9am">9:00 AM</SelectItem>
                      <SelectItem value="10am">10:00 AM</SelectItem>
                      <SelectItem value="11am">11:00 AM</SelectItem>
                      <SelectItem value="1pm">1:00 PM</SelectItem>
                      <SelectItem value="2pm">2:00 PM</SelectItem>
                      <SelectItem value="3pm">3:00 PM</SelectItem>
                      <SelectItem value="4pm">4:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-notes">Additional Notes</Label>
                  <Textarea
                    id="appointment-notes"
                    placeholder="Any specific details about your appointment..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  Request Appointment
                </Button>

                {formSubmitted && (
                  <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>
                      Your appointment request has been submitted! We'll confirm
                      shortly.
                    </span>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="advertise">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company name</Label>
                    <Input id="company-name" placeholder="Acme Inc." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Contact name</Label>
                    <Input id="contact-name" placeholder="John Doe" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Advertising Interest</Label>
                  <RadioGroup
                    defaultValue="podcast"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="podcast" id="podcast" />
                      <Label htmlFor="podcast">Podcast Sponsorship</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="live" id="live" />
                      <Label htmlFor="live">Live Broadcast Ads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="website" id="website" />
                      <Label htmlFor="website">Website Banners</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="app" id="app" />
                      <Label htmlFor="app">In-App Promotions</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Estimated Budget</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under5k">Under $5,000</SelectItem>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="over50k">Over $50,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-details">Campaign Details</Label>
                  <Textarea
                    id="campaign-details"
                    placeholder="Tell us about your product/service and advertising goals..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  Submit Advertising Inquiry
                </Button>

                {formSubmitted && (
                  <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>
                      Your advertising inquiry has been received! Our team will
                      contact you soon.
                    </span>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                How can I listen to WaveStream?
              </h3>
              <p className="text-muted-foreground">
                You can listen to WaveStream directly through our website or by
                installing our progressive web app on your mobile device. We're
                also available on major podcast platforms.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                How do I submit my podcast to WaveStream?
              </h3>
              <p className="text-muted-foreground">
                We're always looking for great content! Please use the contact
                form and select "Partnership Opportunity" as the subject to
                submit your podcast for consideration.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Do you offer studio rentals?
              </h3>
              <p className="text-muted-foreground">
                Yes, our professional recording studios are available for rent.
                Please book an appointment to discuss your needs and schedule a
                tour.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                How can I advertise on WaveStream?
              </h3>
              <p className="text-muted-foreground">
                We offer various advertising options including podcast
                sponsorships, live broadcast ads, and digital promotions. Use
                our advertising form to get started.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Are there job opportunities at WaveStream?
              </h3>
              <p className="text-muted-foreground">
                We're growing! Check our About page for current job openings or
                send your resume to careers@wavestream.example.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-muted rounded-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-brand-100 dark:bg-brand-900 p-2 mt-1">
                <MessageSquare className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Still have questions?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our support team is here to help. Reach out to us and we'll
                  get back to you as soon as possible.
                </p>
                <Button variant="outline" size="sm">
                  Chat with Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden h-[400px] relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.7152203627526!2d-118.35845492424365!3d34.0764938726045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2b8d3b1e0287d%3A0x9cc32be17df028b8!2sCBS%20Television%20City!5e0!3m2!1sen!2sus!4v1682458335242!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="WaveStream Location"
          className="absolute inset-0"
        ></iframe>
      </div>
    </div>
  );
}
