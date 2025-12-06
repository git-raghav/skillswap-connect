import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleMeetingDialogProps {
  onSchedule: (meeting: {
    title: string;
    date: string;
    time: string;
    meetLink: string;
  }) => void;
  disabled?: boolean;
}

const ScheduleMeetingDialog = ({ onSchedule, disabled }: ScheduleMeetingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateGoogleMeetLink = () => {
    // Generate a random meeting ID
    const meetingId = Math.random().toString(36).substring(2, 12);
    return `https://meet.google.com/new?meetingId=${meetingId}`;
  };

  const handleSchedule = async () => {
    if (!title.trim() || !date || !time) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate date is not in the past
    const meetingDate = new Date(`${date}T${time}`);
    if (meetingDate < new Date()) {
      toast({
        title: "Invalid date",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const meetLink = generateGoogleMeetLink();
      
      onSchedule({
        title: title.trim(),
        date,
        time,
        meetLink,
      });

      setTitle("");
      setDate("");
      setTime("");
      setOpen(false);
      
      toast({
        title: "Meeting scheduled!",
        description: "The meeting details have been sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} title="Schedule a meeting">
          <Calendar className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Schedule a Video Call
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="meeting-title">Meeting Title</Label>
            <Input
              id="meeting-title"
              placeholder="e.g., Guitar Lesson, Coding Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meeting-date">Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
              />
            </div>
            <div>
              <Label htmlFor="meeting-time">Time</Label>
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A Google Meet link will be generated automatically for your video call.
          </p>
          <Button 
            onClick={handleSchedule} 
            className="w-full gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            Schedule Meeting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
