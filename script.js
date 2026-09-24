const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const app = {
  mode: 'sorting', algorithm: 'bubble', running: false, paused: false, stepIndex: 0,
  speed: 6, array: [], target: 41, operations: [], graph: null, structures: { stack: [30,20,10], queue: [10,20,30] },
};

const algorithms = {
  sorting: [
    {id:'bubble', name:'Bubble Sort', best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', tag:'O(n²)'},
    {id:'selection', name:'Selection Sort', best:'O(n²)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', tag:'O(n²)'},
    {id:'insertion', name:'Insertion Sort', best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', tag:'O(n²)'},
    {id:'merge', name:'Merge Sort', best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(n)', tag:'O(n log n)'},
    {id:'quick', name:'Quick Sort', best:'O(n log n)', avg:'O(n log n)', worst:'O(n²)', space:'O(log n)', tag:'O(n log n)'},
  ],
  searching: [
    {id:'linear', name:'Linear Search', best:'O(1)', avg:'O(n)', worst:'O(n)', space:'O(1)', tag:'O(n)'},
    {id:'binary', name:'Binary Search', best:'O(1)', avg:'O(log n)', worst:'O(log n)', space:'O(1)', tag:'O(log n)'},
  ],
  graph: [
    {id:'bfs', name:'Breadth-First Search', best:'O(V+E)', avg:'O(V+E)', worst:'O(V+E)', space:'O(V)', tag:'O(V+E)'},
    {id:'dfs', name:'Depth-First Search', best:'O(V+E)', avg:'O(V+E)', worst:'O(V+E)', space:'O(V)', tag:'O(V+E)'},
  ],
  structures: [
    {id:'stack', name:'Stack (LIFO)', best:'O(1)', avg:'O(1)', worst:'O(1)', space:'O(n)', tag:'O(1)'},
    {id:'queue', name:'Queue (FIFO)', best:'O(1)', avg:'O(1)', worst:'O(1)', space:'O(n)', tag:'O(1)'},
  ]
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const delay = () => Math.max(70, 720 - app.speed * 62);
const log = (msg) => { $('#liveLog').textContent = msg; $('#stepLabel').textContent = `Step ${app.stepIndex}`; };

function makeArray(n = 11){
  const pool = []; for(let i=0;i<n;i++) pool.push(Math.floor(10 + Math.random()*90)); return pool;
}
function setStage(html){ $('#visualizerStage').innerHTML = html; }
function setComplexity(meta){
  $('#complexityTag').textContent = meta.tag; $('#bestComplexity').textContent = meta.best; $('#avgComplexity').textContent = meta.avg; $('#worstComplexity').textContent = meta.worst; $('#spaceComplexity').textContent = meta.space;
}
function populateSelect(){
  const list = algorithms[app.mode]; $('#algorithmSelect').innerHTML = list.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  $('#algorithmSelect').value = app.algorithm;
  const meta = list.find(x=>x.id===app.algorithm) || list[0]; setComplexity(meta);
}
function randomize(){
  if(app.mode==='sorting') app.array = makeArray();
  if(app.mode==='searching') app.array = [...makeArray(10)].sort((a,b)=>a-b); app.target = app.array[Math.floor(Math.random()*app.array.length)];
  renderMode(); resetRunState('Fresh input generated. Ready to run.');
}
function resetRunState(message='Ready — choose an algorithm and press Start.'){
  app.running=false; app.paused=false; app.stepIndex=0; app.operations=[]; $('#playBtn').disabled=false; $('#pauseBtn').disabled=true; $('#playBtn').innerHTML='▶ <span>Start</span>'; log(message);
}
function renderMode(){
  $('#labMode').textContent = app.mode.toUpperCase();
  $$('.lab-nav').forEach(b=>b.classList.toggle('active',b.dataset.lab===app.mode));
  populateSelect();
  if(app.mode==='sorting') renderSorting();
  else if(app.mode==='searching') renderSearching();
  else if(app.mode==='graph') renderGraph();
  else renderStructures();
}

function sortingOps(a, type){
  const arr = a.slice(), ops=[];
  const swap=(i,j)=>{ops.push({type:'compare',i,j}); [arr[i],arr[j]]=[arr[j],arr[i]]; ops.push({type:'swap',i,j,vals:[arr[i],arr[j]]});};
  if(type==='bubble'){
    for(let end=arr.length-1;end>0;end--) for(let j=0;j<end;j++){ops.push({type:'compare',i:j,j:j+1}); if(arr[j]>arr[j+1]) swap(j,j+1);} for(let i=0;i<arr.length;i++) ops.push({type:'sorted',i});
  } else if(type==='selection'){
    for(let i=0;i<arr.length;i++){let min=i; for(let j=i+1;j<arr.length;j++){ops.push({type:'compare',i:min,j}); if(arr[j]<arr[min]) min=j;} if(min!==i) swap(i,min); ops.push({type:'sorted',i});}
  } else if(type==='insertion'){
    for(let i=1;i<arr.length;i++){let j=i; while(j>0){ops.push({type:'compare',i:j-1,j}); if(arr[j-1]>arr[j]) swap(j-1,j); else break; j--;}}
    for(let i=0;i<arr.length;i++) ops.push({type:'sorted',i});
  } else if(type==='merge'){
    const merge=(l,r)=>{ if(r-l<=1) return; const m=Math.floor((l+r)/2); merge(l,m); merge(m,r); const left=arr.slice(l,m), right=arr.slice(m,r); let i=0,j=0,k=l; while(i<left.length&&j<right.length){ops.push({type:'compare',i:l+i,j:m+j}); if(left[i]<=right[j]) arr[k++]=left[i++]; else arr[k++]=right[j++]; ops.push({type:'write',index:k-1,value:arr[k-1]});} while(i<left.length){arr[k]=left[i];ops.push({type:'write',index:k,value:arr[k]});i++;k++;} while(j<right.length){arr[k]=right[j];ops.push({type:'write',index:k,value:arr[k]});j++;k++;}}; merge(0,arr.length); for(let i=0;i<arr.length;i++)ops.push({type:'sorted',i});
  } else {
    const partition=(lo,hi)=>{let pivot=arr[hi],i=lo; for(let j=lo;j<hi;j++){ops.push({type:'compare',i:j,j:hi}); if(arr[j]<pivot){swap(i,j); i++;}} if(i!==hi)swap(i,hi); ops.push({type:'sorted',i}); return i;}; const qs=(lo,hi)=>{if(lo>=hi)return;const p=partition(lo,hi);qs(lo,p-1);qs(p+1,hi)}; qs(0,arr.length-1); for(let i=0;i<arr.length;i++)ops.push({type:'sorted',i});
  }
  return ops;
}
function renderSorting(state={}){
  const arr = state.values || app.array; const max=Math.max(...arr); setStage(`<div class="sorting-stage" id="sortingBars">${arr.map((v,i)=>`<div class="sort-bar" data-index="${i}" style="height:${Math.max(38,(v/max)*250)}px">${v}</div>`).join('')}<div class="stage-caption"><span>INPUT SIZE: ${arr.length}</span><span>COMPARE → SWAP → SORTED</span></div></div>`);
}
function applySortOp(op){
  const bars=$$('#sortingBars .sort-bar'); bars.forEach(b=>b.className='sort-bar');
  if(op.type==='compare'){ bars[op.i]?.classList.add('compare'); bars[op.j]?.classList.add('compare'); log(`Comparing ${app.array[op.i]} and ${app.array[op.j]}`); }
  if(op.type==='swap'){
    if(app.array[op.i]!==undefined) [app.array[op.i],app.array[op.j]]=[app.array[op.j],app.array[op.i]];
    renderSorting(); $$(`#sortingBars .sort-bar`)[op.i]?.classList.add('swap'); $$(`#sortingBars .sort-bar`)[op.j]?.classList.add('swap'); log(`Swapped positions ${op.i+1} and ${op.j+1}`);
  }
  if(op.type==='write'){app.array[op.index]=op.value;renderSorting();$$(`#sortingBars .sort-bar`)[op.index]?.classList.add('compare');log(`Merged value ${op.value} into position ${op.index+1}`)}
  if(op.type==='sorted'){ $$(`#sortingBars .sort-bar`)[op.i]?.classList.add('sorted'); log(`Position ${op.i+1} is in its final place.`); }
}

function searchOps(){
  const arr=app.array, t=app.target, ops=[];
  if(app.algorithm==='linear'){
    for(let i=0;i<arr.length;i++){ops.push({type:'inspect',i}); if(arr[i]===t){ops.push({type:'found',i}); return ops;}}
    ops.push({type:'notfound'});
  } else {
    let l=0,r=arr.length-1; while(l<=r){const m=Math.floor((l+r)/2);ops.push({type:'inspect',i:m,l,r}); if(arr[m]===t){ops.push({type:'found',i:m});return ops;} if(arr[m]<t){ops.push({type:'discard',from:l,to:m});l=m+1}else{ops.push({type:'discard',from:m,to:r});r=m-1}}
    ops.push({type:'notfound'});
  } return ops;
}
function renderSearching(){
  setStage(`<div class="search-stage"><div class="search-array" id="searchArray">${app.array.map((v,i)=>`<div class="search-cell" data-i="${i}">${v}</div>`).join('')}</div><div class="search-controls"><span style="font-size:10px;color:#7786a3">TARGET</span><input class="inline-input" id="targetInput" type="number" value="${app.target}" /><button class="small-btn" id="applyTarget">Set Target</button></div><div style="font-size:10px;color:#6e7f9f">${app.algorithm==='binary'?'Sorted input • midpoint elimination':'Scan from left to right'}</div></div>`);
  $('#applyTarget').addEventListener('click',()=>{app.target=Number($('#targetInput').value);app.operations=[];app.stepIndex=0;resetRunState(`Target set to ${app.target}. Ready.`)});
}
function applySearchOp(op){
  const cells=$$('#searchArray .search-cell'); cells.forEach(c=>c.className='search-cell');
  if(op.type==='inspect'){cells[op.i]?.classList.add('inspect');log(`Checking index ${op.i} → value ${app.array[op.i]} against target ${app.target}.`)}
  if(op.type==='discard'){for(let i=op.from;i<=op.to;i++)cells[i]?.classList.add('discard');log(`Eliminated a region of the search space.`)}
  if(op.type==='found'){cells[op.i]?.classList.add('found');log(`Target ${app.target} found at index ${op.i}. 🎯`)}
  if(op.type==='notfound')log(`Target ${app.target} is not present in the array.`);
}

function buildGraph(){
  const nodes={A:[90,155],B:[205,90],C:[205,220],D:[345,72],E:[350,160],F:[350,270],G:[495,110],H:[495,230]};
  const edges=[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['E','G'],['F','H'],['G','H']]; return {nodes,edges};
}
function graphOps(type){
  const g=buildGraph(), adj={}; Object.keys(g.nodes).forEach(n=>adj[n]=[]); g.edges.forEach(([u,v])=>{adj[u].push(v);adj[v].push(u)}); const start='A', ops=[], seen=new Set();
  if(type==='bfs'){const q=[start]; seen.add(start); while(q.length){const u=q.shift();ops.push({type:'visit',node:u});for(const v of adj[u]){ops.push({type:'edge',u,v});if(!seen.has(v)){seen.add(v);q.push(v);ops.push({type:'discover',node:v})}}}}
  else { const dfs=(u)=>{seen.add(u);ops.push({type:'visit',node:u});for(const v of adj[u]){ops.push({type:'edge',u,v});if(!seen.has(v)){ops.push({type:'discover',node:v});dfs(v)}}}; dfs(start); }
  return {g,ops};
}
function renderGraph(){
  const {nodes,edges}=buildGraph(); const edgeSvg=edges.map((e,i)=>{const a=nodes[e[0]],b=nodes[e[1]];return `<line class="graph-edge" id="edge-${i}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" data-u="${e[0]}" data-v="${e[1]}"/>`}).join(''); const nodeSvg=Object.entries(nodes).map(([id,[x,y]])=>`<g class="graph-node" id="node-${id}" transform="translate(${x},${y})"><circle r="26"></circle><text>${id}</text></g>`).join(''); setStage(`<div class="graph-stage"><div class="graph-canvas-wrap"><svg class="graph-canvas" viewBox="0 0 600 330" preserveAspectRatio="xMidYMid meet">${edgeSvg}${nodeSvg}</svg></div><div class="graph-info"><h4>${app.algorithm==='bfs'?'BFS':'DFS'} traversal</h4><p style="font-size:10px;color:#71819f;line-height:1.7">Start node: <b style="color:#dce8ff">A</b><br/>Follow the glowing path as the frontier changes.</p><div class="graph-order" id="graphOrder">Traversal order will appear here.</div><div class="graph-legend"><div class="legend legend-current"><i></i> Current node</div><div class="legend legend-discovered"><i></i> Discovered</div><div class="legend legend-visited"><i></i> Visited</div></div></div></div>`);
}
function applyGraphOp(op){
  if(op.type==='discover'){$(`#node-${op.node}`)?.classList.add('discovered'); log(`Discovered node ${op.node}.`); return}
  if(op.type==='visit'){$$('.graph-node').forEach(n=>n.classList.remove('current'));$(`#node-${op.node}`)?.classList.add('current');$(`#node-${op.node}`)?.classList.add('visited'); $('#graphOrder').textContent += (document.querySelector('#graphOrder').textContent && !document.querySelector('#graphOrder').textContent.includes('Traversal order')) ? ` → ${op.node}` : op.node; log(`Visiting node ${op.node}.`); return}
  if(op.type==='edge'){const edges=$$('.graph-edge');edges.forEach(e=>e.classList.remove('active'));const edge=edges.find(e=>(e.dataset.u===op.u&&e.dataset.v===op.v)||(e.dataset.u===op.v&&e.dataset.v===op.u));edge?.classList.add('active');log(`Inspecting edge ${op.u} — ${op.v}.`)}
}

function renderStructures(){
  const stack=app.structures.stack, queue=app.structures.queue; setStage(`<div class="structures-stage"><div class="structure-panel"><h4>Stack <span style="color:var(--purple)">/ LIFO</span></h4><p>Last In, First Out</p><div class="structure-visual"><div class="stack-visual" id="stackVisual">${stack.map(v=>`<div class="struct-item">${v}</div>`).join('')}</div></div><div class="struct-controls"><input id="stackInput" type="number" placeholder="value" /><button class="small-btn" id="pushBtn">Push</button><button class="small-btn danger" id="popBtn">Pop</button></div></div><div class="structure-panel"><h4>Queue <span style="color:var(--cyan)">/ FIFO</span></h4><p>First In, First Out</p><div class="structure-visual"><div class="queue-visual" id="queueVisual">${queue.map(v=>`<div class="struct-item">${v}</div>`).join('')}</div></div><div class="struct-controls"><input id="queueInput" type="number" placeholder="value" /><button class="small-btn" id="enqueueBtn">Enqueue</button><button class="small-btn danger" id="dequeueBtn">Dequeue</button></div></div></div>`);
  $('#pushBtn').onclick=()=>{const v=Number($('#stackInput').value);if(!Number.isNaN(v)){stack.push(v);renderStructures();log(`Pushed ${v} onto the stack.`)}};
  $('#popBtn').onclick=()=>{if(stack.length){const v=stack.pop();renderStructures();log(`Popped ${v} from the stack.`)}else log('Stack underflow — nothing to pop.')};
  $('#enqueueBtn').onclick=()=>{const v=Number($('#queueInput').value);if(!Number.isNaN(v)){queue.push(v);renderStructures();log(`Enqueued ${v} at the rear.`)}};
  $('#dequeueBtn').onclick=()=>{if(queue.length){const v=queue.shift();renderStructures();log(`Dequeued ${v} from the front.`)}else log('Queue underflow — nothing to dequeue.')};
}

function buildOperations(){
  if(app.mode==='sorting') app.operations=sortingOps(app.array,app.algorithm);
  if(app.mode==='searching') app.operations=searchOps();
  if(app.mode==='graph'){const x=graphOps(app.algorithm);app.graph=x.g;app.operations=x.ops}
  if(app.mode==='structures') app.operations=[];
  app.stepIndex=0;
}
function applyOperation(op){
  if(app.mode==='sorting')applySortOp(op); else if(app.mode==='searching')applySearchOp(op); else if(app.mode==='graph')applyGraphOp(op);
}
async function runLoop(){
  if(app.running)return; if(!app.operations.length)buildOperations(); app.running=true; app.paused=false; $('#playBtn').disabled=true; $('#pauseBtn').disabled=false;
  while(app.stepIndex<app.operations.length && app.running){if(app.paused){await sleep(80);continue} const op=app.operations[app.stepIndex++]; applyOperation(op); await sleep(delay())}
  if(app.stepIndex>=app.operations.length){app.running=false;app.paused=false;$('#playBtn').disabled=false;$('#pauseBtn').disabled=true;$('#playBtn').innerHTML='↻ <span>Replay</span>'; if(app.mode==='sorting')log('Algorithm complete — every element is now resolved.');}
}
function stepOnce(){
  if(app.running && !app.paused)return; if(!app.operations.length)buildOperations(); if(app.stepIndex>=app.operations.length){log('End of execution. Press Reset/Randomize for a fresh run.'); return} app.stepIndex++; applyOperation(app.operations[app.stepIndex-1]); $('#playBtn').innerHTML='▶ <span>Continue</span>';
}

function switchMode(mode){app.mode=mode;app.algorithm=algorithms[mode][0].id;if(mode==='sorting')app.array=makeArray();if(mode==='searching')app.array=[...makeArray(10)].sort((a,b)=>a-b),app.target=app.array[Math.floor(Math.random()*app.array.length)];resetRunState();renderMode();document.querySelector('#lab').scrollIntoView({behavior:'smooth'});}

$$('.lab-nav').forEach(btn=>btn.addEventListener('click',()=>switchMode(btn.dataset.lab)));
$$('.category-card').forEach(btn=>btn.addEventListener('click',()=>switchMode(btn.dataset.open)));
$('#algorithmSelect').addEventListener('change',(e)=>{app.algorithm=e.target.value;resetRunState();renderMode()});
$('#randomBtn').addEventListener('click',randomize);
$('#resetBtn').addEventListener('click',()=>{if(app.mode==='sorting')app.array=makeArray();if(app.mode==='searching')app.array=[...makeArray(10)].sort((a,b)=>a-b);resetRunState();renderMode()});
$('#playBtn').addEventListener('click',runLoop);
$('#pauseBtn').addEventListener('click',()=>{app.paused=!app.paused;$('#pauseBtn').textContent=app.paused?'▶ Resume':'Ⅱ Pause';log(app.paused?'Paused — resume when ready.':'Resumed.')});
$('#stepBtn').addEventListener('click',stepOnce);
$('#speedRange').addEventListener('input',(e)=>{app.speed=Number(e.target.value);$('#speedLabel').textContent=['Slow','Slow','Steady','Steady','Medium','Fast','Fast','Turbo','Turbo','Turbo'][app.speed-1]});
$('#themeBtn').addEventListener('click',()=>document.documentElement.classList.toggle('theme-light'));

document.addEventListener('mousemove',(e)=>{document.documentElement.style.setProperty('--mx',`${e.clientX}px`);document.documentElement.style.setProperty('--my',`${e.clientY}px`);$('.cursor-glow').style.left=`${e.clientX}px`;$('.cursor-glow').style.top=`${e.clientY}px`});

app.array=makeArray(); renderMode();
