import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const SkillCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        {/* Skills */}
        <div className="p-4 space-y-3">
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 pt-0 flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillCardSkeleton;
