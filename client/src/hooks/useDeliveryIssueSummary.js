import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/axios";
import { extractList } from "../utils/apiShape";

const emptySummary = {
  reportedCount: 0,
  activeCount: 0,
  openCount: 0,
  investigatingCount: 0,
  resolvedCount: 0,
};

export default function useDeliveryIssueSummary({ enabled = true, mode = "admin" } = {}) {
  const location = useLocation();
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    if (!enabled) {
      setSummary(emptySummary);
      return undefined;
    }

    let active = true;

    const fetchSummary = async () => {
      try {
        const endpoint = mode === "vendor" ? "/vendor/orders" : "/orders";
        const { data } = await api.get(endpoint);
        const orders = extractList(data, ["orders", "items"]);
        const issueOrders = orders.filter((order) => Boolean(order.delivery?.issueReason));
        const openCount = issueOrders.filter(
          (order) => !order.delivery?.issueStatus || order.delivery.issueStatus === "open"
        ).length;
        const investigatingCount = issueOrders.filter((order) => order.delivery?.issueStatus === "investigating").length;
        const resolvedCount = issueOrders.filter((order) => order.delivery?.issueStatus === "resolved").length;

        if (!active) return;

        setSummary({
          reportedCount: issueOrders.length,
          activeCount: openCount + investigatingCount,
          openCount,
          investigatingCount,
          resolvedCount,
        });
      } catch (error) {
        if (!active) return;
        setSummary(emptySummary);
      }
    };

    fetchSummary();
    const handleRefresh = (event) => {
      if (event?.detail?.mode && event.detail.mode !== mode) {
        return;
      }

      fetchSummary();
    };

    window.addEventListener("delivery-issues:refresh", handleRefresh);
    const intervalId = window.setInterval(fetchSummary, 30000);

    return () => {
      active = false;
      window.removeEventListener("delivery-issues:refresh", handleRefresh);
      window.clearInterval(intervalId);
    };
  }, [enabled, location.key, mode]);

  return summary;
}
