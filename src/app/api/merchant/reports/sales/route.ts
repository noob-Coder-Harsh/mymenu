import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import {
  getSalesReport,
  toSalesReportDocument,
} from "@/lib/orders/sales-report";
import { isValidDateKey, todayDateKeyInIndia } from "@/lib/time";

export async function GET(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const dateKey = dateParam || todayDateKeyInIndia();
  if (!isValidDateKey(dateKey)) {
    return jsonError("Use date as YYYY-MM-DD", 400);
  }

  try {
    const report = await getSalesReport(auth.store.id, dateKey);
    const document = toSalesReportDocument(report, auth.store);
    return Response.json({
      report: {
        dateKey: report.dateKey,
        orderCount: report.todayCount,
        totalSales: report.todaySales,
        paidSales: report.todayPaidSales,
        unpaidAmount: report.unpaidAmount,
        pendingCount: report.pendingCount,
        completedCount: report.completedCount,
        cancelledCount: report.cancelledCount,
        takeawayCount: report.takeawayCount,
        dineInCount: report.dineInCount,
        customersToday: report.customersToday,
        itemSales: report.itemSales,
        paymentPaid: report.paymentPaid,
      },
      document,
    });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not load sales report";
    return jsonError(message, 500);
  }
}
