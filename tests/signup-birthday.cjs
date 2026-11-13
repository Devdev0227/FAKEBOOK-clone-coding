const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const ids=['signupForm','signupName','signupPhone','signupId','signupPassword','signupPasswordConfirm','signupBirthday'];
const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',events:{},addEventListener(k,f){this.events[k]=f}}]));
const store=new Map(),alerts=[];
const context={document:{querySelector:s=>nodes[s.slice(1)]||null},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},sessionStorage:{},location:{},alert:t=>alerts.push(t)};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/auth.js'),'utf8'),context);
Object.assign(nodes.signupName,{value:'김학생'});nodes.signupPhone.value='01012345678';nodes.signupId.value='alice';nodes.signupPassword.value=nodes.signupPasswordConfirm.value='Pass!1234';
const submit=()=>nodes.signupForm.events.submit({preventDefault(){}});
for(const birth of ['', '2005-02-29','2006-13-01','1899-12-31','2999-01-01']){nodes.signupBirthday.value=birth;submit();assert(!store.has('fakebookUsers'),birth);}
nodes.signupBirthday.value='2004-02-29';submit();let user=JSON.parse(store.get('fakebookUsers'))[0];assert.equal(user.birthday,'2004-02-29');assert.equal(user.birthdayPublic,false);assert.equal(user.name,'김학생');assert.equal(context.location.href,'index.html');assert(nodes.signupBirthday.max);
console.log('PASS: signup rejects missing/invalid/future birthdays; accepts leap day, saves birthday with private default; date max set');
