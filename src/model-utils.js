export function modelBuilder(THREE,parent,paint){
 const add=(geometry,material,pos)=>{
  const mesh=new THREE.Mesh(geometry,material);
  if(pos)mesh.position.set(...pos);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const box=(size,pos,material)=>add(new THREE.BoxGeometry(...size),material,pos);
 const panel=(points,material)=>{
  const verts=points.flat(),indices=[];
  for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  return add(geo,material);
 };
 const surface=(sections,material)=>{
  const verts=[],indices=[];
  for(const [z,y,w] of sections)verts.push(-w,y,z,w,y,z);
  for(let i=0;i<sections.length-1;i++){
   const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  return add(geo,material);
 };
 const loft=(sections,ring,material=paint)=>{
  const verts=[],indices=[],sides=ring(sections[0]).length;
  for(const section of sections)for(const point of ring(section))verts.push(...point);
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<sides;j++){
   const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
   indices.push(a,b,c,b,d,c);
  }
  for(let j=1;j<sides-1;j++){indices.push(0,j+1,j);const end=(sections.length-1)*sides;indices.push(end,end+j,end+j+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  return add(geo,material);
 };
 return {add,box,panel,surface,loft};
}
