import React,{useState,useEffect}from"react";
const k="flip-data";const t="flip-title";
const n=v=>Number(v||0);
const c=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n(v));
const d=()=>new Date().toISOString().slice(0,10);
const days=(a,b)=>{if(!a||!b)return 0;return Math.max(0,Math.round((new Date(b)-new Date(a))/(1000*60*60*24)));};
const make=(name="New Property")=>({id:Date.now()+Math.random(),name,address:"",purchaseDate:"",saleDate:d(),purchasePrice:"",closingCosts:"",loanPoints:"",propertyTaxes:"",insurance:"",rehabLabor:"",rehabMaterials:"",holdingCostsBase:"",holdingCostItems:[],sellingCosts:"",dailyInterest:"",extraLineItems:[],salesPrice:"",cashInvested:"",isSold:false});

export default function App(){
const[p,setP]=useState(()=>{const s=localStorage.getItem(k);return s?JSON.parse(s):[make("123 Palm Ave")]});
const[title,setTitle]=useState(()=>localStorage.getItem(t)||"Flip Dashboard");
const[id,setId]=useState(null);

useEffect(()=>localStorage.setItem(k,JSON.stringify(p)),[p]);
useEffect(()=>localStorage.setItem(t,title),[title]);

const sel=p.find(x=>x.id===id);

const upd=(i,f,v)=>setP(p.map(x=>x.id===i?({...x,[f]:v,isSold:f==="isSold"?v:x.isSold,saleDate:(!x.isSold?d():x.saleDate)}):x));
const add=()=>{const x=make("Property "+(p.length+1));setP([...p,x]);setId(x.id)};
const del=i=>{setP(p.filter(x=>x.id!==i));if(id===i)setId(null)};

const calc=x=>{
const dh=days(x.purchaseDate,x.saleDate);
const int=n(x.dailyInterest)*dh;
const hold=n(x.holdingCostsBase);
const exp=n(x.closingCosts)+n(x.loanPoints)+n(x.propertyTaxes)+n(x.insurance)+n(x.rehabLabor)+n(x.rehabMaterials)+hold+n(x.sellingCosts)+int;
const total=exp+n(x.purchasePrice);
const prof=n(x.salesPrice)-total;
const pm=n(x.salesPrice)?prof/n(x.salesPrice):0;
const coc=n(x.cashInvested)?prof/n(x.cashInvested):0;
const annual=dh?Math.pow(1+(prof/n(x.cashInvested)||0),365/dh)-1:0;
return{dh,prof,pm,coc,annual};
};

if(!sel){
const port=p.map(x=>({...x,...calc(x)}));
const tot=port.reduce((s,x)=>s+x.prof,0);
const sales=port.reduce((s,x)=>s+n(x.salesPrice),0);
const cash=port.reduce((s,x)=>s+n(x.cashInvested),0);
const pm=sales?tot/sales:0;
const coc=cash?tot/cash:0;

return <div style={{padding:20,fontFamily:"sans-serif"}}>
<input value={title} onChange={e=>setTitle(e.target.value)} style={{fontSize:20}}/>
<h1>{title}</h1>
<button onClick={add}>Add</button>
<div>{port.map(x=><div key={x.id} onClick={()=>setId(x.id)} style={{border:"1px solid #ccc",padding:10,margin:10}}>
<b>{x.name}</b><br/>
Purchase {c(x.purchasePrice)}<br/>
Sold {c(x.salesPrice)}<br/>
Profit {c(x.prof)}<br/>
Margin {(x.pm*100).toFixed(1)}%<br/>
CoC {(x.coc*100).toFixed(1)}%<br/>
{x.isSold?"Sold":"Active"}
<button onClick={e=>{e.stopPropagation();del(x.id)}}>X</button>
</div>)}</div>
<div style={{border:"2px solid black",padding:10}}>
Total Profit {c(tot)}<br/>
Portfolio Margin {(pm*100).toFixed(1)}%<br/>
Portfolio CoC {(coc*100).toFixed(1)}%
</div>
</div>
}

const m=calc(sel);

return <div style={{padding:20}}>
<button onClick={()=>setId(null)}>Back</button>
<h2>{sel.name}</h2>
<input value={sel.name} onChange={e=>upd(sel.id,"name",e.target.value)}/>
<input value={sel.purchasePrice} onChange={e=>upd(sel.id,"purchasePrice",e.target.value)}/>
<input value={sel.salesPrice} onChange={e=>upd(sel.id,"salesPrice",e.target.value)}/>
<div>Profit {c(m.prof)}</div>
<div>Annual Return {(m.annual*100).toFixed(1)}%</div>
</div>
}
