'use client'

import { CalendarDays, Clock, Filter, MapPin, Plus, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/ui/navbar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  attendees: number
  category: 'meeting' | 'workshop' | 'social' | 'deadline' | 'other'
  color: string
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'React Workshop',
    description: 'Learn advanced React patterns and hooks',
    date: new Date(2025, 0, 15),
    time: '10:00 AM',
    location: 'Tech Hub Jakarta',
    attendees: 25,
    category: 'workshop',
    color: 'bg-blue-500',
  },
  {
    id: '2',
    title: 'Team Standup',
    description: 'Daily team synchronization meeting',
    date: new Date(2025, 0, 16),
    time: '9:00 AM',
    location: 'Conference Room A',
    attendees: 8,
    category: 'meeting',
    color: 'bg-green-500',
  },
  {
    id: '3',
    title: 'Project Deadline',
    description: 'VibeDev ID v2.0 release deadline',
    date: new Date(2025, 0, 20),
    time: '11:59 PM',
    location: 'Remote',
    attendees: 0,
    category: 'deadline',
    color: 'bg-red-500',
  },
  {
    id: '4',
    title: 'Community Meetup',
    description: 'Monthly VibeDev community gathering',
    date: new Date(2025, 0, 25),
    time: '7:00 PM',
    location: 'Coworking Space Bandung',
    attendees: 45,
    category: 'social',
    color: 'bg-purple-500',
  },
]

const categoryColors = {
  meeting: 'bg-green-100 text-green-800 border-green-200',
  workshop: 'bg-blue-100 text-blue-800 border-blue-200',
  social: 'bg-purple-100 text-purple-800 border-purple-200',
  deadline: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: new Date(),
    time: '',
    location: '',
    attendees: 0,
    category: 'other',
  })

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      const event: Event = {
        id: Date.now().toString(),
        title: newEvent.title,
        description: newEvent.description || '',
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location || '',
        attendees: newEvent.attendees || 0,
        category: newEvent.category || 'other',
        color: 'bg-indigo-500',
      }
      setEvents([...events, event])
      setNewEvent({
        title: '',
        description: '',
        date: new Date(),
        time: '',
        location: '',
        attendees: 0,
        category: 'other',
      })
      setIsAddEventOpen(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    // For calendar page, redirect to homepage sections if needed
    if (['projects', 'features', 'reviews', 'faq'].includes(sectionId)) {
      router.push(`/#${sectionId}`)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        showNavigation={true}
        scrollToSection={scrollToSection}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-lg">Manage your events, deadlines, and community activities</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="workshop">Workshops</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Dialog
            open={isAddEventOpen}
            onOpenChange={setIsAddEventOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>Create a new event for your calendar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          date: new Date(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Event location"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="attendees">Attendees</Label>
                    <Input
                      id="attendees"
                      type="number"
                      value={newEvent.attendees || 0}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          attendees: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newEvent.category || 'other'}
                      onValueChange={(value) =>
                        setNewEvent({
                          ...newEvent,
                          category: value as Event['category'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddEventOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddEvent}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Calendar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Single Date Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Calendar View
                </CardTitle>
                <CardDescription>Select a date to view events</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full rounded-md border"
                  modifiers={{
                    hasEvents: (date) => getEventsForDate(date).length > 0,
                  }}
                  modifiersClassNames={{
                    hasEvents: 'bg-primary/10 font-semibold',
                  }}
                />
              </CardContent>
            </Card>

            {/* Range Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Date Range Selection
                </CardTitle>
                <CardDescription>Select a date range for planning</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={setSelectedRange}
                  className="w-full rounded-md border"
                  numberOfMonths={2}
                />
              </CardContent>
            </Card>
          </div>

          {/* Events Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {selectedDate ? `Events for ${selectedDate.toISOString().split('T')[0]}` : 'Select a Date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <h4 className="text-sm font-semibold">{event.title}</h4>
                            <Badge className={categoryColors[event.category]}>{event.category}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-2 text-xs">{event.description}</p>
                          <div className="text-muted-foreground space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                            {event.attendees > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.attendees} attendees
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No events for this date</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a date to view events</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Next events in your calendar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredEvents
                    .filter((event) => event.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-2"
                      >
                        <div className={`h-3 w-3 rounded-full ${event.color} mt-1.5 flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{event.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {event.date.toISOString().split('T')[0]} at {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  {filteredEvents.filter((event) => event.date >= new Date()).length === 0 && (
                    <p className="text-muted-foreground text-sm">No upcoming events</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total Events</span>
                    <Badge variant="secondary">{filteredEvents.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">This Month</span>
                    <Badge variant="secondary">
                      {
                        filteredEvents.filter(
                          (event) =>
                            event.date.getMonth() === new Date().getMonth() &&
                            event.date.getFullYear() === new Date().getFullYear(),
                        ).length
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Upcoming</span>
                    <Badge variant="secondary">
                      {filteredEvents.filter((event) => event.date >= new Date()).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
