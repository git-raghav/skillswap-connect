import { ExternalLink, Calendar, Video, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduledMeeting {
  title: string;
  date: string;
  time: string;
  meetLink: string;
}

interface MediaAttachment {
  url: string;
  type: string;
  name: string;
}

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: string;
  messageType?: string;
  scheduledMeeting?: ScheduledMeeting | null;
  media?: MediaAttachment | null;
}

const MessageBubble = ({
  content,
  isOwn,
  timestamp,
  messageType = "text",
  scheduledMeeting,
  media,
}: MessageBubbleProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Render meeting message
  if (messageType === "meeting" && scheduledMeeting) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold text-sm">Meeting Scheduled</span>
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{scheduledMeeting.title}</p>
            <p>
              {formatDate(scheduledMeeting.date)} at {formatTime(scheduledMeeting.time)}
            </p>
          </div>
          <Button
            variant={isOwn ? "secondary" : "default"}
            size="sm"
            className="mt-3 gap-2 w-full"
            onClick={() => openInNewTab(scheduledMeeting.meetLink)}
          >
            <Video className="w-4 h-4" />
            Join Google Meet
            <ExternalLink className="w-3 h-3" />
          </Button>
          <span
            className={`text-xs mt-2 block ${
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {timestamp}
          </span>
        </div>
      </div>
    );
  }

  // Render media message
  if (messageType === "media" && media) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          {media.type === "image" ? (
            <div className="space-y-2">
              <img
                src={media.url}
                alt={media.name}
                className="rounded-lg max-h-64 object-cover cursor-pointer"
                onClick={() => openInNewTab(media.url)}
              />
              <div className="flex items-center gap-2 text-xs">
                <ImageIcon className="w-3 h-3" />
                <span className="truncate">{media.name}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openInNewTab(media.url)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/10 transition-colors w-full"
            >
              <FileText className="w-8 h-8 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{media.name}</p>
                <p className="text-xs opacity-70">Click to open</p>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </button>
          )}
          {content && <p className="text-sm mt-2">{content}</p>}
          <span
            className={`text-xs mt-1 block ${
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {timestamp}
          </span>
        </div>
      </div>
    );
  }

  // Default text message
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        <p className="text-sm">{content}</p>
        <span
          className={`text-xs mt-1 block ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
