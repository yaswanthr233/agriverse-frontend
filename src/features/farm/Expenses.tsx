import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { expensesApi } from "@/api/endpoints/expenses";
import { qk } from "@/api/queryKeys";
import type {
  ExpenseCategory,
  ExpenseRequest,
  ExpenseResponse,
} from "@/api/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Table, type Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "SEEDS", label: "Seeds" },
  { value: "FERTILIZERS", label: "Fertilizers" },
  { value: "PESTICIDES", label: "Pesticides" },
  { value: "LABOUR", label: "Labour" },
  { value: "IRRIGATION", label: "Irrigation" },
  { value: "MACHINERY", label: "Machinery" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "VETERINARY", label: "Veterinary" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "OTHER", label: "Other" },
];

const MONTHS = [
  { value: "0", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { value: "0", label: "All years" },
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear - 2), label: String(currentYear - 2) },
];

const schema = z.object({
  category: z.enum([
    "SEEDS",
    "FERTILIZERS",
    "PESTICIDES",
    "LABOUR",
    "IRRIGATION",
    "MACHINERY",
    "TRANSPORT",
    "VETERINARY",
    "ELECTRICITY",
    "OTHER",
  ]),
  amount: z.coerce.number().min(0.01, "Amount must be at least ₹0.01"),
  expenseDate: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function Expenses() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const monthParam = Number(selectedMonth) || undefined;
  const yearParam = Number(selectedYear) || undefined;

  const {
    data: expenses,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.myExpenses(monthParam, yearParam),
    queryFn: () => expensesApi.mine(monthParam, yearParam),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "SEEDS",
      amount: undefined,
      expenseDate: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormOutput) => {
      const payload: ExpenseRequest = {
        category: values.category,
        amount: values.amount,
        expenseDate: values.expenseDate,
        description: values.description || undefined,
      };
      return expensesApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Expense logged");
      setModalOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ["expenses", "my"] });
      void queryClient.invalidateQueries({ queryKey: qk.farmerAnalytics() });
    },
    onError: () => toast.error("Couldn't log expense."),
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.remove,
    onSuccess: () => {
      toast.success("Expense deleted");
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: ["expenses", "my"] });
      void queryClient.invalidateQueries({ queryKey: qk.farmerAnalytics() });
    },
    onError: () => toast.error("Couldn't delete expense."),
  });

  const totalAmount = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const columns: Column<ExpenseResponse>[] = [
    { key: "date", header: "Date", render: (e) => formatDate(e.expenseDate) },
    {
      key: "category",
      header: "Category",
      render: (e) => e.categoryLabel || e.category,
    },
    {
      key: "description",
      header: "Description",
      render: (e) => e.description || "—",
    },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      render: (e) => formatCurrency(e.amount),
    },
    {
      key: "actions",
      header: "",
      render: (e) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-700 hover:bg-danger-50"
          onClick={() => setDeletingId(e.id)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Farm expenses
          </h1>
          <p className="mt-1 text-ink-500">
            Record and review farm operating expenditures.
          </p>
        </div>
        <Button
          onClick={() => {
            reset();
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" /> Log expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-40">
          <Select
            label="Month"
            options={MONTHS}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            label="Year"
            options={YEARS}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-ink-500">Total for selected period</p>
          <p className="numeric text-2xl font-semibold text-ink-900">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <p className="text-sm text-ink-500">
          {expenses?.length ?? 0} transaction
          {expenses?.length === 1 ? "" : "s"}
        </p>
      </Card>

      <div>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {!isLoading && !isError && expenses?.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="No expenses logged for this period"
            description="Log seeds, fertilizer, labour, and other farm costs to track profitability."
            action={
              <Button onClick={() => setModalOpen(true)}>Log expense</Button>
            }
          />
        )}

        {!isLoading && !isError && expenses && expenses.length > 0 && (
          <Table
            columns={columns}
            rows={expenses}
            rowKey={(e) => e.id}
            mobileCard={(e) => (
              <Card className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900">
                      {e.categoryLabel || e.category}
                    </span>
                    <span className="text-xs text-ink-500">
                      · {formatDate(e.expenseDate)}
                    </span>
                  </div>
                  {e.description && (
                    <p className="mt-1 text-sm text-ink-600">
                      {e.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric font-semibold text-ink-900">
                    {formatCurrency(e.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-700 hover:bg-danger-50"
                    onClick={() => setDeletingId(e.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            )}
          />
        )}
      </div>

      {/* Log Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log farm expense"
      >
        <form
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register("category")}
          />
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input
            label="Expense date"
            type="date"
            error={errors.expenseDate?.message}
            {...register("expenseDate")}
          />
          <Textarea
            label="Description (optional)"
            placeholder="e.g. 2 bags of urea from local cooperative"
            {...register("description")}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Save expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Delete this expense?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              Yes, delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-700">
          This expense record will be permanently deleted.
        </p>
      </Modal>
    </div>
  );
}
