/** Shared ordering and geometry keep a representative in the same seat during the vote reveal. */
export function hemicycleSeats(total:number) {
  const rows=7,weights=Array.from({length:rows},(_,index)=>130+index*24);
  const sum=weights.reduce((a,b)=>a+b,0),counts=weights.map(weight=>Math.floor(total*weight/sum));
  for(let i=0;counts.reduce((a,b)=>a+b,0)<total;i++)counts[i%rows]!+=1;
  return weights.flatMap((radius,row)=>Array.from({length:counts[row]!},(_,index)=>{
    const angle=Math.PI+(index+.5)/counts[row]!*Math.PI;
    return {x:360+radius*Math.cos(angle),y:310+radius*Math.sin(angle)};
  }));
}
