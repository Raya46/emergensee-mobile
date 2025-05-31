export const getIndicatorColor = (indicator?: string): string => {
  if (!indicator) return "#6B7280";
  switch (indicator.toLowerCase()) {
    case "sangat tinggi":
    case "tinggi":
      return "#30887C";
    case "sedang":
      return "#F97316";
    case "rendah":
    case "sangat rendah":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

export const getIndicatorBackgroundColor = (indicator?: string): string => {
  if (!indicator) return "#E5E7EB";
  switch (indicator.toLowerCase()) {
    case "sangat tinggi":
    case "tinggi":
      return "#D6F1EB";
    case "sedang":
      return "#FFEDD4";
    case "rendah":
    case "sangat rendah":
      return "#FFE2E2";
    default:
      return "#E5E7EB";
  }
};
