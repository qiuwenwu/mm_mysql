require('mm_expand');
const mysql = require('mysql');

/// 数据库封装
function Mysql() {
	// 数据库配置参数
	Mysql.prototype.config = {
		// 服务器地址
		host: "localhost",
		// 端口号
		port: 3306,
		// 连接用户名
		user: "root",
		// 连接密码
		password: "asd123",
		// 数据库
		database: "mm",
		// 是否支持多个sql语句同时操作
		multipleStatements: true,
		// 过滤查询参数字典
		filter: {
			// 页码
			page: "page",
			// 页显示条数
			size: "size",
			// 表名
			table: "table",
			// 方式
			way: "way"
		}
	};

	// 数据库连接池
	this.pool;

	// 错误
	this.error;

	// 表名
	Mysql.prototype.table = "demo";
	// 显示页
	Mysql.prototype.page = 0;
	// 显示条数
	Mysql.prototype.size = 30;
	// 请求方式 add、del、set、get等，跟函数名一致
	Mysql.prototype.way = "";

	/// 配置对象或配置路径
	/// cg: 传入的数据库参数 (object|string)
	Mysql.prototype.setConfig = function(cg) {
		var obj;
		if (typeof(cg) == "string") {
			obj = cg.loadJson();
		} else {
			obj = cg;
		}
		$.push(this.config, obj);
	};

	/// 打开数据库如果没有则建立数据库连接再打开
	Mysql.prototype.open = function() {
		if (!this.pool) {
			this.pool = mysql.createPool(this.config);
		}
	};

	/// 关闭连接
	Mysql.prototype.close = function() {
		if (this.pool) {
			this.pool = null;
		}
	};

	/// 过滤查询参数
	/// query: 查询参数 (object)
	/// all: 全部过滤 (bool)
	Mysql.prototype.filter = function(query, all) {
		var m = this.config.filter;
		for (var k in m) {
			var key = m[k];
			if (query[key]) {
				this[k] = query[key];
				delete query[key];
			}
		}
	};

	/// 重构sql执行, 以便同步
	/// sql: 查询参 (string)
	/// val: 替换值 (array)
	/// 返回: 异步构造器,当await时返回执行结果 (promise|array)
	Mysql.prototype.run = function(sql, val) {
		var _this = this;
		// 返回一个 Promise
		return new Promise((resolve, reject) => {
			_this.pool.getConnection(function(err, conn) {
				if (err) {
					_this.error = {
						code: 2003,
						message: $.info(err).between('Error: ', '\n')
					};
					resolve([]);
				} else {
					conn.query(sql, val, (err, rows) => {
						if (err) {
							_this.error = {
								code: err.errno,
								message: err.sqlMessage
							};
							resolve([]);
						} else {
							_this.error = undefined;
							resolve(rows)
						}
						// 结束会话
						conn.release();
					});
				}
			});
		});
	};

	/// 重构sql执行, 以便同步
	/// sql: 查询参 (string)
	/// val: 替换值 (array)
	/// 返回: 异步构造器,当await时返回执行结果 (promise|bool)
	Mysql.prototype.exec = function(sql, val) {
		var _this = this;
		// 返回一个 Promise
		return new Promise((resolve, reject) => {
			_this.pool.getConnection(function(err, conn) {
				if (err) {
					_this.error = {
						code: 41000,
						message: $.info(err).between('Error: ', '\n')
					};
					resolve(false);
				} else {
					conn.query(sql, val, (err, o) => {
						if (err) {
							_this.error = {
								code: err.errno,
								message: err.sqlMessage
							};
							resolve(false);
						} else {
							_this.error = undefined;
							if (o.constructor == Array) {
								if (o.length > 0) {
									resolve(o[0]['warningCount'] === 0);
								} else {
									resolve(true);
								}
							} else {
								resolve(o['warningCount'] === 0);
							}
						}
						// 结束会话
						conn.release();
					});
				}
			});
		});
	};

	/// 查询拼接
	/// where: 查询条件 (string)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: 执行结果或查询内容 (string)
	Mysql.prototype.toQuery = function(where, sort, view) {
		var sql = "SELECT {1} FROM `{0}`";
		if (!view) {
			view = "*";
		}
		if (where) {
			sql += " WHERE " + where;
		}
		if (sort) {
			sql += " ORDER BY " + sort;
		}
		sql = sql.replace("{0}", this.table).replace("{1}", view);
		if (this.size && this.page) {
			var start = this.size * (this.page - 1);
			sql += " limit " + start + ',' + this.size;
		}
		return sql;
	};

	/* ===  传字符串参数  === */
	/// 增加数据
	/// key: 用作增加的键 (string)
	/// val: 用作增加的值 (string)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.add = function(key, val) {
		var sql = "INSERT INTO `{0}` ({1}) VALUES ({2});";
		sql = sql.replace("{0}", this.table).replace("{1}", key).replace("{2}", val);
		return this.exec(sql);
	};

	/// 删除数据
	/// where: 删除条件 (string)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.del = function(where) {
		var sql = "DELETE FROM `{0}` WHERE {1};";
		sql = sql.replace("{0}", this.table).replace("{1}", where);
		return this.exec(sql);
	};

	/// 修改数据
	/// where: 查询条件 (string)
	/// set: 修改的键值 (string)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.set = function(where, set) {
		var sql = "UPDATE `{0}` SET {1} WHERE {2};";
		sql = sql.replace("{0}", this.table).replace("{1}", set).replace("{2}", where);
		return this.exec(sql);
	};

	/// 查询数据
	/// where: 查询条件 (string)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: 查询到的内容 (promise|array)
	Mysql.prototype.get = function(where, sort, view) {
		var sql = this.toQuery(where, sort, view);
		return this.run(sql);
	};

	/// 查询符合结果总数
	/// where: 查询条件 (string)
	/// 返回: 返回结果总数 (promise|number)
	Mysql.prototype.count = async function(where) {
		var sql = "SELECT count(*) count FROM `" + this.table + "`";
		if (where) {
			sql += ' WHERE ' + where;
		}
		var n = 0;
		var arr = await this.run(sql);
		if (arr.length) {
			n = arr[0].count;
		}
		return n;
	};

	/// 查询数据并返回符合条件总数
	/// where: 查询条件 (string)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: 查询到的内容列表和符合条件总数 (promise|object)
	Mysql.prototype.getCount = async function(where, sort, view) {
		var list = await this.get(where, sort, view);
		var count = 0;
		if (list.length > 0) {
			count = await this.count(where);
		}
		var ret = {
			list: list,
			count: count
		};
		return ret;
	};

	/* ===  sql语句拼接函数  === */
	/// 创建where语句
	/// obj: 用作拼接的对象 (object)
	/// 返回: where格式sql语句字符串 (string)
	Mysql.prototype.toWhere = function(obj) {
		var where = "";
		for (var k in obj) {
			where += " and `" + k + "`='" + obj[k] + "'";
		}
		return where.replace(" and ", "");
	};

	/// 创建set语句
	/// obj: 用作拼接的对象 (object)
	/// 返回: set格式sql语句字符串 (string)
	Mysql.prototype.toSet = function(obj) {
		var set = "";
		for (var k in obj) {
			set += ",`" + k + "`='" + obj[k] + "'";
		}
		return set.replace(",", "");
	};

	/// 创建添加sql语句
	/// item: 用作添加的键值 (object)
	/// 返回: sql语句字符串 (string)
	Mysql.prototype.addSql = function(item) {
		var key = "";
		var val = "";
		for (var k in item) {
			key += ",`" + k + "`";
			val += ",'" + item[k] + "'";
		}
		var sql = "INSERT INTO `{0}` ({1}) VALUES ({2});";
		return sql.replace("{0}", this.table).replace("{1}", key.replace(",", "")).replace("{2}", val.replace(",", ""));
	};

	/// 创建删除sql语句
	/// query: 查询键值 (object)
	/// 返回: sql语句字符串 (string)
	Mysql.prototype.delSql = function(query) {
		var where = this.toWhere(query);
		var sql = "DELETE FROM `{0}` WHERE {1};";
		return sql.replace("{0}", this.table).replace("{1}", where);
	};

	/// 创建修改sql语句
	/// query: 查询键值 (object)
	/// item: 修改键值 (object)
	/// 返回: sql语句字符串 (string)
	Mysql.prototype.setSql = function(query, item) {
		var where = this.toWhere(query);
		var set = this.toSet(item);
		var sql = "UPDATE `{0}` SET {1} WHERE {2};";
		return sql.replace("{0}", this.table).replace("{1}", set).replace("{2}", where);
	};

	/// 创建查询sql语句
	/// query: 查询键值 (object)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: sql语句字符串 (string)
	Mysql.prototype.getSql = function(query, sort, view) {
		var where = this.toWhere(query);
		var sql = this.toQuery(where, sort, view);
		return sql;
	};

	/* ===  传入对象操作  === */
	/// 增加数据
	/// item: 添加的对象 (object)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.addObj = function(item) {
		var sql = this.addSql(item);
		return this.exec(sql);
	};

	/// 删除数据
	/// query: 查询条件 (object)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.delObj = function(query) {
		var sql = this.delSql(query);
		return this.exec(sql);
	};

	/// 修改数据
	/// query: 查询条件 (object)
	/// item: 修改的键值 (object)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.setObj = function(query, item) {
		var sql = this.setSql(query, item);
		return this.exec(sql);
	};

	/// 查询数据
	/// query: 查询条件 (object)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: 查询到的内容 (promise|array)
	Mysql.prototype.getObj = function(query, sort, view) {
		var sql = this.getSql(query, sort, view);
		return this.run(sql);
	};

	/// 查询符合结果总数
	/// query: 查询条件 (string)
	/// 返回: 返回结果总数 (promise|number)
	Mysql.prototype.countObj = function(query) {
		return this.count(this.toWhere(query));
	};

	/// 查询数据并返回符合条件总数
	/// query: 查询条件 (object)
	/// sort: 排序 (string)
	/// view: 返回的字段 (string)
	/// 返回: 查询到的内容列表和符合条件总数 (promise|object)
	Mysql.prototype.getCountObj = async function(query, sort, view) {
		return this.getCount(this.toWhere(query));
	};

	/* ===  传入数组操作  === */
	/// 添加多条数据
	/// list: 对象数组 (array)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.addList = function(list) {
		var sql = "";
		for (var i = 0; i < list.length; i++) {
			sql += this.addSql(list[i]);
		}
		return this.exec(sql);
	};

	/// 删除多条数据
	/// list: 对象数组 (array)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.delList = function(list) {
		var sql = "";
		for (var i = 0; i < list.length; i++) {
			sql += this.delSql(list[i].query);
		}
		return this.exec(sql);
	};

	/// 修改多条数据
	/// list: 对象数组 (array)
	/// 返回: 执行结果 (promise|object)
	Mysql.prototype.setList = function(list) {
		var sql = "";
		for (var i = 0; i < list.length; i++) {
			sql += this.setSql(list[i].query, list[i].item);
		}
		return this.exec(sql);
	};

	/// 获取所有表名
	/// table: 表名关键词 (string)
	/// 返回: 表名数组 (promise|array)
	Mysql.prototype.tables = async function(table) {
		var list = await this.run("show tables");
		var key = 'Tables_in_' + this.config.database;
		if (table) {
			list = list.search(table, key);
		}
		return list.getArr(key);
	};

	/// 获取所有表字段
	/// table: 表名 (string)
	/// 返回: 字段信息列表 (promise|array)
	Mysql.prototype.fields = async function(table) {
		if (!table) {
			table = this.table;
		}
		var field =
			'COLUMN_NAME as `name`,ORDINAL_POSITION as `cid`,COLUMN_DEFAULT as `dflt_value`,IS_NULLABLE as `notnull`,COLUMN_TYPE as `type`,COLUMN_KEY as `pk`,COLUMN_COMMENT as `note`';
		var sql = "select " + field + " from information_schema.COLUMNS where `table_name` = '" + table +
			"' and `table_schema` = '" + this.config.database + "';";
		var list = await this.run(sql);
		for (var i = 0; i < list.length; i++) {
			list[i].pk = list[i].pk ? true : false;
			list[i].notnull = list[i].notnull == 'NO' ? true : false;
		}
		return list;
	};

	/// 设置类型
	/// type: 类型名 (string) 常用类型 mediumint, int, varchar
	/// auto: 是否自增字段 (默认为自增字段)
	/// 返回: 类型
	Mysql.prototype.setType = function(type, auto) {
		if (!type) {
			type = 'int';
		}
		switch (type) {
			case "str":
			case "varchar":
			case "string":
				type = "varchar(255) NOT NULL";
				break;
			case "number":
				type = "int(11) UNSIGNED NOT NULL";
				if (auto || auto === undefined) {
					type += "AUTO_INCREMENT";
				}
				break;
			case "bool":
			case "tinyint":
				type = "tinyint(1) UNSIGNED NOT NULL";
				break;
			default:
				if (type.indexOf('int') == -1) {
					type += " NOT NULL";
				} else {
					type += " UNSIGNED NOT NULL";
					if (auto || auto === undefined) {
						type += " AUTO_INCREMENT";
					}
				}
				break;
		}
		return type;
	}

	/// 创建数据表
	/// table: 表名 (string)
	/// field: 主键字段名 (string)
	/// type: 类型名 (string) 常用类型 mediumint, int, varchar
	/// auto: 是否自增字段, 默认为自增字段 (bool)
	/// 返回: 执行结果 (promise|bool)
	Mysql.prototype.addTable = async function(table, field, type, auto) {
		if (!field) {
			field = "id";
		}
		var sql = "CREATE TABLE IF NOT EXISTS `{0}` (`{1}` {2}, PRIMARY KEY (`{3}`));".replace('{0}', table).replace('{1}',
			field).replace('{2}', this.setType(type, auto)).replace('{3}', field);
		return await this.exec(sql);
	};

	/// 添加字段
	/// field: 字段名 (string)
	/// type: 类型名 (string) 常用类型 mediumint, int, float, double, varchar, tinyint, text, date, datetime, time
	/// value: 默认值 (string|number)
	/// isKey: 是否主键
	/// 返回: 添加成功返回true, 失败返回false (promise|bool)
	Mysql.prototype.field_add = async function(field, type, value, isKey) {
		var sql =
			"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
		sql = sql.replace('{0}', this.config.database).replace('{1}', this.table).replace('{2}', field);
		var arr = await this.run(sql);
		if (arr && arr.length > 0) {
			if (arr[0].count == 0) {
				var type = this.setType(type, false);
				if (value !== undefined) {
					if (typeof(value) == 'string') {
						type += " DEFAULT '" + value + "'";
					} else {
						type += " DEFAULT " + value;
					}
				} else if (type.has('varchar') || type.has('text')) {
					type = type.replace('NOT NULL', '');
				} else if (type.has('dateTime')) {
					type += " DEFAULT '1970-01-01 00:00:00'";
				} else if (type.has('date')) {
					type += " DEFAULT '1970-01-01'";
				} else if (type.has('time')) {
					type += " DEFAULT '00:00:00'";
				} else {
					type += " DEFAULT 0";
				}
				var sql = "ALTER Table `{0}` ADD `{1}` {2}".replace('{0}', this.table).replace('{1}', field).replace('{2}', type);
				if (isKey) {
					sql += ", ADD PRIMARY KEY (`{0}`)".replace('{0}', field);
				}
				return await this.exec(sql);
			}
		}
		return false;
	};

	Mysql.prototype.field_del = async function(field) {
		var sql =
			"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
		sql = sql.replace('{0}', this.config.database).replace('{1}', this.table).replace('{2}', field);
		var arr = await this.run(sql);
		if (arr && arr.length > 0) {
			if (arr[0].count > 0) {
				sql = "ALTER Table `{0}` DROP `{1}`;".replace('{0}', this.table).replace('{1}', field);
				return await this.exec(sql);
			}
		}
		return false;
	};
}

exports.Mysql = Mysql;
