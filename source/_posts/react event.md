---
title: 记一次 react 事件踩坑
date: 2019-03-17 20:36:23
tags: react events
---

最初刚开始用 react 开发，对于其某些 API 还是有些不熟悉，在使用其事件机制时就踩坑了，所以阅读了其事件机制，才真正知道了坑踩在哪里了，首先来看下一次事件踩坑。

## 踩坑
首先一个需求是用 svg 画一个元素，该元素整体可拖拽(目标元素位置不动，只拖动出一个副本)，点击其中某个小圆点时不触发拖拽，点击小圆点要随着鼠标画线。踩坑的 [demo](https://codesandbox.io/s/pww7579yjx), demo 中是简化了的版本，没有画 svg, 用一个 div 代替了，点击圆点画线也省略了。

主体思路是提供一个 Draggable 组件，通过组合的方式提供拖拽功能，Draggable 拖拽功能是通过 mouse 事件实现的，因为 svg 元素不支持 h5 的 drag 事件。
可以看下主要的结构：

```bash
// Draggable.jsx
componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    this.$el = ReactDOM.findDOMNode(this);

    // 方式一： addEventListener
    this.$el.addEventListener("mousedown", this.onMousedown);
}
render() {
    const { children } = this.props;
    const child = React.Children.only(children);
    // 方式一 + componentDidMount 里的 addEventListneer
    return <React.Fragment>{child}</React.Fragment>;
}
```
最开始的实现方式，Draggable.jsx 通过 findDOMNode 找到 children 的根元素，直接通过 addEventListener 注册 mousedown 事件，开始记录拖动的元素。

```bash
// index.js
funtion onMouseDown(event) {
    event.stopPropagation();
}
render() {
    <Draggable>
        <div className="node">
          <span>可拖拽</span>
          <div className="dot" onMouseDown={onMouseDown} />
        </div>
    </Draggable>
}
```
在 index.js 里引入 Draggable 包裹需要拖拽的元素，点击小圆点的时候想要不触发拖拽，自然想到是通过 stopPropagation 阻止 mousedown 事件的冒泡，这样就不会触发拖拽的操作了。可是坑来了，怎么阻止不了冒泡啊？console.log 打印出来看一下，是先触发了 Draggable 里的 onMouseDown 事件，然后才调用了 index.js 里的 onMouseDown 事件，顿时觉得啥？这和我知道的事件冒泡机制完全不一样啊，react 打底做了啥？其实网上搜一个就能出来解决方案的，Draggable 组件无非是想给 children 绑定一个 onMouseDown 事件嘛，其实熟悉了 react 之后，立马就能解决这个问题了。我们后面再说，好奇的宝宝先让我们来了解下 react 的事件机制。

## React 事件机制
React 自己实现了一套高效的事件注册，存储和分发系统，进行了性能优化，减少了内存的消耗。解决了浏览器之间的事件兼容性问题。下图是官网提供的一个事件流程图：
```bash
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
```

下面主要从事件注册和事件执行的主要源码来讲解。源码只展示了主要的逻辑功能代码，加上注解的形式分析。

### 事件注册
```bash
// ReactDOMComponent.js
_updateDOMProperties: function (lastProps, nextProps, transaction) {
    ...
    for (propKey in nextProps) {
      // 判断是否为事件属性，registrationNameModules { onBlur, onClick ..... }
      if (registrationNameModules.hasOwnProperty(propKey)) {
        enqueuePutListener(this, propKey, nextProp, transaction);
      }
    }
  }
}
function enqueuePutListener(inst, registrationName, listener, transaction) {
  ...
  var doc = isDocumentFragment ? containerInfo._node : containerInfo._ownerDocument;
  // listenTo 将事件注册到 document 上
  listenTo(registrationName, doc);
  // putListener 存储事件，放入事务队列中
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst,
    registrationName: registrationName,
    listener: listener
  });
}
```

解析组件 props 事件，通过 listenTo 将事件注册到 document 上，listenTo 里面会判断是事件的冒泡还是捕获。本文下面我们都主要看事件的冒泡处理部分。

```bash
// ReactBrowserEventEmitter.js
listenTo: function (registrationName, contentDocumentHandle) {
    ...
    if (...) {
      // 事件冒泡
      ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(...);
    } else if (...) {
      // 事件捕获
      ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(...);
    }
    ...
}

// ReactEventListener.js
var ReactEventListener = {
    ...
    trapBubbledEvent: function (topLevelType, handlerBaseName, element) {
      ...
      var handler = ReactEventListener.dispatchEvent.bind(null, topLevelType);
      // EventListener.listen 进行事件注册。handler 仅仅调用了一个 dispatchEvent 分发事件。
      return EventListener.listen(element, handlerBaseName, handler);
    },
    trapCapturedEvent: function (topLevelType, handlerBaseName, element) {
      var handler = ReactEventListener.dispatchEvent.bind(null, topLevelType);
      return EventListener.capture(element, handlerBaseName, handler);
    }
    dispatchEvent: function (topLevelType, nativeEvent) {
      ...
      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);
      ...
    }
}
```

listenTo 最后会调用 listen 函数，在 listen 函数里面我们看到了熟悉的绑定事件的代码，react 帮我们处理了各个浏览器之间的兼容性问题。

```bash
// 熟悉的事件绑定
listen: function listen(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function remove() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function remove() {
          target.detachEvent('on' + eventType, callback);
        }
      };
    }
}
```

上面对 props 事件的处理，主要调用了 listenTo 将事件绑定到了 document 上，所有的事件存储调用了 EventPluginHub 的 putListener。

```bash
// EventPluginHub.js
var listenerBank = {};
var getDictionaryKey = function (inst) {
  return '.' + inst._rootNodeID;
}
var EventPluginHub = {
  putListener: function (inst, registrationName, listener) {
    ...
    var key = getDictionaryKey(inst);
    // 将 listener 事件回调方法存入 listenerBank[registrationName][key] 中,
    // 比如 listenerBank['onclick'][nodeId]
    // 所有 React 组件对象定义的所有 React 事件都会存储在 listenerBank 中
    var bankForRegistrationName = listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[key] = listener;
    ...

  }
}
```

putListener 将事件存储在 listenerBank 对象中，在后面的合成事件里面会获取该对象里面的回调函数。

### 事件执行

在上述事件的绑定过程中，可以看到所有事件的执行都是调用了 dispatchEvent 方法，该方法主要将事件分发的真正核心—— handleTopLevelImpl 方法放入批处理队列中。

```bash
// ReactEventListener.js
function handleTopLevelImpl(bookKeeping) {
  var nativeEventTarget = getEventTarget(bookKeeping.nativeEvent);
  var targetInst = ReactDOMComponentTree.getClosestInstanceFromNode(nativeEventTarget);

  var ancestor = targetInst;
  do {
    bookKeeping.ancestors.push(ancestor);
    ancestor = ancestor && findParent(ancestor);
  } while (ancestor);
  // 从当前组件向父组件遍历,依次执行注册的回调方法. 我们遍历构造ancestors数组时,是从当前组件向父组件回溯
  // 的, 模拟了事件的冒泡顺序。
  for (var i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    ReactEventListener._handleTopLevel(bookKeeping.topLevelType, targetInst, bookKeeping.nativeEvent, getEventTarget(bookKeeping.nativeEvent));
  }
}
```
可以看到这里 react 通过队列的方式模拟的事件的冒泡。 _handleTopLevel 方法处理了真正的回调。

```bash
_handleTopLevel: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    // 获取合成事件, 合成事件过程会从上述注册阶段中的 EventPluginHub listenerBank 中获取相关回调函数
    var events = EventPluginHub.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    // 批处理事件
    runEventQueueInBatch(events);
}
```

EventPluginHub.extractEvents 调用了事件 Plugins 进行合成事件。合成事件处理了事件跨浏览器的兼容性(如 transitionEnd, webkitTransitionEnd, MozTransitionEnd 和 oTransitionEnd)等，并且采用了一个事件池的一个概念，避免了频繁的创建对象分配内存及垃圾回收操作，达到一个性能优化。

此处就不再介绍合成事件的过程，感兴趣的同学可以参考这边文章：[React细节知识之对象池](https://www.jianshu.com/p/89e625e33506)


批处理 runEventQueueInBatch 的核心函数 executeDispatchesInOrder，执行 React 组件中 JSX 申明的回调函数。
```bash
// EventPluginUtils.js
function executeDispatchesInOrder(event, simulated) {
  // dispatchListeners 为事件队列
  var dispatchListeners = event._dispatchListeners;
  var dispatchInstances = event._dispatchInstances;

  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // dispatchListeners[i] 为 JSX 中声明的事件 callback
      // dispatchInstances[i] 为对应的 React Component 
      executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}
function executeDispatch(event, simulated, listener, inst) {
  var type = event.type || 'unknown-event';
  event.currentTarget = EventPluginUtils.getNodeFromInstance(inst);
  if (simulated) {
    ReactErrorUtils.invokeGuardedCallbackWithCatch(type, listener, event);
  } else {
    ReactErrorUtils.invokeGuardedCallback(type, listener, event);
  }
  event.currentTarget = null;
}

function invokeGuardedCallback(name, func, a) {
  try {
    // 回调函数是直接调用的，并没有指定调用的组件，所以在组件里面需要手动绑定this.
    func(a);
  } catch (x) {
    if (caughtError === null) {
      caughtError = x;
    }
  }
}
```
在 invokeGuardedCallback 方法里面我们也看到了为什么我们在写 react 方法时需要手动的绑定 this. 

## 总结

上面就介绍完成了 react 事件机制从事件注册到事件执行的整个过程，整个事件机制还是蛮复杂的，其中还是有很多细节有待深入研究。从上述过程中可以得到 react 事件机制的几个特点：
1. 几乎所有的事件都是绑定在 document 上，除了 video, andio 标签的 onPlay, onPause 等，这些事件是document 不具有的，那么只能在这些标签上进行事件绑定。
2. React 以队列的方式，自身模拟了一套事件冒泡机制，对于原生事件和合成事件混用的情况下，我们没办法通过 event.stopPropagation() 来组织原生事件的传播。因为 react 的事件都是先冒泡到 document 上之后，才会进行事件的分发处理。
3. React 使用对象池来管理合成事件对象的创建和销毁，这样减少了垃圾回收操作和新对象内存的分配，大大提高了性能。

## 解决问题

回到最开始的问题，那么现在我们知道为什么阻止不了父组件的 onMouseDown 事件了，因为我们这里混用了原生事件和合成事件，没办法阻止原生事件的冒泡。那么该怎么做尼，其实 React 提供了 cloneElement API 进行克隆子组件，并传递 props. 所以改下 Draggable 里的render 方法：
```bash
componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    this.$el = ReactDOM.findDOMNode(this);

    // 方式一： addEventListener
    // this.$el.addEventListener("mousedown", this.onMousedown);
}
render() {
    const { children } = this.props;
    const child = React.Children.only(children);
    // 方法二：cloneElement
    return React.cloneElement(child, {
        onMouseDown: this.onMousedown
    });
}
```
这样在子组件中就可以通过 event.stopPropagation() 阻止事件的冒泡了。这样做也有一个需要注意的:

```bash
<Draggable>
    <div>可拖拽元素</div>
</Draggable>
```

```bash
    // index.js
    <Draggable>
        <TestNode></TestNode>
    </Draggable>

    // TestNode.jsx
    render() {
        <div {...this.props}>
            <p>Test</p>
        </div>
    }
```
上述在 Draggable 包裹的是原生DOM时，可以在根节点上自动接受到 props。如果 Draggable 内子组件是一个 React Component 时，如上述的 onMouseDown 事件就需要手动在 TestNode 子组件 DOM 上接收 props. 