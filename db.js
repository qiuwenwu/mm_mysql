const Sql = require('../sql');

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

		/// 获取所有表名
		/// table: 表名关键词 (string)
		/// 返回: 表名数组 (promise|array)
		DB.prototype.tables = async function(table) {
			var list = await this.run("show tables");
			var key = 'Tables_in_' + this.database;
			if (table) {
				list = list.search(table, key);
			}
			return list.getArr(key);
		};

		/// 获取所有表字段
		/// table: 表名 (string)
		/// 返回: 字段信息列表 (promise|array)
		DB.prototype.fields = async function(table) {
			if (!table) {
				table = this.table;
			}
			var field =
				'COLUMN_NAME as `name`,ORDINAL_POSITION as `cid`,COLUMN_DEFAULT as `dflt_value`,IS_NULLABLE as `notnull`,COLUMN_TYPE as `type`,COLUMN_KEY as `pk`,COLUMN_COMMENT as `note`';
			var sql = "select " + field + " from information_schema.COLUMNS where `table_name` = '" + table +
				"' and `table_schema` = '" + this.database + "';";
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
		DB.prototype.setType = function(type, auto) {
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
		};

		/// 创建数据表
		/// table: 表名 (string)
		/// field: 主键字段名 (string)
		/// type: 类型名 (string) 常用类型 mediumint, int, varchar
		/// auto: 是否自增字段, 默认为自增字段 (bool)
		/// 返回: 执行结果 (promise|bool)
		DB.prototype.addTable = async function(table, field, type, auto) {
			if (!field) {
				field = "id";
			}
			var sql = "CREATE TABLE IF NOT EXISTS `{0}` (`{1}` {2}, PRIMARY KEY (`{3}`));".replace('{0}', table).replace(
				'{1}', field).replace('{2}', this.setType(type, auto)).replace('{3}', field);
			return await this.exec(sql);
		};

		/// 添加字段
		/// field: 字段名 (string)
		/// type: 类型名 (string) 常用类型 mediumint, int, float, double, varchar, tinyint, text, date, datetime, time
		/// value: 默认值 (string|number)
		/// isKey: 是否主键
		/// 返回: 添加成功返回1, 失败返回0 (promise|bool)
		DB.prototype.field_add = async function(field, type, value, isKey) {
			var sql =
				"SELECT COUNT(*) as `count` FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{0}' AND table_name='{1}' AND COLUMN_NAME='{2}'";
			sql = sql.replace('{0}', this.database).replace('{1}', this.table).replace('{2}', field);
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
					var sql = "ALTER Table `{0}` ADD `{1}` {2}".replace('{0}', this.table).replace('{1}', field).replace('{2}',
						type);
					if (isKey) {
						sql += ", ADD PRIMARY KEY (`{0}`)".replace('{0}', field);
					}
					return await this.exec(sql);
				}
			}
			return 0;
		};

		/**
		 * @description 删除字段
		 * @param {Object} field 字段名
		 * @return {Number} 删除成功返回1，失败返回0
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
	}
}

exports.DB = DB;
