/**
 *  连接数据库模型类
 * @class
 */
class Link_model {
	/**
	 * 构造函数
	 * @param {Object} config 配置参数
	 */
	constructor(config, sql) {
		/**
		 * 配置参数
		 */
		this.config = Object.assign({
			key: "user_id",
			value: 0,
			clear_prefix: true
		}, config);

		/**
		 * 模型集合
		 */
		this.model = {};

		/**
		 * 数据库集合
		 */
		this.dbs = {};

		/**
		 * 数据库集合
		 */
		this.sql = sql;
	}
}

/**
 * 添加对象
 * @param {String} table 表名
 * @return {Object}
 */
Link_model.prototype.add = async function(table) {
	var {
		key,
		value,
		clear_prefix
	} = this.config;
	var db = this.sql.db();
	db.table = table;
	db.key = key;
	db.size = 1;
	db.page = 1;
	var query = {};
	query[key] = value;
	var obj = await db.getObj(query);
	if (!obj) {
		var n = await db.add(query);
		if (n) {
			obj = await db.getObj(query);
		}
	}

	var name = table;
	// 是否去除表前缀
	if (clear_prefix) {
		var arr = table.split("_");
		if (arr.length > 1) {
			name = table.right("_");
		}
	}
	this.model[name] = obj;
	this.dbs[table] = db;
	return this;
};

/**
 * 初始化
 * @param {Object} sql 数据管理器
 * @return {Object} 当前对象
 */
Link_model.prototype.init = function(sql) {
	this.sql = sql;
	return this;
};

/**
 * 更新键值
 * @param {Object} key
 * @param {Object} value
 * @return {Object} 当前对象
 */
Link_model.prototype.update = function(key, value) {
	var m = this.model;
	for (var k in m) {
		var o = m[k];
		if (o[key] !== undefined) {
			o[key] = value;
		}
	}
	return this;
};

/**
 * 合并属性
 * @param {Array} arr_name 当前对象
 * @return {Object} 
 */
Link_model.prototype.merge = function(...arr_name) {
	var model = {};
	if (arr_name.length === 0) {
		arr_name = Object.keys(this.model);
	}
	for (var i = 0; i < arr_name.length; i++) {
		var name = arr_name[i];
		var o = this.model[name];
		if (o) {
			for (var k in o) {
				model[k] = o[k]
			}
		}
	}
	var _this = this;
	return new Proxy(model, {
		set: function(obj, prop, value) {
			_this.update(prop, value);
			obj[prop] = value;
			return obj;
		}
	});
};

module.exports = Link_model; 