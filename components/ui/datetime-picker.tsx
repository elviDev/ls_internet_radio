"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  label: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  minDate?: Date
}

export function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = "Pick date & time",
  required = false,
  disabled = false,
  minDate
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [hour, setHour] = useState(value ? value.getHours().toString().padStart(2, '0') : "09")
  const [minute, setMinute] = useState(value ? value.getMinutes().toString().padStart(2, '0') : "00")

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const newDateTime = new Date(date)
      newDateTime.setHours(parseInt(hour), parseInt(minute))
      onChange(newDateTime)
    } else {
      onChange(undefined)
    }
  }

  const handleTimeChange = (newHour?: string, newMinute?: string) => {
    const finalHour = newHour || hour
    const finalMinute = newMinute || minute
    
    setHour(finalHour)
    setMinute(finalMinute)
    
    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(parseInt(finalHour), parseInt(finalMinute))
      onChange(newDateTime)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {required && <span className="text-red-500">*</span>}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate) {
                  return date < new Date(minDate.setHours(0, 0, 0, 0))
                }
                return date < new Date(new Date().setHours(0, 0, 0, 0))
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Select 
          value={hour} 
          onValueChange={(value) => handleTimeChange(value, undefined)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                {i.toString().padStart(2, '0')}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={minute} 
          onValueChange={(value) => handleTimeChange(undefined, value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 4 }, (_, i) => (
              <SelectItem key={i} value={(i * 15).toString().padStart(2, '0')}>
                :{(i * 15).toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}