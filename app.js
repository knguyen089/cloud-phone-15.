// Sửa URL này thành địa chỉ HTTPS backend của bạn sau khi triển khai.
const API_BASE = "https://YOUR-BACKEND-DOMAIN";
const $ = id => document.getElementById(id);
let mode = "login", token = localStorage.getItem("cp15_token") || "", currentUser = null;
function msg(id, text){$(id).textContent=text}
async function api(path, options={}){
  if(API_BASE.includes("YOUR-BACKEND")) throw new Error("Chưa cấu hình API_BASE trong web/app.js.");
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  const res=await fetch(API_BASE+path,{...options,headers});
  const data=await res.json().catch(()=>({error:"Phản hồi máy chủ không hợp lệ"}));
  if(!res.ok) throw new Error(data.error||"Yêu cầu thất bại");
  return data;
}
$("loginTab").onclick=()=>setMode("login");
$("registerTab").onclick=()=>setMode("register");
function setMode(m){mode=m;$("loginTab").classList.toggle("active",m==="login");$("registerTab").classList.toggle("active",m==="register");$("authSubmit").textContent=m==="login"?"Đăng nhập":"Tạo tài khoản";$("password").autocomplete=m==="login"?"current-password":"new-password";msg("authMessage","");}
$("authForm").onsubmit=async e=>{
 e.preventDefault();msg("authMessage","Đang xử lý…");
 try{const data=await api("/api/"+mode,{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})});token=data.token;localStorage.setItem("cp15_token",token);await loadDashboard();}
 catch(err){msg("authMessage",err.message);}
};
$("logout").onclick=()=>{token="";localStorage.removeItem("cp15_token");$("dashboard").hidden=true;$("auth").hidden=false;};
$("redeem").onclick=async()=>{
 msg("redeemMessage","Đang kiểm tra mã…");
 try{await api("/api/redeem",{method:"POST",body:JSON.stringify({code:$("redeemCode").value.trim()})});msg("redeemMessage","Kích hoạt thành công.");$("redeemCode").value="";await loadDashboard();}
 catch(err){msg("redeemMessage",err.message);}
};
async function loadDashboard(){
 const data=await api("/api/me");currentUser=data.user;
 $("auth").hidden=true;$("dashboard").hidden=false;$("userEmail").textContent=currentUser.email;
 $("plan").textContent=currentUser.paidUntil>Date.now()?"Đã kích hoạt":"Dùng thử";
 const seconds=Math.max(0,Math.floor(((currentUser.paidUntil>Date.now()?currentUser.paidUntil:currentUser.trialEndsAt)-Date.now())/1000));
 $("remaining").textContent=fmt(seconds);
 renderDevices(data.devices||[]);
}
function fmt(s){return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,"0")).join(":");}
function renderDevices(devices){
 $("devices").innerHTML="";
 for(let i=0;i<3;i++){
  const d=devices[i]||{id:i+1,status:"not_connected"};
  const el=document.createElement("article");el.className="device";
  const phone=document.createElement("div");phone.className="phone";el.append(phone);
  const title=document.createElement("h3");title.textContent="Android 15 · Máy "+(i+1);el.append(title);
  const state=document.createElement("p");state.className="state";state.textContent=d.status==="running"?"Đang chạy":d.status==="stopped"?"Đã tắt":"Máy chủ chưa kết nối";el.append(state);
  const btn=document.createElement("button");btn.textContent=d.status==="running"?"Tắt máy":"Bật máy";btn.disabled=true;btn.title="Cần tích hợp Android host trước khi điều khiển";el.append(btn);
  $("devices").append(el);
 }
}
(async()=>{
 if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
 if(token){try{await loadDashboard();}catch(e){token="";localStorage.removeItem("cp15_token");}}
 try{const h=await api("/api/health");$("systemStatus").textContent="Backend đang hoạt động · "+h.version;}
 catch(e){$("systemStatus").textContent="Chưa kết nối backend: "+e.message;}
})();
