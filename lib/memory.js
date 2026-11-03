const { DatabaseSync } = require('node:sqlite');
const {randomUUID} = require('node:crypto');
const stop=new Set('the and that this with have what when where which how you your my our was were are did does just please about from tell remember again said want can could would should me for'.split(' '));
function terms(text){return new Set((text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).map(w=>({colour:'color',colours:'color',favourite:'favorite'})[w]||w).filter(w=>!stop.has(w)));}
function createMemory(file) {
 const db=new DatabaseSync(file);
 db.exec(`CREATE TABLE IF NOT EXISTS memories(id TEXT PRIMARY KEY, text TEXT NOT NULL, created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY, role TEXT NOT NULL, content TEXT NOT NULL);`);
 return {
  list:()=>db.prepare('SELECT * FROM memories ORDER BY created DESC LIMIT 100').all(),
  add(text){text=String(text||'').trim();if(!text||text.length>300)throw Error('Memory must contain 1–300 characters.');const existing=db.prepare('SELECT * FROM memories WHERE lower(text)=lower(?)').get(text);if(existing)return existing;if(db.prepare('SELECT count(*) AS n FROM memories').get().n>=100)throw Error('Memory is full. Remove an item first.');const item={id:randomUUID(),text,created:new Date().toISOString()};db.prepare('INSERT INTO memories VALUES(?,?,?)').run(item.id,item.text,item.created);return item;},
  remove:id=>db.prepare('DELETE FROM memories WHERE id=?').run(id),
  clearHistory:()=>db.exec('DELETE FROM history'),
  history:()=>db.prepare('SELECT role,content FROM (SELECT * FROM history ORDER BY id DESC LIMIT 24) ORDER BY id').all(),
  turn(user,assistant){db.exec('BEGIN');try{const insert=db.prepare('INSERT INTO history(role,content) VALUES(?,?)');insert.run('user',user.slice(0,2000));insert.run('assistant',assistant.slice(0,2000));db.exec('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 200)');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}},
  context(message){
   const rows=db.prepare('SELECT id,role,content FROM history ORDER BY id').all();let recent=[],remaining=3000;
   for(let i=rows.length-2;i>=0&&recent.length<12;i-=2){const pair=rows.slice(i,i+2).map(r=>({...r,content:r.content.slice(0,r.role==='user'?1000:600)}));const size=pair.reduce((n,r)=>n+r.content.length,0);if(size>remaining)break;recent.unshift(...pair);remaining-=size;}
   const cutoff=recent[0]?.id??Infinity,query=terms(message),older=rows.filter(r=>r.id<cutoff&&r.role==='user');
   const ranked=older.map(r=>({row:r,score:[...query].filter(w=>terms(r.content).has(w)).reduce((n,w)=>n+Math.min(4,w.length/3),0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||b.row.id-a.row.id).slice(0,2);
   const recalled=ranked.sort((a,b)=>a.row.id-b.row.id).map(({row})=>({user:row.content.slice(0,500),assistant:rows.find(r=>r.id===row.id+1&&r.role==='assistant')?.content.slice(0,250)||''}));
   return {recent:recent.map(({role,content})=>({role,content})),recalled};
  },
  relevant(message){const words=message.toLowerCase().match(/[a-z]{3,}/g)||[];return this.list().map((m,i)=>({...m,score:words.filter(w=>m.text.toLowerCase().includes(w)).length+(i<2?.1:0)})).sort((a,b)=>b.score-a.score).slice(0,5).map(m=>m.text);},
  close:()=>db.close()
 };
}
module.exports={createMemory};
