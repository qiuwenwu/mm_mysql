const fxp = require("fast-xml-parser");
const fs = require("fs");
const path = require('path');
const util = require('util');

const runPath = path.resolve('.') + '\\';

/// 获取函数详情
/// obj: 函数或对象 (任意类型)
/// 返回: 函数详情字符串 (string)
function info(obj){
	return util.inspect(obj, {showHidden: false, depth: null});
}

/// 延迟
/// milliSeconds: 毫秒 (number)
/// obj: 判断对象或函数 (object)
/// key: 判断的对象属性, 为存在的情况下提成退出循环 (string)
function sleep(milliSeconds, obj, key) {
	var endTime = new Date().getTime() + milliSeconds;
	if (obj) {
		if (key) {
			while (new Date().getTime() < endTime) {
				if (obj[key]) {
					continue;
				}
			}
		} else {
			var fun = obj;
			while (new Date().getTime() < endTime) {
				if (!fun()) {
					continue;
				}
			}
		}
	} else {
		while (new Date().getTime() < endTime) {}
	}
}

/// 判断对象是否相似
/// obj: 被判断对象 (任意类型)
/// query: 用作判断的对象 (任意类型)
/// all: 是否完全相同 (bool)
/// 返回: 相似返回true，否则返回false (bool)
function as(obj, query, all) {
	var bl = true;
	var type = typeof(obj);
	if (type !== typeof(query)) {
		bl = false;
	} else if (obj.constructor == Object) {
		if (all && (Object.getOwnPropertyNames(obj).length !== Object.getOwnPropertyNames(query).length)) {
			bl = false;
		} else {
			for (var k in query) {
				if (!as(obj[k], query[k])) {
					bl = false;
					break;
				}
			}
		}
	} else if (obj.constructor == Array) {
		var lh = obj.length;
		if (all && (lh !== query.length)) {
			bl = false;
		} else {
			for (var i = 0; i < lh; i++) {
				if (!as(obj[i], query[i])) {
					bl = false;
					break;
				}
			}
		}
	} else {
		bl = obj === query;
	}
	return bl;
}

/// 测试函数执行速度
/// fun：测试的函数 (function)
/// times: 测试次数 (number)
function speed(fun, times) {
	if (!times) {
		times = 1000000;
	}
	var t1 = (new Date()).valueOf();
	for (var i = 0; i < times; i++) {
		fun();
	}
	var t2 = (new Date()).valueOf();
	var s = t2 - t1;
	console.log('耗时' + s + '毫秒, 平均' + (s / times) + 'ms/次');
}

/// 排序
/// key: 属性键 (string)
/// 返回: 排序函数 (function)
function newSort(key) {
	var field = key;
	return {
		/// 升序
		/// obj1: 对象1 (object)
		/// obj2: 对象2 (object)
		/// 返回: 顺序值 (number)
		asc: function asc(obj1, obj2) {
			var val1 = obj1[field];
			var val2 = obj2[field];
			if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
				val1 = Number(val1);
				val2 = Number(val2);
			}
			if (val1 < val2) {
				return -1;
			} else if (val1 > val2) {
				return 1;
			} else {
				return 0;
			}
		},
		asc_cn: function asc_cn(obj1, obj2) {
			return obj1[field].localeCompare(obj2[field], 'zh-CN');
		},
		/// 倒序
		/// obj1: 对象1 (object)
		/// obj2: 对象2 (object)
		/// 返回: 顺序值 (number)
		desc: function desc(obj1, obj2) {
			var val1 = obj1[field];
			var val2 = obj2[field];
			if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
				val1 = Number(val1);
				val2 = Number(val2);
			}
			if (val1 > val2) {
				return -1;
			} else if (val1 < val2) {
				return 1;
			} else {
				return 0;
			}
		},
		/// 中文排序
		/// obj1: 对象1 (object)
		/// obj2: 对象2 (object)
		/// 返回: 顺序值 (number)
		desc_cn: function desc_cn(obj1, obj2) {
			return obj2[field].localeCompare(obj1[field], 'zh-CN');
		}
	};
}

/// 添加对象属性
/// objA: 被添加的对象 (object)
/// objB: 用作添加的对象 (object)
/// bl: 是否补充没有的对象 (bool)
/// 返回: 新对象 (object)
function push(objA, objB, bl) {
	if (!objA || !objB) {
		return objA;
	}
	if (bl) {
		for (var k in objB) {
			objA[k] = objB[k];
		}
	} else {
		for (var k in objA) {
			var value = objB[k];
			if (value != undefined) {
				var type = typeof(objA[k]);
				if (type == "Number") {
					objA[k] = value;
				} else if (type == "Array" && typeof(value) == "Array") {
					objA[k].clear();
					objA[k].eachPush(value);
				} else if (value == "true") {
					objA[k] = true;
				} else if (value == "false") {
					objA[k] = false;
				} else {
					objA[k] = value;
				}
			}
		}
	}
	return objA;
}

/* == 数字原型函数 == */
/// 转为json字符串
/// obj: 被转换的对象 (object)
/// 返回: json格式字符串 (string)
function toJson(obj) {
	return JSON.stringify(obj);
}

/// 转为xml字符串
/// obj: 被转换的对象 (object)
/// format: 是否格式化 (bool)
/// mode: 表示方式, true为属性格式 (bool)
/// 返回: xml格式字符串 (string)
function toXml(obj, format, mode) {
	var param = {
		format: format
	};
	if (mode) {
		param = {
			format: format,
			attrNodeName: "_attrs",
			textNodeName: "#text",
			cdataTagName: "_cdata"
		}
	};
	return xml = new fxp.j2xParser(param).parse(obj);
};

/// 转url字符串
/// obj: 被转换的对象 (object)
/// url: 请求地址 (string)
/// 返回: url参数格式字符串 (string)
function toUrl(obj, url) {
	var queryStr = "";
	for (var key in obj) {
		var value = obj[key];
		if (typeof(value) == 'number') {
			if (value > 0) {
				queryStr += "&" + key + "=" + obj[key];
			}
		} else if (value) {
			queryStr += "&" + key + "=" + encodeURI(obj[key]);
		}
	}
	if (url) {
		if (url.endWith('?') || url.endWith('&')) {
			return url + queryStr.replace('&', '');
		} else if (url.indexOf('?') === -1) {
			return url + queryStr.replace('&', '?');
		} else {
			return url + queryStr;
		}
	} else {
		return queryStr.replace('&', '');
	}
};

/// 保存为json格式文件
/// obj: 被保存的对象 (object)
/// 返回: 保存结果 (bool)
function saveJson(obj, file) {
	return file.saveText($.toJson(obj));
};

/// 保存为xml格式文件
/// obj: 被保存的对象 (object)
/// format: 是否格式化 (bool)
/// mode: 表示方式, true为属性格式 (bool)
/// 返回: 保存结果 (bool)
function saveXml(obj, file, format, mode) {
	return file.saveText($.toXml(obj, format, mode));
};

/// 拷贝对象
/// obj: 被拷贝的对象 (object)
/// has: 是否非空拷贝，如果含有数据才拷贝，不含数据不拷贝 (bool)
/// 返回: 新对象 (object)
function copy(obj, has) {
	var newObj = {};
	if (has) {
		for (var attr in obj) {
			var o = obj[attr];
			if (o) {
				newObj[attr] = o;
			}
		}
	} else {
		for (var attr in obj) {
			newObj[attr] = obj[attr];
		}
	}
	return newObj;
};

function keys(obj, file) {
	var text = "";
	for (var k in obj) {
		text += k + '\r\n'
	}
	if (file) {
		file.saveText(text);
	} else {
		console.log(text);
	}
}

/// 定义全局函数
global.$ = {
	// 字典, 用于缓存机制框架
	dict: {},
	runPath: runPath,
	sleep: sleep,
	speed: speed,
	as: as,
	push: push,
	toJson: toJson,
	toXml: toXml,
	toUrl: toUrl,
	saveJson: saveJson,
	saveXml: saveXml,
	copy: copy,
	keys: keys,
	info: info
};

/* == 数字原型函数 == */
/// 去尾法
/// len: 保留长度 (number)
/// 返回: 数值 (number)
Number.prototype.toFloor = function(len) {
	var n = Math.pow(10, len);
	return Math.floor(this * n) / n;
};

/// 进一法
/// len: 保留长度 (number)
/// 返回: 数值 (number)
Number.prototype.toCeil = function(len) {
	var n = Math.pow(10, len);
	return Math.ceil(this * n) / n;
};

/// 四舍五入法
/// len: 保留长度 (number)
/// 返回: 数值 (number)
Number.prototype.toRound = function(len) {
	var n = Math.pow(10, len);
	return Math.round(this * n) / n;
};

/// 数值转字符串, 保留尾数长度
/// len: 保留长度 (number)
/// mode: 保留方式 (string)
/// 返回: 截取后字符串 (string)
Number.prototype.get = function(len, mode) {
	var n;
	switch (mode) {
		case 1:
		case "toRound":
			n = this.toRound(len)
			break;
		case 2:
		case "toCeil":
			n = this.toCeil(len)
			break;
		case 3:
		case "toFloor":
			n = this.toFloor(len)
			break;
		default:
			n = this.toString();
			break;
	}
	return n;
}

/// 数值转字符串, 保留尾数长度
/// len: 保留长度 (number)
/// mode: 保留方式 (string)
/// 返回: 截取后字符串 (string)
Number.prototype.toStr = function(len, mode) {
	var n = this.get(len, mode);
	var s = n.toString();
	var rs = s.indexOf('.');
	if (len > 0 && rs < 0) {
		rs = s.length;
		s += '.';
	}
	while (s.length <= rs + len) {
		s += '0';
	}
	return s;
}

/// 转为时间类型
/// 返回: 时间对象 (Date)
Number.prototype.toTime = function() {
	return new Date(this * 1000);
};


/* == 时间原型函数 == */
/// 时间格式化
/// format: 指定格式 (string)
/// 返回: 时间格式字符串 (string)
Date.prototype.toStr = function(format) {
	var o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"h+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};
	if (/(y+)/.test(format)) {
		var x = RegExp.$1;
		format = format.replace(x, (this.getFullYear() + "").substr(4 - x.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			var x = RegExp.$1;
			format = format.replace(x, x.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
};

/// 获取当前时间戳
/// 返回: 返回时间戳 (number)
Date.prototype.stamp = function() {
	var timestamp = Date.parse(this);
	return timestamp / 1000;
};

/// 计算时间差——时间间隔
/// endTime: 结束时间 (string)
/// time_unit: 时间单位, day天、hours小时、minutes分钟. (string)
/// 返回: 间隔时长 (number)
Date.prototype.interval = function(endTime, time_unit) {
	var startTime = this; // startTime: 开始时间
	var stime = Date.parse(new Date(startTime));
	var etime = Date.parse(new Date(endTime));
	var usedTime = etime - stime; // 两个时间戳相差的毫秒数
	if (time_unit == "day") {
		return Math.floor(usedTime / (24 * 3600 * 1000));
	} else {
		// 计算出小时数
		var leave1 = usedTime % (24 * 3600 * 1000); // 计算天数后剩余的毫秒数
		if (time_unit == "hours") {
			return Math.floor(leave1 / (3600 * 1000));
		} else {
			// 计算相差分钟数
			var leave2 = leave1 % (3600 * 1000); // 计算小时数后剩余的毫秒数  
			return Math.floor(leave2 / (60 * 1000));
		}
	}
	return 0;
};

/// 时间添加天数
/// days: 天数 (number)
/// 返回: 时间对象 (Date)
Date.prototype.addDays = function(days) {
	this.setDate(this.getDate() + days);
	return this;
};

/// 时间添加秒数
/// seconds: 秒数 (number)
/// 返回: 时间对象 (Date)
Date.prototype.addSeconds = function(seconds) {
	this.setSeconds(this.getSeconds() + seconds);
	return this;
};

/* == 字符串拓展函数 == */
/// 将json字符串转为对象
/// 返回: 对象 (object)
String.prototype.toJson = function() {
	return JSON.parse(this);
};

/// 将xml字符串转为对象
/// 返回: 对象 (object)
String.prototype.toXml = function() {
	return fxp.parse(this);
};

/// 将url字符串转为对象
/// 返回: 对象 (object)
String.prototype.toUrl = function() {
	var arr = this.split('&');
	var obj = {};
	arr.fun(function(o) {
		var ar = o.split('=');
		if (ar.length > 1) {
			obj[ar[0]] = decodeURI(ar[1]);
		} else {
			obj[ar[0]] = null;
		}
	});
	return obj;
};

/// 删除首字符
/// str: 要删除的字符, 默认删除空字符 (string)
/// 返回: 删除后字符串 (string)
String.prototype.startTrim = function(str) {
	if (!str) {
		str = "\\s";
	} else {
		str = str.replace("$", "\\$").replace("^", "\\^").replace("(", "\\(").replace(")", "\\)");
	}
	var rx = new RegExp("(^" + str + "*)", "g");
	return this.replace(rx, "");
};

/// 删除尾字符
/// str: 要删除的字符, 默认删除空字符 (string)
/// 返回: 删除后字符串 (string)
String.prototype.endTrim = function(str) {
	if (!str) {
		str = "\\s";
	} else {
		str = str.replace("$", "\\$").replace("^", "\\^").replace("(", "\\(").replace(")", "\\)");
	}
	var rx = new RegExp("(" + str + "*$)", "g");
	return this.replace(rx, "");
};

/// 删除首尾字符
/// str: 要删除的字符, 默认删除空字符 (string)
/// 返回: 删除后字符串 (string)
String.prototype.trim = function(str) {
	if (!str) {
		str = "\\s";
	} else {
		str = str.replace("$", "\\$").replace("^", "\\^").replace("(", "\\(").replace(")", "\\)");
	}
	var rx = new RegExp("(^" + str + "*)|(" + str + "*$)", "g");
	return this.replace(rx, "");
};

/// 取文本左边
/// str: 索引的字符 (string)
/// bl: 当索引字符不存在时是否保留左边 (bool)
/// 返回: 截取后的字符串 (string)
String.prototype.left = function(str, bl) {
	var i = this.indexOf(str);
	if (i == -1) {
		if (bl) {
			return this + '';
		} else {
			return "";
		}
	} else {
		return this.substring(0, i);
	}
};

/// 取文本右边
/// str: 索引的字符 (string)
/// bl: 当索引字符不存在时是否保留右边 (bool)
/// 返回: 截取后的字符串 (string)
String.prototype.right = function(str, bl) {
	var i = this.indexOf(str);
	if (i == -1) {
		if (bl) {
			return this + '';
		} else {
			return "";
		}
	} else {
		return this.substring(i + str.length);
	}
};

/// 取文本之间
/// str: 索引的字符 (string)
/// bl: 当索引字符不存在时是否保留右边 (bool)
/// 返回: 截取后的字符串 (string)
String.prototype.between = function(str_l, str_r, bl) {
	var str = this.right(str_l, bl);
	return str.left(str_r, bl);
};

/// 替换字符串——所有
/// oldStr: 替换的字符串 (string)
/// newStr: 替换为字符串 (string)
/// 返回: 替换后的字符串 (string)
String.prototype.replaceAll = function(oldStr, newStr) {
	var txt = this + '';
	if (!newStr) {
		newStr = '';
	}
	while (txt.indexOf(oldStr) !== -1) {
		txt = txt.replace(oldStr, newStr);
	}
	return txt;
};

/// 验证开头字符串
/// startStr: 开头字符串 (string)
/// 返回: 验证成功返回true，失败返回false (bool)
String.prototype.startWith = function(startStr) {
	var d = this.length - startStr.length;
	if (d >= 0 && this.indexOf(startStr) == 0) {
		return true;
	}
	return false;
};

/// 验证结束字符串
/// endStr: 结尾字符串 (string)
/// 返回: 验证成功返回true，失败返回false (bool)
String.prototype.endWith = function(endStr) {
	var d = this.length - endStr.length;
	if (d >= 0 && this.lastIndexOf(endStr) == d) {
		return true;
	}
	return false;
};


/// 是否含字符串
/// str: 判断的字符 (string)
/// 返回: 验证成功返回true，失败返回false (bool)
String.prototype.has = function(str) {
	return this.indexOf(str) !== -1;
};


/// 验证是否匹配
/// str: 字符串 (string)  支持*号匹配, 前*表示匹配后面字符串, 后*表示匹配前面字符串, 前后*表示匹配包含字符串
/// 返回: 验证成功返回true，失败返回false (bool)
String.prototype.with = function(str) {
	var o = this + '';
	var k = str.replaceAll('*', '');
	if (str.startWith("*")) {
		if (str.endWith("*")) {
			return o.indexOf(k) !== -1;
		} else {
			return o.endWith(k);
		}
	} else if (str.endWith("*")) {
		return o.startWith(k);
	} else {
		return o == k;
	}
};

/// 转为时间对象
/// 返回: 时间对象 (Date)
String.prototype.toTime = function() {
	var str = this.replace('T', ' ').replace('Z', '').replaceAll('.', '/').replaceAll('-', '/');
	return new Date(str);
};

/// 转为时间格式字符串
/// format: 转换的格式 (string)
/// 返回: 时间格式字符串 (string)
String.prototype.toTimeFormat = function(format) {
	var str = this.replace('T', ' ').replace('Z', '').replaceAll('.', '/').replaceAll('-', '/');
	return new Date(str).toStr(format);
};

/// 转为数组
/// separator: 分隔符或正则 (string|regex)
/// maxLen: 最大长度 (number)
/// 返回: 数组 (array)
String.prototype.toArr = function(separator, maxLen) {
	return this.split(separator, maxLen);
};

/// 转为数字
/// len: 保留长度 (number)
/// mode: 保留方式 (string)
/// 返回: 浮点数 (number)
String.prototype.toNum = function(len, mode) {
	return new Number(num).get(len, mode);
};

/// 转为对象
/// 返回: 对象 (任意类型)
String.prototype.toObj = function() {
	return eval(this + '');
};


/// 转正则表达式
/// mode: 转换方式, g为全部, i为不区分大小写 (string)
/// 返回: 返回正则 (regex)
String.prototype.toRx = function(mode) {
	if (!mode) {
		mode = 'gi';
	}
	return eval("/" + this + "/" + mode);
};

/// 编译模板
/// 返回: 编译后的字符串 (string)
String.prototype.tpl = function() {
	return eval("`" + this + "`");
};

/// 补全路径
/// dir: 当前路径 (string)
/// 返回: 字符串 (string)
String.prototype.fullname = function(dir) {
	var f = this.replaceAll('/', '\\');
	if (f.indexOf('\\') === 0) {
		f = f.replace('\\', runPath);
	} else if (f.indexOf('.\\') === 0) {
		if (dir) {
			if(!dir.endWith('\\'))
			{
				dir += '\\';
			}
			f = f.replace('.\\', dir.fullname());
		} else {
			f = f.replace('.\\', runPath);
		}
	} else if (f.indexOf(':') == -1) {
		f = path.resolve(".") + '\\' + f;
	}
	return f;
};

/// 取基础名
/// 返回: 字符串 (string)
String.prototype.basename = function() {
	return path.basename(this + '');
};

/// 取拓展名
/// 返回: 字符串 (string)
String.prototype.extname = function() {
	return path.extname(this + '');
};

/// 取路径
/// 返回: 字符串 (string)
String.prototype.dirname = function() {
	return path.dirname(this + '') + '/';
};

/// 保存文件
/// text: 被保存的文本 (string)
String.prototype.saveText = function(text) {
	return fs.writeFileSync(this.fullname(), text);
};

/// 加载文件
/// encode: 编码方式 (string)
/// 返回: 加载的文本 (string)
String.prototype.loadText = function(encode) {
	var file = this.fullname();
	if (fs.existsSync(file)) {
		if (!encode) {
			encode = "utf-8";
		}
		return fs.readFileSync(file, encode);
	} else {
		return undefined;
	}
};

/// 加载xml
/// 返回: 加载的文本 (string)
String.prototype.loadXml = function() {
	var f = this.fullname();
	if (fs.existsSync(f)) {
		var text = fs.readFileSync(f, "utf-8");
		return text.toXml();
	} else {
		return undefined;
	}
};

/// 加载json
/// 返回: 加载的文本 (string)
String.prototype.loadJson = function() {
	var f = this.fullname();
	if (fs.existsSync(f)) {
		var text = fs.readFileSync(f, "utf-8");
		return text.toJson();
	} else {
		return undefined;
	}
};

/// 判断文件是否存在
/// 返回: 存在返回true, 不存在返回false (bool)
String.prototype.hasFile = function() {
	return fs.existsSync(this.fullname());
};

/// 复制文件
/// file: 保存路径 (string)
/// 返回: 复制成功返回true, 失败返回false (bool)
String.prototype.copyFile = function(file) {
	return fs.copyFileSync(this.fullname(), file.fullname());
};

/* == 数组原型函数 == */
/// 拷贝对象
/// has: 是否非空拷贝，如果含有数据才拷贝，不含数据不拷贝(bool)
/// 返回: 新数组 (array)
Array.prototype.copy = function(has) {
	var arr_new = [];
	var arr = this;
	if (has) {
		for (var i = 0; i < arr.length; i++) {
			var o = arr[i];
			if (o) {
				arr_new[i] = o;
			}
		}
	} else {
		for (var i = 0; i < arr.length; i++) {
			arr_new[i] = arr[i];
		}
	}
	return arr_new;
};

/// 遍历对象执行函数
/// fun: 函数名 (function)
Array.prototype.fun = function(fun) {
	for (var i = 0; i < this.length; i++) {
		if (fun(this[i])) {
			break;
		}
	}
};

/// 数组转字符串
/// splitStr: 分隔符(string)
/// key: 对象属性 (string)
/// 返回: 字符串 (object)
Array.prototype.toStr = function(splitStr, key) {
	var arr = this;
	var str = "";
	if (key) {
		for (var i = 0; i < arr.length; i++) {
			var o = arr[i];
			if (o[key]) {
				str += splitStr + o[key];
			}
		}
	} else {
		for (var i = 0; i < arr.length; i++) {
			var o = arr[i];
			str += splitStr + o;
		}
	}
	return str.replace(splitStr, "");
};

/// 清空数组
/// 返回: 清空的数组 (array)
Array.prototype.clear = function() {
	this.splice(0, this.length);
	return this;
};

/// 修改数组成员
/// query: 搜索条件 (任意类型)
/// obj: 修改项 (任意类型)
/// 返回: 删除后的数组 (array)
Array.prototype.set = function(query, obj) {
	for (var i = 0; i < this.length; i++) {
		var o = this[i];
		for (var k in query) {
			if (as(o, query)) {
				this[i] = obj;
			};
		}
	}
	return this;
};

/// 对象列表排序
/// method: 排序方式, asc升序, desc降序 (string)
/// key: 用来判断排序的对象属性 (string)
Array.prototype.sortBy = function(method, key) {
	if (key) {
		var isCN = typeof this[0][key] == "string";
		var fun = newSort(key);
		if (method && method.toLowerCase() == "desc") {
			if (isCN) {
				this.sort(fun.desc_cn);
			} else {
				this.sort(fun.desc);
			}
		} else {
			if (isCN) {
				this.sort(fun.asc_cn);
			} else {
				this.sort(fun.desc);
			}
		}
	} else {
		if (method && method.toLowerCase() == "desc") {
			this.sort(function(a, b) {
				return b - a;
			});
		} else {
			this.sort(function(a, b) {
				return a - b;
			});
		}
	}
	return this;
};

/// 数组列表取数组
/// key: 取的属性 (string)
/// 返回: 截取的数组 (array)
Array.prototype.toArr = function(key) {
	var arr = [];
	var lt = this;
	for (var i = 0; i < lt.length; i++) {
		var o = lt[i];
		arr.push(o[key]);
	}
	return arr;
};

/// 从数组获取对象
/// query: 查询条件 (object)
/// 返回: 对象 (object)
Array.prototype.getOne = function(query) {
	var obj;
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				obj = o;
				break;
			}
		}
	}
	return obj;
};

/// 获取数组对象的属性值
/// key: 属性名 (string)
/// query: 查询条件 (object)
/// 返回: 属性值 (任意类型)
Array.prototype.getVal = function(key, query) {
	var obj = this.getOne(query);
	return obj[key];
};

/// 获取符合条件的数组对象
/// query: 查询条件 (object)
/// 返回: 对象数组 (array)
Array.prototype.getList = function(query) {
	var arr = [];
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				arr.push(o);
			}
		}
	} else {
		arr = this.copy()
	}
	return arr;
};

/// 获取数组所有对象的属性值
/// key: 属性名
/// query: 查询条件
/// 返回: 属性值数组
Array.prototype.getArr = function(key, query) {
	var arr = [];
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				arr.push(o[key]);
			}
		}
	} else {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			arr.push(o[key]);
		}
	}
	return arr;
};

/// 给数组对象添加属性值
/// key: 属性名 (string)
/// value: 属性值 (任意类型)
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只添加给第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.addVal = function(key, value, query, end) {
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				if (o[key] == null) {
					o[key] = value;
					if (end) {
						break;
					}
				}
			}
		}
	} else {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (o[key] == null) {
				o[key] = value;
				if (end) {
					break;
				}
			}
		}
	}
	return this;
};

/// 给数组添加对象
/// obj: 对象 (object)
/// query: 查询条件 (object)
/// 返回: 对象数组 (array)
Array.prototype.addOne = function(obj, query) {
	var has = false;
	if (query) {
		for (var i = 0; i < this.length; i++) {
			if (as(this[i], query)) {
				has = true;
				break;
			}
		}
	} else {
		for (var i = 0; i < this.length; i++) {
			if (as(this[i], obj)) {
				has = true;
				break;
			}
		}
	}
	if (!has) {
		this.push(obj);
	}
	return this;
};

/// 给数组添加多个对象
/// list: 数组 (array)
/// query: 查询条件 (object)
/// 返回: 对象数组 (array)
Array.prototype.addList = function(list, query) {
	for (var i = 0; i < list.length; i++) {
		this.addOne(list[i], query);
	}
	return this;
};

/// 删除数组中对象的属性
/// key: 对象属性键 (string)
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只删除第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.delVal = function(key, query, end) {
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				this.splice(i);
				if (end) {
					break;
				}
			}
		}
	} else {
		for (var i = 0; i < this.length; i++) {
			this.splice(i);
			if (end) {
				break;
			}
		}
	}
	return this;
};

/// 删除数组中的对象
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只删除第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.delObj = function(query, end) {
	var bl = false;
	if (end) {
		if (query) {
			for (var i = 0; i < this.length; i++) {
				if (as(this[i], query)) {
					this.splice(i);
					break;
				}
			}
		} else {
			for (var i = 0; i < this.length; i++) {
				this.splice(i);
				break;
			}
		}
	} else {
		if (query) {
			for (var i = this.length - 1; i >= 0; i--) {
				if (as(this[i], query)) {
					this.splice(i);
				}
			}
		} else {
			for (var i = this.length - 1; i >= 0; i--) {
				this.splice(i);
			}
		}
	}
	return this;
};

/// 删除多个不同的数组成员
/// list: 查询条件列表 (array)
/// end: 是否中断循环,中断只删除第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.delList = function(list, end) {
	for (var i = 0; i < list.length; i++) {
		this.delObj(list[i], end);
	}
	return this;
};

/// 设置数组中对象的属性值
/// key: 属性键 (string)
/// value: 属性值 (任意类型)
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只修改第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.setVal = function(key, value, query, end) {
	if (query) {
		for (var i = 0; i < this.length; i++) {
			if (as(this[i], query)) {
				this[i][key] = value;
				if (end) {
					break;
				}
			}
		}
	} else {
		for (var i = 0; i < this.length; i++) {
			this[i][key] = value;
			if (end) {
				break;
			}
		}
	}
	return this;
};

/// 设置数组中对象的属性值
/// obj: 对象 (object)
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只修改第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.setObj = function(obj, query, end) {
	if (query) {
		for (var i = 0; i < this.length; i++) {
			var o = this[i];
			if (as(o, query)) {
				this[i] = obj;
				if (end) {
					break;
				}
			}
		}
	}
	return this;
};

/// 设置数组中对象的属性值
/// list: 对象列表 (array)
/// query: 查询条件 (object)
/// end: 是否中断循环,中断只修改第一个符合条件的对象 (bool)
/// 返回: 对象数组 (array)
Array.prototype.setList = function(list, query) {
	for (var i = 0; i < this.length; i++) {
		this.setObj(this[i], query, end);
	}
};

/// 过滤成员
/// str: 搜索关键词 (string)
/// key: 主键, 用于列表数组时 (string)
Array.prototype.search = function(str, key) {
	var arr = [];
	var fun;
	var k = str.replaceAll('*', '');
	if (str.startWith("*")) {
		if (str.endWith("*")) {
			if (key) {
				fun = function(o) {
					if (o[key].indexOf(k) !== -1) {
						arr.push(o);
					}
				}
			} else {
				fun = function(o) {
					if (o.indexOf(k) !== -1) {
						arr.push(o);
					}
				}
			}
		} else {
			if (key) {
				fun = function(o) {
					if (o[key].endWith(k)) {
						arr.push(o);
					}
				}
			} else {
				fun = function(o) {
					if (o.endWith(k)) {
						arr.push(o);
					}
				}
			}
		}
	} else if (str.endWith("*")) {
		if (key) {
			fun = function(o) {
				if (o[key].startWith(k)) {
					arr.push(o);
				}
			}
		} else {
			fun = function(o) {
				if (o.startWith(k)) {
					arr.push(o);
				}
			}
		}

	} else {
		if (key) {
			fun = function(o) {
				if (o[key] == k) {
					arr.push(o);
				}
			}
		} else {
			fun = function(o) {
				if (o == k) {
					arr.push(o);
				}
			}
		}
	}
	this.forEach(fun);
	return arr;
};

/// 过滤成员
/// query: 搜索关键词 (任意类型)
/// key: 主键, 用于列表数组时 (string)
Array.prototype.has = function(query) {
	var has = false;
	for(var i = 0; i < this.length; i++){
		if(as(this[i], query))
		{
			has = true;
			break;
		}
	};
	return has;
};

