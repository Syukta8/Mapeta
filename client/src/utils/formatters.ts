export function formatManeuverDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatNavigationDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr ${remMins} min`;
  }
  return `${mins} min`;
}

export function formatTollCurrency(amount: number): string {
  if (amount <= 0) return 'Toll-Free';
  return `RM ${amount.toFixed(2)}`;
}
