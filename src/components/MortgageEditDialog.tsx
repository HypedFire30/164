import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Mortgage } from "@/types";

interface MortgageEditDialogProps {
  mortgage: Mortgage | null;
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Mortgage>) => void;
}

export function MortgageEditDialog({
  mortgage,
  propertyId,
  open,
  onOpenChange,
  onSave,
}: MortgageEditDialogProps) {
  const [formData, setFormData] = useState({
    lender: "",
    principalBalance: 0,
    interestRate: 0,
    paymentAmount: 0,
  });

  useEffect(() => {
    if (mortgage) {
      setFormData({
        lender: mortgage.lender || "",
        principalBalance: mortgage.principalBalance || 0,
        interestRate: (mortgage.interestRate || 0) * 100, // Convert to percentage
        paymentAmount: mortgage.paymentAmount || 0,
      });
    }
  }, [mortgage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      propertyId,
      interestRate: formData.interestRate / 100, // Convert back to decimal
      lastUpdated: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mortgage ? "Update Mortgage Balance" : "Add Mortgage"}
          </DialogTitle>
          <DialogDescription>
            Update mortgage information and current balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lender">Lender *</Label>
            <Input
              id="lender"
              value={formData.lender}
              onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
              placeholder="Bank of America"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="principalBalance">Current Balance ($) *</Label>
            <Input
              id="principalBalance"
              type="number"
              step="0.01"
              value={formData.principalBalance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  principalBalance: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Update this monthly to track mortgage balance
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="5.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Monthly Payment ($)</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={formData.paymentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}





