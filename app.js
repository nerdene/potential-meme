(function(){
'use strict';
var $=function(i){return document.getElementById(i)},MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],FULL=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'],
TPL='{company}-{type}-{client}-{mon}-{year}',
DEF={v:3,client:'',fallback:TPL,companies:['VANKING','ECOFLEET','PRO ENERGY','SBINC','LIVELINE','IMAGINATION AFRICA','MINDMINERS'],
 alias:{LIVELINE:['LiveLine Technologies Ghana Ltd','Liveline Technologies Gh Ltd'],SBINC:['SBINC SOLUTIONS LTD']},clients:[],
 types:[{label:'SSNIT CLEARANCE',kw:'ssnit, social security and national insurance',tpl:TPL},{label:'TAX CLEARANCE',kw:'tax clearance, ghana revenue authority',tpl:TPL},
  {label:'POWER OF ATTORNEY',kw:'power of attorney',tpl:TPL},{label:'LABOUR CLEARANCE',kw:'labour department, department of labour',tpl:TPL},
  {label:'INVOICE',kw:'invoice',tpl:'{company}-{buyer} {subject} {type}-{mon}-{year}'}]},
cfg,rows=[],pdf=window.pdfjsLib,ORG=/\b(ministry|authority|assembly|commission|agency|council|university|institute|company|corporation|board|bank|limited|ltd|trust|directorate|department|municipal|metropolitan|foundation|association|college)\b/i,
PERS=/\b(chief|executive|director|manager|secretary|registrar|officer|coordinator|engineer|mr|mrs|ms|dr|ing|hon|attention|attn)\b/i;
function clone(o){return JSON.parse(JSON.stringify(o))}
try{cfg=JSON.parse(localStorage.getItem('fr-cfg'))}catch(e){}
if(!cfg||!cfg.types)cfg=clone(DEF);
cfg.types.forEach(function(t){if(t.label==='LABOUR')t.label='LABOUR CLEARANCE'});
if(!cfg.v||cfg.v<3){cfg.companies=DEF.companies.slice();cfg.alias=clone(DEF.alias);cfg.client='';DEF.types.forEach(function(d){if(!cfg.types.some(function(t){return t.label===d.label}))cfg.types.push(clone(d))});cfg.v=3}
cfg.alias=cfg.alias||{};cfg.clients=Array.isArray(cfg.clients)?cfg.clients:[];
if(pdf)pdf.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.min.js';
function dlAnchor(blob,n){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},10000)}
function platformSave(r,n){var file=null;try{file=new File([r.f],n,{type:r.f.type||'application/octet-stream'})}catch(e){}
 if(file&&matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:n}).then(function(){say('Shared '+n)}).catch(function(e){if(e&&e.name!=='AbortError'){dlAnchor(file,n);say('Saved '+n)}});return}
 dlAnchor(file||r.f,n);say('Saved '+n)}
if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});

function persist(){try{localStorage.setItem('fr-cfg',JSON.stringify(cfg))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(t){$('msg').textContent=t}
function opts(a,sel,blank){return (blank?'<option value="">'+blank+'</option>':'')+a.map(function(x){var v=x.value!==undefined?x.value:x,l=x.text||x;return '<option value="'+esc(v)+'"'+(String(v)===String(sel)?' selected':'')+'>'+esc(l)+'</option>'}).join('')}
function rx(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function nm(c){return [c].concat(cfg.alias[c]||[])}
function inDoc(text,s){return new RegExp('(?<![A-Za-z0-9])'+rx(s).replace(/\s+/g,'\\s+')+'(?![A-Za-z0-9])','i').test(text)}
function isInv(t){return /\{(buyer|subject)\}/.test(t.tpl)}
function letters(s){return s.replace(/[^A-Za-z]/g,'').length}
function initials(o){return o.replace(/[().,&]/g,' ').split(/\s+/).filter(function(w){return w&&!/^(the|and)$/i.test(w)}).map(function(w){return w[0]}).join('').toUpperCase()}
function okey(o){return o.toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function clean(s){return s.replace(/\//g,'\u2215').replace(/[\\:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()}
function fixTitle(s){return s.replace(/(^|[^A-Za-z0-9])[Il](?=NO\b)/g,function(m,p){return p+'1'})}
function tidy(s){return s.replace(/^\s*(re|subject|ref)\s*[:\-]\s*/i,'').replace(/\s+/g,' ').replace(/^[\s:;,.\-–]+|[\s:;,.\-–]+$/g,'')}
function stripNames(s,extra){var u=' '+s+' ',all=[];cfg.companies.forEach(function(c){nm(c).forEach(function(x){all.push(x)})});
 all.sort(function(a,b){return b.length-a.length}).forEach(function(c){u=u.replace(new RegExp('(?<![A-Za-z0-9])'+rx(c)+'\\.?(?![A-Za-z0-9])','ig'),' ')});
 [$('client').value.trim()].concat(extra||[]).forEach(function(cl){if(cl)u=u.replace(new RegExp('(?<![A-Za-z0-9])'+rx(cl)+'(?![A-Za-z0-9])','ig'),function(m,off,str){var pre=str.slice(0,off);return pre.split('(').length>pre.split(')').length?m:' '})});
 return u.replace(/\s+/g,' ').replace(/^[\s\-–:,.]+|[\s\-–:,.]+$/g,'')}

/* ---------- reading documents ---------- */
function toLines(items,bold){var a=items.filter(function(x){return x.str!==''}).map(function(x){return{s:x.str,x:x.transform[4],y:x.transform[5],h:Math.abs(x.transform[3])||10,w:x.width,b:!!bold[x.fontName]}});
 a.sort(function(p,q){return Math.abs(q.y-p.y)>Math.max(2,Math.min(p.h,q.h)*.4)?q.y-p.y:p.x-q.x});var L=[],cur=null;
 a.forEach(function(it){if(!cur||Math.abs(cur.y-it.y)>Math.max(2,Math.min(cur.h,it.h)*.4)){cur={y:it.y,h:it.h,t:'',bl:0,tl:0,last:null};L.push(cur)}
  var gap=cur.last?it.x-(cur.last.x+cur.last.w):0;if(cur.last&&gap>it.h*.2&&!/^\s/.test(it.s)&&!/\s$/.test(cur.last.s))cur.t+=' ';cur.t+=it.s;cur.h=Math.max(cur.h,it.h);var n=letters(it.s);cur.tl+=n;if(it.b)cur.bl+=n;cur.last=it});
 return L.map(function(l){return{t:l.t.replace(/\s+/g,' ').trim(),y:l.y,h:l.h,b:l.tl?l.bl/l.tl:0}}).filter(function(l){return l.t})}
function pickHeading(L){
 var sal=-1;for(var i=0;i<L.length;i++)if(/^(dear|sir\b|madam|gentlemen|to whom|attention)/i.test(L[i].t)){sal=i;break}
 function run(from){var i=from;while(i<L.length&&!(L[i].b>=.8&&letters(L[i].t)>=3))i++;
  var B=[],cur=null;for(;i<L.length&&L[i].b>=.8;i++){var l=L[i];if(cur&&Math.abs(cur.y-l.y)<l.h*1.7){cur.t+=' '+l.t;cur.y=l.y}else{cur={t:l.t,y:l.y};B.push(cur)}}
  return{B:B,end:i}}
 function make(B){var s=B.map(function(b){return tidy(b.t)}).filter(function(x){return letters(stripNames(x))>=4});if(!s.length)return'';
  if(s.length>1){var k=-1,m=99;s.forEach(function(x,j){var n=x.split(' ').length;if(n<=6&&n<m){m=n;k=j}});if(k>0)s.unshift(s.splice(k,1)[0])}
  return s.slice(0,3).join('-')}
 function scan(from){var p=from,g=0;while(p<L.length&&g++<6){var q=run(p);if(!q.B.length)break;var r=make(q.B);if(r)return r;p=Math.max(q.end,p+1)}return''}
 pickHeading.sal=sal;var r=sal>-1?scan(sal+1):'';if(!r)r=scan(0);
 if(!r){var best=0,txt='';L.forEach(function(l){if(letters(l.t)>=4&&l.h>best+.4){best=l.h;txt=l.t}});r=letters(stripNames(txt))>=4?tidy(txt):''}
 return r}
function analyse(L){var o={title:pickHeading(L),letter:pickHeading.sal>-1,org:'',buyer:'',subject:''},sal=pickHeading.sal,i;
 for(i=0;i<(sal>-1?sal:0);i++){var t=L[i].t;if(ORG.test(t)&&!PERS.test(t)&&letters(stripNames(t))>=4&&!/\d{3}/.test(t)){o.org=t.replace(/^the\s+/i,'').replace(/[,;.]+$/,'');break}}
 var bi=-1,ci=-1,ti=-1;L.forEach(function(l,k){if(bi<0&&/^buyer\b/i.test(l.t))bi=k;if(bi>-1&&ci<0&&k>=bi&&/client id/i.test(l.t))ci=k;if(ti<0&&/^item\b.*\bdescription\b/i.test(l.t))ti=k});
 if(bi>-1){var end=ci>-1?ci:(ti>-1?ti-1:bi+3);
  for(i=bi;i<=Math.min(end,L.length-1);i++){var s=L[i].t.replace(/^buyer\b/i,'').split(/\b(?:Date|Valid Until|Invoice|Client ID)\b/i)[0].replace(/[:\s]+$/,'').trim();if(letters(s)>=3){o.buyer=s;break}}
  if(ti>-1)for(i=(ci>-1?ci:bi)+1;i<ti;i++){if(letters(L[i].t)>=3){o.subject=L[i].t.trim();break}}}
 return o}
async function readText(f){
 var out={text:'',head:'',a:null,err:''};
 if(!(f.type==='application/pdf'||/\.pdf$/i.test(f.name)))return out;
 if(!pdf){out.err='the PDF reader did not load';return out}
 try{var doc=await pdf.getDocument({data:new Uint8Array(await f.arrayBuffer()),disableFontFace:true}).promise;
  for(var i=1;i<=Math.min(3,doc.numPages);i++){var pg=await doc.getPage(i),c=await pg.getTextContent(),tx=c.items.map(function(x){return x.str}).join(' ');out.text+=' '+tx;
   if(i===1){out.head=tx.slice(0,800);var bold={};try{await pg.getOperatorList();Object.keys(c.styles).forEach(function(n){try{if(pg.commonObjs.has(n)){var fo=pg.commonObjs.get(n);bold[n]=!!(fo.bold||fo.black||/bold|black|heavy|demi/i.test(fo.name||''))}}catch(e){}})}catch(e){}
    out.a=analyse(toLines(c.items,bold));if(out.a.letter)out.head=out.a.title}}}catch(e){out.err=(e&&e.message)||String(e)}
 return out}
async function readDocx(f){
 var out={text:'',head:'',a:null,err:''};if(!window.JSZip){out.err='the Word reader did not load';return out}
 try{var z=await JSZip.loadAsync(await f.arrayBuffer()),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  doc=new DOMParser().parseFromString(await z.file('word/document.xml').async('string'),'application/xml'),ps=doc.getElementsByTagNameNS(W,'p'),L=[],all='';
  for(var i=0;i<ps.length;i++){var p=ps[i],rs=p.getElementsByTagNameNS(W,'r'),t='',bl=0,tl=0,pp=p.getElementsByTagNameNS(W,'pStyle')[0],hd=pp&&/^(heading|title)/i.test(pp.getAttributeNS(W,'val')||'');
   for(var j=0;j<rs.length;j++){var r=rs[j],s='';Array.prototype.forEach.call(r.childNodes,function(n){if(n.localName==='t')s+=n.textContent;else if(n.localName==='tab')s+=' '});
    var b=r.getElementsByTagNameNS(W,'b')[0],on=hd||(b&&!/^(0|false)$/i.test(b.getAttributeNS(W,'val')||''));t+=s;var n=letters(s);tl+=n;if(on)bl+=n}
   t=t.replace(/\s+/g,' ').trim();if(t){all+=' '+t;L.push({t:t,y:-i*50,h:12,b:tl?bl/tl:0})}}
  var names=Object.keys(z.files).filter(function(n){return /^word\/(header|footer)\d*\.xml$/.test(n)});
  for(var k=0;k<names.length;k++){var hx=new DOMParser().parseFromString(await z.file(names[k]).async('string'),'application/xml');Array.prototype.forEach.call(hx.getElementsByTagNameNS(W,'p'),function(hp){var ht='';Array.prototype.forEach.call(hp.getElementsByTagNameNS(W,'t'),function(n){ht+=n.textContent});all+=' '+ht})}
  out.text=all;out.head=all.slice(0,800);out.a=analyse(L);if(out.a.letter)out.head=out.a.title}catch(e){out.err=(e&&e.message)||String(e)}
 return out}
function squash(s){return s.toLowerCase().replace(/[^a-z0-9]/g,'')}
function mailTokens(text){var out=[];(text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?:https?:\/\/|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).forEach(function(m){m=m.replace(/^https?:\/\//i,'').replace(/^www\./i,'');var p=m.split('@'),loc=p.length>1?p[0]:'',dom=(p.length>1?p[1]:p[0]).split('.')[0];[loc,dom].forEach(function(x){x=squash(x);if(x.length>=3)out.push(x)})});return out}
function detect(head,full,letter){var res={type:'',company:'',why:''};
 cfg.types.forEach(function(t,i){if(res.type!==''||!t.kw)return;if(letter&&isInv(t))return;t.kw.split(',').some(function(k){k=k.trim();if(k&&inDoc(head,k)){res.type=i;res.why=k;return true}})});
 var best=0;cfg.companies.forEach(function(c){nm(c).forEach(function(x){if(x.length>best&&inDoc(full,x)){best=x.length;res.company=c}})});
 if(!res.company){var tk=mailTokens(full);cfg.companies.forEach(function(c){nm(c).forEach(function(x){var q=squash(x);if(q.length>=4&&q.length>best&&tk.some(function(t){return t.indexOf(q)===0})){best=q.length;res.company=c}})})}
 return res}

/* ---------- naming ---------- */
function invRow(r){var t=cfg.types[r.type];return !!t&&isInv(t)}
function known(org){var k=okey(org),h=cfg.clients.filter(function(c){return okey(c.n)===k})[0];return h?h.c:''}
function clientOf(r){if(r.cl!==undefined)return r.cl;var o=invRow(r)?r.orgI:r.orgL;if(o)return known(o)||initials(o);return invRow(r)?'':$('client').value.trim()}
function build(r){var t=cfg.types[r.type],m=+$('mon').value,cl=clientOf(r);
 if(!t){if(!r.title&&!r.base)return'';t={label:stripNames(r.title,[cl])||r.base,tpl:cfg.fallback||TPL}}
 var v={company:r.company||$('co').value,type:t.label,client:cl,buyer:cl,subject:isInv(t)?clean(r.sj!==undefined?r.sj:r.subj):'',mon:MON[m],month:FULL[m],year:$('yr').value};
 return clean(t.tpl.replace(/\{(\w+)\}/g,function(_,k){return v[k]===undefined?'':v[k]}).toUpperCase()).replace(/\s*-\s*/g,'-').replace(/-{2,}/g,'-').replace(/^-|-$/g,'')}
function calc(){var seen={};rows.forEach(function(r){var n=r.edit!==null?r.edit:build(r),k=n.toLowerCase()+r.ext,d=seen[k]=(seen[k]||0)+1;r.final=d>1?n+' ('+d+')':n})}
function paint(){document.querySelectorAll('#list .row').forEach(function(el){var r=rows[+el.dataset.i],ta=el.querySelector('.nm');if(r.edit===null){ta.value=r.final;ta.rows=Math.min(6,Math.max(2,Math.ceil(r.final.length/32)))}})}

/* ---------- settings ---------- */
function keepTypes(fn){var lb=rows.map(function(r){var t=cfg.types[r.type];return t?t.label:null});fn();rows.forEach(function(r,i){if(lb[i]!==null){var j=-1;cfg.types.forEach(function(t,k){if(j<0&&t.label===lb[i])j=k});r.type=j>-1?j:''}})}
function renderSettings(){
 $('cos').value=cfg.companies.map(function(c){var a=cfg.alias[c]||[];return a.length?c+' = '+a.join(' | '):c}).join('\n');
 $('cls').value=cfg.clients.map(function(c){return c.c+' = '+c.n}).join('\n');
 $('types').innerHTML=cfg.types.map(function(t,i){return '<div class="type" data-i="'+i+'"><label>Name used in the file name</label><input type="text" data-f="label" value="'+esc(t.label)+'"><label>Keywords</label><input type="text" data-f="kw" value="'+esc(t.kw)+'"><label>Format</label><input type="text" data-f="tpl" value="'+esc(t.tpl)+'"><button type="button" data-del="'+i+'" class="rm">Remove this type</button></div>'}).join('');
 $('types').querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){keepTypes(function(){collect();cfg.types.splice(+b.dataset.del,1)});renderSettings();render()}});
 $('co').innerHTML=opts(cfg.companies,$('co').value,'— choose —');$('fb').value=cfg.fallback||TPL;$('client').value=$('client').value||cfg.client||''}
function collect(){cfg.companies=[];cfg.alias={};
 $('cos').value.split('\n').forEach(function(l){var p=l.split('='),n=p[0].trim().toUpperCase();if(!n)return;cfg.companies.push(n);var a=(p[1]||'').split('|').map(function(x){return x.trim()}).filter(Boolean);if(a.length)cfg.alias[n]=a});
 if(!cfg.companies.length){cfg.companies=DEF.companies.slice();cfg.alias=clone(DEF.alias)}
 cfg.clients=$('cls').value.split('\n').map(function(l){var p=l.split('=');return{c:p[0].trim().toUpperCase(),n:(p.slice(1).join('=')||'').trim()}}).filter(function(c){return c.c&&c.n});
 cfg.types=Array.prototype.map.call($('types').querySelectorAll('.type'),function(d){var o={};d.querySelectorAll('[data-f]').forEach(function(x){o[x.dataset.f]=x.value.trim()});return o}).filter(function(t){return t.label});cfg.fallback=$('fb').value.trim()||TPL}
$('addt').onclick=function(){keepTypes(function(){collect();cfg.types.push({label:'NEW DOCUMENT',kw:'',tpl:TPL})});renderSettings()};
$('savecfg').onclick=function(){keepTypes(collect);cfg.client=$('client').value.trim();persist();renderSettings();var ch=0;
 rows.forEach(function(r){var det=detect(r.f.name+' '+r.head,r.text,r.letter);if(!r.man.company&&det.company!==r.company){r.company=det.company;r.edit=null;ch++}else if(r.company&&cfg.companies.indexOf(r.company)<0){r.company='';r.edit=null}if(!r.man.type&&det.type!==r.type){r.type=det.type;r.why=det.why;r.edit=null;ch++}});
 render();$('smsg').textContent='Settings saved'+(rows.length?(ch?'. Updated '+ch+' file name'+(ch>1?'s':'')+' above.':'. No file names needed changing.'):'.')};
var rt=0;$('reset').onclick=function(){if(!rt){$('reset').textContent='Click again to confirm reset';rt=setTimeout(function(){rt=0;$('reset').textContent='Reset to defaults'},4000);return}clearTimeout(rt);rt=0;$('reset').textContent='Reset to defaults';
 cfg=clone(DEF);persist();renderSettings();rows.forEach(function(r){var d=detect(r.f.name+' '+r.head,r.text,r.letter);r.man={};r.type=d.type;r.why=d.why;r.company=d.company;r.edit=null});render();$('smsg').textContent='Settings reset to the defaults.'};
$('client').onchange=function(){cfg.client=$('client').value.trim();persist()};
var d=new Date();$('mon').innerHTML=opts(MON.map(function(m,i){return{value:i,text:FULL[i]}}),d.getMonth());$('yr').value=d.getFullYear();
['client','mon','yr','co'].forEach(function(id){$(id).oninput=render;$(id).onchange=render});
renderSettings();
if(!pdf)say('The PDF reader did not load, so PDFs cannot be read. Check that the “vendor” folder was uploaded.');

/* ---------- files and rows ---------- */
$('fi').onchange=async function(){
 var fs=Array.prototype.slice.call(this.files);this.value='';if(!fs.length)return;say('Reading files…');
 for(var f of fs){var rd=await(/\.docx$/i.test(f.name)?readDocx(f):readText(f)),a=rd.a||{},det=detect(f.name+' '+rd.head,rd.text,a.letter),ext=(f.name.match(/\.[^.]+$/)||[''])[0];
  rows.push({f:f,ext:ext,base:f.name.replace(/\.[^.]+$/,''),type:det.type,why:det.why,company:det.company,title:fixTitle(clean(a.title||'')).slice(0,160),text:rd.text,head:rd.head,letter:!!a.letter,
   orgL:a.org||'',orgI:a.buyer||'',subj:a.subject||'',err:rd.err,man:{},edit:null,scanned:!rd.text&&(f.type==='application/pdf'||/\.pdf$/i.test(f.name))})}
 say('');render()};
function render(){
 $('empty').hidden=rows.length>0;calc();
 $('list').innerHTML=rows.map(function(r,i){var t=cfg.types[r.type],bt=t?t.label:'',inv=invRow(r),org=inv?r.orgI:r.orgL;
  return '<div class="row" data-i="'+i+'"><div class="rtop"><span class="badge'+(bt?'':' other')+'">'+esc(bt||'Other document')+'</span><span class="old">'+esc(r.f.name)+'</span></div>'+
  '<div class="grid"><div><label>Document type</label><select data-k="type">'+opts(cfg.types.map(function(x,j){return{value:j,text:x.label}}),r.type,r.title?'Use bold heading':'Use file name')+'</select></div>'+
  '<div><label>Company</label><select data-k="company">'+opts(cfg.companies,r.company||$('co').value,'— choose —')+'</select></div></div>'+
  '<div class="grid"><div><label>'+(inv?'Buyer (short code)':'Client (short code)')+'</label><input type="text" data-k="cl" value="'+esc(clientOf(r))+'" placeholder="None"></div>'+
  (inv?'<div><label>Job / subject</label><input type="text" data-k="sj" value="'+esc(r.sj!==undefined?r.sj:r.subj)+'" placeholder="None"></div>':'')+'</div>'+
  (t&&r.why&&!r.man.type?'<div class="hint">Recognised as '+esc(t.label)+' because it contains “'+esc(r.why)+'”. Wrong? Change the type above.</div>':'')+
  (org?'<div class="hint">Found in document: '+esc(org)+'</div>':'')+
  '<label>New name</label><textarea class="nm" rows="2" data-k="edit">'+esc(r.final)+'</textarea>'+
  (r.err?'<div class="warn">Couldn’t read the text of this file ('+esc(r.err)+'), so this name uses the file name only.</div>':'')+
  (!(r.company||$('co').value)?'<div class="warn">Company not found in the document. Choose it above.</div>':'')+
  (!t?'<div class="hint">Not one of your saved document types, so it is named from '+(r.title?'its bold heading: '+esc(r.title):'the file name'+(r.scanned?' (this looks like a scanned PDF, which can’t be read)':''))+'. Check it before saving.</div>':'')+
  '<div class="btns"><button class="pri" data-save="'+i+'">Save renamed file</button><button data-rm="'+i+'">Remove</button></div></div>'}).join('');
 paint();
 $('list').querySelectorAll('.row').forEach(function(el){var r=rows[+el.dataset.i];
  el.querySelectorAll('select').forEach(function(s){s.onchange=function(){r.man[s.dataset.k]=true;r[s.dataset.k]=s.dataset.k==='type'&&s.value!==''?+s.value:s.value;r.edit=null;render()}});
  el.querySelectorAll('input[data-k]').forEach(function(x){x.oninput=function(){if(x.dataset.k==='cl')r.cl=x.value.trim().toUpperCase();else r.sj=x.value;r.edit=null;calc();paint()}});
  el.querySelector('.nm').oninput=function(){r.edit=this.value.replace(/\n/g,' ')};
  el.querySelector('[data-rm]').onclick=function(){rows.splice(+el.dataset.i,1);render()};
  el.querySelector('[data-save]').onclick=function(){var o=invRow(r)?r.orgI:r.orgL,c=clientOf(r);
   if(o&&c&&known(o)!==c){cfg.clients=cfg.clients.filter(function(k){return okey(k.n)!==okey(o)});cfg.clients.push({n:o,c:c});persist();renderSettings()}
   platformSave(r,(r.edit!==null?clean(r.edit):r.final)+r.ext)}})}
})();
