const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = process.argv[2] || path.join(root, 'config.local.json');
if (!fs.existsSync(configPath)) throw new Error(`Missing config: ${configPath}`);

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const company = config.companyName || 'KOL招募';
const sheetId = config.googleSheetId;
const ownerEmail = config.ownerEmail || config.smtp?.toEmail || config.smtp?.user;
if (!sheetId || !ownerEmail) throw new Error('googleSheetId and ownerEmail are required.');

const googleCredential = { id: 'kol-google-service-account', name: 'KOL Google Service Account' };
const smtpCredential = { id: 'kol-smtp', name: 'KOL SMTP' };
const documentId = { __rl: true, value: sheetId, mode: 'id' };
const sheetName = (value) => ({ __rl: true, value, mode: 'name' });

function googleNode(id, name, position, operation, tab, extra = {}) {
  return {
    parameters: {
      operation,
      documentId,
      sheetName: sheetName(tab),
      ...extra,
    },
    id,
    name,
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4.6,
    position,
    credentials: { googleApi: googleCredential },
  };
}

const scoringCode = `
const rows = $input.all().map(i => i.json);
const staticData = $getWorkflowStaticData('global');
staticData.done = staticData.done || {};
const pick = (r, keys) => { for (const k of keys) { const v=r[k]; if(v!==undefined&&v!==null&&String(v).trim()!=='') return String(v).trim(); } return ''; };
const num = v => Number(String(v??'').replace(/[,，\\s]/g,'')) || 0;
const has = (v, words) => words.some(w => String(v||'').includes(w));
const pad = n => String(n).padStart(2,'0');
const now = new Date();
const day = d => \\`${'${'}d.getFullYear()}-${'${'}pad(d.getMonth()+1)}-${'${'}pad(d.getDate())}\\`;
const ymd = \\`${'${'}now.getFullYear()}${'${'}pad(now.getMonth()+1)}${'${'}pad(now.getDate())}\\`;
const out=[];
for(let i=0;i<rows.length;i++){
  const r=rows[i];
  const name=pick(r,['姓名','Name']);
  const url=pick(r,['社交平台链接','平台链接','账号链接']);
  const submitted=pick(r,['提交时间','Timestamp','时间戳'])||day(now);
  const key=[submitted,name,url,i].join('|');
  if(!name||!url||pick(r,['n8n处理状态','自动化处理状态','处理状态'])==='已处理'||staticData.done[key]) continue;
  const followers=num(pick(r,['粉丝数','Followers']));
  const views=num(pick(r,['平均播放量','近10条平均播放量','Avg Views']));
  const interactions=num(pick(r,['平均互动量','近10条平均互动量','Avg Engagements']));
  const type=pick(r,['内容类型','Content Type']);
  const identity=pick(r,['年级/身份','身份','年级']);
  const audience=pick(r,['受众画像','Audience']);
  const intention=pick(r,['合作意向','Collaboration Intention']);
  const experience=pick(r,['过往合作经验','合作经验']);
  const caseStudy=pick(r,['代表合作案例','案例']);
  const consent=pick(r,['是否同意后续联系','是否同意联系'])||'是';
  const price=num(pick(r,['报价','Price']));
  const rate=views?interactions/views:0;
  let fan=followers>=50000&&views>=10000?20:followers>=10000&&views>=3000?16:followers>=5000&&views>=1000?12:followers>=1000&&views>=300?8:4;
  let match=has(type,['AI视频','AI工具','视频剪辑','互动视频'])?25:has(type,['影视娱乐','短剧','科技数码','内容平台'])?20:has(type,['校园','留学','社群'])?16:has(type,['生活','美妆','穿搭','探店'])?10:5;
  let engage=rate>=.08?20:rate>=.05?16:rate>=.03?12:rate>=.01?8:4;
  let campus=has(identity+intention,['社群负责人','校园大使','学生组织'])?15:has(identity,['本科','研究生','留学生'])&&has(intention,['校园推广','社群分发'])?12:has(identity,['本科','研究生','留学生'])?9:has(audience,['大学生','校园','留学生'])?6:3;
  const cpv=views?price/views:999;
  let priceScore=cpv<=.05?10:cpv<=.1?8:cpv<=.2?6:cpv<=.5?4:2;
  let history=experience.includes('10次以上')&&caseStudy?10:experience.includes('4-10次')&&caseStudy?8:experience.includes('1-3次')?6:has(intention,['长期合作','拉新注册','任务挑战','校园推广'])?4:2;
  const total=fan+match+engage+campus+priceScore+history;
  const tier=total>=80?'A类':total>=60?'B类':'C类';
  const priority=tier==='A类'?'高':tier==='B类'?'中':'低';
  const status=tier==='C类'?'观察池':'待联系';
  const valid=['A类','B类'].includes(tier)&&consent!=='否'?'有效':'待观察';
  const next=new Date(now); if(tier==='B类') next.setDate(next.getDate()+1); if(tier==='C类') next.setDate(next.getDate()+7);
  const school=pick(r,['学校','School']);
  const region=pick(r,['地区','Region']);
  const recommended=tier==='A类'?'重点定制合作：内容共创、校园节点、长期大使、注册转化任务':tier==='B类'?'标准任务合作：产品体验、内容发布、社群分发、CPA测试':'观察池：低成本试用、后续活动邀请、暂缓高预算投入';
  const message=tier==='A类'?\\`你好 ${'${'}name}，我是${'${'}company}合作负责人。我们正在招募AI视频与互动视频方向创作者，你的${'${'}type}内容和目标受众很匹配，希望沟通定制内容共创或校园推广合作。\\`:tier==='B类'?\\`你好 ${'${'}name}，我是${'${'}company}合作负责人。我们正在招募校园及内容创作者，想邀请你参与产品体验、内容发布或社群推广合作。\\`:\\`你好 ${'${'}name}，感谢关注${'${'}company}。我们会将你纳入创作者观察池，后续有匹配活动会优先联系。\\`;
  const kolId=\\`KOL-${'${'}ymd}-${'${'}String(i+2).padStart(3,'0')}\\`;
  staticData.done[key]=true;
  out.push({json:{...r,'KOL ID':kolId,'提交时间':submitted,'姓名':name,'联系邮箱':pick(r,['联系邮箱','邮箱','Email']),'联系方式':pick(r,['联系方式','微信号/其他联系方式','微信']),'学校':school,'年级/身份':identity,'地区':region,'主要社交平台':pick(r,['主要社交平台','社交平台','平台']),'社交平台链接':url,'粉丝数':followers,'平均播放量':views,'平均互动量':interactions,'互动率':rate,'内容类型':type,'受众画像':audience,'合作意向':intention,'报价':price,'可接受合作方式':pick(r,['可接受合作方式','合作方式']),'过往合作经验':experience,'代表合作案例':caseStudy,'是否同意后续联系':consent,'粉丝质量分':fan,'内容匹配度分':match,'互动率分':engage,'校园影响力分':campus,'报价合理性分':priceScore,'过往合作表现分':history,'总分':total,'KOL分层':tier,'推荐合作方式':recommended,'自动联系话术':message,'当前跟进状态':status,'优先级':priority,'负责人':'${ownerEmail}','下一次跟进日期':day(next),'是否有效KOL':valid,'n8n处理状态':'已处理','跟进ID':\\`FU-${'${'}ymd}-${'${'}String(i+2).padStart(3,'0')}\\`,'跟进方式':'自动生成','跟进内容':message,'下一步动作':recommended,'是否需要提醒':tier==='C类'?'否':'是','邮件主题':\\`【${company} KOL招募】${'${'}name} / ${'${'}tier} / ${'${'}total}分\\`,'邮件正文':\\`${'${'}name} 已完成自动评分：${'${'}total}分，${'${'}tier}。\\n主页：${'${'}url}\\n推荐：${'${'}recommended}\\n话术：${'${'}message}\\`}});
}
return out;`;

const main = {
  name: `${company} KOL - Form Intake Automation`, active: false,
  nodes: [
    { parameters:{rule:{interval:[{field:'minutes',minutesInterval:5}]}}, id:'schedule5', name:'Schedule - Every 5 Minutes', type:'n8n-nodes-base.scheduleTrigger', typeVersion:1.2, position:[180,300] },
    googleNode('readForm','Google Sheets - Read Form Responses',[430,300],'read','Form Responses',{options:{}}),
    { parameters:{jsCode:scoringCode}, id:'score', name:'Code - Score and Prepare', type:'n8n-nodes-base.code', typeVersion:2, position:[700,300] },
    googleNode('appendDb','Google Sheets - Append KOL Database',[980,120],'append','KOL Database',{columns:{mappingMode:'autoMapInputData',value:null},options:{handlingExtraData:'ignoreIt'}}),
    googleNode('appendFu','Google Sheets - Append Follow-up Tracker',[980,280],'append','Follow-up Tracker',{columns:{mappingMode:'autoMapInputData',value:null},options:{handlingExtraData:'ignoreIt'}}),
    googleNode('updateForm','Google Sheets - Mark Form Row Processed',[980,440],'update','Form Responses',{columns:{mappingMode:'autoMapInputData',matchingColumns:['提交时间'],value:null},options:{handlingExtraData:'ignoreIt'}}),
    { parameters:{fromEmail:ownerEmail,toEmail:ownerEmail,subject:'={{$json["邮件主题"]}}',text:'={{$json["邮件正文"]}}'}, id:'notify', name:'Email - Notify Owner', type:'n8n-nodes-base.emailSend', typeVersion:2, position:[980,600], continueOnFail:true, credentials:{smtp:smtpCredential} },
  ],
  connections:{
    'Schedule - Every 5 Minutes':{main:[[{node:'Google Sheets - Read Form Responses',type:'main',index:0}]]},
    'Google Sheets - Read Form Responses':{main:[[{node:'Code - Score and Prepare',type:'main',index:0}]]},
    'Code - Score and Prepare':{main:[[{node:'Google Sheets - Append KOL Database',type:'main',index:0},{node:'Google Sheets - Append Follow-up Tracker',type:'main',index:0},{node:'Google Sheets - Mark Form Row Processed',type:'main',index:0},{node:'Email - Notify Owner',type:'main',index:0}]]},
  }, settings:{executionOrder:'v1'}
};

const dailyCode = `
const today=new Date(); today.setHours(0,0,0,0);
const active=new Set(['待联系','已联系','已回复','已报价','复联中']);
const due=$input.all().map(i=>i.json).filter(r=>{const s=String(r['当前跟进状态']||'').trim();if(!active.has(s)||!r['下一次跟进日期'])return false;const d=new Date(r['下一次跟进日期']);d.setHours(0,0,0,0);return d<=today;});
const lines=due.map((r,i)=>\\`${'${'}i+1}. ${'${'}r['姓名']}｜${'${'}r['KOL分层']}｜${'${'}r['总分']}分｜${'${'}r['主要社交平台']}｜${'${'}r['社交平台链接']}\\`);
return [{json:{subject:\\`【${company} KOL跟进提醒】今日待跟进 ${'${'}due.length} 人\\`,body:due.length?\\`今日待跟进KOL共 ${'${'}due.length} 人：\\n\\n${'${'}lines.join('\\n')}\\`:'今日没有到期待跟进的KOL。'}}];`;

const daily = {
  name:`${company} KOL - Daily Follow-up Reminder`, active:false,
  nodes:[
    {parameters:{rule:{interval:[{field:'cronExpression',expression:'0 10 * * *'}]}},id:'daily10',name:'Schedule - Daily 10',type:'n8n-nodes-base.scheduleTrigger',typeVersion:1.2,position:[180,280]},
    googleNode('readDaily','Google Sheets - Read KOL Database',[450,280],'read','KOL Database',{options:{}}),
    {parameters:{jsCode:dailyCode},id:'dailyCode',name:'Code - Build Daily Reminder',type:'n8n-nodes-base.code',typeVersion:2,position:[720,280]},
    {parameters:{fromEmail:ownerEmail,toEmail:ownerEmail,subject:'={{$json.subject}}',text:'={{$json.body}}'},id:'dailyMail',name:'Email - Daily Reminder',type:'n8n-nodes-base.emailSend',typeVersion:2,position:[990,280],continueOnFail:true,credentials:{smtp:smtpCredential}},
  ],
  connections:{'Schedule - Daily 10':{main:[[{node:'Google Sheets - Read KOL Database',type:'main',index:0}]]},'Google Sheets - Read KOL Database':{main:[[{node:'Code - Build Daily Reminder',type:'main',index:0}]]},'Code - Build Daily Reminder':{main:[[{node:'Email - Daily Reminder',type:'main',index:0}]]}},settings:{executionOrder:'v1'}
};

const weeklyCode = `
const rows=$input.all().map(i=>i.json);const total=rows.length;const valid=rows.filter(r=>r['是否有效KOL']==='有效').length;const a=rows.filter(r=>r['KOL分层']==='A类').length;const b=rows.filter(r=>r['KOL分层']==='B类').length;const c=rows.filter(r=>r['KOL分层']==='C类').length;const converted=rows.filter(r=>['已合作','已签约','合作中'].includes(String(r['当前跟进状态']||''))).length;const regs=rows.reduce((s,r)=>s+(Number(r['注册数'])||0),0);const tasks=rows.reduce((s,r)=>s+(Number(r['任务完成数'])||0),0);return [{json:{subject:'【${company} KOL周报】自动化数据看板摘要',body:\\`KOL招募周报\\n提交/入库：${'${'}total}\\n有效KOL：${'${'}valid}\\nA类：${'${'}a}\\nB类：${'${'}b}\\nC类：${'${'}c}\\n已合作/签约/合作中：${'${'}converted}\\n注册数：${'${'}regs}\\n任务完成数：${'${'}tasks}\\`}}];`;

const weekly = {
  name:`${company} KOL - Weekly Dashboard Report`, active:false,
  nodes:[
    {parameters:{rule:{interval:[{field:'cronExpression',expression:'0 18 * * 5'}]}},id:'fri18',name:'Schedule - Friday 18',type:'n8n-nodes-base.scheduleTrigger',typeVersion:1.2,position:[180,280]},
    googleNode('readWeekly','Google Sheets - Read KOL Database',[450,280],'read','KOL Database',{options:{}}),
    {parameters:{jsCode:weeklyCode},id:'weeklyCode',name:'Code - Build Weekly Report',type:'n8n-nodes-base.code',typeVersion:2,position:[720,280]},
    {parameters:{fromEmail:ownerEmail,toEmail:ownerEmail,subject:'={{$json.subject}}',text:'={{$json.body}}'},id:'weeklyMail',name:'Email - Weekly Report',type:'n8n-nodes-base.emailSend',typeVersion:2,position:[990,280],continueOnFail:true,credentials:{smtp:smtpCredential}},
  ],
  connections:{'Schedule - Friday 18':{main:[[{node:'Google Sheets - Read KOL Database',type:'main',index:0}]]},'Google Sheets - Read KOL Database':{main:[[{node:'Code - Build Weekly Report',type:'main',index:0}]]},'Code - Build Weekly Report':{main:[[{node:'Email - Weekly Report',type:'main',index:0}]]}},settings:{executionOrder:'v1'}
};

const outDir = path.join(root, 'workflows', 'generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, '01_form_intake_automation.json'), JSON.stringify(main, null, 2));
fs.writeFileSync(path.join(outDir, '02_daily_followup_reminder.json'), JSON.stringify(daily, null, 2));
fs.writeFileSync(path.join(outDir, '03_weekly_dashboard_report.json'), JSON.stringify(weekly, null, 2));
fs.writeFileSync(path.join(outDir, 'all_workflows.json'), JSON.stringify([main, daily, weekly], null, 2));
console.log(outDir);
