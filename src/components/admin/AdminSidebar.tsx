import {
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Star,
  MessageSquare,
  LayoutDashboard,
  Shield,
  Settings,
  GraduationCap,
  Newspaper,
  Mail,
  DollarSign,
  HelpCircle,
  Activity,
  Scale,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Service Requests", url: "/admin/services", icon: Briefcase },
  { title: "Contracts", url: "/admin/contracts", icon: FileText },
  { title: "Transactions", url: "/admin/transactions", icon: CreditCard },
  { title: "Reviews", url: "/admin/reviews", icon: Star },
  { title: "Careers", url: "/admin/careers", icon: GraduationCap },
  { title: "Blog & Press", url: "/admin/blog", icon: Newspaper },
  { title: "Contact Inbox", url: "/admin/messages", icon: Mail },
  { title: "Pricing Plans", url: "/admin/pricing", icon: DollarSign },
  { title: "Help Center", url: "/admin/help", icon: HelpCircle },
  { title: "System Status", url: "/admin/status", icon: Activity },
  { title: "Legal Docs", url: "/admin/legal", icon: Scale },
  { title: "Chatbot Logs", url: "/admin/chatbot", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-secondary" />
            {!collapsed && <span>Admin Panel</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-secondary/10 text-secondary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
