// ReactDOMComponent.js
function _updateDOMProperties (lastProps, nextProps, transaction) {
  // ...
  for (propKey in nextProps) {
    // 判断是否为事件属性，registrationNameModules { onBlur, onClick ..... }
    if (registrationNameModules.hasOwnProperty(propKey)) {
      enqueuePutListener(this, propKey, nextProp, transaction);
    }
  }
}

function enqueuePutListener(inst, registrationName, listener, transaction) {
  // ...
  // doc 是 document 
  var doc = isDocumentFragment ? containerInfo._node : containerInfo._ownerDocument; 
  // listenTo 将事件注册到 document 上
  listenTo(registrationName, doc);
  
  // putListener 存储事件，放入事务队列中
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst, // React Component
    registrationName: registrationName, // 合成事件名称
    listener: listener // 回调函数
  });
}

// ReactBrowserEventEmitter.js
listenTo: function (registrationName, contentDocumentHandle) {
    // ...
    if (bubbled) {
      // 事件冒泡
      ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(...);
    } else if (capture) {
      // 事件捕获
      ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(...);
    }
    //...
}

// ReactEventListener.js
var ReactEventListener = {
    // ...
    trapBubbledEvent: function (topLevelType, handlerBaseName, element) {
      // ...
      var handler = ReactEventListener.dispatchEvent.bind(null, topLevelType);
      // EventListener.listen 进行事件注册。handler 仅仅调用了一个 dispatchEvent 分发事件。
      return EventListener.listen(element, handlerBaseName, handler);
    },
    trapCapturedEvent: function (topLevelType, handlerBaseName, element) {
      var handler = ReactEventListener.dispatchEvent.bind(null, topLevelType);
      return EventListener.capture(element, handlerBaseName, handler);
    },
    dispatchEvent: function (topLevelType, nativeEvent) {
      // ...
      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);
      // ...
    }
}

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

// 事件存储
// EventPluginHub.js
var listenerBank = {};
var getDictionaryKey = function (inst) {
  return '.' + inst._rootNodeID;
}
var EventPluginHub = {
  putListener: function (inst, registrationName, listener) {
    //...
    var key = getDictionaryKey(inst);
    // 将 listener 事件回调方法存入 listenerBank[registrationName][key] 中,
    // 比如 listenerBank['onclick'][nodeId]
    // 所有 React 组件对象定义的所有 React 事件都会存储在 listenerBank 中
    var bankForRegistrationName = listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[key] = listener;
    // ...

  }
}


事件执行：

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

function _handleTopLevel (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
  // 获取合成事件, 合成事件过程会从上述注册阶段中的 EventPluginHub listenerBank 中获取相关回调函数
  var events = EventPluginHub.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
  // 批处理事件
  runEventQueueInBatch(events);
}

// runEventQueueInBatch 批处理的核心函数
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

// executeDispatch 的核心函数 invokeGuardedCallback 
// fun 是回调函数
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

