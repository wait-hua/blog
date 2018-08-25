---
title: JS的跨域理解
date: 2017-01-02 19:16:57
tags: 跨域
---

## 前言
博客搬家
周一的学院点开题被批的很惨，换了个校长，各种被抓严，班上已经有两个同学打算休学了。哎，这周的聚会可能是大家集聚的最后一次吧。熬着吧，还是学习我的前端，不管老板学校咋逼了，找个好工作才是王道。今天把学习的几种跨域方法做个小结吧，不然就很容易忘了。

## 什么是跨域？
JavaScript处于安全方面的考虑，不允许跨域调用其他页面的对象。也就是说a.com域名下的JS无法操作b.com或者c.a.com域名下的对象。JS跨域就是要解决在不同的域之间的数据传输或通信。只要是协议、域名、端口有任何一个的不同，都被当做是不同的域。

## JSONP跨域

JsonP跨域是我们最常见的跨域方法，它所基于的原理：直接通过XMLHttpRequest是不能请求不同域的数据，但是我们可以在页面中引入不同域的JS文件。

假设a.html页面里面要获取 http://b.com/data.php里面的json数据。那么我们可以在a.html页面中可以这样实现：
``` bash
<script>
    function cb(jsondata){
        //处理获得的json数据
    }
</script>
<script src="http://b.com/data.php?callback=cb"></script>

```
<!--more-->

在创建的script标签里src的url后面有个?callback=cb,这里cb就是我们获取数据后要执行的函数。

在data.php里面，返回的必须是一段可执行的JS文件。如下：

``` bash
<?php
    $callback = $_GET['callback']; //得到回调函数名cb
    $data = array('a','b','c');  //返回的数据
    echo $callback.'('.json_encode($data).')';
?>
```

最终a.html页面得到的结果是cb(['a','b','c'])。这就得到我们想要的数据了。
在这里我们在页面源头引入了一段JSONP用来跨域的脚本，这样如果在一个页面里面需要跨域去获取很多数据的时候，那么就会需要引入很多跨域的脚本，一个优化的方式是可以在跨域回调函数里面获取到数据处理完之后之后，将这段异步脚本给删除掉。

##### JSONP跨域的优缺点
- 优点: 兼容性很好，而且不需要XMLHttpRequest对象也可以完成跨域获取数据了。
- 缺点：JSONP只支持GET操作，这样就会限制传输的数据大小了；也不能传输文件类型的数据；需要和服务器端的约定和配合，服务器端将需要返回的数据和callback回调组装一起返回给客户端。

## iframe跨域
网易的登录组件内嵌到各个产品中去就是通过iframe跨域通信的方式。
它的原理是利用iframe的src属性，跨域拿去所需资源，该资源可以是存放在目标服务器的一个代理文件，该代理文件与目标服务器在同一个域名下，资源的通信就不是跨域了。通过这样将消息传递方式从跨域转变为两个窗体之间的通信。
该代理文件则负责消息的接受和转发工作。

首先知道一个知识点：如果父页面引入一个同域的子页面，那么这两个窗体的通信就是很容易的，父页面可以通过调用子页面的window.frames['name'].contentWindow进行操作子页的DOM树等，且子页面也同样可以调用父页面的window.parent.contentWindow来操作父页面的DOM树。
但是如果两个窗体的跨域的情况下，则会有限制，父窗体几乎拿不到子窗体的信息，window.frames['name'].location.href及window.frames['name'].contentWindow都是会报错的，同样子窗体可以重写父窗体的href属性，例如：window.parent.location.href = "http://www.baidu.com";但是却对父窗体的href属性没有读的权限。
那两个窗体之间是如何通信的尼。在高版本浏览器中我们可以通过postMessage在两个窗体之间通信，低版本通过window.name的方式通信。

postMessage消息通信方式
1.父子窗体之间的简单通信：
parent.html里面，域名为:http://localhost:9001
sub.html里面，域名为：http://localhost:9002

``` bash
<p>父页面</p>		
<iframe src="http://localhost:9002/sub.html" name="nejFrame"></iframe>
<p style="color:green" id="ad"></p>
<script type="text/javascript">
    function receiveMessage(msg) {
        // 源 msg.origin
        document.getElementById('ad').innerHTML = msg.data;
    }
    window.frames.onload = function () {
        window.frames['nejFrame'].postMessage("我是来自父窗体的消息", 'http://localhost:9002');
    }
    window.addEventListener("message", receiveMessage, false);
</script>
```
注意父页面内发送消息的时候需要在iframe加载完之后。
``` bash
<p>子页面</p>
<p style="color:red" id="eg"></p>	
<script type="text/javascript">
    function receiveMessage(msg) {
        document.getElementById('eg').innerHTML = msg.data;
    }
    window.parent.postMessage("我是来自子窗体的消息", 'http://localhost:9001');
    window.addEventListener("message", receiveMessage, false);
</script>
```
2.兄弟之间的窗体通信可通过由父窗体进行转发，也可通过MessageChannel建立起一个通道进行通信，大家可以自行研究一下。

对于低版本的ie678，采用window.name来进行消息通信，主要利用了跨域窗体之间是可以设置window.name的特性。
window.name通信过程如下：
1.parent窗体按照协议拼接好消息。
2.parent窗体将消息字符串设置到sub窗体的window.name属性上。
3.sub窗体定时的轮询window.name的变化情况。
4.sub发现window.name上有parent传来的消息，按照协议进行消息的转码。
5.sub触发window上的onmessage事件，通知上层应用处理消息。
上述所讲到的协议主要是字符串的设置格式：
- 必须以字符串 MSG| 作为起始，且必须大写字符
- 参数以键值对方式传入，键与值之间用 = 连接，所有键值均做encodeURIComponent编码，键值对之间以 | 字符分隔，如 a=b|b=a%26b
- 将以上结果做escape后设置到目标window的name属性上，如MSG%7Cdata%3D%257B%2522url%2522%253A%2522http%253A%252F%252Fa.b.com

##### iframe跨域的优缺点
- 优点：兼容性比较好，低版本浏览器也可以支持，而且支持GET、POST等方式。
- 缺点：首次需要从目标服务器加载一个代理文件，低版本的浏览器是通过window.name的轮询机制，存在一定的消息丢失，并且在消息并发量大的时候存在一定的延时。
## CORS跨域
CORS是w3c新出的一个跨域方案，对于该方案，前端几乎不需要做额外的操作，仅需要在服务器端在请求头中加上跨域请求头的配置，如下：
Access-Control-Allow-Origin: 允许跨域访问的源，可为*.
Access-Control-Expose-Headers: X-Request-With,Content-Type
Access-Control-Allow-Methods: GET,POST,PUT,OPTION
Access-Control-Allow-Credentials: true, 允许客户端带withCredentials为true的请求，客户端带cookie的情况
Access-Control-Max-Age: 指明预检请求的响应的有效时间.

在跨域请求的时候，如果是非简单请求，如POST请求application/json类型的时候，浏览器会发送一个OPTION请求，服务器端将可以跨域请求的头信息返回给客户端，客户端收到了reponse的跨域请求头之后，再发送之后的请求。
在需求跨域带cookie的情况下Access-Control-Allow-Credentials: true设置为true之后，则Access-Control-Allow-Origin不能设置为*，必须设置为具体的源。
CORS方案仅支持高版本浏览器，ie67不支持，ie8下支持度不是很好，并且不能带上cookie，和contentType.
##### CORS跨域的优缺点
- 优点：仅需要服务器端配置头即可，并且可以配置在ngnix上，前后端都不需要额外的操作。
- 缺点：仅支持高版本的浏览器


## Ngnix的代理
通过Ngnix进行请求代理的转发，在服务器端就不存在跨域了，通过配置proxy_pass转发。网易163邮箱和126邮箱的登录就是通过该方法。

## Flash跨域
Flash的跨域和iframe的跨域方式差不多，都是通过代理文件实现的，目前flash方式用的比较少了。

## 总结
1.在少量的跨域请求时可以用JSONP的方式。
2.能利用Ngnix代理则利用Ngnix代理配置进行转发，目前很多前后端分离的项目，前端单独服务器部署，本身就用到了Ngnix的代理转发到后端。
3.在移动端和仅需要支持版本浏览器的时候使用CORS跨域方案。
4.需要支持IE8以下的低版本浏览器的时候使用iframe方式。










