const Mysql = require('./index.js').Mysql;

// 测试Mysql
async function test(){
	var ml = new Mysql();
	ml.open();
	ml.table = "test";
	var addArr = [];
	for(var i=1 ;i <= 9;i++){
		var add = {name:"test" + i, username:"t" + i, password:"a" + i};
		addArr.push(add);
	}
	var ret = await ml.addList(addArr);
	console.log("添加：" + $.toJson(ret), ml.error);
	var setArr = [];
	for(var i=1 ; i <= addArr.length; i++){
		setArr.push({query:{name:"test"+i},item:{username:"username"+i,password:"password"+i}});
	}
	ret = await ml.setList(setArr);
	console.log("修改：" + $.toJson(ret), ml.error);
	
	var delArr = [];
	for(var i=1; i <= addArr.length; i++){
		if(i % 2 == 0){
			delArr.push({query:{username:"username"+i}});
		}
	}
	// ret = await ml.delList(delArr);
	ret = await ml.delObj({username:"username"});
	console.log("删除：" + $.toJson(ret), ml.error);
}

async function testTable() {
	var ml = new Mysql();
	ml.open();
	var bl;
	ml.table = 'test8';
	bl = await ml.field_del('set6');
	bl = await ml.field_add('set6', 'str');
	//bl = await ml.field_add("age6", 'mediumint', 0, true);
	console.log("结果：" + bl);
	var arr = await ml.tables('t2*');
	console.log("表名" + $.toJson(arr));
	var list = await ml.fields('test');
	console.log("字段信息" + $.toJson(list));
}

testTable();

test();