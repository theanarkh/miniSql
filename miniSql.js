var miniSql={
	id:0,//数据唯一索引
	db:{},//数据存储对象
	count:0,
	// argumentsConfig:{
	// 	query:1,
	// 	add:1,
	// 	delete:1,
	// 	update:2
	// },//配置每种操作的参数个数
	logManager:{
		logId : 0,
		setLog:function(data){
			var date = new Date();
			var key = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()].join('');
			var obj = {};
			obj[key] = data;
			sessionStorage && sessionStorage.setItem(this.logId++,JSON.stringify(obj));
		},
		getLog:function(data,isLikeMatch){
			if(!sessionStorage){
				return ;
			}
			if(data === undefined){
				return  sessionStorage;
			}
			var date = new Date(data);
			var time = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()].join('');
			var result ={};
			var keys = Object.keys(sessionStorage);
			var length = keys.length;
			var body = isLikeMatch == true ?'var regexp = new RegExp(data);return regexp.test(Object.keys(sessionStorage.getItem(index))[0]);' : 'return data == Object.keys(sessionStorage.getItem(index))[0];'
			var condition = new Function(data,keys,index,body);
		 	for(var i = 0; i<length; i++){
		 		if(condition(time,keys,i,body)){
		 			result.push(sessionStorage.getItem(keys[i]));
		 		}
		 	}
		 	return result;
		}

	},
	compareConfig:{
		string:function(source,dest){
			source = String(source);
			dest = String(dest);
			if(source ==='' && dest !== ''){
				return -1;
			}
			else if(source !== '' && dest === ''){
				return 1;
			}
			else if(source === '' && dest === ''){
				return 0;
			}
			var i = 0;
			while(source[i] && dest[i] && source[i] === dest[i]){
				i++;
			}
			var value = source.charCodeAt(0)-dest.charCodeAt(0);
			return value>0 ? 1 : value<0 ? -1 : 0;
		},
		number:function(source,dest){
			source = Number(source);
			dest = Number(dest);
			var value = source-dest;
			return value>0 ? 1 : value<0 ? -1 : 0;
		},
		date:function(source,dest){
			var value = source.getTime()-dest.getTime();
			return value>0 ? 1 : value<0 ? -1 : 0;
		}	
	},/*
	call:(function(obj){
		var self = Function.prototype.call;
				return function(){
					return self.apply(obj,arguments);
				}
			}(Object.prototype.toString)
		),*/
	toStr:Object.prototype.toString,
	compare:function(source,dest){
		var type = this.toStr(source).replace(/\[object (\w+?)\]/,'$1').toLowerCase();
		return this.compareConfig[type](source,dest);
	},
	add:function(data){
		data.id = ++this.id;
		this.db[this.id] = data;
		var result = {code:0,data:{id:this.id},msg:'增加成功'};
		this.count++;
		this.logManager.setLog(result);
		return result;
	},
	delete:function(id){
		var result;
		if(id == "all"){
			result = {code:0,msg:'删除所有数据成功'}
			this.logManager.setLog(result);
			this.db={};
			return result;
		}
		if(this.db[id] !== undefined){
			delete this.db[id];
			this.count--;
			result = {code:0,data:{id:id},msg:'删除成功'};
			this.logManager.setLog(result);
			return result;
		}
		else{
			result = {code:-1,data:{},msg:'该id不存在'}
			this.logManager.setLog(result);
			return result;	
		}

	},
	query:function(id,keys){
		var result;
		if(id == "all"){
			result = {code:0,data:this.db};
			this.logManager.setLog(result);
			return result;
		}
		else if(this.db[id] === undefined){
			result = {code:-1,msg:'该id不存在'};
			this.logManager.setLog(result);
			return result;
		}
		else{
			if(!keys || keys.length ===0 ){
				result = {code:0,data:this.db[id],msg:'查询成功'};
				this.logManager.setLog(result);
				return result;
			}
			var resultSet = {};
			var len = keys.length;
			var data = this['db'][id];
			while(len-->0){
				resultSet[keys[len]] = data[keys[len]];
			}
			result = {code:0,data:resultSet,msg:'查询成功'};
			this.logManager.setLog(result);
			return result;
		}
	},
	update:function(id,data){
		var keys = Object.keys(data);
		var keysLen = keys.length;
		var result;
		if(this.db[id] === undefined){
			result = {code:-1,msg:'该id不存在'};
			this.logManager.setLog(result);
			return result; 
		}
		else{
			for(var i = 0; i<keysLen; i++){
				this.db[id][keys[i]] = data[keys[i]]; 
			}
			result = {code:0,data:{id:id},msg:'更新成功'};
			this.logManager.setLog(result);
			return result; 
		}
	},

	sort:function(sortedKey,dataSet){
		var key = sortedKey ? sortedKey : 'id';
		var database=dataSet ? dataSet :this['db'];
		var data = Object.keys(database);
        var len = data.length;
        var position = 0;
        var tmp;
        //一定要减一
        for (var i = 0; i < len - 1; i++) {
            var max = database[data[i]][key];
            position = i;
            for (var j = i + 1; j < len; j++) {
            	if (this.compare(database[data[j]][key],max) == 1) {
                    position = j;
                }
            }
            tmp = data[position];
            data[position] = data[i];
            data[i] = tmp;
        }
        var result = [];
		var resultIndex = 0;
		var resultLen = data.length;
        while(resultIndex<resultLen){
        	result[resultIndex] = database[data[resultIndex]].id;
            resultIndex++;
        }
        
        return result;

	},
	execute:function(cmd){
		//var needNum=this.argumentsConfig[cmd];//获取操作所需的操作数个数
		var realArg=Array.prototype.slice.call(arguments,1);//获取用户实际传进来的参数个数
		// if(needNum ^ realArg.length){
		// 	return {code:-1,msg:'参数个数有误'};
		// }
		//var method = this.methodConfig[cmd] ? this[this.methodConfig[cmd]] : this[cmd];
		if(!this[cmd]){
			return {code:-1,msg:'该方法不存在'};
		}
		return this[cmd].apply(this,realArg);
	
	}
}
var i=0;
while(i<10){
	miniSql.execute("add",{name:"a",age:ZYM.random(1,10,1)});
	i++
}
miniSql.execute("add",{name:"c",age:23});
miniSql.execute("add",{name:"b",age:24});
console.log(miniSql)
console.log(miniSql.execute("delete",1));
console.log(miniSql.execute("query",5,['id','age']));
console.log(miniSql.execute("update",5,{age:2}));
console.log(miniSql.sort('age'))
