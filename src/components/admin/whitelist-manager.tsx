'use client';

import { useState } from 'react';
import { useWhitelist, useAddWhitelist, useRemoveWhitelist, type WhitelistEntry } from '@/hooks/api/useWhitelist';
import { useTypink } from 'typink';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Loader2, Shield, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function WhitelistManager() {
  const { data: whitelist, isLoading, error, refetch } = useWhitelist();
  const { connectedAccount } = useTypink();
  const addWhitelist = useAddWhitelist();
  const removeWhitelist = useRemoveWhitelist();

  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!address.trim()) {
      setErrorMessage('Address is required');
      return;
    }

    try {
      await addWhitelist.mutateAsync({
        address: address.trim(),
        note: note.trim() || undefined,
        addedBy: connectedAccount?.address || undefined,
      });

      // Reset form
      setAddress('');
      setNote('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add whitelist entry');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address from the whitelist?')) return;

    try {
      await removeWhitelist.mutateAsync(id);
    } catch (err) {
      console.error('Failed to remove whitelist entry:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading whitelist...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load whitelist: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Whitelist Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Whitelisted Address
          </CardTitle>
          <CardDescription>
            Add a new wallet address to the whitelist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address *</Label>
              <Input
                id="address"
                placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={addWhitelist.isPending}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Reason for whitelisting..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={addWhitelist.isPending}
              />
            </div>

            <Button type="submit" disabled={addWhitelist.isPending} className="w-full">
              {addWhitelist.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Whitelist
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Whitelist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Whitelisted Addresses ({whitelist?.length || 0})
          </CardTitle>
          <CardDescription>
            Manage wallet addresses that have access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!whitelist || whitelist.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No whitelisted addresses. Add your first address above.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-mono text-sm">{entry.address}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {entry.note || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">
                          {entry.addedBy ? (
                            <span className="truncate max-w-[150px] inline-block">
                              {entry.addedBy}
                            </span>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(entry.id)}
                          disabled={removeWhitelist.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

