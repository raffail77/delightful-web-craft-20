import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Info } from "lucide-react";

export default function AdminChatbot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-secondary" /> Chatbot Activity Logs
        </h1>
        <p className="text-muted-foreground text-sm">Monitor AI assistant interactions</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-full bg-secondary/10">
            <Info className="h-8 w-8 text-secondary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">Chatbot logging coming soon</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              Chatbot activity logs will be available here once conversation logging is enabled.
              This will show user queries, response times, and conversation analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
