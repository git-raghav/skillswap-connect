import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Search, MessageCircle, Star, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: ArrowRightLeft,
    title: "Welcome to Barterly!",
    description: "Exchange skills with others instead of money. You teach what you know, and learn what you want.",
    color: "text-primary",
  },
  {
    icon: Search,
    title: "Find Your Match",
    description: "Browse skills offered by others and find people who want to learn what you can teach.",
    color: "text-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Connect & Chat",
    description: "Send barter requests and chat with potential partners to arrange skill exchanges.",
    color: "text-green-500",
  },
  {
    icon: Star,
    title: "Rate & Build Trust",
    description: "After completing a barter, rate your experience to build your reputation on the platform.",
    color: "text-yellow-500",
  },
  {
    icon: CheckCircle,
    title: "You're Ready!",
    description: "Start by completing your profile with your skills offered and wanted. Good luck!",
    color: "text-primary",
  },
];

const OnboardingDialog = ({ open, onComplete }: OnboardingDialogProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
    }
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8"
          >
            {/* Progress */}
            <div className="flex gap-1 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6`}
              >
                <Icon className={`w-10 h-10 ${step.color}`} />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-3">{step.title}</h2>
              <p className="text-muted-foreground mb-8">{step.description}</p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={handleSkip} className="flex-1">
                  Skip
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {currentStep < steps.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
