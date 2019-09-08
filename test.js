const Mysql = require('./index.js').Mysql;

// 测试Mysql
async function test() {
	var sql = new Mysql();
	sql.open();
	db = sql.db();
	db.table = "test";
	var addArr = [];
	for (var i = 1; i <= 9; i++) {
		var add = {
			name: "test" + i,
			username: "t" + i,
			password: "a" + i
		};
		addArr.push(add);
	}
	var ret = await db.addList(addArr);
	console.log("添加：" + $.toJson(ret), db.error);
	var setArr = [];
	for (var i = 1; i <= addArr.length; i++) {
		setArr.push({
			query: {
				name: "test" + i
			},
			item: {
				username: "username" + i,
				password: "password" + i
			}
		});
	}
	ret = await db.setList(setArr);
	console.log("修改：" + $.toJson(ret), db.error);

	var delArr = [];
	for (var i = 1; i <= addArr.length; i++) {
		if (i % 2 == 0) {
			delArr.push({
				query: {
					username: "username" + i
				}
			});
		}
	}
	// ret = await db.delList(delArr);
	ret = await db.delObj({
		username: "username"
	});
	console.log("删除：" + $.toJson(ret), db.error);
}

test();

async function testTable() {
	var sql = new Mysql();
	sql.open();
	db = sql.db();
	var bl;
	db.table = 'test8';
	bl = await db.field_del('set6');
	bl = await db.field_add('set6', 'str');
	//bl = await db.field_add("age6", 'mediumint', 0, true);
	console.log("结果：" + bl);
	var arr = await db.tables('t2*');
	console.log("表名" + $.toJson(arr));
	var list = await db.fields('test');
	console.log("字段信息" + $.toJson(list));
}

testTable();
