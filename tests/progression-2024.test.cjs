const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('All twelve 2024 core classes have 20 levels and fixed HP',()=>{
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('src/progression-2024.js','utf8'),sandbox);
 const p=sandbox.window.ATLAS_PROGRESSION_2024;assert.equal(Object.keys(p).length,12);
 for(const [name,levels] of Object.entries(p)){assert.equal(levels.length,20,name);for(let i=0;i<20;i++){assert.equal(levels[i].level,i+1);assert.equal(levels[i].proficiencyBonus,Math.ceil((i+1)/4)+1);assert.ok(levels[i].fixedHpAfterFirst>=4);}}
 assert.ok(p.Fighter[2].features.includes('Fighter Subclass'));
 assert.ok(p.Sorcerer[2].features.includes('Sorcerer Subclass'));
});
