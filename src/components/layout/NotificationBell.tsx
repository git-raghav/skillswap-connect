import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const NotificationBell = () => {
  const { counts, loading } = useNotifications();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {!loading && counts.total > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {counts.total > 9 ? "9+" : counts.total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2">
          <h4 className="font-semibold text-foreground">Notifications</h4>
        </div>
        <DropdownMenuSeparator />
        {counts.total === 0 ? (
          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
            No new notifications
          </div>
        ) : (
          <>
            {counts.unreadRequests > 0 && (
              <DropdownMenuItem 
                onClick={() => navigate("/requests")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Pending barter requests</span>
                  <Badge variant="secondary">{counts.unreadRequests}</Badge>
                </div>
              </DropdownMenuItem>
            )}
            {counts.unreadMessages > 0 && (
              <DropdownMenuItem 
                onClick={() => navigate("/messages")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>New messages (24h)</span>
                  <Badge variant="secondary">{counts.unreadMessages}</Badge>
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
