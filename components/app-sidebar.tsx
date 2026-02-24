"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, ChartHistogramIcon, CreditCardIcon, Settings05Icon, HelpCircleIcon, File01Icon, ChartLineData01Icon, DollarCircleIcon, UserGroupIcon, CommandIcon, Add01Icon, ShoppingBasket01Icon, GiveBloodIcon, Store01Icon, Archive01Icon } from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "Volunteer",
    email: "volunteer@giftcards.org",
    avatar: "/avatars/volunteer.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: (
        <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Add Gift Card",
      url: "/add-card",
      icon: (
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Spending",
      url: "/redemption",
      icon: (
        <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Donations Given",
      url: "/donations",
      icon: (
        <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Reports",
      url: "#",
      icon: (
        <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
      ),
    },
  ],
  navClouds: [
    {
      title: "Categories",
      icon: (
        <HugeiconsIcon icon={Store01Icon} strokeWidth={2} />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Fast Food",
          url: "#",
        },
        {
          title: "Grocery",
          url: "#",
        },
        {
          title: "Clothing",
          url: "#",
        },
        {
          title: "Other",
          url: "#",
        },
      ],
    },
    {
      title: "Quick Actions",
      icon: (
        <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2} />
      ),
      url: "#",
      items: [
        {
          title: "Record Spend",
          url: "#",
        },
        {
          title: "Record Donation",
          url: "#",
        },
        {
          title: "Bulk Import",
          url: "#",
        },
      ],
    },
    {
      title: "Management",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
      url: "#",
      items: [
        {
          title: "Volunteers",
          url: "#",
        },
        {
          title: "Stores",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Help",
      url: "#",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Export Data",
      url: "#",
      icon: (
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
      ),
    },
  ],
  documents: [
    {
      name: "All Cards",
      url: "#",
      icon: (
        <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Transactions",
      url: "#",
      icon: (
        <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Value Report",
      url: "#",
      icon: (
        <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">GiftCard Tracker</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
