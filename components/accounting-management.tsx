"use client"

import { useState } from "react"
import { BarChart3, Wallet, FileText } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatisticsDashboard } from "@/components/statistics-dashboard"
import { SalaryManagement } from "@/components/salary-management"
import { InvoiceManagement } from "@/components/invoice-management"

export function AccountingManagement() {
  const [accountingTab, setAccountingTab] = useState<string>("statistics")

  return (
    <Tabs defaultValue="statistics" onValueChange={setAccountingTab} className="w-full mb-6">
      <TabsList className="bg-white border w-full justify-start overflow-x-auto">
        <TabsTrigger
          value="statistics"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistiques
        </TabsTrigger>
        <TabsTrigger
          value="salaries"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Gestion des Salaires
        </TabsTrigger>
        <TabsTrigger
          value="invoices"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
        >
          <FileText className="h-4 w-4 mr-2" />
          Gestion des Factures
        </TabsTrigger>
      </TabsList>

      <TabsContent value="statistics">
        <StatisticsDashboard />
      </TabsContent>

      <TabsContent value="salaries">
        <SalaryManagement />
      </TabsContent>

      <TabsContent value="invoices">
        <InvoiceManagement />
      </TabsContent>
    </Tabs>
  )
}
