import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  RowData,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Rows as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Declare module for TanStack Table if using custom meta
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    isInteractive: boolean;
  }
}

// Define the structure for the table's data, to be passed as a prop
export interface TableData {
  headers: string[];
  rows: string[][]; // Array of rows, each row is an array of cell strings
}

// Define the component props
interface DataTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  isInteractive?: boolean; // To differentiate editor vs. run mode behavior
  data?: TableData | null; // Parsed CSV data, passed via component properties
  onDataChange?: (updatedData: TableData) => void; // For editable cells in run mode
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Helper function to check for basic HTML tags
const CONTAINS_HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;
function isHtmlString(str: unknown): str is string {
  return typeof str === "string" && CONTAINS_HTML_TAG_REGEX.test(str);
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, isInteractive = false, data, onDataChange, id, ...props }, ref) => {
    // State for data that can be updated by AI service
    const [currentData, setCurrentData] = React.useState<TableData | null>(data || null);
    
    // Memoize the internalData to prevent unnecessary re-renders
    const internalData = React.useMemo(() => currentData, [currentData]);

    // Update currentData when data prop changes
    React.useEffect(() => {
      setCurrentData(data || null);
    }, [data]);

    // Expose data to AI service via data attribute
    React.useEffect(() => {
      if (id && currentData) {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute('data-table-data', JSON.stringify(currentData));
          console.log(`📊 DataTable ${id} exposed data to AI service:`, currentData);
        }
      }
    }, [id, currentData]);

    // Listen for AI service updates
    React.useEffect(() => {
      if (!id) return;

      const handleDataUpdate = (event: CustomEvent) => {
        if (event.detail) {
          setCurrentData(event.detail);
          console.log("DataTable received AI update:", event.detail);
        }
      };

      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('dataTableUpdate', handleDataUpdate as EventListener);
        return () => {
          element.removeEventListener('dataTableUpdate', handleDataUpdate as EventListener);
        };
      }
    }, [id]);

    // Handle cell updates when in interactive mode
    const updateData = React.useCallback(
      (rowIndex: number, columnId: string, cellValue: unknown) => {
        if (!onDataChange || !internalData) return;

        const colIndex = internalData.headers.findIndex((h) => h === columnId);
        if (colIndex === -1) return;

        // Create a new rows array with the updated cell value
        const newRows = internalData.rows.map((row, rIndex) => {
          if (rIndex === rowIndex) {
            const newRow = [...row];
            newRow[colIndex] = String(cellValue);
            return newRow;
          }
          return row;
        });

        const updatedData = { ...internalData, rows: newRows };
        setCurrentData(updatedData);
        onDataChange?.(updatedData);
      },
      [onDataChange, internalData]
    );

    // Memoize columns to prevent recreating them on every render
    const tableColumns = React.useMemo<ColumnDef<string[], any>[]>(() => {
      if (!internalData?.headers) return [];

      // Define the common cell rendering logic (static display)
      return internalData.headers.map(
        (header: string, index: number): ColumnDef<string[]> => ({
          accessorFn: (row: string[]) => row[index] || "",
          id: `col-${index}-${header}`, // Ensure unique ID using both index and header
          header: () => <span>{header}</span>,
          cell: (info) => {
            const rawValue = info.getValue();
            const cellContentString = String(rawValue);

            if (cellContentString === "Loading...") {
              return <Skeleton className="w-full h-5 rounded-sm" />;
            }

            // For run mode with interactivity enabled
            if (isInteractive) {
              const initialValue = rawValue;
              const [cellValue, setCellValue] = React.useState(initialValue);
              const [isEditing, setIsEditing] = React.useState(false);

              // Update local state when the data source changes
              // but only if not currently editing to avoid disrupting user input.
              React.useEffect(() => {
                if (!isEditing) {
                  setCellValue(initialValue);
                }
              }, [initialValue, isEditing]);

              const startEditing = () => {
                setCellValue(initialValue); // Sync with latest data when starting to edit
                setIsEditing(true);
              };

              // Render input when editing
              if (isEditing) {
                return (
                  <input
                    value={String(cellValue)}
                    onChange={(e) => setCellValue(e.target.value)}
                    onBlur={() => {
                      updateData(info.row.index, info.column.id, cellValue);
                      setIsEditing(false); // Exit editing mode on blur
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateData(info.row.index, info.column.id, cellValue);
                        setIsEditing(false);
                      } else if (e.key === "Escape") {
                        setCellValue(initialValue); // Revert changes
                        setIsEditing(false);
                      }
                    }}
                    // Auto-focus the input when it appears
                    autoFocus
                    className="w-full p-1 border border-blue-500 rounded-sm bg-transparent text-sm"
                  />
                );
              }

              // Render static display when not editing (in interactive mode)
              // Use a div or span that can be clicked to start editing
              return (
                <div
                  onClick={startEditing}
                  onFocus={startEditing} // Allow keyboard navigation to trigger edit
                  tabIndex={0} // Make it focusable
                  className="w-full p-1 border border-transparent hover:border-gray-300 focus:border-blue-500 cursor-text bg-transparent min-h-[1.5rem]"
                  role="textbox"
                  aria-readonly={false}
                >
                  {/* Render HTML or plain text statically */}
                  {isHtmlString(rawValue) ? (
                    <span
                      dangerouslySetInnerHTML={{ __html: String(rawValue) }}
                    />
                  ) : (
                    <span>{String(rawValue)}</span>
                  )}
                </div>
              );
            }

            // For editor mode (static display - no interactivity)
            if (isHtmlString(rawValue)) {
              return (
                <span dangerouslySetInnerHTML={{ __html: String(rawValue) }} />
              );
            }
            // Default to plain text display
            return <span>{String(rawValue)}</span>;
          },
        })
      );
    }, [internalData?.headers, isInteractive, updateData]);

    // Memoize data to prevent recreating on every render
    const tableData = React.useMemo(
      () => internalData?.rows || [],
      [internalData?.rows]
    );

    // Setup pagination state
    const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

    // Create the table instance with pagination
    const table = useReactTable({
      data: tableData,
      columns: tableColumns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: DEFAULT_PAGE_SIZE,
        },
      },
      meta: {
        isInteractive,
        updateData,
      },
    });

    // Handle page size change
    React.useEffect(() => {
      table.setPageSize(pageSize);
    }, [pageSize, table]);

    // If no data is available, show a placeholder
    if (!data || !data.headers || data.headers.length === 0) {
      return (
        <div
          ref={ref}
          id={id}
          className={cn(
            "w-full h-full border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 text-gray-400",
            className
          )}
          {...props}
          data-component-type="TablePlaceholder"
        >
          <TableIcon className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">Data Table</p>
          <p className="text-xs text-center mt-1">
            Right-click and select 'Edit Properties' to upload a CSV file.
          </p>
        </div>
      );
    }

    // Calculate total pages for pagination
    const totalPages = Math.ceil(tableData.length / pageSize);
    const currentPage = table.getState().pagination.pageIndex + 1;

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "w-full h-full flex flex-col border border-gray-300 rounded-md bg-white overflow-hidden",
          !isInteractive ? "cursor-default" : "",
          className
        )}
        {...props}
        data-component-type="Table"
      >
        {/* Table container with fixed height */}
        <div className="flex-grow overflow-auto">
          <table className="w-full min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup, groupIndex) => (
                <tr key={`header-group-${groupIndex}-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => (
                    <th
                      key={`header-${groupIndex}-${headerIndex}-${header.id}`}
                      className="p-2 border-b border-r border-gray-200 text-left font-semibold text-gray-700"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}-${row.id}`}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}-${cell.column.id}`} className="p-2 border-r border-gray-200">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No data available.
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {tableData.length > 0 && (
          <div className="border-t border-gray-200 p-2 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                {table.getState().pagination.pageIndex * pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * pageSize,
                  tableData.length
                )}{" "}
                of {tableData.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = "DataTable";

export { DataTable as DataTable }; 