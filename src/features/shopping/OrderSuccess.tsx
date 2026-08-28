import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export function OrderSuccess() {
  const { id } = useParams();
  const orderId = Number(id);

  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => ordersApi.byId(orderId),
    enabled: Number.isFinite(orderId),
  });

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <CheckCircle2
        className="mx-auto size-14 text-success-500"
        aria-hidden="true"
      />
      <h1 className="mt-4 text-2xl font-semibold text-ink-900">
        Order confirmed
      </h1>
      <p className="mt-2 text-ink-500">
        Thanks — we've received your order and the seller has been notified.
      </p>

      <Card className="mt-6 p-5 text-left">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-28" />
          </div>
        ) : order ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Order ID</dt>
              <dd className="font-mono font-medium text-ink-900">#{order.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Total amount</dt>
              <dd className="numeric font-semibold text-ink-900">
                {formatCurrency(order.totalAmount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery to</dt>
              <dd className="text-right text-ink-900">
                {order.deliveryAddress}
              </dd>
            </div>
          </dl>
        ) : null}
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/app/orders">
          <Button>View My Orders</Button>
        </Link>
        <Link to="/marketplace">
          <Button variant="outline">Keep shopping</Button>
        </Link>
      </div>
    </div>
  );
}
