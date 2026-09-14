'use strict';
const assert=require('node:assert/strict');
const {tools,execute}=require('./engine.js');
let passed=0;
const ok=(a,msg)=>{assert.ok(a,msg);passed++};
const val=id=>Object.fromEntries(tools.find(t=>t.id===id).fields.map(f=>[f.id,f.example]));
const run=(id,v={})=>execute(id,{...val(id),...v});
ok(tools.length===20,'20 tools');ok(new Set(tools.map(t=>t.id)).size===20,'unique ids');
for(const t of tools){ok(run(t.id).length>30,'output '+t.id);for(const f of t.fields){assert.throws(()=>run(t.id,{[f.id]:''}),undefined,'empty '+t.id+':'+f.id);passed++}}
const expectations={priority:'10',brief:'尚待訪談',interview:'最近一次',roster:'缺口',agenda:'11:00',budget:'4,000',access:'3/6',readable:'1.',contrast:'達門檻',handoff:'逾期',meals:'39',supplies:'18',pantry:'-4',reuse:'24 小時',energy:'27 kWh',reusables:'25',study:'60',quiz:'2 張',outreach:'utm_source=campus-volunteers',impact:'40%'};
for(const [id,expected] of Object.entries(expectations))ok(run(id).includes(expected),id+' expected '+expected);
ok(run('contrast',{fg:'#000000',bg:'#ffffff'}).includes('21.0000'),'black white');
ok(run('contrast',{fg:'#FFFFFF',bg:'#FFFFFF'}).includes('1.0000'),'same colors');
ok(run('contrast',{fg:'#777777',bg:'#ffffff'}).includes('一般文字 AA（至少 4.5）：未達門檻'),'threshold not rounded');
ok(run('agenda',{start:'23:50',items:'第一段 | 20'}).includes('+1日 00:10'),'cross midnight');
ok(run('energy',{after:'10'}).includes('-18 kWh'),'increase not savings');
ok(run('reusables',{single:'1',wash:'2'}).includes('沒有有限'),'no breakeven');
ok(run('study',{minutes:'23',block:'20'}).includes('3 分鐘'),'remainder');
ok(run('impact',{visitors:'0',completers:'0',feedback:'0',real:'0'}).includes('無分母'),'zero visitors');
const bad=[['roster',{people:'A | 上午\nA | 下午'}],['roster',{slots:'上午 | 2\n上午 | 2'}],['meals',{vegetarian:'100'}],['pantry',{items:'a | 2026-02-30 | 1'}],['budget',{fund:'-1'}],['budget',{people:'0'}],['priority',{items:'a | 5 | 5 | 0'}],['outreach',{url:'javascript:alert(1)'}],['outreach',{url:'https://u:p@example.com'}],['outreach',{source:'<img>'}],['impact',{feedback:'9'}],['impact',{completers:'21'}],['study',{block:'200'}],['contrast',{fg:'#gggggg'}],['agenda',{start:'25:00'}],['handoff',{items:'a | b | 2026-09-10 | unknown'}],['access',{done:'1,7'}],['supplies',{items:'a | 本 | 5'}],['energy',{before:'25'}]];
for(const [id,v]of bad){assert.throws(()=>run(id,v),undefined,id);passed++}
console.log(JSON.stringify({suite:'engine',passed,failed:0,tools:20},null,2));
