export const TACH_MAX_RPM=8000;

export function tachPercent(rpm){
 return Math.max(0,Math.min(100,rpm/TACH_MAX_RPM*100));
}
