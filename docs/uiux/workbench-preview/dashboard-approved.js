const months=[['Jul',20,2],['Agu',40,3],['Sep',50,3],['Okt',30,4],['Nov',80,4],['Des',60,4]];
const sum=(a)=>a.reduce((n,x)=>n+x,0);
console.assert(sum(months.map(x=>x[1]))===280 && sum(months.map(x=>x[2]))===20 && 2+8+12===22,'Data sintetis tidak konsisten');
const plot=document.querySelector('#bars'), select=document.querySelector('#period');
function render(){const rows=Number(select.value) ? months.slice(-Number(select.value)) : [];plot.innerHTML=rows.map(([label,value,count],i)=>`<div class="bar-wrap"><button class="bar ${i===rows.length-2?'selected':''}" style="height:${value}%" aria-label="${label} 2026: Rp ${value}.000.000, ${count} dokumen"><span>${label} 2026<br>Rp ${value}.000.000 · ${count} PR</span></button><span class="month">${label}</span></div>`).join('') || '<p>Tidak ada data pada periode ini.</p>';document.querySelector('#chart-summary').textContent=`${rows.length} bulan: Rp ${sum(rows.map(x=>x[1]))}.000.000 · ${sum(rows.map(x=>x[2]))} PR diajukan`;}
select.addEventListener('change',render);render();
const menu=document.querySelector('.menu');menu.addEventListener('click',()=>{const open=document.querySelector('.sidebar').classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelector('.sidebar').classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Buka navigasi');}});

