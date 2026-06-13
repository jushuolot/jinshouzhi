function n(){return{polygons:[]}}function o(n){return n.polygons.length?n.polygons.map((n,o)=>n.label||`区域${o+1}（${n.ring.length}点）`).join("、"):"未选择"}export{n as e,o as s};
