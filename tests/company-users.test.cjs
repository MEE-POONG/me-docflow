const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),bcrypt=require('bcryptjs');
function load(file,prisma,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports,Response,require:id=>imports[id] || (id==='@/lib/prisma'?{prisma}:require(id))});return exports;}

test('administrator saves a real hashed company member which can then log in',async()=>{
 const owner={id:'a'.repeat(24),companyId:'b'.repeat(24),name:'Owner',email:'owner@example.com',role:'OWNER',status:'ACTIVE',passwordHash:bcrypt.hashSync('owner-pass',4)};
 const users=[owner];
 const prisma={companyUser:{
  findFirst:async({where})=>users.find(u=>(!where.id||u.id===where.id)&&u.companyId===where.companyId&&(!where.email||u.email===where.email.equals.toLowerCase()))||null,
  findMany:async({where})=>users.filter(u=>u.status===where.status&&where.OR.some(c=>c.email?.equals===u.email||c.phone&&c.phone===u.phone)).map(u=>({...u,company:{name:'Test Company'}})),
  create:async({data})=>{const u={id:'c'.repeat(24),...data};users.push(u);return u;},
 }};
 const actions=load('app/(dashboard)/settings/users/actions.ts',prisma);
 const actor={companyId:owner.companyId,userEmail:owner.email};
 const input={fullName:'New Member',email:'member@example.com',password:'member-pass',role:'employee',status:'active',adminPassword:'wrong'};
 assert.equal((await actions.saveCompanyUser(actor,input)).success,false);assert.equal(users.length,1);
 const saved=await actions.saveCompanyUser(actor,{...input,adminPassword:'owner-pass'});
 assert.equal(saved.success,true);assert.equal(users[1].companyId,owner.companyId);
 assert.notEqual(users[1].passwordHash,input.password);assert.ok(await bcrypt.compare(input.password,users[1].passwordHash));
 assert.equal(saved.user.passwordHash,undefined);assert.equal(saved.user.password,undefined);
 const {POST}=load('app/api/auth/login/route.ts',prisma);
 const response=await POST({json:async()=>({identifier:' MEMBER@EXAMPLE.COM ',password:'member-pass'})});
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.user.id,users[1].id);assert.equal(body.user.companyId,owner.companyId);assert.equal(body.user.passwordHash,undefined);
 users[1].status='SUSPENDED';assert.equal((await POST({json:async()=>({identifier:'member@example.com',password:'member-pass'})})).status,401);
});

test('browser-only account cannot authenticate when absent from the database',async()=>{
 const {POST}=load('app/api/auth/login/route.ts',{companyUser:{findMany:async()=>[]}});
 assert.equal((await POST({json:async()=>({identifier:'local@example.com',password:'local-pass'})})).status,401);
});


test('database password reset requires valid email OTP before updating hashes', async () => {
  let updates=0;
  class OtpError extends Error { constructor(message){super(message);this.status=400;} }
  const prisma={companyUser:{findFirst:async()=>({email:'user@example.com'}),updateMany:async({data})=>{assert.ok(await bcrypt.compare('new-pass',data.passwordHash));updates++;}}};
  const route=load('app/api/auth/reset-password/route.ts',prisma,{'@/lib/otp':{OtpError,verifyOtp:(email,otp)=>{if(otp!=='123456')throw new OtpError('invalid');},issueOtp:async()=>{}},'@/lib/mail':{sendOtpEmail:async()=>{}}});
  assert.equal((await route.POST({json:async()=>({identifier:'user@example.com',password:'new-pass',otp:'wrong'})})).status,400);assert.equal(updates,0);
  assert.equal((await route.POST({json:async()=>({identifier:'user@example.com',password:'new-pass',otp:'123456'})})).status,200);assert.equal(updates,1);
});
