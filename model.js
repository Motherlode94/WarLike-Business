(function(root){
'use strict';
const KEY='warlike-business-demo-v1',MAX=10000000000;
const fail=message=>{throw Error(message)};
function text(v,max=220){if(typeof v!=='string'||!v.trim()||v.length>max)fail('Texte manquant ou trop long.');return v.trim()}
function cents(v){const s=String(v).trim().replace(',','.');if(!/^\d{1,8}(\.\d{1,2})?$/.test(s))fail('Saisis un montant positif avec deux décimales maximum.');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(n<1||n>MAX)fail('Montant hors limites.');return n}
function integer(n,min=0,max=MAX){if(!Number.isSafeInteger(n)||n<min||n>max)fail('Valeur numérique invalide.');return n}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail('Date invalide.');return v}
function id(v){if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(v))fail('Identifiant invalide.');return v}
function customer(c){const email=text(c.email,200);if(!/^[^\s@]+@[^\s@]+$/.test(email))fail('Email invalide.');return {id:id(c.id),name:text(c.name,120),email}}
function lines(values){if(!Array.isArray(values)||values.length<1||values.length>40)fail('Ajoute de 1 à 40 lignes.');return values.map(l=>({description:text(l.description),quantity:integer(l.quantity,1,10000),unitCents:integer(l.unitCents,1)}))}
function total(doc){const result=doc.lines.reduce((n,l)=>n+l.quantity*l.unitCents,0);return integer(result,1)}
function paid(doc){return (doc.payments||[]).reduce((n,p)=>n+p.cents,0)}
function balance(doc){return total(doc)-paid(doc)}
function invoiceState(doc,today=new Date().toISOString().slice(0,10)){return balance(doc)===0?'payée':doc.dueDate<today?'en retard':paid(doc)>0?'partielle':'émise'}
function initial(){return {version:2,counter:1,clients:[{id:'c1',name:'WarLike Group',email:'contact@example.invalid'}],quotes:[],invoices:[]}}
function normalize(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('Sauvegarde Business invalide.');
 if(raw.version!==undefined&&raw.version!==2)fail('Version non prise en charge.');
 const result={version:2,counter:integer(raw.counter,0,1000000000),clients:[],quotes:[],invoices:[]};
 for(const key of ['clients','quotes','invoices'])if(!Array.isArray(raw[key])||raw[key].length>5000)fail('Liste Business invalide.');
 result.clients=raw.clients.map(customer);const refs=new Set(),ids=new Set(result.clients.map(c=>c.id));if(ids.size!==result.clients.length)fail('Clients en double.');
 function doc(d,kind){
  if(!d||typeof d!=='object')fail('Document invalide.');
  const c=result.clients.find(c=>c.id===d.client);if(!c)fail('Client du document introuvable.');
  const out={id:id(d.id),ref:text(d.ref,80),client:c.id,customer:d.customer?customer(d.customer):{...c},date:date(d.date),dueDate:date(d.dueDate||d.date),lines:d.lines?lines(d.lines):[{description:text(d.description),quantity:1,unitCents:integer(Math.round(Number(d.amount)*100),1)}]};
  if(out.customer.id!==c.id)fail('Client du document incohérent.');total(out);
  if(refs.has(out.ref)||ids.has(out.id))fail('Référence ou identifiant en double.');refs.add(out.ref);ids.add(out.id);
  if(kind==='quote'){out.status=d.status||'brouillon';if(!['brouillon','envoyé','accepté','refusé'].includes(out.status))fail('État de devis invalide.');if(d.invoiceId)out.invoiceId=id(d.invoiceId)}
  else{out.quoteRef=text(d.quoteRef,80);out.payments=(d.payments||(d.status==='payée'?[{cents:total(out),date:d.date}]:[])).map(p=>({cents:integer(p.cents,1),date:date(p.date)}));if(out.payments.length>1000||paid(out)>total(out))fail('Règlements supérieurs au total.');}
  return out;
 }
 result.quotes=raw.quotes.map(d=>doc(d,'quote'));result.invoices=raw.invoices.map(d=>doc(d,'invoice'));
 for(const q of result.quotes){const inv=result.invoices.filter(i=>i.quoteRef===q.ref);if(inv.length>1||Boolean(q.invoiceId)!==Boolean(inv.length)||(q.invoiceId&&inv[0]?.id!==q.invoiceId))fail('Lien devis/facture incohérent.');}
 for(const inv of result.invoices)if(!result.quotes.some(q=>q.ref===inv.quoteRef&&q.invoiceId===inv.id))fail('Facture sans devis associé.');
 return result;
}
function nextId(data,prefix){let value;do{integer(++data.counter,1,1000000000);value=prefix+data.counter}while([...data.clients,...data.quotes,...data.invoices].some(x=>x.id===value||x.ref==='DEV-'+value||x.ref==='FAC-'+value));return value}
function convert(data,quoteId,now,due){const q=data.quotes.find(q=>q.id===quoteId);if(!q||q.invoiceId)fail('Ce devis est déjà facturé ou introuvable.');if(q.status==='refusé')fail('Un devis refusé ne peut pas être converti.');const i=nextId(data,'f');const inv={id:i,ref:'FAC-'+i,client:q.client,customer:{...q.customer},date:date(now),dueDate:date(due),lines:q.lines.map(l=>({...l})),quoteRef:q.ref,payments:[]};q.invoiceId=i;data.invoices.push(inv);return inv}
function payment(data,invoiceId,value,when){const inv=data.invoices.find(i=>i.id===invoiceId);if(!inv)fail('Facture introuvable.');integer(value,1);if(value>balance(inv))fail('Le règlement dépasse le solde restant.');inv.payments.push({cents:value,date:date(when)});return inv}
function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csv(data){const rows=[['Référence','Client','Date','Échéance','HT EUR','Réglé EUR','Solde EUR','État'],...data.invoices.map(i=>[i.ref,i.customer.name,i.date,i.dueDate,(total(i)/100).toFixed(2),(paid(i)/100).toFixed(2),(balance(i)/100).toFixed(2),invoiceState(i)])];return '\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')}
const api={KEY,initial,cents,normalize,total,paid,balance,invoiceState,nextId,convert,payment,csv};root.BusinessModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
