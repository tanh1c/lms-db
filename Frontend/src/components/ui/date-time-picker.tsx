"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "MM/DD/YYYY hh:mm aa",
  className,
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve time if date already exists, otherwise set to current time
      if (date) {
        const newDate = new Date(selectedDate)
        newDate.setHours(date.getHours())
        newDate.setMinutes(date.getMinutes())
        onDateChange(newDate)
      } else {
        const newDate = new Date(selectedDate)
        newDate.setHours(12) // Default to 12 PM
        newDate.setMinutes(0)
        onDateChange(newDate)
      }
    }
  }

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    value: string
  ) => {
    let newDate: Date
    
    if (date) {
      newDate = new Date(date)
    } else {
      // Create new date with today and default time (12:00 PM)
      newDate = new Date()
      newDate.setHours(12, 0, 0, 0)
    }
    
    if (type === "hour") {
      const hourValue = parseInt(value)
      const currentHours = newDate.getHours()
      const isPM = currentHours >= 12
      // Convert 12-hour format to 24-hour format
      // 12 PM = 12, 12 AM = 0, 1-11 PM = 13-23, 1-11 AM = 1-11
      newDate.setHours(
        (hourValue % 12) + (isPM ? 12 : 0)
      )
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value))
    } else if (type === "ampm") {
      const currentHours = newDate.getHours()
      const hour12 = currentHours % 12 || 12
      if (value === "PM") {
        newDate.setHours(hour12 === 12 ? 12 : hour12 + 12)
      } else {
        newDate.setHours(hour12 === 12 ? 0 : hour12)
      }
    }
    
    onDateChange(newDate)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "MM/dd/yyyy hh:mm aa")
          ) : (
            <span className="text-[#676767] dark:text-gray-400">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1a1a1a] border-[#e5e7e7] dark:border-[#333]">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={minDate ? (date) => date < minDate : undefined}
            className="bg-white dark:bg-[#1a1a1a]"
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7e7] dark:divide-[#333]">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      date && date.getHours() % 12 === hour % 12
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      date && date.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
                  >
                    {minute}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea>
              <div className="flex sm:flex-col p-2">
                {["AM", "PM"].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      date &&
                      ((ampm === "AM" && date.getHours() < 12) ||
                        (ampm === "PM" && date.getHours() >= 12))
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("ampm", ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "MM/DD/YYYY",
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "MM/dd/yyyy")
          ) : (
            <span className="text-[#676767] dark:text-gray-400">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1a1a1a] border-[#e5e7e7] dark:border-[#333]">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setIsOpen(false)
          }}
          initialFocus
          disabled={
            minDate || maxDate
              ? (date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }
              : undefined
          }
          className="bg-white dark:bg-[#1a1a1a]"
        />
      </PopoverContent>
    </Popover>
  )
}

