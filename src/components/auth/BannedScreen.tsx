import { motion } from "framer-motion";
import { ShieldX, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const BannedScreen = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Account Suspended
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Your account has been suspended due to a violation of our community guidelines. 
            If you believe this is a mistake, please contact our support team.
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => window.location.href = "mailto:support@barterly.com"}
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Reference your account email when contacting support for faster assistance.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BannedScreen;
