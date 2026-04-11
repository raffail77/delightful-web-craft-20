import { useState, useEffect } from "react";
import { useContracts, ContractStatus } from "@/hooks/useContracts";
import ContractCard from "@/components/messaging/ContractCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, Play, AlertTriangle, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusTabs: { value: string; label: string; icon: React.ElementType; statuses: ContractStatus[] }[] = [
  { value: "all", label: "All", icon: FileText, statuses: [] },
  { value: "active", label: "Active", icon: Play, statuses: ["proposed", "pending_payment", "accepted", "in_progress"] },
  { value: "proposed", label: "Proposed", icon: Clock, statuses: ["proposed"] },
  { value: "pending_payment", label: "Awaiting Payment", icon: Clock, statuses: ["pending_payment"] },
  { value: "in_progress", label: "In Progress", icon: Play, statuses: ["in_progress"] },
  { value: "completed", label: "Completed", icon: CheckCircle2, statuses: ["completed"] },
  { value: "cancelled", label: "Cancelled", icon: X, statuses: ["cancelled"] },
];

const Contracts = () => {
  const { contracts, isLoading, refreshContracts } = useContracts();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  // Verify Stripe payment on return from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const contractId = params.get("contract");

    if (payment === "success" && contractId) {
      supabase.functions.invoke("verify-contract-payment", {
        body: { contract_id: contractId },
      }).then(({ data, error }) => {
        if (error) {
          console.error("Payment verification error:", error);
        } else if (data?.activated) {
          toast({ title: "Payment Confirmed", description: "Your contract is now active!" });
          refreshContracts();
        }
      });
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancelled") {
      toast({ title: "Payment Cancelled", description: "You can pay later from the contract card.", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Re-verify pending_payment contracts when tab becomes visible (returning from Stripe)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const pendingContracts = contracts.filter(c => c.status === "pending_payment" && c.stripe_payment_intent_id);
        pendingContracts.forEach(c => {
          supabase.functions.invoke("verify-contract-payment", {
            body: { contract_id: c.id },
          }).then(({ data }) => {
            if (data?.activated) {
              toast({ title: "Payment Confirmed", description: `Contract "${c.title}" is now active!` });
              refreshContracts();
            }
          });
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [contracts]);

  const filteredContracts = contracts.filter((contract) => {
    if (activeTab === "all") return true;
    const tab = statusTabs.find((t) => t.value === activeTab);
    return tab?.statuses.includes(contract.status);
  });

  const getCountForTab = (tabValue: string) => {
    if (tabValue === "all") return contracts.length;
    const tab = statusTabs.find((t) => t.value === tabValue);
    return contracts.filter((c) => tab?.statuses.includes(c.status)).length;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Contracts</h1>
          <p className="text-muted-foreground">
            Manage your service agreements and track their progress
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {statusTabs.map((tab) => {
              const count = getCountForTab(tab.value);
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredContracts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <CardTitle className="text-lg mb-2">No contracts found</CardTitle>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {activeTab === "all"
                      ? "You don't have any contracts yet. Start by proposing a contract through the messaging dialog."
                      : `No contracts with "${statusTabs.find((t) => t.value === activeTab)?.label}" status.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onAction={refreshContracts}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Contracts;
