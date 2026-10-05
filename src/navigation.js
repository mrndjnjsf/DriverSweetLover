import {nearestRoadPoint,gridPoint,neighbors,findRoute} from './grid-map.js';

const direction=(a,b)=>{const distance=Math.hypot(b.x-a.x,b.z-a.z);return distance?{x:(b.x-a.x)/distance,z:(b.z-a.z)/distance}:null;};
const turn=(a,b)=>a.x*b.x+a.z*b.z<-.5?'Make a U-turn':a.x*b.z-a.z*b.x>.5?'Turn right':a.x*b.z-a.z*b.x<-.5?'Turn left':'Continue straight';

// Cache street routing at intersections, rather than running BFS every frame.
export function createNavigationRouter(){
 let cachedMap=null,cachedKey='',route=null;
 return function navigate(map,position,target){
  if(!target)return {detail:'Explore the city',points:[]};
  const remaining=Math.hypot(target.x-position.x,target.z-position.z);
  if(remaining<19)return {detail:'Arrived · stop and open the app',points:[]};
  const facing={x:-Math.sin(position.heading),z:-Math.cos(position.heading)};
  let start=nearestRoadPoint(map,position.x,position.z);
  const toStart=direction(position,start),distanceToStart=Math.hypot(start.x-position.x,start.z-position.z);
  if(toStart&&distanceToStart>map.roadWidth&&toStart.x*facing.x+toStart.z*facing.z<-.5){
   const ahead=neighbors(map,start.col,start.row).map(node=>({...node,...gridPoint(map,node.col,node.row)}))
    .find(node=>{const dir=direction(start,node);return dir.x*facing.x+dir.z*facing.z>.5;});
   if(ahead)start=ahead;
  }
  const goal=nearestRoadPoint(map,target.x,target.z),key=`${start.col}:${start.row}:${goal.col}:${goal.row}`;
  if(map!==cachedMap||key!==cachedKey){route=findRoute(map,start,goal);cachedMap=map;cachedKey=key;}
  if(!route)return {detail:'No connected street route · check Maps',points:[]};
  const points=route.map(node=>gridPoint(map,node.col,node.row));
  let incoming=facing,distance=Math.hypot(start.x-position.x,start.z-position.z);
  const approach=direction(position,start);
  if(distance>map.roadWidth&&approach&&turn(facing,approach)==='Make a U-turn')return {detail:'Make a U-turn when safe',points};
  if(distance>map.roadWidth&&approach)incoming=approach;
  for(let index=0;index<points.length-1;index++){
   const outgoing=direction(points[index],points[index+1]),instruction=turn(incoming,outgoing);
   if(instruction!=='Continue straight')return {detail:`${instruction} in ${Math.round(distance)} m`,points};
   distance+=Math.hypot(points[index+1].x-points[index].x,points[index+1].z-points[index].z);incoming=outgoing;
  }
  return {detail:`Continue straight · destination ${Math.round(distance+Math.hypot(target.x-goal.x,target.z-goal.z))} m`,points};
 };
}
