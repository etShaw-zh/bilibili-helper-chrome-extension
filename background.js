// 只有在 background.js 中，才能实现外域访问

// 在安装了这个扩展的时候，加入一个监听器
chrome.runtime.onInstalled.addListener(function() {
	/* 
	https://developer.chrome.com/extensions/declarativeContent
	Use the chrome.declarativeContent API to take actions depending on the content 
	of a page, without requiring permission to read the page's content. 
	*/
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			// 条件：hostEquals == 'www.bilibili.com'
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {hostEquals: 'www.bilibili.com'},
				})
			],
			// 干什么：showPageAction
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
});

// 接收 contentscript.js和 popup.js 发送过来的 html 文件进行分析
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
		// background.js 中的 log 是在扩展页面该扩展的背景页显示的
		command = request.command; // command可能是detect命令，也可能直接是html页面
		// console.log(command);
		if(command == "start"){
			return;
		}
		$.ajax({
			url: "http://127.0.0.1:8000/bilibili_helper/",
			type: "GET",
			dataType: "json", // 是请求后，返回的数据将以json格式显示
			data: command,
			success: function (data) {
				let status = data["status"];
				let timeline = data["danmu_timeline"];
				console.log(status);
				// 将 timeline 存储到本地，需要 storage 权限
				chrome.storage.sync.set({timeline: timeline.toString()}, function() {
					console.log("timeline saved"); // 存储完毕后调用该方法
				});

				// 发送消息给 popup.js，告诉它已收到结果，隐藏 loader
				chrome.runtime.sendMessage({command: "over"});

				// 发送消息给 content-script，让其在前端绘制 timeline
				/*
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {command: "start_rendering"});
					}
				);
				*/
				chrome.tabs.sendMessage(0, {command: "start_rendering"});
				return;
			}
		});
    }
);

