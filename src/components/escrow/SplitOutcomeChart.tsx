import type { FC } from "react";

export interface DistributionItem {
  recipient: string;
  amount: string;
  percentage: number;
}

export interface SplitOutcomeChartProps {
  distribution: DistributionItem[];
}

const RECIPIENT_COLORS: Record<string, string> = {
  Shelter: "#008080", // Teal
  Adopter: "#3b82f6", // Blue
  Platform: "#6b7280", // Gray
};

const RECIPIENT_LABELS: Record<string, string> = {
  Shelter: "Shelter",
  Adopter: "Adopter",
  Platform: "Platform",
};

function calculateTotal(distribution: DistributionItem[]): string {
  const total = distribution.reduce((sum, item) => {
    const amountNum = parseFloat(item.amount);
    return sum + (isNaN(amountNum) ? 0 : amountNum);
  }, 0);
  return total.toFixed(2);
}

export const SplitOutcomeChart: FC<SplitOutcomeChartProps> = ({
  distribution,
}) => {
  const total = calculateTotal(distribution);

  return (
    <div
      data-testid="split-outcome-chart"
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "100%",
      }}
    >
      {/* Horizontal Bar Chart */}
      <div
        role="img"
        aria-label="Escrow distribution chart"
        style={{
          display: "flex",
          height: "40px",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#f3f4f6",
        }}
      >
        {distribution.map((item, index) => {
          const label = RECIPIENT_LABELS[item.recipient] || item.recipient;
          const color = RECIPIENT_COLORS[item.recipient] || "#6b7280";
          const width = Math.max(item.percentage, 0);

          return (
            <div
              key={`${item.recipient}-${index}`}
              data-testid={`chart-segment-${item.recipient.toLowerCase()}`}
              style={{
                flexBasis: `${width}%`,
                flexGrow: 0,
                flexShrink: 0,
                minWidth: width > 0 ? "2px" : "0",
                backgroundColor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: 500,
              }}
              aria-label={`${label}: ${item.percentage}%, ${item.amount}`}
              role="presentation"
            >
              {width >= 10 && (
                <span style={{ whiteSpace: "nowrap", padding: "0 4px" }}>
                  {item.percentage}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend with amounts */}
      <div
        data-testid="chart-legend"
        style={{
          marginTop: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {distribution.map((item, index) => {
          const label = RECIPIENT_LABELS[item.recipient] || item.recipient;
          const color = RECIPIENT_COLORS[item.recipient] || "#6b7280";

          return (
            <div
              key={`${item.recipient}-${index}`}
              data-testid={`legend-item-${item.recipient.toLowerCase()}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  backgroundColor: color,
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {label}: {item.amount} ({item.percentage}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Total Amount */}
      <div
        data-testid="chart-total"
        style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        Total: {total} USDC
      </div>
    </div>
  );
};