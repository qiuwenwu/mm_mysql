const Sql = require('./sql');

/**
 * @class 数据库操作类
 * @extends Sql
 */
class DB extends Sql {
	/**
	 * @description 数据库管理器
	 * @param {String} database 数据库名称
	 * @param {Object} run 查询函数
	 * @param {Object} exec 更改函数
	 */
	constructor(database, run, exec) {
		super(run, exec);

		// 数据库名
		this.database = database;
	}
}

/**
 * @description 获取所有表名
 * @param {String} table 表名关键词, 可以 *table*包含、*table后缀、table*前缀 查询
 * @return {Promise|Array} 表名数组
 */
DB.prototype.tables = async function(table) {
	var list = await this.run("show tables");
	var key = 'Tables_in_' + this.database;
	if (table) {
		list = list.search(table, key);
	}
	return list.getArr(key);
};

/**
 * @description 获取所有表字段
 * @param {String} table 表名
 * @return {Promise|Array} 字段信息列表
 */
DB.prototype.fields = async function(table, field_name) {
	if (!table) {
		table = this.table;
	}
	var field =
		'COLUMN_NAME as `name`,ORDINAL_POSITION as `cid`,COLUMN_DEFAULT as `dflt_value`,IS_NULLABLE as `notnull`,COLUMN_TYPE as `type`,COLUMN_KEY as `pk`,EXTRA as `auto`,COLUMN_COMMENT as `note`';
	var sql = "select " + field + " from information_schema.COLUMNS where `table_name` = '" + table +
		"' and `table_schema` = '" + this.database + "'";
	if (field_name) {
		sql += " AND COLUMN_NAME='" + field_name + "'";
	}
	var list = await this.run(sql);
	var len = list.length;
	for (var i = 0; i < len; i++) {
		list[i].pk = list[i].pk ? true : false;
		list[i].notnull = list[i].notnull == 'NO' ? true : false;
	}
	return list;
};

/**
 * @description 设置类型
 * @param {String} field 字段名
 * @param {String} type 类型名，常用类型 mediumint, int, varchar, datetime
 * @param {String} value 默认值
 * @param {Boolean} not_null 是否非空字段 true为非空，false为可空
 * @param {Boolean} auto 自动
 * @return {String} 返回最终类型
 */
DB.prototype.setType = function(field, type, value, not_null, auto) {
	if (!type) {
		type = 'int';
	}
	switch (type) {
		case "str":
		case "varchar":
		case "string":
			type = "varchar(255)";
			if (not_null) {
				type += " NOT NULL";
			}
			if (value) {
				type += " DEFAULT '" + value + "'";
			} else {
				type += " DEFAULT ''";
			}
			break;
		case "number":
			type = "int(11) NOT NULL";
			if (auto) {
				type += " AUTO_INCREMENT";
			} else if (value) {
				type += " DEFAULT " + value;
			} else {
				type += " DEFAULT 0";
			}
			break;
		case "bool":
		case "tinyint":
			type = "tinyint(1) UNSIGNED NOT NULL";
			if (value) {
				type += " DEFAULT " + value;
			} else {
				type += " DEFAULT 0";
			}
			break;
		case "datetime":
			if (!value) {
				value = "1970-01-01 00:00:00";
			}
			type += " DEFAULT '" + value + "'";
			break;
		case "timestamp":
			if (auto) {
				if (field.indexOf('update') !== -1 || field.indexOf('last') !== -1) {
					type += " DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
				} else {
					type += " DEFAULT CURRENT_TIMESTAMP";
				}
			} else {
				type += " DEFAULT CURRENT_TIMESTAMP";
			}
			break;
		case "date":
			if (!value) {
				value = "1970-01-01";
			}
			type += " NOT NULL DEFAULT '" + value + "'";
			break;
		case "time":
			if (!value) {
				value = "00:00:00";
			}
			type += " NOT NULL DEFAULT '" + value + "'";
			break;
		case "double":
			if (type == "double") {
				type = "double(10, 2)"
			}
			type += " NOT NULL";
			if (value) {
				type += " DEFAULT '" + value + "'";
			} else {
				type += " DEFAULT 0";
			}
			break;
		case "float":
			if (type == "float") {
				type = "float(17, 8)"
			}
			type += " NOT NULL";
			if (value) {
				type += " DEFAULT '" + value + "'";
			} else {
				type += " DEFAULT 0";
			}
			break;
		case "text":
			break;
		default:
			if (type.indexOf('var') !== -1) {
				if (not_null) {
					type += " NOT NULL"
				}
				if (value) {
					type += " DEFAULT '" + value + "'";
				} else {
					type += " DEFAULT ''";
				}
			} else {
				type += " UNSIGNED NOT NULL";
				if (auto) {
					type += " AUTO_INCREMENT";
				}
				else {
					if (value) {
						type += " DEFAULT '" + value + "'";
					} else {
						type += " DEFAULT 0";
					}
				}
			}
			break;
	}
	return type;
};

/**
 * @description 创建数据表
 * @param {String} table 表名
 * @param {String} field 主键字段名
 * @param {String} type  类型名，常用类型 mediumint, int, varchar
 * @param {Boolean} auto 是否自增字段, 默认为自增字段
 * @param {String} commit 注释
 * @return {Promise|Number} 创建成功返回1，失败返回0
 */
DB.prototype.addTable = async function(table, field, type, auto, commit = '') {
	if (!field) {
		field = "id";
	}
	var sql = "CREATE TABLE IF NOT EXISTS `{0}` (`{1}` {2})".replace('{0}', table).replace(
		'{1}', field).replace('{2}', this.setType(field, type, null, true, auto) + ' PRIMARY KEY');
	if(commit){
		sql += " COMMENT = '" + commit + "';"
	}
	else {
		sql += ";"
	}
	var bl = await this.exec(sql);
	return bl;
};

/**
 * @description 清空数据表
 * @param {Boolean} reset 是否重置自增ID
 * @return {Promise|Number} 清空成功返回1，失败返回0
 */
DB.prototype.clearTable = async function(reset = true, table = '') {
	var sql = reset ? "TRUNCATE table `{0}`;" : "DELETE FROM `{0}`";
	var bl = await this.exec(sql.replace('{0}', table || this.table));
	return bl;
};

/**
 * @description 添加字段
 * @param {String} field 字段名
 * @param {String} type 类型名，常用类型 mediumint, int, float, double, varchar, tinyint, text, date, datetime, time, timestamp
 * @param {String|Number} value 默认值
 * @param {Boolean} not_null 是否非空字段 true为非空，false为可空
 * @param {Boolean} auto 是否自动（如果为数字类型则自增增段，如果为时间类型则默认事件）
 * @param {Boolean} isKey 是否主键
 * @return {Promise|Number} 添加成功返回1，失败返回0
 */
DB.prototype.field_add = async function(field, type, value, not_null, auto, isKey) {
	var sql =
		"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
	sql = sql.replace('{0}', this.database).replace('{1}', this.table).replace('{2}', field);
	var arr = await this.run(sql);
	if (arr && arr.length > 0) {
		if (arr[0].count == 0) {
			var type = this.setType(field, type, value, not_null, auto);
			var sql = "ALTER Table `{0}` ADD `{1}` {2}";
			sql = sql.replace('{0}', this.table).replace('{1}', field).replace('{2}', type);
			if (isKey) {
				sql += " , ADD PRIMARY KEY (`" + field + "`)";
			}
			else {
				sql += ";";
			}
			return await this.exec(sql);
		}
	}
	return 0;
};

/**
 * @description 添加字段
 * @param {String} field 字段名
 * @param {String} type 类型名，常用类型 mediumint, int, float, double, varchar, tinyint, text, date, datetime, time, timestamp
 * @param {String|Number} value 默认值
 * @param {Boolean} not_null 是否非空字段 true为非空，false为可空
 * @param {Boolean} auto 是否自动（如果为数字类型则自增增段，如果为时间类型则默认事件）
 * @param {Boolean} isKey 是否主键
 * @param {String} new_name 新名称
 * @return {Promise|Number} 添加成功返回1，失败返回0
 */
DB.prototype.field_set = async function(field, type, value, not_null, auto, isKey, new_name) {
	var sql =
		"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
	sql = sql.replace('{0}', this.database).replace('{1}', this.table).replace('{2}', field);
	var arr = await this.run(sql);
	if (arr && arr.length > 0) {
		if (arr[0].count == 0) {
			return 0;
		}
	}

	var type = this.setType(field, type, value, not_null, auto);
	if (type.has('text')) {
		type = type.replace('NOT NULL', '');
	}

	if (!new_name) {
		new_name = field;
	}

	sql = "ALTER TABLE `{0}` CHANGE COLUMN `{1}` `{2}` {3}";
	sql = sql.replace('{0}', this.table).replace('{1}', field).replace('{2}', new_name).replaceAll('{3}', type);
	if(isKey){
		sql += ", DROP PRIMARY KEY, ADD PRIMARY KEY (" + new_name + ") USING BTREE;"
	}
	else {
		sql += ";";
	}
	return await this.exec(sql);
};

/**
 * @description 删除字段
 * @param {String} field 字段名
 * @return {Promise|Number} 删除成功返回1，失败返回0
 */
DB.prototype.field_del = async function(field) {
	var sql =
		"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
	sql = sql.replace('{0}', this.database).replace('{1}', this.table).replace('{2}', field);
	var arr = await this.run(sql);
	if (arr && arr.length > 0) {
		if (arr[0].count > 0) {
			sql = "ALTER Table `{0}` DROP `{1}`;".replace('{0}', this.table).replace('{1}', field);
			return await this.exec(sql);
		}
	}
	return 0;
};

/**
 * @description 拼接字段信息SQL
 * @param {Object} fd 字段信息
 * @return {String} sql语段
 */
DB.prototype.field_sql = function(fd) {
	var sql = "`{0}`".replace('{0}', fd.name);
	sql += " " + fd.type;
	if (fd.notnull) {
		sql += " NOT NULL";
	}
	if (fd.auto) {
		if (fd.dflt_value) {
			if (fd.dflt_value === '0000-00-00 00:00:00') {
				fd.dflt_value = 'CURRENT_TIMESTAMP';
			}
			sql += " DEFAULT " + fd.dflt_value;
		}
		sql += " " + fd.auto;
	} else if (fd.dflt_value) {
		if (fd.dflt_value === '0000-00-00 00:00:00') {
			fd.dflt_value = '1970-01-01 00:00:00';
		}
		sql += " DEFAULT " + fd.dflt_value;
	}
	if (fd.note) {
		sql += " COMMENT '" + fd.note + "'";
	}
	if (fd.pk) {
		sql += " PRIMARY KEY";
	}
	return sql;
};

/**
 * @description 修改字段名称
 * @param {String} field 字段名
 * @param {String} name 变更后名称
 * @return {Promise|Number} 修改成功返回1，失败返回0
 */
DB.prototype.field_name = async function(field, name) {
	var fields = await this.fields(this.table, field);
	if (!fields) {
		return -1;
	}
	if (fields.length === 0) {
		return 0;
	}
	var sql_sub = this.field_sql(fields[0]);
	sql_sub = sql_sub.replace("`" + field + "`", "`" + name + "`").replace(' PRIMARY KEY', '');
	var sql = "alter table `{0}` change `{1}` " + sql_sub;
	sql = sql.replace('{0}', this.table).replace('{1}', field);
	return await this.exec(sql);
};

exports.DB = DB;
