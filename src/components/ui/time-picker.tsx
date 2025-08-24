"use client";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Button } from "./button";

export interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  showCurrentTimeButton?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled,
  error,
  className,
  showCurrentTimeButton = true,
}) => {
  const getDefaultTime = React.useCallback(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(m / 5) * 5;
    return {
      hour: String(h).padStart(2, "0"),
      minute: String(roundedMinutes).padStart(2, "0"),
    };
  }, []);

  const [hour, setHour] = React.useState<string>("");
  const [minute, setMinute] = React.useState<string>("");

  const handleSetCurrentTime = React.useCallback(() => {
    const def = getDefaultTime();
    setHour(def.hour);
    setMinute(def.minute);
    if (onChange) {
      const newValue = `${def.hour}:${def.minute}`;
      onChange(newValue);
    }
  }, [getDefaultTime, onChange]);

  React.useEffect(() => {
    if (!value) {
      const def = getDefaultTime();
      setHour(def.hour);
      setMinute(def.minute);
      if (onChange) {
        const newValue = `${def.hour}:${def.minute}`;
        onChange(newValue);
      }
    } else if (
      typeof value === "string" &&
      value.match(/^\d{1,2}:\d{2}$/)
    ) {
      const [h, m] = value.split(":");
      setHour(h);
      setMinute(m);
    }
  }, []);

  const handleChange = React.useCallback(
    (h: string, m: string) => {
      setHour(h);
      setMinute(m);
      if (h && m && onChange) {
        const newValue = `${h}:${m}`;
        if (newValue !== value) {
          onChange(newValue);
        }
      }
    },
    [onChange, value]
  );

  // Generate 5-minute intervals
  const minuteOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 60; i += 5) {
      options.push(String(i).padStart(2, "0"));
    }
    return options;
  }, []);

  return (
    <div
      className={
        className ??
        "flex w-full flex-col items-center gap-2" +
          (error ? " rounded border border-red-500 p-2" : "")
      }
    >
      <div className="flex w-full items-center gap-2 justify-center">
        <div className="w-16">
          <Select
            disabled={disabled}
            onValueChange={(val: string) => handleChange(val, minute)}
            value={hour}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) =>
                String(i).padStart(2, "0")
              ).map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-slate-600">:</span>
        <div className="w-16">
          <Select
            disabled={disabled}
            onValueChange={(val: string) => handleChange(hour, val)}
            value={minute}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {showCurrentTimeButton && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleSetCurrentTime}
        >
          Set Current Time
        </Button>
      )}
    </div>
  );
};
