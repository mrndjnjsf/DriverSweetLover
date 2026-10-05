import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationRouter} from '../src/navigation.js';
import {createGridMap,gridPoint} from '../src/grid-map.js';

test('GPS distinguishes left, right, straight and arrival with metres',()=>{
 const map=createGridMap(),origin=Math.floor(map.size/2),position={...gridPoint(map,origin,origin),heading:0};
 const navigate=createNavigationRouter();
 assert.match(navigate(map,position,gridPoint(map,origin+1,origin)).detail,/Turn right in 0 m/);
 assert.match(navigate(map,position,gridPoint(map,origin-1,origin)).detail,/Turn left in 0 m/);
 assert.match(navigate(map,position,gridPoint(map,origin,origin+2)).detail,/Continue straight.*m/);
 assert.match(navigate(map,position,position).detail,/Arrived/);
 assert.equal(navigate(map,position,null).points.length,0);
});
test('GPS chooses the junction ahead instead of telling a moving driver to turn behind',()=>{
 const map=createGridMap(),origin=Math.floor(map.size/2),position={x:0,z:-20,heading:0};
 const result=createNavigationRouter()(map,position,gridPoint(map,origin+1,origin+1));
 assert.match(result.detail,new RegExp(`Turn right in ${map.blockSize-20} m`));
 assert.equal(result.points[0].z,-map.blockSize);
});
