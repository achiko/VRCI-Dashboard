'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TokenForm } from '@/components/admin/token-form';
import { TokenList } from '@/components/admin/token-list';
import { TokenTable } from '@/components/admin/token-table';
import { WhitelistManager } from '@/components/admin/whitelist-manager';
import { TokenRegistrationManager } from '@/components/admin/token-registration-manager';
import { Settings, Plus, List, Table2, Shield, Database } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('table');

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage tokens, whitelist, and monitor Oracle data from CoinMarketCap
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Token Management
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Token
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Register Tokens
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <TokenTable />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <TokenList />
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <TokenForm />
        </TabsContent>

        <TabsContent value="register" className="space-y-6">
          <TokenRegistrationManager />
        </TabsContent>

        <TabsContent value="whitelist" className="space-y-6">
          <WhitelistManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

