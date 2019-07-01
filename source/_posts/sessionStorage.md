---
title: 多 tab 页 sessionStorage 共享问题
date: 2019-06-23 21:17:45
tags: sessionStorage
---

### sessionStorage 介绍
说起 sessionStorage, 大家肯定都不陌生，浏览器的 sessionStorage 属性允许我们存储一些 key/value 的数据。与 localStorage 的不同之处，sessionStorage 里存储的数据在每次关闭浏览器之后就没有了，是会话级别的数据存储。而 localStorage 存储的数据是永久性的，在关闭浏览器之后也不会消失，下次再打开浏览器时，数据依然存在，除非你手动的进行删除。

sessionStorage 的 api 也是非常的简单。
```bash
    // 存储数据
    sessionStorage.setItem('name', 'jch');
    // 获取数据
    sessionStorage.getItem('name'); // 'jch'
```

### 问题描述
看似很简单实用的一个属性，却也在打开多个 tab 页面时引起了问题。

问题出现场景：

在一个后端任务管理系统中，菜单里有很多任务相关的页面，这些任务都与服务器有关。很多类似这样的系统下系统顶部 topmenu 都有一个 切换服务器的功能，每次点击切换服务器之后，当前页面的数据都需要刷新，即重新的请求后端数据，并且希望页面刷新。后端这个时候希望这个 `服务器` 的信息是前端写在 cookie 中，这里暂不说其他方式。

这是需求的一个描述，简化一下就是：点击切换服务器 topmenu 的时候，写 cookie，并且刷新浏览器. 在不关闭浏览器的情况下刷新浏览器都是刚刚选择的服务器。既然需要刷新浏览器记住数据，自然而然我想到了写 sessionStorage. 做法是：

点击切换服务器时，写 sessionStorage 记住当前选择的服务器并重新刷新浏览器，在进入系统 App 根路由时读取 sessionStorage 判断是否有记录服务器的值，若没有的话 topmenu 默认选择列表的第一个并写 cookie，这样后面请求都会带上这个 cookie 了。若有的话，根据该 sessionStorage 写 cookie 并且 topmenu 的 selected 值就是 sessionStorage 里的值。这样看起来没有啥问题，妥妥的完成了需求。然而 bug 无所不在，当你在一个 tab 页面里面切换了服务器之后，系统里面一个 a 标签新开一个 tab 页面查看某个任务详情的时候，新开的 tab 页面里面默认最开始是选择第一个服务器，因为两个 tab 页面的 sessionStorage 是不共享的。这样在打开的新 tab 页面的时候，默认选择了第一个服务器，并且写下了 cookie 值为第一个服务器，这样奇怪的问题就会出现了，再次回到第一个 tab 的时候，点击其他页面请求的数据都是第二个 tab 选择的服务器值，而第一个 tab 的 topmenu 显示的还是刚刚选择过的服务器，这样就不对了。产生这个问题的原因是不同页面的 sessionStorage 是不共享的，而 cookie 是共享的，cookie 是针对域名下的。我们在打开新 tab 的时候，因为该 tab 下 sessionStorage 没有记录服务器的值，我们默认选择了第一个服务器，并且写了 cookie, 这样就导致 cookie 值被更新了，回到第一个页面的时候再次请求 cookie 就是不对了。

看到这个问题之后，才了解到 sessionStorage 和 localStorage 其实还有一个更大的不同点，在不同 tab 下 sessionStorage 是不共享的，而 localStorage 是共享的。既然 localStorage 是共享的，那么就可以解决上面我们新开页面因 sessionStorage 不共享导致写 cookie 错乱的问题了。

### 解决问题
知道问题的源头在哪里，解决起来就很简单了，只要把上面记录服务器的信息写在 localStorage 中就可以了，这样新开 tab 页的时候，在根路由 App 里面判断 localStorage 的时候就已经有值了，并且和第一个 tab 是一样的，这样写的 cookie 也是一样的。解决了这个之后，还有一个问题是 开了两个 tab 情况时，在不同的 tab 里面切换服务器的时候，也会导致一个 cookie 错乱的问题。其实后端想放在 cookie 里面记录这个服务器的值，就是希望这个服务器的信息和用户登录一样的，不管开多少个页面，大家都是保持一样的一个情况。这样就需要多 tab 页里面更改 localStorage 的时候需要互相通知到。嗯，强大的浏览器已经有这样的 API 供我们使用了，我们可以在 App 根路由处监听 storage 的变化，如下：
```bash
    window.addEventListener('storage', event => {
        // servername 为 localStorage 的 key
      if (event.key === 'servername') {
        this.data.serverName = event.newValue; // newValue 即为新设置的 localStorage 的值，更新 topmenu 为 localStorage 里的值，保持多 tab 页一致。
      }
    });
```
这样问题就彻底解决了。通过 localStorage 及监听 storage 事件，我们也可以用一个 localStorage 实现多 tab 页共享 sessionStorage, 通过上面分析，想来大家都知道怎么做了，那就动手去实现下吧！

