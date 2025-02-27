/**
 * Formats seconds into a human-readable string (e.g., "2h 30m" or "45m")
 * @param seconds Total number of seconds to format
 * @returns Formatted string in hours and minutes
 */
export const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}; 