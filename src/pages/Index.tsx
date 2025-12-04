import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { GuestList } from "@/components/GuestList";
import { AccommodationView } from "@/components/AccommodationView";
import { SettingsView } from "@/components/SettingsView";
import { BottomNav } from "@/components/BottomNav";
import { initialGuests } from "@/data/guests";

type TabType = "dashboard" | "guests" | "accommodations" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [guests] = useState(initialGuests);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard guests={guests} />;
      case "guests":
        return <GuestList guests={guests} />;
      case "accommodations":
        return <AccommodationView guests={guests} />;
      case "settings":
        return <SettingsView />;
      default:
        return <Dashboard guests={guests} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 py-6">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
