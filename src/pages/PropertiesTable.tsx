import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Grid,
  Heart,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { updateProperty, deleteProperty } from "@/lib/airtable/properties";
import { updateMortgageBalance } from "@/lib/airtable/mortgages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

type EditableField =
  | "address"
  | "currentValue"
  | "ownershipPercentage"
  | "purchasePrice"
  | "mortgageBalance";

type ActiveCell = {
  propertyId: string;
  field: EditableField;
  mortgageId?: string;
} | null;

type EditingCell = ActiveCell;

type SortField = "address" | "currentValue" | "equity" | "purchasePrice";
type SortDirection = "asc" | "desc";

// Local storage key for favorites
const FAVORITES_STORAGE_KEY = "property-favorites";

export default function PropertiesTable() {
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCell, setActiveCell] = useState<ActiveCell>(null); // Currently focused cell (not editing)
  const [editingCell, setEditingCell] = useState<EditingCell>(null); // Currently editing cell
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("address");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Bulk editing state
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(
    new Set()
  );
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(Array.from(favorites))
      );
    } else {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
  }, [favorites]);

  // Set default active cell on load (first property's address)
  useEffect(() => {
    if (
      data?.properties &&
      data.properties.length > 0 &&
      !activeCell &&
      !editingCell
    ) {
      const firstProperty = data.properties[0];
      setActiveCell({
        propertyId: firstProperty.id,
        field: "address",
      });
    }
  }, [data, activeCell, editingCell]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Optimistic updates: track local changes for immediate UI updates
  // Must be before early returns to maintain hook order
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<
      string,
      {
        property?: Partial<{
          address: string;
          purchasePrice: number;
          currentValue: number;
          ownershipPercentage: number;
        }>;
        mortgage?: { principalBalance: number };
      }
    >
  >({});

  // Get property with mortgage and equity info, applying optimistic updates
  const propertiesWithDetails = useMemo(() => {
    if (!data) return [];
    return data.properties.map((property) => {
      const mortgage = data.mortgages.find((m) => m.propertyId === property.id);
      const optimistic = optimisticUpdates[property.id];

      // Apply optimistic updates
      const updatedProperty = optimistic?.property
        ? { ...property, ...optimistic.property }
        : property;
      const updatedMortgage =
        optimistic?.mortgage && mortgage
          ? { ...mortgage, ...optimistic.mortgage }
          : mortgage;

      const equity = calculatePropertyEquity(updatedProperty, updatedMortgage);
      return {
        property: updatedProperty,
        mortgage: updatedMortgage,
        equity,
      };
    });
  }, [data, optimisticUpdates]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    if (!data) return [];
    let filtered = propertiesWithDetails;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(({ property }) =>
        property.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(({ property }) => favorites.has(property.id));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "address":
          aValue = a.property.address;
          bValue = b.property.address;
          break;
        case "currentValue":
          aValue = a.property.currentValue;
          bValue = b.property.currentValue;
          break;
        case "equity":
          aValue = a.equity;
          bValue = b.equity;
          break;
        case "purchasePrice":
          aValue = a.property.purchasePrice;
          bValue = b.property.purchasePrice;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [
    propertiesWithDetails,
    searchQuery,
    showFavoritesOnly,
    favorites,
    sortField,
    sortDirection,
  ]);

  // Use totals from all properties (not filtered) for portfolio overview
  const displayTotals = useMemo(() => {
    if (!data) return { totalValue: 0, totalMortgages: 0, totalEquity: 0 };
    // Calculate from all properties, applying optimistic updates
    const totalValue = propertiesWithDetails.reduce((sum, { property }) => {
      return sum + property.currentValue * (property.ownershipPercentage / 100);
    }, 0);
    const totalMortgages = propertiesWithDetails.reduce((sum, { mortgage }) => {
      return sum + (mortgage?.principalBalance || 0);
    }, 0);
    const totalEquity = totalValue - totalMortgages;
    return { totalValue, totalMortgages, totalEquity };
  }, [propertiesWithDetails, data]);

  // Scroll a cell into view
  const scrollCellIntoView = useCallback(
    (propertyId: string, field: EditableField) => {
      if (!tableRef.current) return;

      // Find the table row
      const row = tableRef.current.querySelector(
        `tr[data-property-id="${propertyId}"]`
      );
      if (!row) return;

      // Find the cell in that row based on field
      const cells = row.querySelectorAll("td");
      let targetCell: HTMLElement | null = null;

      // Map field to column index (accounting for bulk mode checkbox, heart, delete columns)
      const fieldToIndex: Record<EditableField, number> = {
        address: isBulkMode ? 3 : 2,
        purchasePrice: isBulkMode ? 4 : 3,
        currentValue: isBulkMode ? 5 : 4,
        ownershipPercentage: isBulkMode ? 6 : 5,
        mortgageBalance: isBulkMode ? 7 : 6,
      };

      const cellIndex = fieldToIndex[field];
      if (cells[cellIndex]) {
        targetCell = cells[cellIndex] as HTMLElement;
      }

      if (targetCell) {
        targetCell.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    },
    [isBulkMode]
  );

  // Handle keyboard navigation when not editing
  useEffect(() => {
    if (!data) return; // Don't set up keyboard handler if no data

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if we're editing
      if (editingCell) {
        return;
      }

      // Don't handle if focus is in an input/textarea (except our own input which is handled separately)
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
        // Allow if it's our own input (shouldn't happen when not editing, but just in case)
        if (activeElement !== inputRef.current) {
          return;
        }
      }

      // Don't handle if user is typing in search box
      if (
        document.activeElement?.getAttribute("placeholder") ===
        "Search properties..."
      ) {
        return;
      }

      if (!activeCell || filteredProperties.length === 0) return;

      const currentIndex = filteredProperties.findIndex(
        (p) => p.property.id === activeCell.propertyId
      );
      if (currentIndex < 0) return;

      const currentProperty = filteredProperties[currentIndex];
      const fields: EditableField[] = [
        "address",
        "purchasePrice",
        "currentValue",
        "ownershipPercentage",
        "mortgageBalance",
      ];
      const currentFieldIndex = fields.indexOf(activeCell.field);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < filteredProperties.length - 1) {
          const nextProperty = filteredProperties[currentIndex + 1];
          const nextCell: ActiveCell = {
            propertyId: nextProperty.property.id,
            field: activeCell.field,
            mortgageId:
              activeCell.field === "mortgageBalance"
                ? nextProperty.mortgage?.id
                : undefined,
          };
          setActiveCell(nextCell);
          // Scroll the cell into view
          setTimeout(
            () =>
              scrollCellIntoView(nextProperty.property.id, activeCell.field),
            0
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevProperty = filteredProperties[currentIndex - 1];
          const prevCell: ActiveCell = {
            propertyId: prevProperty.property.id,
            field: activeCell.field,
            mortgageId:
              activeCell.field === "mortgageBalance"
                ? prevProperty.mortgage?.id
                : undefined,
          };
          setActiveCell(prevCell);
          // Scroll the cell into view
          setTimeout(
            () =>
              scrollCellIntoView(prevProperty.property.id, activeCell.field),
            0
          );
        }
      } else if (e.key === "ArrowRight" || e.key === "Tab") {
        e.preventDefault();
        if (currentFieldIndex < fields.length - 1) {
          const nextField = fields[currentFieldIndex + 1];
          let nextCell: ActiveCell;
          if (nextField === "mortgageBalance" && currentProperty.mortgage) {
            nextCell = {
              propertyId: currentProperty.property.id,
              field: nextField,
              mortgageId: currentProperty.mortgage.id,
            };
          } else if (
            nextField !== "mortgageBalance" ||
            currentProperty.mortgage
          ) {
            nextCell = {
              propertyId: currentProperty.property.id,
              field: nextField,
            };
          } else {
            return;
          }
          setActiveCell(nextCell);
          // Scroll the cell into view
          setTimeout(
            () => scrollCellIntoView(currentProperty.property.id, nextField),
            0
          );
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentFieldIndex > 0) {
          const prevField = fields[currentFieldIndex - 1];
          const prevCell: ActiveCell = {
            propertyId: currentProperty.property.id,
            field: prevField,
            mortgageId:
              prevField === "mortgageBalance"
                ? currentProperty.mortgage?.id
                : undefined,
          };
          setActiveCell(prevCell);
          // Scroll the cell into view
          setTimeout(
            () => scrollCellIntoView(currentProperty.property.id, prevField),
            0
          );
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Start editing the active cell
        startEditing(activeCell);
      } else if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        // User is typing - start editing
        e.preventDefault();
        startEditing(activeCell);
        // Set the initial value to the typed character
        setTimeout(() => {
          if (inputRef.current) {
            setEditValue(e.key);
            inputRef.current.focus();
            inputRef.current.setSelectionRange(1, 1);
          }
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCell, editingCell, filteredProperties, data, scrollCellIntoView]);

  // Start editing a cell
  const startEditing = (cell: ActiveCell) => {
    if (!cell || !data) return;

    // We need to find the property - use propertiesWithDetails if available, otherwise use data.properties
    const property = data.properties.find((p) => p.id === cell.propertyId);
    if (!property) return;

    const mortgage = data.mortgages.find(
      (m) => m.propertyId === cell.propertyId
    );

    let value: number | string;
    if (cell.field === "address") {
      value = property.address;
    } else if (cell.field === "mortgageBalance") {
      if (!mortgage) return;
      value = mortgage.principalBalance;
    } else {
      value =
        property[
          cell.field === "purchasePrice"
            ? "purchasePrice"
            : cell.field === "currentValue"
            ? "currentValue"
            : "ownershipPercentage"
        ];
    }

    setEditingCell(cell);
    setEditValue(value.toString());
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load properties. Please check your Airtable configuration."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Please configure Airtable or add properties to your base.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { properties, mortgages, totals } = data;

  const toggleFavorite = (propertyId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleCellDoubleClick = (
    propertyId: string,
    field: EditableField,
    currentValue: number | string,
    mortgageId?: string
  ) => {
    const cell: ActiveCell = { propertyId, field, mortgageId };
    setActiveCell(cell);
    startEditing(cell);
  };

  const handleCellClick = (
    propertyId: string,
    field: EditableField,
    mortgageId?: string
  ) => {
    setActiveCell({ propertyId, field, mortgageId });
    // Scroll the cell into view when clicked
    setTimeout(() => scrollCellIntoView(propertyId, field), 0);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
    // Keep the cell active (focused) but not editing
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const { propertyId, field, mortgageId } = editingCell;

    // Handle address field (text, not number)
    if (field === "address") {
      setIsSaving(true);
      try {
        await updateProperty(propertyId, { address: editValue });
        toast({
          title: "Property updated",
          description: "Property address has been updated successfully.",
        });
        setEditingCell(null);
        setEditValue("");
        refetch();
      } catch (error) {
        console.error("Error saving:", error);
        toast({
          title: "Error saving",
          description:
            error instanceof Error
              ? error.message
              : "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const numericValue = parseFloat(editValue);

    // Validation
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    if (
      field === "ownershipPercentage" &&
      (numericValue < 0 || numericValue > 100)
    ) {
      toast({
        title: "Invalid percentage",
        description: "Ownership percentage must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Apply optimistic update immediately
    if (field === "mortgageBalance" && mortgageId) {
      setOptimisticUpdates((prev) => ({
        ...prev,
        [propertyId]: {
          ...prev[propertyId],
          mortgage: { principalBalance: numericValue },
        },
      }));
    } else {
      const updates: Partial<(typeof properties)[0]> = {};
      if (field === "currentValue") updates.currentValue = numericValue;
      if (field === "ownershipPercentage")
        updates.ownershipPercentage = numericValue;
      if (field === "purchasePrice") updates.purchasePrice = numericValue;

      setOptimisticUpdates((prev) => ({
        ...prev,
        [propertyId]: {
          ...prev[propertyId],
          property: { ...prev[propertyId]?.property, ...updates },
        },
      }));
    }

    try {
      if (field === "mortgageBalance" && mortgageId) {
        await updateMortgageBalance(mortgageId, numericValue);
        toast({
          title: "Mortgage updated",
          description: "Mortgage balance has been updated successfully.",
        });
      } else {
        const updates: Partial<{
          currentValue: number;
          ownershipPercentage: number;
          purchasePrice: number;
        }> = {};
        if (field === "currentValue") updates.currentValue = numericValue;
        if (field === "ownershipPercentage")
          updates.ownershipPercentage = numericValue;
        if (field === "purchasePrice") updates.purchasePrice = numericValue;

        await updateProperty(propertyId, updates);
        toast({
          title: "Property updated",
          description: "Property value has been updated successfully.",
        });
      }

      setEditingCell(null);
      setEditValue("");
      // Keep cell active after save
      // Clear optimistic update after successful save
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });
      refetch();
    } catch (error) {
      console.error("Error saving:", error);
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });
      toast({
        title: "Error saving",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
      // Move to next cell down in same column
      if (editingCell) {
        moveToNextCell(editingCell.field, editingCell.propertyId, "down");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (editingCell) {
        // Save and move right
        handleSave();
        moveToNextCellRight(editingCell);
      }
    }
    // Arrow keys when editing navigate within the text, not between cells
    // (default browser behavior)
  };

  // Move to next/previous cell in same column
  const moveToNextCell = (
    field: EditableField,
    currentPropertyId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = filteredProperties.findIndex(
      (p) => p.property.id === currentPropertyId
    );
    if (currentIndex < 0) return;

    const nextIndex =
      direction === "down" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= filteredProperties.length) {
      // Exit editing mode, keep cell active
      setEditingCell(null);
      setEditValue("");
      return;
    }

    const nextProperty = filteredProperties[nextIndex];
    let mortgageId: string | undefined;

    if (field === "mortgageBalance") {
      if (!nextProperty.mortgage) {
        // Skip properties without mortgages, but still set as active
        setActiveCell({
          propertyId: nextProperty.property.id,
          field,
        });
        setEditingCell(null);
        setEditValue("");
        return;
      }
      mortgageId = nextProperty.mortgage.id;
    }

    // Set as active and start editing
    const nextCell: ActiveCell = {
      propertyId: nextProperty.property.id,
      field,
      mortgageId,
    };
    setActiveCell(nextCell);

    // Small delay to ensure save completes, then start editing
    setTimeout(() => {
      startEditing(nextCell);
    }, 50);
  };

  // Move to next cell to the right
  const moveToNextCellRight = (currentCell: ActiveCell) => {
    const currentIndex = filteredProperties.findIndex(
      (p) => p.property.id === currentCell.propertyId
    );
    if (currentIndex < 0) return;

    const currentProperty = filteredProperties[currentIndex];
    const fields: EditableField[] = [
      "address",
      "purchasePrice",
      "currentValue",
      "ownershipPercentage",
      "mortgageBalance",
    ];
    const currentFieldIndex = fields.indexOf(currentCell.field);

    if (currentFieldIndex < fields.length - 1) {
      const nextField = fields[currentFieldIndex + 1];
      let nextCell: ActiveCell;

      if (nextField === "mortgageBalance" && currentProperty.mortgage) {
        nextCell = {
          propertyId: currentProperty.property.id,
          field: nextField,
          mortgageId: currentProperty.mortgage.id,
        };
      } else if (nextField !== "mortgageBalance" || currentProperty.mortgage) {
        nextCell = {
          propertyId: currentProperty.property.id,
          field: nextField,
        };
      } else {
        return; // Can't move to mortgage balance if no mortgage
      }

      setActiveCell(nextCell);
      setTimeout(() => {
        startEditing(nextCell);
      }, 50);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    startPropertyId: string,
    field: EditableField
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length === 0) return;

    // Find starting property index
    const startIndex = filteredProperties.findIndex(
      (p) => p.property.id === startPropertyId
    );
    if (startIndex < 0) return;

    // Parse values (handle currency, commas, etc.)
    const values = lines
      .map((line) => {
        // Remove currency symbols, commas, whitespace
        const cleaned = line.replace(/[$,\s]/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      })
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      toast({
        title: "Invalid paste",
        description:
          "Could not parse values from clipboard. Make sure you're pasting numbers.",
        variant: "destructive",
      });
      return;
    }

    // Apply values to properties starting from current position
    const updates: Array<{
      propertyId: string;
      value: number;
      mortgageId?: string;
    }> = [];

    for (
      let i = 0;
      i < values.length && startIndex + i < filteredProperties.length;
      i++
    ) {
      const property = filteredProperties[startIndex + i];

      if (field === "mortgageBalance") {
        if (property.mortgage) {
          updates.push({
            propertyId: property.property.id,
            value: values[i],
            mortgageId: property.mortgage.id,
          });
        }
      } else {
        updates.push({
          propertyId: property.property.id,
          value: values[i],
        });
      }
    }

    // Apply all updates
    setIsSaving(true);
    try {
      const promises = updates.map(
        async ({ propertyId, value, mortgageId }) => {
          if (field === "mortgageBalance" && mortgageId) {
            return updateMortgageBalance(mortgageId, value);
          } else {
            const updateData: Partial<{
              currentValue: number;
              ownershipPercentage: number;
              purchasePrice: number;
            }> = {};
            if (field === "currentValue") updateData.currentValue = value;
            if (field === "ownershipPercentage")
              updateData.ownershipPercentage = value;
            if (field === "purchasePrice") updateData.purchasePrice = value;
            return updateProperty(propertyId, updateData);
          }
        }
      );

      await Promise.all(promises);

      toast({
        title: "Bulk update complete",
        description: `Updated ${updates.length} ${
          field === "mortgageBalance" ? "mortgage balances" : "property values"
        }.`,
      });

      refetch();
    } catch (error) {
      console.error("Error in bulk update:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update properties.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleDeleteClick = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    try {
      await deleteProperty(propertyToDelete);
      toast({
        title: "Property deleted",
        description: "Property has been removed successfully.",
      });
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error deleting",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isCellEditing = (propertyId: string, field: EditableField) => {
    return (
      editingCell?.propertyId === propertyId && editingCell?.field === field
    );
  };

  const isCellActive = (propertyId: string, field: EditableField) => {
    return (
      activeCell?.propertyId === propertyId &&
      activeCell?.field === field &&
      !editingCell
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Properties
            </h1>
            <p className="text-muted-foreground mt-1">
              Click to select • Type or double-click to edit • Arrow keys/Tab to
              navigate • Enter to save • Paste to bulk update
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/properties/cards")}
            >
              <Grid className="h-4 w-4 mr-2" />
              Card View
            </Button>
            <Button
              variant={isBulkMode ? "default" : "outline"}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                if (!isBulkMode) {
                  setSelectedProperties(new Set());
                }
              }}
            >
              {isBulkMode ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Bulk Mode
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Select Multiple
                </>
              )}
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Heart
              className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`}
            />
            Favorites
          </Button>
          <Select
            value={sortField}
            onValueChange={(value) => handleSort(value as SortField)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="address">Address</SelectItem>
              <SelectItem value="currentValue">Current Value</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="purchasePrice">Purchase Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  {filteredProperties.length}{" "}
                  {filteredProperties.length === 1 ? "property" : "properties"}{" "}
                  found
                </CardDescription>
              </div>
              {/* Totals in Header */}
              <div className="flex gap-6 md:gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(displayTotals.totalValue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Total Mortgages
                  </p>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(displayTotals.totalMortgages)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Equity</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(displayTotals.totalEquity)}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProperties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchQuery || showFavoritesOnly
                  ? "No properties match your filters."
                  : "No properties found. Add your first property to get started."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table ref={tableRef}>
                  <TableHeader>
                    <TableRow>
                      {isBulkMode && (
                        <TableHead className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              if (
                                selectedProperties.size ===
                                filteredProperties.length
                              ) {
                                setSelectedProperties(new Set());
                              } else {
                                setSelectedProperties(
                                  new Set(
                                    filteredProperties.map((p) => p.property.id)
                                  )
                                );
                              }
                            }}
                          >
                            {selectedProperties.size ===
                            filteredProperties.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("address")}
                      >
                        <div className="flex items-center">
                          Address
                          <SortIcon field="address" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("purchasePrice")}
                      >
                        <div className="flex items-center justify-end">
                          Purchase Price
                          <SortIcon field="purchasePrice" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("currentValue")}
                      >
                        <div className="flex items-center justify-end">
                          Current Value
                          <SortIcon field="currentValue" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Ownership %</TableHead>
                      <TableHead className="text-right">
                        Mortgage Balance
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("equity")}
                      >
                        <div className="flex items-center justify-end">
                          Equity
                          <SortIcon field="equity" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map(
                      ({ property, mortgage, equity }) => {
                        const isEditingCurrentValue = isCellEditing(
                          property.id,
                          "currentValue"
                        );
                        const isEditingOwnership = isCellEditing(
                          property.id,
                          "ownershipPercentage"
                        );
                        const isEditingPurchasePrice = isCellEditing(
                          property.id,
                          "purchasePrice"
                        );
                        const isEditingMortgage =
                          mortgage &&
                          isCellEditing(property.id, "mortgageBalance");
                        const isFavorite = favorites.has(property.id);

                        const isSelected = selectedProperties.has(property.id);

                        return (
                          <TableRow
                            key={property.id}
                            data-property-id={property.id}
                          >
                            {/* Bulk Select Checkbox */}
                            {isBulkMode && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const newSelected = new Set(
                                      selectedProperties
                                    );
                                    if (isSelected) {
                                      newSelected.delete(property.id);
                                    } else {
                                      newSelected.add(property.id);
                                    }
                                    setSelectedProperties(newSelected);
                                  }}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            )}

                            {/* Heart/Favorite */}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleFavorite(property.id)}
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    isFavorite
                                      ? "fill-red-500 text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                            </TableCell>

                            {/* Delete */}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(property.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>

                            <TableCell
                              className={`font-medium cursor-pointer hover:text-primary hover:underline relative ${
                                isCellActive(property.id, "address")
                                  ? "bg-primary/5"
                                  : ""
                              } ${
                                isCellEditing(property.id, "address") ? "" : ""
                              }`}
                              onClick={() =>
                                handleCellClick(property.id, "address")
                              }
                              onDoubleClick={() => {
                                const value = property.address;
                                handleCellDoubleClick(
                                  property.id,
                                  "address",
                                  value
                                );
                              }}
                            >
                              {isCellActive(property.id, "address") && (
                                <div className="absolute inset-1.5 border-2 border-primary rounded-md pointer-events-none" />
                              )}
                              {isCellEditing(property.id, "address") ? (
                                <Input
                                  ref={inputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSave}
                                  disabled={isSaving}
                                  className="w-full"
                                />
                              ) : (
                                property.address
                              )}
                            </TableCell>

                            {/* Purchase Price */}
                            <TableCell
                              className={`text-right cursor-pointer hover:bg-muted/50 transition-colors relative ${
                                isCellActive(property.id, "purchasePrice")
                                  ? "bg-primary/5"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCellClick(property.id, "purchasePrice")
                              }
                              onDoubleClick={() =>
                                handleCellDoubleClick(
                                  property.id,
                                  "purchasePrice",
                                  property.purchasePrice
                                )
                              }
                            >
                              {isCellActive(property.id, "purchasePrice") && (
                                <div className="absolute inset-1.5 border-2 border-primary rounded-md pointer-events-none" />
                              )}
                              {isEditingPurchasePrice ? (
                                <Input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onPaste={(e) =>
                                    handlePaste(e, property.id, "purchasePrice")
                                  }
                                  onBlur={handleSave}
                                  disabled={isSaving}
                                  className="w-32 ml-auto text-right"
                                />
                              ) : (
                                formatCurrency(property.purchasePrice)
                              )}
                            </TableCell>

                            {/* Current Value */}
                            <TableCell
                              className={`text-right cursor-pointer hover:bg-muted/50 transition-colors relative ${
                                isCellActive(property.id, "currentValue")
                                  ? "bg-primary/5"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCellClick(property.id, "currentValue")
                              }
                              onDoubleClick={() =>
                                handleCellDoubleClick(
                                  property.id,
                                  "currentValue",
                                  property.currentValue
                                )
                              }
                            >
                              {isCellActive(property.id, "currentValue") && (
                                <div className="absolute inset-1.5 border-2 border-primary rounded-md pointer-events-none" />
                              )}
                              {isEditingCurrentValue ? (
                                <Input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onPaste={(e) =>
                                    handlePaste(e, property.id, "currentValue")
                                  }
                                  onBlur={handleSave}
                                  disabled={isSaving}
                                  className="w-32 ml-auto text-right"
                                />
                              ) : (
                                formatCurrency(property.currentValue)
                              )}
                            </TableCell>

                            {/* Ownership Percentage */}
                            <TableCell
                              className={`text-right cursor-pointer hover:bg-muted/50 transition-colors relative ${
                                isCellActive(property.id, "ownershipPercentage")
                                  ? "bg-primary/5"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCellClick(
                                  property.id,
                                  "ownershipPercentage"
                                )
                              }
                              onDoubleClick={() =>
                                handleCellDoubleClick(
                                  property.id,
                                  "ownershipPercentage",
                                  property.ownershipPercentage
                                )
                              }
                            >
                              {isCellActive(
                                property.id,
                                "ownershipPercentage"
                              ) && (
                                <div className="absolute inset-1.5 border-2 border-primary rounded-md pointer-events-none" />
                              )}
                              {isEditingOwnership ? (
                                <Input
                                  ref={inputRef}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onPaste={(e) =>
                                    handlePaste(
                                      e,
                                      property.id,
                                      "ownershipPercentage"
                                    )
                                  }
                                  onBlur={handleSave}
                                  disabled={isSaving}
                                  className="w-24 ml-auto text-right"
                                />
                              ) : (
                                `${property.ownershipPercentage}%`
                              )}
                            </TableCell>

                            {/* Mortgage Balance */}
                            <TableCell
                              className={`text-right ${
                                mortgage
                                  ? "cursor-pointer hover:bg-muted/50 transition-colors"
                                  : ""
                              } relative ${
                                isCellActive(property.id, "mortgageBalance")
                                  ? "bg-primary/5"
                                  : ""
                              }`}
                              onClick={
                                mortgage
                                  ? () =>
                                      handleCellClick(
                                        property.id,
                                        "mortgageBalance",
                                        mortgage.id
                                      )
                                  : undefined
                              }
                              onDoubleClick={
                                mortgage
                                  ? () =>
                                      handleCellDoubleClick(
                                        property.id,
                                        "mortgageBalance",
                                        mortgage.principalBalance,
                                        mortgage.id
                                      )
                                  : undefined
                              }
                            >
                              {isCellActive(property.id, "mortgageBalance") && (
                                <div className="absolute inset-1.5 border-2 border-primary rounded-md pointer-events-none" />
                              )}
                              {isEditingMortgage ? (
                                <Input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onPaste={(e) =>
                                    mortgage &&
                                    handlePaste(
                                      e,
                                      property.id,
                                      "mortgageBalance"
                                    )
                                  }
                                  onBlur={handleSave}
                                  disabled={isSaving}
                                  className="w-32 ml-auto text-right"
                                />
                              ) : (
                                <span
                                  className={mortgage ? "text-destructive" : ""}
                                >
                                  {mortgage
                                    ? formatCurrency(mortgage.principalBalance)
                                    : "No Mortgage"}
                                </span>
                              )}
                            </TableCell>

                            {/* Equity (calculated, not editable - automatically computed from property value minus mortgage balance) */}
                            <TableCell className="text-right text-success font-semibold">
                              {formatCurrency(equity)}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Operations Toolbar */}
        {isBulkMode && selectedProperties.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedProperties.size} property
                    {selectedProperties.size !== 1 ? "ies" : ""} selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Apply same value to all selected
                      const value = prompt(
                        "Enter value to apply to all selected properties:"
                      );
                      if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          // TODO: Implement bulk apply
                          toast({
                            title: "Bulk apply",
                            description: `Would apply ${numValue} to ${selectedProperties.size} properties.`,
                          });
                        }
                      }
                    }}
                  >
                    Apply Same Value
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const percent = prompt(
                        "Enter percentage increase (e.g., 5 for 5%):"
                      );
                      if (percent) {
                        const numPercent = parseFloat(percent);
                        if (!isNaN(numPercent)) {
                          // TODO: Implement percentage increase
                          toast({
                            title: "Percentage increase",
                            description: `Would increase values by ${numPercent}% for ${selectedProperties.size} properties.`,
                          });
                        }
                      }
                    }}
                  >
                    Increase by %
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProperties(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
