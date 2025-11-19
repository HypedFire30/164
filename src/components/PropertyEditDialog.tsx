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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Property } from "@/types";

interface PropertyEditDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Property>) => void;
}

export function PropertyEditDialog({
  property,
  open,
  onOpenChange,
  onSave,
}: PropertyEditDialogProps) {
  const [formData, setFormData] = useState({
    address: "",
    purchasePrice: 0,
    currentValue: 0,
    ownershipPercentage: 100,
    notes: "",
    // Schedule E fields
    scheduleEDebtorName: "",
    scheduleEPaymentSchedule: "Monthly",
    scheduleEAmountPastDue: 0,
    scheduleEOriginalBalance: 0,
    scheduleEPresentBalance: 0,
    scheduleEInterestRate: 0,
  });

  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address || "",
        purchasePrice: property.purchasePrice || 0,
        currentValue: property.currentValue || 0,
        ownershipPercentage: property.ownershipPercentage || 100,
        notes: property.notes || "",
        scheduleEDebtorName: property.scheduleEDebtorName || "",
        scheduleEPaymentSchedule: property.scheduleEPaymentSchedule || "Monthly",
        scheduleEAmountPastDue: property.scheduleEAmountPastDue || 0,
        scheduleEOriginalBalance: property.scheduleEOriginalBalance || 0,
        scheduleEPresentBalance: property.scheduleEPresentBalance || 0,
        scheduleEInterestRate: property.scheduleEInterestRate || 0,
      });
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add Property"}</DialogTitle>
          <DialogDescription>
            Update property information and valuation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value ($) *</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e) =>
                  setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownershipPercentage">Ownership Percentage (%)</Label>
            <Input
              id="ownershipPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.ownershipPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ownershipPercentage: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this property"
              rows={3}
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Schedule E - Contracts and Mortgages Receivable</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Information for Schedule E of the PFS form (if this property has a contract/mortgage receivable)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleEDebtorName">Name of Debtor</Label>
                <Input
                  id="scheduleEDebtorName"
                  value={formData.scheduleEDebtorName}
                  onChange={(e) => setFormData({ ...formData, scheduleEDebtorName: e.target.value })}
                  placeholder="Debtor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleEPaymentSchedule">Payment Schedule</Label>
                <Select
                  value={formData.scheduleEPaymentSchedule}
                  onValueChange={(value) => setFormData({ ...formData, scheduleEPaymentSchedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleEAmountPastDue">Amount Past Due ($)</Label>
                <Input
                  id="scheduleEAmountPastDue"
                  type="number"
                  step="0.01"
                  value={formData.scheduleEAmountPastDue}
                  onChange={(e) => setFormData({ ...formData, scheduleEAmountPastDue: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleEOriginalBalance">Original Balance ($)</Label>
                <Input
                  id="scheduleEOriginalBalance"
                  type="number"
                  step="0.01"
                  value={formData.scheduleEOriginalBalance}
                  onChange={(e) => setFormData({ ...formData, scheduleEOriginalBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleEPresentBalance">Present Balance ($)</Label>
                <Input
                  id="scheduleEPresentBalance"
                  type="number"
                  step="0.01"
                  value={formData.scheduleEPresentBalance}
                  onChange={(e) => setFormData({ ...formData, scheduleEPresentBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleEInterestRate">Interest Rate (%)</Label>
                <Input
                  id="scheduleEInterestRate"
                  type="number"
                  step="0.01"
                  value={formData.scheduleEInterestRate}
                  onChange={(e) => setFormData({ ...formData, scheduleEInterestRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
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

