export const makeShort = (str: string, start: number, end: number) => {
  return str.slice(0, start) + "..." + str.slice(-end);
};
export function getTimeInSeconds(sec: number = 1): string {
  const now = new Date();
  // Add 2 seconds
  now.setSeconds(now.getSeconds() + sec);

  // Format to HH:mm:ss
  const hours = now.getUTCHours().toString().padStart(2, "0");
  const minutes = now.getUTCMinutes().toString().padStart(2, "0");
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}
